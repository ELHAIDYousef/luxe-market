"""
Authentication endpoints.

POST /auth/login    → returns access + refresh tokens
POST /auth/register → creates account, returns tokens
POST /auth/refresh  → exchanges refresh token for new access token
GET  /auth/me       → returns current user (requires access token)
POST /auth/password → change password (requires access token)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.users import verification_codes
from app.services.mail_service import MailService

from app.db.session import get_db
from app.schemas.user import (
    LoginRequest,
    TokenOut,
    UserCreate,
    UserOut,
    RefreshRequest,
)
from app.services import auth_service
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-registration-code")
async def request_registration_code(body: dict, db: Session = Depends(get_db)):
    """Sends a verification code to a new email address for account creation."""
    email = body.get("email", "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Check if user already exists
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    code = MailService.generate_verification_code()
    
    # Store the code for this email
    verification_codes[email] = code
    
    await MailService.send_verification_email(email, code)
    return {"message": "Verification code sent successfully"}

@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new customer account after verifying the email code."""
    # 1. Verify Code
    email = payload.email.lower().strip()
    stored_code = verification_codes.get(email)
    
    if not stored_code or stored_code != payload.verification_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    # 2. Proceed with registration
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    payload.role = "customer"
    user = auth_service.create_user(db, payload)
    
    # Cleanup code
    del verification_codes[email]
    
    tokens = auth_service.issue_tokens(user)
    return TokenOut(**tokens, user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Returns JWT access token (60 min) and refresh token (7 days).
    Blocked users receive 401 — suspended users can still log in.
    """
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    tokens = auth_service.issue_tokens(user)
    return TokenOut(**tokens, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new customer account."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Force customer role on self-registration — admins are seeded
    payload.role = "customer"
    user = auth_service.create_user(db, payload)
    tokens = auth_service.issue_tokens(user)
    return TokenOut(**tokens, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenOut)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access token.
    Call this when the frontend receives a 401 on an API request.
    """
    tokens = auth_service.refresh_access_token(db, payload.refresh_token)
    # Re-fetch user for up-to-date UserOut
    from app.core.security import decode_refresh_token
    p = decode_refresh_token(payload.refresh_token)
    user = db.query(User).filter(User.id == int(p["sub"])).first()
    return TokenOut(**tokens, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/password")
def change_password(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change password. Body: {current_password, new_password}"""
    ok = auth_service.change_password(
        db,
        current_user,
        body.get("current_password", ""),
        body.get("new_password", ""),
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password updated successfully"}
