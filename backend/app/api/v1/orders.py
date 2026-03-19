"""
Orders API.

Route ordering matters in FastAPI — more specific routes must come first.
GET /my        must be before GET /{order_id}
GET /          (admin) is fine after /{order_id} since "/" != "/{x}"
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


# ── Customer endpoints ────────────────────────────────────────────────────────

@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    payload:      OrderCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Place a new order. Decrements product stock automatically."""
    return order_service.create_order(db, payload, current_user.id)


@router.get("/my", response_model=list[OrderOut])
def my_orders(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Return all orders for the current authenticated customer."""
    return order_service.get_orders_for_customer(db, current_user.id)


# ── Admin endpoints — placed BEFORE /{order_id} so "/" is matched correctly ──

@router.get(
    "/",
    response_model=list[OrderOut],
    dependencies=[Depends(get_current_admin)],
)
def list_all_orders(
    skip:  int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db:    Session = Depends(get_db),
):
    """
    List all orders — admin only.
    Returns orders newest-first with full item and product details.
    """
    return order_service.get_all_orders(db, skip=skip, limit=limit)


@router.patch(
    "/{order_id}/status",
    response_model=OrderOut,
    dependencies=[Depends(get_current_admin)],
)
def update_order_status(
    order_id: str,
    payload:  OrderStatusUpdate,
    db:       Session = Depends(get_db),
):
    """Update the status of an order. Admin only."""
    order = order_service.update_status(db, order_id, payload)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ── Single order (customer can only see their own) ────────────────────────────

@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id:     str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Get a single order by ID.
    Customers can only access their own orders; admins can access any.
    """
    order = order_service.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if (order.customer_id != current_user.id
            and current_user.role not in ("admin", "super_admin", "editor")):
        raise HTTPException(status_code=403, detail="Not authorised to view this order")
    return order
