from sqlalchemy import Column, Integer, String, Float, Text, ARRAY
from sqlalchemy.orm import relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False, index=True)
    category    = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price       = Column(Float, nullable=False)
    stock       = Column(Integer, default=0, nullable=False)
    images      = Column(ARRAY(String), default=list)
    finish      = Column(ARRAY(String), default=list)

    # Relationships
    order_items      = relationship("OrderItem", back_populates="product")
    analytics_events = relationship("AnalyticsEvent", back_populates="product", cascade="all, delete-orphan")
    cart_items       = relationship("CartItem", back_populates="product")
