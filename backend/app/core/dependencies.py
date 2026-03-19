"""
FastAPI dependency functions for authentication & authorization.

Usage in routes:
    # Require any authenticated user
    current_user = Depends(get_current_user)

    # Require admin access (super_admin, admin, editor)
    _ = Depends(get_current_admin)

    # Require super_admin only
    _ = Depends(get_current_super_admin)

    # Optional — returns None for unauthenticated requests
    current_user = Depends(get_optional_user)
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import oauth2_scheme, decode_access_token, ADMIN_ROLES, SUPER_ADMIN_ONLY
from app.models.user import User, UserStatus


def _fetch_user(token: str | None, db: Session) -> User | None:
    """Shared helper: decode token → fetch user → validate active status."""
    if not token:
        return None
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        return None
    if user.status == UserStatus.inactive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact support.",
        )
    return user


def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns the current user or None — never raises for missing token."""
    return _fetch_user(token, db)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Requires a valid authenticated user. Raises 401 otherwise."""
    user = _fetch_user(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Requires admin-level access.
    Roles: super_admin, admin, editor — all can manage products & orders.
    Raises 403 for customers and viewers.
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You don't have permission for this action.",
        )
    return current_user


def get_current_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Requires super_admin role only.
    Used for: user management, admin management, analytics dashboard.
    """
    if current_user.role not in SUPER_ADMIN_ONLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required.",
        )
    return current_user
