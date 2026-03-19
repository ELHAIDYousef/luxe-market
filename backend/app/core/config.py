from pydantic_settings import BaseSettings
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL:               str = "postgresql://luxe_user:luxe_pass@db:5432/luxemarket"
    SECRET_KEY:                 str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM:                  str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS:   int = 7
    APP_ENV:                    str = "development"
    ALLOWED_ORIGINS:            str = "http://localhost:5173,http://localhost:3000"
    ANTHROPIC_API_KEY:          str = ""

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    MAIL_USERNAME: str = "youssefelhaid0000@gmail.com"
    MAIL_PASSWORD: str = "kocz woeh nbwk ouyp"
    MAIL_FROM: str = "noreply@luxemarket.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "LuxeMarket Admin"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
