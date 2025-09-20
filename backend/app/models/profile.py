from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum

from .base import BaseFirestoreModel

class BodyMeasurementUnit(str, Enum):
    """Units for body measurements"""
    CM = "cm"
    INCHES = "inches"

class FitPreference(str, Enum):
    """Clothing fit preferences"""
    SLIM = "slim"
    REGULAR = "regular"
    LOOSE = "loose"
    OVERSIZED = "oversized"

class StylePreference(str, Enum):
    """Style preferences"""
    CASUAL = "casual"
    FORMAL = "formal"
    SPORTY = "sporty"
    VINTAGE = "vintage"
    BOHEMIAN = "bohemian"
    MINIMALIST = "minimalist"
    TRENDY = "trendy"
    CLASSIC = "classic"

class BodyMeasurements(BaseModel):
    """Body measurements for better fit recommendations"""
    unit: BodyMeasurementUnit = BodyMeasurementUnit.CM

    # Basic measurements
    height: Optional[float] = Field(None, description="Height in specified units")
    weight: Optional[float] = Field(None, description="Weight in kg")

    # Body measurements
    chest_bust: Optional[float] = Field(None, description="Chest/bust circumference")
    waist: Optional[float] = Field(None, description="Waist circumference")
    hips: Optional[float] = Field(None, description="Hip circumference")

    # Additional measurements
    shoulder_width: Optional[float] = Field(None, description="Shoulder width")
    arm_length: Optional[float] = Field(None, description="Arm length")
    leg_length: Optional[float] = Field(None, description="Leg length")
    neck: Optional[float] = Field(None, description="Neck circumference")

    # Clothing sizes
    shirt_size: Optional[str] = Field(None, description="Preferred shirt size")
    pants_size: Optional[str] = Field(None, description="Preferred pants size")
    shoe_size: Optional[str] = Field(None, description="Shoe size")

    @field_validator("height")
    @classmethod
    def validate_height(cls, v):
        """Validate height is reasonable"""
        if v is not None and (v < 50 or v > 300):  # 50cm to 300cm
            raise ValueError("Height must be between 50 and 300 cm")
        return v

    @field_validator("weight")
    @classmethod
    def validate_weight(cls, v):
        """Validate weight is reasonable"""
        if v is not None and (v < 20 or v > 500):  # 20kg to 500kg
            raise ValueError("Weight must be between 20 and 500 kg")
        return v

class StylePreferences(BaseModel):
    """User style preferences and fashion choices"""

    # Preferred styles
    style_preferences: List[StylePreference] = Field(default_factory=list, description="Preferred clothing styles")
    fit_preference: FitPreference = Field(default=FitPreference.REGULAR, description="Preferred clothing fit")

    # Color preferences
    preferred_colors: List[str] = Field(default_factory=list, description="Preferred colors (hex codes or names)")
    avoided_colors: List[str] = Field(default_factory=list, description="Colors to avoid")

    # Brand preferences
    preferred_brands: List[str] = Field(default_factory=list, description="Preferred clothing brands")
    budget_range_min: Optional[float] = Field(None, description="Minimum budget for clothing items")
    budget_range_max: Optional[float] = Field(None, description="Maximum budget for clothing items")

    # Occasion preferences
    primary_occasions: List[str] = Field(default_factory=list, description="Primary occasions for clothing (work, casual, formal, etc.)")

    # Sustainability preferences
    sustainability_important: bool = Field(default=False, description="Whether sustainability is important")
    ethical_brands_only: bool = Field(default=False, description="Prefer only ethical brands")

class PrivacySettings(BaseModel):
    """User privacy settings for profile visibility"""

    profile_visibility: str = Field(default="friends", description="Who can see profile (public, friends, private)")
    measurements_visible: bool = Field(default=False, description="Whether measurements are visible to others")
    style_preferences_visible: bool = Field(default=True, description="Whether style preferences are visible")
    wardrobe_visible: bool = Field(default=False, description="Whether wardrobe is visible to others")
    try_on_results_visible: bool = Field(default=False, description="Whether try-on results are visible")

    # Data sharing
    allow_analytics: bool = Field(default=True, description="Allow anonymous analytics")
    allow_personalization: bool = Field(default=True, description="Allow personalized recommendations")
    allow_marketing: bool = Field(default=False, description="Allow marketing communications")

class Profile(BaseFirestoreModel):
    """Extended user profile with body measurements, style preferences, and privacy settings"""

    # Link to user
    user_uid: str = Field(..., description="Reference to User document")

    # Personal information
    bio: Optional[str] = Field(None, description="User bio/description", max_length=500)
    location: Optional[str] = Field(None, description="User location (city, country)")
    website: Optional[str] = Field(None, description="Personal website URL")

    # Body measurements
    measurements: BodyMeasurements = Field(default_factory=BodyMeasurements, description="Body measurements")

    # Style preferences
    style_preferences: StylePreferences = Field(default_factory=StylePreferences, description="Style preferences")

    # Privacy settings
    privacy_settings: PrivacySettings = Field(default_factory=PrivacySettings, description="Privacy settings")

    # Profile completion
    profile_completion_percentage: float = Field(default=0.0, description="Profile completion percentage")
    onboarding_completed: bool = Field(default=False, description="Whether onboarding is completed")

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v):
        """Validate bio length and content"""
        if v and len(v.strip()) < 10:
            raise ValueError("Bio must be at least 10 characters")
        return v.strip() if v else None

    @field_validator("website")
    @classmethod
    def validate_website(cls, v):
        """Basic website URL validation"""
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Website URL must start with http:// or https://")
        return v

    def calculate_completion_percentage(self) -> float:
        """Calculate profile completion percentage"""
        total_fields = 15  # Total number of important fields
        completed_fields = 0

        # Check basic info
        if self.bio:
            completed_fields += 1
        if self.location:
            completed_fields += 1

        # Check measurements
        measurements = self.measurements
        if measurements.height:
            completed_fields += 1
        if measurements.weight:
            completed_fields += 1
        if measurements.chest_bust:
            completed_fields += 1
        if measurements.waist:
            completed_fields += 1
        if measurements.hips:
            completed_fields += 1
        if measurements.shirt_size:
            completed_fields += 1
        if measurements.pants_size:
            completed_fields += 1
        if measurements.shoe_size:
            completed_fields += 1

        # Check style preferences
        style_prefs = self.style_preferences
        if style_prefs.style_preferences:
            completed_fields += 1
        if style_prefs.preferred_colors:
            completed_fields += 1
        if style_prefs.primary_occasions:
            completed_fields += 1
        if style_prefs.budget_range_min and style_prefs.budget_range_max:
            completed_fields += 1

        # Check onboarding
        if self.onboarding_completed:
            completed_fields += 1

        percentage = (completed_fields / total_fields) * 100
        self.profile_completion_percentage = round(percentage, 1)
        return self.profile_completion_percentage

    def update_profile_completion(self):
        """Update profile completion percentage"""
        self.calculate_completion_percentage()
        self.update_timestamp()

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore format with special handling for nested objects"""
        data = super().to_firestore()

        # Convert nested models to dicts
        for field in ['measurements', 'style_preferences', 'privacy_settings']:
            if field in data and hasattr(data[field], 'model_dump'):
                data[field] = data[field].model_dump()

        return data

    @classmethod
    def from_firestore(cls, doc_data: Dict[str, Any], doc_id: str = None):
        """Create Profile from Firestore document with special handling"""
        if not doc_data:
            return None

        # Handle nested objects
        if 'measurements' in doc_data and isinstance(doc_data['measurements'], dict):
            doc_data['measurements'] = BodyMeasurements(**doc_data['measurements'])

        if 'style_preferences' in doc_data and isinstance(doc_data['style_preferences'], dict):
            doc_data['style_preferences'] = StylePreferences(**doc_data['style_preferences'])

        if 'privacy_settings' in doc_data and isinstance(doc_data['privacy_settings'], dict):
            doc_data['privacy_settings'] = PrivacySettings(**doc_data['privacy_settings'])

        return super().from_firestore(doc_data, doc_id)

class ProfileCreate(BaseModel):
    """Model for creating a new profile"""
    user_uid: str
    bio: Optional[str] = None
    location: Optional[str] = None

class ProfileUpdate(BaseModel):
    """Model for updating profile information"""
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    measurements: Optional[BodyMeasurements] = None
    style_preferences: Optional[StylePreferences] = None
    privacy_settings: Optional[PrivacySettings] = None

class ProfileResponse(BaseModel):
    """Model for profile API responses"""
    user_uid: str
    bio: Optional[str]
    location: Optional[str]
    website: Optional[str]
    measurements: BodyMeasurements
    style_preferences: StylePreferences
    privacy_settings: PrivacySettings
    profile_completion_percentage: float
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_profile(cls, profile: Profile) -> "ProfileResponse":
        """Create response model from Profile model"""
        return cls(
            user_uid=profile.user_uid,
            bio=profile.bio,
            location=profile.location,
            website=profile.website,
            measurements=profile.measurements,
            style_preferences=profile.style_preferences,
            privacy_settings=profile.privacy_settings,
            profile_completion_percentage=profile.profile_completion_percentage,
            onboarding_completed=profile.onboarding_completed,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )