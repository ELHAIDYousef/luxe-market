"""
LuxeMarket Security
===================
Uses bcrypt directly (no passlib) to avoid the passlib/bcrypt 4.x incompatibility.

JWT access tokens  (60 min)
JWT refresh tokens (7 days)
"""

import bcrypt
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

# ── Roles ─────────────────────────────────────────────────────────────────────
ROLE_SUPER_ADMIN = "super_admin"
ROLE_ADMIN       = "admin"
ROLE_EDITOR      = "editor"
ROLE_VIEWER      = "viewer"
ROLE_CUSTOMER    = "customer"

ADMIN_ROLES      = {ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_EDITOR}
SUPER_ADMIN_ONLY = {ROLE_SUPER_ADMIN}

# ── Password hashing (direct bcrypt, no passlib) ──────────────────────────────

def get_password_hash(plain: str) -> str:
    """Hash a plain-text password with bcrypt."""
    # bcrypt requires bytes; encode to UTF-8, truncate at 72 bytes (bcrypt limit)
    password_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        password_bytes = plain.encode("utf-8")[:72]
        hashed_bytes   = hashed.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ── OAuth2 scheme ─────────────────────────────────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


# ── Token creation ────────────────────────────────────────────────────────────
def _encode(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: int, role: str) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int, role: str) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ── Token decoding ────────────────────────────────────────────────────────────
def _decode(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type — {expected_type} token required",
        )
    return payload


def decode_access_token(token: str) -> dict:
    return _decode(token, "access")


def decode_refresh_token(token: str) -> dict:
    return _decode(token, "refresh")