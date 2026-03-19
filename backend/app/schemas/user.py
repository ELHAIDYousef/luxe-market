from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name:  str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    verification_code: str
    role: str = "customer"


class UserUpdate(BaseModel):
    name:       Optional[str] = None
    email:      Optional[EmailStr] = None
    role:       Optional[str] = None
    status:     Optional[str] = None
    admin_note: Optional[str] = None


class UserOut(UserBase):
    id:           int
    role:         str
    status:       str
    avatar_url:   Optional[str] = None
    admin_note:   Optional[str] = None
    member_since: Optional[datetime] = None
    last_login:   Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user:          UserOut


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str
