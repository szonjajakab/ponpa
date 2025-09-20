from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, EmailStr
from enum import Enum

from .base import BaseFirestoreModel

class UserStatus(str, Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class UserPreferences(BaseModel):
    """User preferences and settings"""
    notifications_enabled: bool = True
    email_notifications: bool = True
    push_notifications: bool = True
    privacy_level: str = "standard"  # "private", "standard", "public"
    language: str = "en"
    theme: str = "light"  # "light", "dark", "auto"

class User(BaseFirestoreModel):
    """User model for Firebase Authentication integration"""

    # Firebase UID (document ID in Firestore)
    uid: str = Field(..., description="Firebase UID")

    # Basic user information
    email: EmailStr = Field(..., description="User email address")
    display_name: Optional[str] = Field(None, description="User display name")
    first_name: Optional[str] = Field(None, description="User first name")
    last_name: Optional[str] = Field(None, description="User last name")

    # Profile information
    profile_picture_url: Optional[str] = Field(None, description="URL to profile picture")
    phone_number: Optional[str] = Field(None, description="Phone number")
    date_of_birth: Optional[datetime] = Field(None, description="Date of birth")

    # Account management
    status: UserStatus = Field(default=UserStatus.ACTIVE, description="Account status")
    email_verified: bool = Field(default=False, description="Email verification status")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")

    # User preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences, description="User preferences")

    # Metadata
    provider: str = Field(default="email", description="Authentication provider")
    terms_accepted: bool = Field(default=False, description="Terms of service acceptance")
    privacy_policy_accepted: bool = Field(default=False, description="Privacy policy acceptance")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        """Validate email format"""
        if not v or "@" not in v:
            raise ValueError("Invalid email address")
        return v.lower()

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v):
        """Validate display name"""
        if v and len(v.strip()) < 2:
            raise ValueError("Display name must be at least 2 characters")
        return v.strip() if v else None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        """Basic phone number validation"""
        if v:
            # Remove all non-digit characters for basic validation
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError("Phone number must contain at least 10 digits")
        return v

    def get_full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.display_name:
            return self.display_name
        else:
            return self.email.split("@")[0]

    def is_profile_complete(self) -> bool:
        """Check if user profile is complete"""
        required_fields = [self.display_name or (self.first_name and self.last_name)]
        return all(required_fields)

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.now()
        self.update_timestamp()

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore format with special handling for nested objects"""
        data = super().to_firestore()

        # Convert nested preferences model to dict
        if isinstance(data.get('preferences'), UserPreferences):
            data['preferences'] = data['preferences'].model_dump()

        # Handle datetime fields
        if self.date_of_birth:
            data['date_of_birth'] = int(self.date_of_birth.timestamp())
        if self.last_login:
            data['last_login'] = int(self.last_login.timestamp())

        return data

    @classmethod
    def from_firestore(cls, doc_data: Dict[str, Any], doc_id: str = None):
        """Create User from Firestore document with special handling"""
        if not doc_data:
            return None

        # Handle datetime fields
        for field in ['date_of_birth', 'last_login']:
            if field in doc_data and isinstance(doc_data[field], (int, float)):
                doc_data[field] = datetime.fromtimestamp(doc_data[field])

        # Handle preferences
        if 'preferences' in doc_data and isinstance(doc_data['preferences'], dict):
            doc_data['preferences'] = UserPreferences(**doc_data['preferences'])

        # Use UID as document ID if not provided
        if doc_id:
            doc_data['uid'] = doc_id

        return super().from_firestore(doc_data, doc_id)

class UserCreate(BaseModel):
    """Model for creating a new user"""
    uid: str
    email: EmailStr
    display_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    """Model for updating user information"""
    display_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    """Model for user API responses (excludes sensitive data)"""
    uid: str
    email: str
    display_name: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    profile_picture_url: Optional[str]
    status: UserStatus
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    preferences: UserPreferences

    @classmethod
    def from_user(cls, user: User) -> "UserResponse":
        """Create response model from User model"""
        return cls(
            uid=user.uid,
            email=user.email,
            display_name=user.display_name,
            first_name=user.first_name,
            last_name=user.last_name,
            profile_picture_url=user.profile_picture_url,
            status=user.status,
            email_verified=user.email_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
            preferences=user.preferences
        )