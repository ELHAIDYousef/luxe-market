"""
Authentication service.
Handles: login, register, token refresh, password change.
"""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User, UserRole, UserStatus
from app.core.security import (
    verify_password,
    get_password_hash, # Synchronized naming
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.schemas.user import UserCreate


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Verify credentials. Returns user on success, None on failure.
    Also updates last_login timestamp.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if user.status in (UserStatus.blocked,):
        return None  # blocked users cannot log in at all
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    return user


def create_user(db: Session, data: UserCreate) -> User:
    """Creates a new user with a hashed password."""
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password), # Synchronized call
        role=UserRole(data.role) if data.role in [r.value for r in UserRole] else UserRole.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def issue_tokens(user: User) -> dict:
    """Issue both access and refresh tokens for a user."""
    return {
        "access_token":  create_access_token(user.id, user.role),
        "refresh_token": create_refresh_token(user.id, user.role),
        "token_type":    "bearer",
    }


def refresh_access_token(db: Session, refresh_token: str) -> dict:
    """
    Validate a refresh token and issue a fresh access token.
    The refresh token itself is NOT rotated (stateless strategy).
    """
    payload = decode_refresh_token(refresh_token)
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status == UserStatus.blocked:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account blocked",
        )
    return {
        "access_token":  create_access_token(user.id, user.role),
        "refresh_token": refresh_token,   # return same refresh token
        "token_type":    "bearer",
    }


def change_password(
    db: Session, user: User, current_password: str, new_password: str
) -> bool:
    """Returns True on success, False if current_password is wrong."""
    if not verify_password(current_password, user.hashed_password):
        return False
    user.hashed_password = get_password_hash(new_password) # Synchronized call
    db.commit()
    return True