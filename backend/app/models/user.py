from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    customer    = "customer"
    admin       = "admin"
    super_admin = "super_admin"
    editor      = "editor"
    viewer      = "viewer"


class UserStatus(str, enum.Enum):
    active    = "active"
    inactive  = "inactive"
    suspended = "suspended"   # added: temporary ban
    blocked   = "blocked"     # added: permanent ban


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(120), nullable=False)
    email            = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password  = Column(String(255), nullable=False)
    role             = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    status           = Column(Enum(UserStatus), default=UserStatus.active, nullable=False)
    avatar_url       = Column(String(500), nullable=True)
    admin_note       = Column(String(1000), nullable=True)   # internal admin notes
    member_since     = Column(DateTime, default=datetime.utcnow)
    last_login       = Column(DateTime, nullable=True)

    # Relationships
    orders           = relationship("Order", back_populates="customer", lazy="dynamic")
    analytics_events = relationship("AnalyticsEvent", back_populates="user", lazy="dynamic")
