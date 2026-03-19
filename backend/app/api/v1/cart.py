from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.cart import CartItem
from app.schemas.cart import CartItemBase, CartItemOut, CartOut
from app.services import product_service

router = APIRouter(prefix="/cart", tags=["cart"])

TAX_RATE = 0.08


def _cart_out(db: Session, user_id: int) -> CartOut:
    items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    subtotal = sum(i.product.price * i.quantity for i in items if i.product)
    tax = round(subtotal * TAX_RATE, 2)
    return CartOut(
        items=[CartItemOut.model_validate(i) for i in items],
        subtotal=round(subtotal, 2),
        tax=tax,
        total=round(subtotal + tax, 2),
    )


@router.get("/", response_model=CartOut)
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _cart_out(db, current_user.id)


@router.post("/", response_model=CartOut)
def add_to_cart(
    payload:      CartItemBase,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    product = product_service.get_by_id(db, payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if existing:
        existing.quantity += payload.quantity
    else:
        item = CartItem(
            user_id=current_user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
            selected_finish=payload.selected_finish,
        )
        db.add(item)
    db.commit()
    return _cart_out(db, current_user.id)


@router.patch("/{item_id}", response_model=CartOut)
def update_cart_item(
    item_id:      int,
    quantity:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if quantity <= 0:
        db.delete(item)
    else:
        item.quantity = quantity
    db.commit()
    return _cart_out(db, current_user.id)


@router.delete("/{item_id}", response_model=CartOut)
def remove_from_cart(
    item_id:      int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return _cart_out(db, current_user.id)


@router.delete("/", response_model=CartOut)
def clear_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return _cart_out(db, current_user.id)
