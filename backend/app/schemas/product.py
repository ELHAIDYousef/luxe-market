from typing import Optional
from pydantic import BaseModel


class ProductBase(BaseModel):
    name:        str
    category:    str
    description: Optional[str] = None
    price:       float
    stock:       int = 0
    images:      list[str] = []
    finish:      list[str] = []


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name:        Optional[str]   = None
    category:    Optional[str]   = None
    description: Optional[str]   = None
    price:       Optional[float] = None
    stock:       Optional[int]   = None
    images:      Optional[list[str]] = None
    finish:      Optional[list[str]] = None


class ProductOut(ProductBase):
    id: int

    model_config = {"from_attributes": True}
