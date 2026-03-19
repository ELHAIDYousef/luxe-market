"""
User management endpoints.

GET    /users/me                    — own profile (any authenticated user)
PATCH  /users/me                    — update own name/email (any authenticated user)
POST   /users/me/request-password-reset — send verification code to own email
PATCH  /users/me/update-password     — verify code and set new password
GET    /users/stats                 — count stats (admin+)
GET    /users/                      — list all users (admin+)
GET    /users/{id}                  — get user by ID (admin+)
PATCH  /users/{id}                  — update user (see permission matrix below)
DELETE /users/{id}                  — delete user (super_admin only)

Permission matrix for PATCH /{id}:
  - status change   → any admin (editor, admin, super_admin)
  - admin_note      → any admin
  - role change     → super_admin only; can only assign editor or super_admin
  - cannot change your own role
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_current_super_admin
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserOut, UserUpdate
from app.services.mail_service import MailService
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

# Roles that super_admin is allowed to assign to admin-panel users
ASSIGNABLE_ADMIN_ROLES = {"editor", "super_admin"}

# In-memory storage for verification codes (Replace with Redis for production)
verification_codes = {}

class PasswordResetRequest(BaseModel):
    code: str
    new_password: str

# ── OWN ACCOUNT ENDPOINTS ───────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieves the currently authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates the currently authenticated user's profile information."""
    if payload.role:
        raise HTTPException(status_code=403, detail="Cannot change your own role")
    
    if payload.email:
        existing = db.query(User).filter(
            User.email == payload.email, User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
            
    for field, value in payload.model_dump(exclude_none=True).items():
        if field not in ("role", "status"):
            setattr(current_user, field, value)
            
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/request-password-reset")
async def request_password_reset(
    current_user: User = Depends(get_current_user)
):
    """Generates and sends a 6-digit verification code to the user's registered email."""
    code = MailService.generate_verification_code()
    # Store code mapped to user email
    verification_codes[current_user.email] = code
    
    await MailService.send_verification_email(current_user.email, code)
    return {"message": "Verification code sent to your email"}


@router.patch("/me/update-password")
async def update_password(
    data: PasswordResetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifies the code and updates the user's hashed password in the database."""
    stored_code = verification_codes.get(current_user.email)
    
    if not stored_code or stored_code != data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
    
    # Update password using security utility
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    # Remove code after successful use
    del verification_codes[current_user.email]
    
    return {"message": "Password updated successfully"}


# ── ADMIN MANAGEMENT ENDPOINTS ──────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(get_current_admin)])
def user_stats(db: Session = Depends(get_db)):
    """Aggregates user counts by role and status for admin dashboards."""
    total     = db.query(func.count(User.id)).scalar() or 0
    active    = db.query(func.count(User.id)).filter(User.status == UserStatus.active).scalar() or 0
    suspended = db.query(func.count(User.id)).filter(User.status == UserStatus.suspended).scalar() or 0
    blocked   = db.query(func.count(User.id)).filter(User.status == UserStatus.blocked).scalar() or 0
    customers = db.query(func.count(User.id)).filter(User.role == UserRole.customer).scalar() or 0
    admins    = db.query(func.count(User.id)).filter(User.role != UserRole.customer).scalar() or 0
    
    return {
        "total": total, "active": active, "suspended": suspended,
        "blocked": blocked, "customers": customers, "admins": admins
    }


@router.get("/", response_model=list[UserOut], dependencies=[Depends(get_current_admin)])
def list_users(
    skip:   int = Query(0, ge=0),
    limit:  int = Query(50, ge=1, le=200),
    role:   str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Lists users with optional role and status filtering."""
    q = db.query(User)
    if role:   q = q.filter(User.role == role)
    if status: q = q.filter(User.status == status)
    return q.order_by(User.member_since.desc()).offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(get_current_admin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieves a specific user's details by their ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """
    Updates a user with strict permission enforcement:
    - Any admin can change status or admin_note.
    - Only Super Admins can change roles (limited to editor/super_admin).
    - No user can change their own role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_none=True)

    # Role change permission check
    if "role" in update_data:
        if current_user.role != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Only Super Admins can change user roles",
            )
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        
        new_role = update_data["role"]
        if new_role not in ASSIGNABLE_ADMIN_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Role must be one of: {', '.join(ASSIGNABLE_ADMIN_ROLES)}. "
                       "Use the customer role for regular users."
            )

    # Status change permission check (cannot touch another super_admin unless super_admin)
    if "status" in update_data:
        if user.role == "super_admin" and current_user.role != "super_admin":
            raise HTTPException(
                status_code=403,
                detail="Only Super Admins can change another Super Admin's status",
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin),
):
    """Deletes a user account. Restricted to Super Admins."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()