"""
Image upload endpoint.
Stores files in /app/uploads/ inside the container (mapped to ./uploads on host).
Returns a URL path the frontend can use to display the image.
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from app.core.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin),
):
    """
    Upload a product image.
    Returns: { url: "/uploads/<filename>" }
    Requires admin role.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: JPEG, PNG, WebP, GIF",
        )

    # Read file and check size
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 5 MB.",
        )

    # Generate unique filename preserving extension
    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / filename

    # Save to disk
    dest.write_bytes(contents)

    return {"url": f"/uploads/{filename}", "filename": filename}
