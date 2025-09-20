import os
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
import logging

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # App configuration
    app_name: str = "Ponpa Backend API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Firebase configuration
    firebase_project_id: Optional[str] = Field(None, alias="FIREBASE_PROJECT_ID")
    firebase_service_account_path: Optional[str] = Field(None, alias="FIREBASE_SERVICE_ACCOUNT_PATH")
    firebase_storage_bucket: Optional[str] = Field(None, alias="FIREBASE_STORAGE_BUCKET")

    # Google Generative AI configuration
    google_ai_api_key: Optional[str] = Field(None, alias="GOOGLE_AI_API_KEY")

    # Security
    jwt_algorithm: str = "RS256"

    # CORS settings
    cors_origins: str = "*"  # Configure for production

    # Logging
    log_level: str = "INFO"

    @field_validator("firebase_project_id")
    @classmethod
    def validate_firebase_project_id(cls, v):
        if not v:
            logging.warning("FIREBASE_PROJECT_ID not set - Firebase features will be disabled")
        return v

    @field_validator("firebase_service_account_path")
    @classmethod
    def validate_firebase_service_account(cls, v):
        if v and not os.path.exists(v):
            raise ValueError(f"Firebase service account file not found: {v}")
        return v

    @field_validator("google_ai_api_key")
    @classmethod
    def validate_google_ai_key(cls, v):
        if not v:
            logging.warning("GOOGLE_AI_API_KEY not set - AI features will be disabled")
        return v

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }

# Global settings instance
settings = Settings()

def get_settings() -> Settings:
    """Get application settings"""
    return settings