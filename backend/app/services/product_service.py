from sqlalchemy.orm import Session
from typing import Optional
from fastapi import HTTPException

from app.models.product import Product
from app.models.order import OrderItem
from app.models.cart import CartItem
from app.schemas.product import ProductCreate, ProductUpdate


def get_all(db: Session, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> list[Product]:
    q = db.query(Product)
    if category:
        q = q.filter(Product.category == category)
    return q.offset(skip).limit(limit).all()


def get_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def create(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update(db: Session, product_id: int, data: ProductUpdate) -> Optional[Product]:
    product = get_by_id(db, product_id)
    if not product:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete(db: Session, product_id: int) -> bool:
    product = get_by_id(db, product_id)
    if not product:
        return False

    # Check for dependencies
    if db.query(OrderItem).filter(OrderItem.product_id == product_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete product: it is referenced in orders")
    if db.query(CartItem).filter(CartItem.product_id == product_id).first():
        raise HTTPException(status_code=400, detail="Cannot delete product: it is in someone's cart")

    db.delete(product)
    db.commit()
    return True
