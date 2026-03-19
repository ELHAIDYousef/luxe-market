from typing import Optional
from pydantic import BaseModel

from app.schemas.product import ProductOut


class CartItemBase(BaseModel):
    product_id:      int
    quantity:        int = 1
    selected_finish: Optional[str] = None


class CartItemOut(CartItemBase):
    id:      int
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    items:    list[CartItemOut]
    subtotal: float
    tax:      float
    total:    float
