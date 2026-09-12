from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    app_name: str = Field(
        default="Analytics Platform MVP",
        alias="APP_NAME"
    )

    app_env: str = Field(
        default="development",
        alias="APP_ENV"
    )

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/analytics_platform",
        alias="DATABASE_URL",
    )

    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
        alias="CORS_ORIGINS"
    )

    auto_create_tables: bool = Field(
        default=True,
        alias="AUTO_CREATE_TABLES"
    )

    # JWT Settings
    jwt_secret: str = Field(
        alias="JWT_SECRET"
    )

    jwt_algorithm: str = Field(
        default="HS256",
        alias="JWT_ALGORITHM"
    )

    access_token_expire_minutes: int = Field(
        default=60,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod

    def parse_cors_origins(cls, value: object) -> List[str]:
        if value is None or value == "":
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if isinstance(value, str):
            parsed = [origin.strip() for origin in value.split(",") if origin.strip()]
            if "http://localhost:5173" in parsed and "http://127.0.0.1:5173" not in parsed:
                parsed.append("http://127.0.0.1:5173")
            if "http://127.0.0.1:5173" in parsed and "http://localhost:5173" not in parsed:
                parsed.append("http://localhost:5173")
            return parsed
        if isinstance(value, list):
            parsed = [str(origin).strip() for origin in value if str(origin).strip()]
            if "http://localhost:5173" in parsed and "http://127.0.0.1:5173" not in parsed:
                parsed.append("http://127.0.0.1:5173")
            if "http://127.0.0.1:5173" in parsed and "http://localhost:5173" not in parsed:
                parsed.append("http://localhost:5173")
            return parsed
        return [str(value)]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
