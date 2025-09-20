import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException, UploadFile
import io

from app.services.user_service import UserService, ProfileService
from app.models.user import UserCreate, UserUpdate, UserResponse
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse

class TestUserService:
    """Test UserService class"""

    @pytest.fixture
    def mock_firestore_helper(self):
        """Mock FirestoreHelper for testing"""
        with patch('app.services.user_service.FirestoreHelper') as mock:
            yield mock

    @pytest.fixture
    def mock_storage_bucket(self):
        """Mock Firebase Storage bucket"""
        with patch('app.services.user_service.get_storage_bucket') as mock:
            yield mock

    @pytest.fixture
    def sample_user_create(self):
        """Sample user creation data"""
        return UserCreate(
            uid="test_user_123",
            email="test@example.com",
            display_name="Test User",
            first_name="Test",
            last_name="User"
        )

    @pytest.fixture
    def sample_user_doc(self):
        """Sample user document from Firestore"""
        return {
            "uid": "test_user_123",
            "email": "test@example.com",
            "display_name": "Test User",
            "first_name": "Test",
            "last_name": "User",
            "status": "active",
            "email_verified": False,
            "created_at": 1234567890,
            "updated_at": 1234567890,
            "preferences": {
                "notifications_enabled": True,
                "email_notifications": True,
                "push_notifications": True,
                "privacy_level": "standard",
                "language": "en",
                "theme": "light"
            }
        }

    @pytest.mark.asyncio
    async def test_create_user_success(self, mock_firestore_helper, sample_user_create):
        """Test successful user creation"""
        # Mock Firestore operations
        mock_firestore_helper.get_document.return_value = None  # User doesn't exist
        mock_firestore_helper.create_document.return_value = True

        result = await UserService.create_user(sample_user_create)

        assert isinstance(result, UserResponse)
        assert result.uid == "test_user_123"
        assert result.email == "test@example.com"
        assert result.display_name == "Test User"

        # Verify Firestore calls
        mock_firestore_helper.get_document.assert_called_once_with("users", "test_user_123")
        mock_firestore_helper.create_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_already_exists(self, mock_firestore_helper, sample_user_create, sample_user_doc):
        """Test user creation when user already exists"""
        # Mock user already exists
        mock_firestore_helper.get_document.return_value = sample_user_doc

        with pytest.raises(HTTPException) as exc_info:
            await UserService.create_user(sample_user_create)

        assert exc_info.value.status_code == 409
        assert "already exists" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_create_user_firestore_failure(self, mock_firestore_helper, sample_user_create):
        """Test user creation when Firestore operation fails"""
        mock_firestore_helper.get_document.return_value = None
        mock_firestore_helper.create_document.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await UserService.create_user(sample_user_create)

        assert exc_info.value.status_code == 500
        assert "Failed to create user" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_user_by_uid_success(self, mock_firestore_helper, sample_user_doc):
        """Test successful user retrieval"""
        mock_firestore_helper.get_document.return_value = sample_user_doc

        result = await UserService.get_user_by_uid("test_user_123")

        assert isinstance(result, UserResponse)
        assert result.uid == "test_user_123"
        assert result.email == "test@example.com"

        mock_firestore_helper.get_document.assert_called_once_with("users", "test_user_123")

    @pytest.mark.asyncio
    async def test_get_user_by_uid_not_found(self, mock_firestore_helper):
        """Test user retrieval when user doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        result = await UserService.get_user_by_uid("nonexistent_user")

        assert result is None

    @pytest.mark.asyncio
    async def test_update_user_success(self, mock_firestore_helper, sample_user_doc):
        """Test successful user update"""
        mock_firestore_helper.get_document.return_value = sample_user_doc
        mock_firestore_helper.update_document.return_value = True

        user_update = UserUpdate(
            display_name="Updated Name",
            first_name="Updated"
        )

        result = await UserService.update_user("test_user_123", user_update)

        assert isinstance(result, UserResponse)
        assert result.display_name == "Updated Name"
        assert result.first_name == "Updated"

        mock_firestore_helper.update_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, mock_firestore_helper):
        """Test user update when user doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        user_update = UserUpdate(display_name="Updated Name")

        with pytest.raises(HTTPException) as exc_info:
            await UserService.update_user("nonexistent_user", user_update)

        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_delete_user_success(self, mock_firestore_helper):
        """Test successful user deletion"""
        mock_firestore_helper.delete_document.return_value = True

        result = await UserService.delete_user("test_user_123")

        assert result is True

        # Should delete both profile and user
        assert mock_firestore_helper.delete_document.call_count == 2

    @pytest.mark.asyncio
    async def test_upload_profile_picture_success(self, mock_firestore_helper, mock_storage_bucket, sample_user_doc):
        """Test successful profile picture upload"""
        # Mock file
        file_content = b"fake image content"
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "image/jpeg"
        mock_file.filename = "test.jpg"
        mock_file.read = AsyncMock(return_value=file_content)

        # Mock storage bucket
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.public_url = "https://example.com/profile.jpg"
        mock_bucket.blob.return_value = mock_blob
        mock_storage_bucket.return_value = mock_bucket

        # Mock Firestore
        mock_firestore_helper.get_document.return_value = sample_user_doc
        mock_firestore_helper.update_document.return_value = True

        result = await UserService.upload_profile_picture("test_user_123", mock_file)

        assert result == "https://example.com/profile.jpg"

        # Verify storage operations
        mock_bucket.blob.assert_called_once()
        mock_blob.upload_from_string.assert_called_once_with(file_content, content_type="image/jpeg")
        mock_blob.make_public.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_profile_picture_invalid_file_type(self, mock_storage_bucket):
        """Test profile picture upload with invalid file type"""
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "text/plain"

        with pytest.raises(HTTPException) as exc_info:
            await UserService.upload_profile_picture("test_user_123", mock_file)

        assert exc_info.value.status_code == 400
        assert "must be an image" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_upload_profile_picture_file_too_large(self, mock_storage_bucket):
        """Test profile picture upload with file too large"""
        # 6MB file (over 5MB limit)
        large_content = b"x" * (6 * 1024 * 1024)
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=large_content)

        with pytest.raises(HTTPException) as exc_info:
            await UserService.upload_profile_picture("test_user_123", mock_file)

        assert exc_info.value.status_code == 400
        assert "less than 5MB" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_remove_profile_picture_success(self, mock_firestore_helper, mock_storage_bucket):
        """Test successful profile picture removal"""
        # User with profile picture
        user_doc = {
            "uid": "test_user_123",
            "email": "test@example.com",
            "profile_picture_url": "https://example.com/profile.jpg",
            "created_at": 1234567890,
            "updated_at": 1234567890,
            "preferences": {}
        }

        mock_firestore_helper.get_document.return_value = user_doc
        mock_firestore_helper.update_document.return_value = True

        # Mock storage
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.exists.return_value = True
        mock_bucket.blob.return_value = mock_blob
        mock_storage_bucket.return_value = mock_bucket

        result = await UserService.remove_profile_picture("test_user_123")

        assert result is True
        mock_firestore_helper.update_document.assert_called_once()

class TestProfileService:
    """Test ProfileService class"""

    @pytest.fixture
    def mock_firestore_helper(self):
        """Mock FirestoreHelper for testing"""
        with patch('app.services.user_service.FirestoreHelper') as mock:
            yield mock

    @pytest.fixture
    def sample_profile_create(self):
        """Sample profile creation data"""
        return ProfileCreate(
            user_uid="test_user_123",
            bio="This is a test bio with enough characters to be valid",
            location="New York, USA"
        )

    @pytest.fixture
    def sample_profile_doc(self):
        """Sample profile document from Firestore"""
        return {
            "user_uid": "test_user_123",
            "bio": "Test bio with enough characters to pass validation",
            "location": "New York",
            "created_at": 1234567890,
            "updated_at": 1234567890,
            "measurements": {
                "unit": "cm",
                "height": 175.0,
                "weight": 70.0
            },
            "style_preferences": {
                "style_preferences": [],
                "fit_preference": "regular",
                "preferred_colors": []
            },
            "privacy_settings": {
                "profile_visibility": "friends",
                "measurements_visible": False
            },
            "profile_completion_percentage": 25.0,
            "onboarding_completed": False
        }

    @pytest.mark.asyncio
    async def test_create_profile_success(self, mock_firestore_helper, sample_profile_create):
        """Test successful profile creation"""
        mock_firestore_helper.get_document.return_value = None  # Profile doesn't exist
        mock_firestore_helper.create_document.return_value = True

        result = await ProfileService.create_profile(sample_profile_create)

        assert isinstance(result, ProfileResponse)
        assert result.user_uid == "test_user_123"
        assert result.bio == "This is a test bio with enough characters to be valid"

        mock_firestore_helper.create_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_profile_already_exists(self, mock_firestore_helper, sample_profile_create, sample_profile_doc):
        """Test profile creation when profile already exists"""
        mock_firestore_helper.get_document.return_value = sample_profile_doc

        with pytest.raises(HTTPException) as exc_info:
            await ProfileService.create_profile(sample_profile_create)

        assert exc_info.value.status_code == 409
        assert "already exists" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_profile_by_user_uid_success(self, mock_firestore_helper, sample_profile_doc):
        """Test successful profile retrieval"""
        mock_firestore_helper.get_document.return_value = sample_profile_doc

        result = await ProfileService.get_profile_by_user_uid("test_user_123")

        assert isinstance(result, ProfileResponse)
        assert result.user_uid == "test_user_123"

        mock_firestore_helper.get_document.assert_called_once_with("profiles", "test_user_123")

    @pytest.mark.asyncio
    async def test_get_profile_by_user_uid_not_found(self, mock_firestore_helper):
        """Test profile retrieval when profile doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        result = await ProfileService.get_profile_by_user_uid("nonexistent_user")

        assert result is None

    @pytest.mark.asyncio
    async def test_update_profile_success(self, mock_firestore_helper, sample_profile_doc):
        """Test successful profile update"""
        mock_firestore_helper.get_document.return_value = sample_profile_doc
        mock_firestore_helper.update_document.return_value = True

        profile_update = ProfileUpdate(
            bio="Updated bio with enough characters to pass validation",
            location="Los Angeles"
        )

        result = await ProfileService.update_profile("test_user_123", profile_update)

        assert isinstance(result, ProfileResponse)
        assert result.bio == "Updated bio with enough characters to pass validation"
        assert result.location == "Los Angeles"

        mock_firestore_helper.update_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_not_found(self, mock_firestore_helper):
        """Test profile update when profile doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        profile_update = ProfileUpdate(bio="Updated bio with enough characters")

        with pytest.raises(HTTPException) as exc_info:
            await ProfileService.update_profile("nonexistent_user", profile_update)

        assert exc_info.value.status_code == 404
        assert "Profile not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_delete_profile_success(self, mock_firestore_helper):
        """Test successful profile deletion"""
        mock_firestore_helper.delete_document.return_value = True

        result = await ProfileService.delete_profile("test_user_123")

        assert result is True

        mock_firestore_helper.delete_document.assert_called_once_with("profiles", "test_user_123")