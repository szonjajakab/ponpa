import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.profile import (
    Profile, BodyMeasurements, BodyMeasurementUnit, StylePreferences,
    PrivacySettings, FitPreference, StylePreference, ProfileCreate,
    ProfileUpdate, ProfileResponse
)

class TestBodyMeasurements:
    """Test BodyMeasurements model"""

    def test_default_measurements(self):
        """Test default measurements"""
        measurements = BodyMeasurements()

        assert measurements.unit == BodyMeasurementUnit.CM
        assert measurements.height is None
        assert measurements.weight is None
        assert measurements.chest_bust is None

    def test_valid_measurements(self):
        """Test valid measurements"""
        measurements = BodyMeasurements(
            unit=BodyMeasurementUnit.CM,
            height=175.5,
            weight=70.0,
            chest_bust=95.0,
            waist=75.0,
            hips=98.0,
            shirt_size="M",
            pants_size="32",
            shoe_size="9"
        )

        assert measurements.height == 175.5
        assert measurements.weight == 70.0
        assert measurements.chest_bust == 95.0
        assert measurements.shirt_size == "M"

    def test_height_validation(self):
        """Test height validation"""
        # Valid heights
        measurements1 = BodyMeasurements(height=170.0)
        assert measurements1.height == 170.0

        # Invalid heights
        with pytest.raises(ValidationError):
            BodyMeasurements(height=30.0)  # Too short

        with pytest.raises(ValidationError):
            BodyMeasurements(height=350.0)  # Too tall

    def test_weight_validation(self):
        """Test weight validation"""
        # Valid weights
        measurements1 = BodyMeasurements(weight=70.0)
        assert measurements1.weight == 70.0

        # Invalid weights
        with pytest.raises(ValidationError):
            BodyMeasurements(weight=10.0)  # Too light

        with pytest.raises(ValidationError):
            BodyMeasurements(weight=600.0)  # Too heavy

class TestStylePreferences:
    """Test StylePreferences model"""

    def test_default_style_preferences(self):
        """Test default style preferences"""
        prefs = StylePreferences()

        assert prefs.style_preferences == []
        assert prefs.fit_preference == FitPreference.REGULAR
        assert prefs.preferred_colors == []
        assert prefs.avoided_colors == []
        assert prefs.preferred_brands == []
        assert prefs.primary_occasions == []
        assert prefs.sustainability_important is False

    def test_custom_style_preferences(self):
        """Test custom style preferences"""
        prefs = StylePreferences(
            style_preferences=[StylePreference.CASUAL, StylePreference.SPORTY],
            fit_preference=FitPreference.SLIM,
            preferred_colors=["#FF0000", "#0000FF"],
            preferred_brands=["Nike", "Adidas"],
            budget_range_min=50.0,
            budget_range_max=200.0,
            sustainability_important=True
        )

        assert StylePreference.CASUAL in prefs.style_preferences
        assert StylePreference.SPORTY in prefs.style_preferences
        assert prefs.fit_preference == FitPreference.SLIM
        assert "#FF0000" in prefs.preferred_colors
        assert "Nike" in prefs.preferred_brands
        assert prefs.budget_range_min == 50.0
        assert prefs.sustainability_important is True

class TestPrivacySettings:
    """Test PrivacySettings model"""

    def test_default_privacy_settings(self):
        """Test default privacy settings"""
        privacy = PrivacySettings()

        assert privacy.profile_visibility == "friends"
        assert privacy.measurements_visible is False
        assert privacy.style_preferences_visible is True
        assert privacy.wardrobe_visible is False
        assert privacy.allow_analytics is True
        assert privacy.allow_marketing is False

    def test_custom_privacy_settings(self):
        """Test custom privacy settings"""
        privacy = PrivacySettings(
            profile_visibility="public",
            measurements_visible=True,
            allow_marketing=True
        )

        assert privacy.profile_visibility == "public"
        assert privacy.measurements_visible is True
        assert privacy.allow_marketing is True

class TestProfile:
    """Test Profile model"""

    @pytest.fixture
    def valid_profile_data(self):
        """Valid profile data for testing"""
        return {
            "user_uid": "test_user_123",
            "bio": "This is a test bio with enough characters to be valid",
            "location": "New York, USA"
        }

    def test_create_profile_minimal(self):
        """Test creating profile with minimal required fields"""
        profile = Profile(user_uid="test_user_123")

        assert profile.user_uid == "test_user_123"
        assert profile.bio is None
        assert profile.location is None
        assert isinstance(profile.measurements, BodyMeasurements)
        assert isinstance(profile.style_preferences, StylePreferences)
        assert isinstance(profile.privacy_settings, PrivacySettings)
        assert profile.profile_completion_percentage == 0.0
        assert profile.onboarding_completed is False

    def test_create_profile_full(self, valid_profile_data):
        """Test creating profile with all fields"""
        profile = Profile(**valid_profile_data)

        assert profile.user_uid == "test_user_123"
        assert profile.bio == "This is a test bio with enough characters to be valid"
        assert profile.location == "New York, USA"

    def test_bio_validation(self):
        """Test bio validation"""
        # Valid bio
        profile1 = Profile(
            user_uid="test1",
            bio="This is a valid bio with enough characters"
        )
        assert profile1.bio == "This is a valid bio with enough characters"

        # Bio with extra spaces
        profile2 = Profile(
            user_uid="test2",
            bio="  Spaced bio  "
        )
        assert profile2.bio == "Spaced bio"

        # Invalid bio (too short)
        with pytest.raises(ValidationError):
            Profile(user_uid="test3", bio="Short")

    def test_website_validation(self):
        """Test website URL validation"""
        # Valid websites
        profile1 = Profile(user_uid="test1", website="https://example.com")
        assert profile1.website == "https://example.com"

        profile2 = Profile(user_uid="test2", website="http://example.com")
        assert profile2.website == "http://example.com"

        # Invalid websites
        with pytest.raises(ValidationError):
            Profile(user_uid="test3", website="invalid-url")

        with pytest.raises(ValidationError):
            Profile(user_uid="test4", website="ftp://example.com")

    def test_calculate_completion_percentage(self):
        """Test profile completion percentage calculation"""
        # Empty profile
        profile = Profile(user_uid="test1")
        percentage = profile.calculate_completion_percentage()
        assert percentage == 0.0

        # Partially filled profile
        profile.bio = "This is a test bio with enough characters"
        profile.location = "New York"
        profile.measurements.height = 175.0
        profile.measurements.weight = 70.0
        profile.measurements.shirt_size = "M"
        profile.style_preferences.style_preferences = [StylePreference.CASUAL]
        profile.onboarding_completed = True

        percentage = profile.calculate_completion_percentage()
        assert percentage > 0.0
        assert percentage < 100.0
        assert profile.profile_completion_percentage == percentage

    def test_update_profile_completion(self):
        """Test update_profile_completion method"""
        profile = Profile(user_uid="test1")
        original_updated = profile.updated_at

        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)

        profile.bio = "Test bio with enough characters"
        profile.update_profile_completion()

        assert profile.profile_completion_percentage > 0.0
        assert profile.updated_at > original_updated

    def test_to_firestore(self):
        """Test to_firestore conversion"""
        profile = Profile(
            user_uid="test1",
            bio="Test bio with enough characters",
            location="New York",
            measurements=BodyMeasurements(height=175.0, weight=70.0),
            style_preferences=StylePreferences(
                style_preferences=[StylePreference.CASUAL],
                preferred_colors=["#FF0000"]
            ),
            privacy_settings=PrivacySettings(profile_visibility="public")
        )

        firestore_data = profile.to_firestore()

        assert isinstance(firestore_data, dict)
        assert firestore_data["user_uid"] == "test1"
        assert firestore_data["bio"] == "Test bio with enough characters"
        assert firestore_data["location"] == "New York"

        # Check nested objects are converted to dicts
        assert isinstance(firestore_data["measurements"], dict)
        assert isinstance(firestore_data["style_preferences"], dict)
        assert isinstance(firestore_data["privacy_settings"], dict)

        # Check timestamp conversion
        assert isinstance(firestore_data["created_at"], int)
        assert isinstance(firestore_data["updated_at"], int)

    def test_from_firestore(self):
        """Test from_firestore creation"""
        now_timestamp = int(datetime.now().timestamp())
        firestore_data = {
            "user_uid": "test1",
            "bio": "Test bio with enough characters to pass validation",
            "location": "New York",
            "created_at": now_timestamp,
            "updated_at": now_timestamp,
            "measurements": {
                "unit": "cm",
                "height": 175.0,
                "weight": 70.0
            },
            "style_preferences": {
                "style_preferences": ["casual"],
                "fit_preference": "slim",
                "preferred_colors": ["#FF0000"]
            },
            "privacy_settings": {
                "profile_visibility": "public",
                "measurements_visible": True
            },
            "profile_completion_percentage": 45.5,
            "onboarding_completed": True
        }

        profile = Profile.from_firestore(firestore_data, "profile1")

        assert profile.user_uid == "test1"
        assert profile.bio == "Test bio with enough characters to pass validation"
        assert profile.location == "New York"

        # Check timestamp conversion
        assert isinstance(profile.created_at, datetime)
        assert isinstance(profile.updated_at, datetime)

        # Check nested objects conversion
        assert isinstance(profile.measurements, BodyMeasurements)
        assert profile.measurements.height == 175.0
        assert profile.measurements.weight == 70.0

        assert isinstance(profile.style_preferences, StylePreferences)
        assert StylePreference.CASUAL in profile.style_preferences.style_preferences
        assert profile.style_preferences.fit_preference == FitPreference.SLIM

        assert isinstance(profile.privacy_settings, PrivacySettings)
        assert profile.privacy_settings.profile_visibility == "public"
        assert profile.privacy_settings.measurements_visible is True

        assert profile.profile_completion_percentage == 45.5
        assert profile.onboarding_completed is True

    def test_from_firestore_empty(self):
        """Test from_firestore with empty data"""
        result = Profile.from_firestore({})
        assert result is None

        result = Profile.from_firestore(None)
        assert result is None

class TestProfileCreate:
    """Test ProfileCreate model"""

    def test_valid_profile_create(self):
        """Test valid profile creation data"""
        profile_create = ProfileCreate(
            user_uid="test123",
            bio="Test bio with enough characters",
            location="New York"
        )

        assert profile_create.user_uid == "test123"
        assert profile_create.bio == "Test bio with enough characters"
        assert profile_create.location == "New York"

    def test_profile_create_minimal(self):
        """Test minimal profile creation data"""
        profile_create = ProfileCreate(user_uid="test123")

        assert profile_create.user_uid == "test123"
        assert profile_create.bio is None
        assert profile_create.location is None

class TestProfileUpdate:
    """Test ProfileUpdate model"""

    def test_profile_update(self):
        """Test profile update data"""
        measurements = BodyMeasurements(height=180.0, weight=75.0)
        style_prefs = StylePreferences(
            style_preferences=[StylePreference.FORMAL],
            fit_preference=FitPreference.SLIM
        )

        profile_update = ProfileUpdate(
            bio="Updated bio with enough characters",
            location="Los Angeles",
            measurements=measurements,
            style_preferences=style_prefs
        )

        assert profile_update.bio == "Updated bio with enough characters"
        assert profile_update.location == "Los Angeles"
        assert profile_update.measurements == measurements
        assert profile_update.style_preferences == style_prefs

class TestProfileResponse:
    """Test ProfileResponse model"""

    def test_from_profile(self):
        """Test creating ProfileResponse from Profile"""
        profile = Profile(
            user_uid="test123",
            bio="Test bio with enough characters",
            location="New York",
            measurements=BodyMeasurements(height=175.0),
            style_preferences=StylePreferences(
                style_preferences=[StylePreference.CASUAL]
            ),
            privacy_settings=PrivacySettings(profile_visibility="friends"),
            profile_completion_percentage=60.0,
            onboarding_completed=True
        )

        response = ProfileResponse.from_profile(profile)

        assert response.user_uid == "test123"
        assert response.bio == "Test bio with enough characters"
        assert response.location == "New York"
        assert isinstance(response.measurements, BodyMeasurements)
        assert isinstance(response.style_preferences, StylePreferences)
        assert isinstance(response.privacy_settings, PrivacySettings)
        assert response.profile_completion_percentage == 60.0
        assert response.onboarding_completed is True

class TestEnums:
    """Test enum classes"""

    def test_body_measurement_unit(self):
        """Test BodyMeasurementUnit enum"""
        assert BodyMeasurementUnit.CM == "cm"
        assert BodyMeasurementUnit.INCHES == "inches"

    def test_fit_preference(self):
        """Test FitPreference enum"""
        assert FitPreference.SLIM == "slim"
        assert FitPreference.REGULAR == "regular"
        assert FitPreference.LOOSE == "loose"
        assert FitPreference.OVERSIZED == "oversized"

    def test_style_preference(self):
        """Test StylePreference enum"""
        assert StylePreference.CASUAL == "casual"
        assert StylePreference.FORMAL == "formal"
        assert StylePreference.SPORTY == "sporty"
        assert StylePreference.VINTAGE == "vintage"
        assert StylePreference.CLASSIC == "classic"