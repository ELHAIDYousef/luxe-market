from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    pending    = "Pending"
    processing = "Processing"
    shipped    = "Shipped"
    delivered  = "Delivered"
    cancelled  = "Cancelled"


class Order(Base):
    __tablename__ = "orders"

    id                  = Column(String(20), primary_key=True, index=True)   # e.g. LX-9021
    customer_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    status              = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    total               = Column(Float, nullable=False)
    created_at          = Column(DateTime, default=datetime.utcnow)

    # Shipping
    shipping_first_name = Column(String(80), nullable=True)
    shipping_last_name  = Column(String(80), nullable=True)
    shipping_address    = Column(String(300), nullable=True)
    shipping_city       = Column(String(100), nullable=True)
    shipping_zip        = Column(String(20), nullable=True)

    # Delivery
    carrier             = Column(String(100), nullable=True)
    tracking_number     = Column(String(100), nullable=True)
    estimated_delivery  = Column(String(50), nullable=True)
    delivery_method     = Column(String(50), default="standard")

    # Relationships
    customer   = relationship("User", back_populates="orders")
    items      = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id               = Column(Integer, primary_key=True, index=True)
    order_id         = Column(String(20), ForeignKey("orders.id"), nullable=False)
    product_id       = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity         = Column(Integer, nullable=False, default=1)
    unit_price       = Column(Float, nullable=False)
    selected_finish  = Column(String(100), nullable=True)

    order   = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
