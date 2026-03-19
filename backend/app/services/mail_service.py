# backend/app/services/mail_service.py
import random
import string
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=True
)

class MailService:
    @staticmethod
    def generate_verification_code() -> str:
        """Generates a 6-digit numeric verification code."""
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    async def send_verification_email(email: str, code: str):
        html = f"""
        <div style="font-family: 'DM Sans', sans-serif; padding: 20px; background-color: #FAF9F6; color: #1A1A1A;">
            <h2 style="font-family: 'Cormorant Garamond', serif; border-bottom: 1px solid #E8E4DC; padding-bottom: 10px;">
                LuxeMarket Security
            </h2>
            <p>You requested a password change. Please use the following verification code:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #144bb8;">
                {code}
            </div>
            <p style="font-size: 12px; color: #8C8278;">
                If you did not request this, please ignore this email. This code will expire soon.
            </p>
        </div>
        """
        
        message = MessageSchema(
            subject="LuxeMarket Verification Code",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)