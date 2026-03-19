from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AnalyticsEventType(str, enum.Enum):
    VIEW        = "VIEW"          # User opened product detail page
    ADD_TO_CART = "ADD_TO_CART"   # User added product to cart
    PURCHASE    = "PURCHASE"      # User completed checkout for this product


class AnalyticsEvent(Base):
    """
    Core marketing funnel table.

    By comparing event counts across types, the Marketing Analytics
    dashboard derives:
      - Awareness  = product impressions (VIEW count)
      - Interest   = product consultations (VIEW count, deduplicated per session)
      - Desire     = add-to-cart events
      - Action     = purchases

    The "Consulted but Not Purchased" rate = (ADD_TO_CART - PURCHASE) / ADD_TO_CART
    """
    __tablename__ = "analytics_events"

    id         = Column(Integer, primary_key=True, index=True)
    event_type = Column(Enum(AnalyticsEventType), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(64), nullable=False, index=True)   # anonymous tracking
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="analytics_events")
    user    = relationship("User", back_populates="analytics_events")
