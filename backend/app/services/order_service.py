import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderStatusUpdate


def _generate_order_id() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"LX-{suffix}"


def create_order(db: Session, data: OrderCreate, customer_id: int) -> Order:
    order_id = _generate_order_id()
    # Ensure unique
    while db.query(Order).filter(Order.id == order_id).first():
        order_id = _generate_order_id()

    total = sum(i.unit_price * i.quantity for i in data.items)
    estimated = (datetime.utcnow() + timedelta(days=7)).strftime("%b %d, %Y")

    order = Order(
        id=order_id,
        customer_id=customer_id,
        total=total,
        status=OrderStatus.pending,
        shipping_first_name=data.shipping.first_name,
        shipping_last_name=data.shipping.last_name,
        shipping_address=data.shipping.address,
        shipping_city=data.shipping.city,
        shipping_zip=data.shipping.zip_code,
        delivery_method=data.delivery_method,
        estimated_delivery=estimated,
    )
    db.add(order)
    db.flush()

    for item_data in data.items:
        item = OrderItem(
            order_id=order_id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            selected_finish=item_data.selected_finish,
        )
        db.add(item)
        # Decrement stock
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if product and product.stock >= item_data.quantity:
            product.stock -= item_data.quantity

    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: str) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_orders_for_customer(db: Session, customer_id: int) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.customer_id == customer_id)
        .order_by(Order.created_at.desc())
        .all()
    )


def get_all_orders(db: Session, skip: int = 0, limit: int = 50) -> list[Order]:
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_status(db: Session, order_id: str, data: OrderStatusUpdate) -> Optional[Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order
