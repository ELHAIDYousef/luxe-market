from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.core.dependencies import get_current_admin
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services import product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[ProductOut])
def list_products(
    skip:     int = Query(0, ge=0),
    limit:    int = Query(100, ge=1, le=200),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return product_service.get_all(db, skip=skip, limit=limit, category=category)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_service.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(get_current_admin)])
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create(db, payload)


@router.patch("/{product_id}", response_model=ProductOut,
              dependencies=[Depends(get_current_admin)])
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = product_service.update(db, product_id, payload)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(get_current_admin)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not product_service.delete(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
