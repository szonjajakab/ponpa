import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.user import (
    User, UserStatus, UserPreferences, UserCreate,
    UserUpdate, UserResponse
)

class TestUserPreferences:
    """Test UserPreferences model"""

    def test_default_preferences(self):
        """Test default preferences values"""
        prefs = UserPreferences()

        assert prefs.notifications_enabled is True
        assert prefs.email_notifications is True
        assert prefs.push_notifications is True
        assert prefs.privacy_level == "standard"
        assert prefs.language == "en"
        assert prefs.theme == "light"

    def test_custom_preferences(self):
        """Test custom preferences"""
        prefs = UserPreferences(
            notifications_enabled=False,
            privacy_level="private",
            language="es",
            theme="dark"
        )

        assert prefs.notifications_enabled is False
        assert prefs.privacy_level == "private"
        assert prefs.language == "es"
        assert prefs.theme == "dark"

class TestUser:
    """Test User model"""

    @pytest.fixture
    def valid_user_data(self):
        """Valid user data for testing"""
        return {
            "uid": "test_user_123",
            "email": "test@example.com",
            "display_name": "Test User",
            "first_name": "Test",
            "last_name": "User"
        }

    def test_create_user_minimal(self):
        """Test creating user with minimal required fields"""
        user = User(uid="test_123", email="test@example.com")

        assert user.uid == "test_123"
        assert user.email == "test@example.com"
        assert user.status == UserStatus.ACTIVE
        assert user.email_verified is False
        assert user.preferences is not None
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_create_user_full(self, valid_user_data):
        """Test creating user with all fields"""
        user = User(**valid_user_data)

        assert user.uid == "test_user_123"
        assert user.email == "test@example.com"
        assert user.display_name == "Test User"
        assert user.first_name == "Test"
        assert user.last_name == "User"

    def test_email_validation(self):
        """Test email validation"""
        # Valid emails
        user1 = User(uid="test1", email="valid@example.com")
        assert user1.email == "valid@example.com"

        user2 = User(uid="test2", email="VALID@EXAMPLE.COM")
        assert user2.email == "valid@example.com"  # Should be lowercased

        # Invalid emails
        with pytest.raises(ValidationError):
            User(uid="test3", email="invalid-email")

        with pytest.raises(ValidationError):
            User(uid="test4", email="")

    def test_display_name_validation(self):
        """Test display name validation"""
        # Valid display names
        user1 = User(uid="test1", email="test@example.com", display_name="John Doe")
        assert user1.display_name == "John Doe"

        user2 = User(uid="test2", email="test@example.com", display_name="  Spaced  ")
        assert user2.display_name == "Spaced"

        # Invalid display names
        with pytest.raises(ValidationError):
            User(uid="test3", email="test@example.com", display_name="X")  # Too short

    def test_phone_number_validation(self):
        """Test phone number validation"""
        # Valid phone numbers
        user1 = User(uid="test1", email="test@example.com", phone_number="+1-234-567-8901")
        assert user1.phone_number == "+1-234-567-8901"

        user2 = User(uid="test2", email="test@example.com", phone_number="12345678901")
        assert user2.phone_number == "12345678901"

        # Invalid phone numbers
        with pytest.raises(ValidationError):
            User(uid="test3", email="test@example.com", phone_number="123")  # Too short

    def test_get_full_name(self):
        """Test get_full_name method"""
        # With first and last name
        user1 = User(uid="test1", email="test@example.com", first_name="John", last_name="Doe")
        assert user1.get_full_name() == "John Doe"

        # With display name only
        user2 = User(uid="test2", email="test@example.com", display_name="Jane Smith")
        assert user2.get_full_name() == "Jane Smith"

        # With neither - should use email prefix
        user3 = User(uid="test3", email="johndoe@example.com")
        assert user3.get_full_name() == "johndoe"

    def test_is_profile_complete(self):
        """Test is_profile_complete method"""
        # Complete with display name
        user1 = User(uid="test1", email="test@example.com", display_name="John Doe")
        assert user1.is_profile_complete() is True

        # Complete with first and last name
        user2 = User(uid="test2", email="test@example.com", first_name="John", last_name="Doe")
        assert user2.is_profile_complete() is True

        # Incomplete
        user3 = User(uid="test3", email="test@example.com")
        assert user3.is_profile_complete() is False

    def test_update_last_login(self):
        """Test update_last_login method"""
        user = User(uid="test1", email="test@example.com")
        original_updated = user.updated_at

        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)

        user.update_last_login()

        assert user.last_login is not None
        assert isinstance(user.last_login, datetime)
        assert user.updated_at > original_updated

    def test_to_firestore(self):
        """Test to_firestore conversion"""
        now = datetime.now()
        user = User(
            uid="test1",
            email="test@example.com",
            display_name="Test User",
            date_of_birth=now,
            last_login=now
        )

        firestore_data = user.to_firestore()

        assert isinstance(firestore_data, dict)
        assert firestore_data["uid"] == "test1"
        assert firestore_data["email"] == "test@example.com"
        assert firestore_data["display_name"] == "Test User"

        # Check timestamp conversion
        assert isinstance(firestore_data["created_at"], int)
        assert isinstance(firestore_data["updated_at"], int)
        assert isinstance(firestore_data["date_of_birth"], int)
        assert isinstance(firestore_data["last_login"], int)

        # Check preferences conversion
        assert isinstance(firestore_data["preferences"], dict)

    def test_from_firestore(self):
        """Test from_firestore creation"""
        now_timestamp = int(datetime.now().timestamp())
        firestore_data = {
            "uid": "test1",
            "email": "test@example.com",
            "display_name": "Test User",
            "created_at": now_timestamp,
            "updated_at": now_timestamp,
            "date_of_birth": now_timestamp,
            "last_login": now_timestamp,
            "preferences": {
                "notifications_enabled": True,
                "email_notifications": False,
                "language": "es"
            }
        }

        user = User.from_firestore(firestore_data, "test1")

        assert user.uid == "test1"
        assert user.email == "test@example.com"
        assert user.display_name == "Test User"

        # Check timestamp conversion
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)
        assert isinstance(user.date_of_birth, datetime)
        assert isinstance(user.last_login, datetime)

        # Check preferences conversion
        assert isinstance(user.preferences, UserPreferences)
        assert user.preferences.language == "es"

    def test_from_firestore_empty(self):
        """Test from_firestore with empty data"""
        result = User.from_firestore({})
        assert result is None

        result = User.from_firestore(None)
        assert result is None

class TestUserCreate:
    """Test UserCreate model"""

    def test_valid_user_create(self):
        """Test valid user creation data"""
        user_create = UserCreate(
            uid="test123",
            email="test@example.com",
            display_name="Test User"
        )

        assert user_create.uid == "test123"
        assert user_create.email == "test@example.com"
        assert user_create.display_name == "Test User"

    def test_user_create_minimal(self):
        """Test minimal user creation data"""
        user_create = UserCreate(
            uid="test123",
            email="test@example.com"
        )

        assert user_create.uid == "test123"
        assert user_create.email == "test@example.com"
        assert user_create.display_name is None

class TestUserUpdate:
    """Test UserUpdate model"""

    def test_user_update(self):
        """Test user update data"""
        user_update = UserUpdate(
            display_name="Updated Name",
            first_name="Updated",
            phone_number="1234567890"
        )

        assert user_update.display_name == "Updated Name"
        assert user_update.first_name == "Updated"
        assert user_update.phone_number == "1234567890"
        assert user_update.last_name is None

class TestUserResponse:
    """Test UserResponse model"""

    def test_from_user(self):
        """Test creating UserResponse from User"""
        user = User(
            uid="test123",
            email="test@example.com",
            display_name="Test User",
            first_name="Test",
            last_name="User",
            status=UserStatus.ACTIVE,
            email_verified=True
        )

        response = UserResponse.from_user(user)

        assert response.uid == "test123"
        assert response.email == "test@example.com"
        assert response.display_name == "Test User"
        assert response.first_name == "Test"
        assert response.last_name == "User"
        assert response.status == UserStatus.ACTIVE
        assert response.email_verified is True
        assert isinstance(response.preferences, UserPreferences)

class TestUserStatus:
    """Test UserStatus enum"""

    def test_user_status_values(self):
        """Test UserStatus enum values"""
        assert UserStatus.ACTIVE == "active"
        assert UserStatus.INACTIVE == "inactive"
        assert UserStatus.SUSPENDED == "suspended"

    def test_user_status_in_model(self):
        """Test UserStatus in User model"""
        user = User(uid="test1", email="test@example.com", status=UserStatus.SUSPENDED)
        assert user.status == UserStatus.SUSPENDED
        assert user.status == "suspended"