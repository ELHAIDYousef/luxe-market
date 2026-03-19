from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id      = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity        = Column(Integer, default=1, nullable=False)
    selected_finish = Column(String(100), nullable=True)

    product = relationship("Product", back_populates="cart_items")
