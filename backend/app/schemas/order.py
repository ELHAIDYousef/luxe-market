from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.schemas.product import ProductOut


class OrderItemBase(BaseModel):
    product_id:      int
    quantity:        int
    unit_price:      float
    selected_finish: Optional[str] = None


class OrderItemOut(OrderItemBase):
    id:      int
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class ShippingInfo(BaseModel):
    first_name: str
    last_name:  str
    address:    str
    city:       str
    zip_code:   str


class OrderCreate(BaseModel):
    items:           list[OrderItemBase]
    shipping:        ShippingInfo
    delivery_method: str = "standard"


class OrderStatusUpdate(BaseModel):
    status: str


class OrderOut(BaseModel):
    id:                 str
    customer_id:        int
    status:             str
    total:              float
    created_at:         datetime
    shipping_first_name: Optional[str] = None
    shipping_last_name:  Optional[str] = None
    shipping_address:    Optional[str] = None
    shipping_city:       Optional[str] = None
    shipping_zip:        Optional[str] = None
    carrier:             Optional[str] = None
    tracking_number:     Optional[str] = None
    estimated_delivery:  Optional[str] = None
    delivery_method:     str = "standard"
    items:               list[OrderItemOut] = []

    model_config = {"from_attributes": True}
