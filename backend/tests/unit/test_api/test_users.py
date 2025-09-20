import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import status, HTTPException
import io

from app.main import app
from app.models.user import UserResponse, UserUpdate
from app.models.profile import ProfileResponse, ProfileCreate, ProfileUpdate
from app.core.security import get_current_user_uid, get_current_user

class TestUsersAPI:
    """Test user API endpoints"""

    @pytest.fixture
    def client(self):
        """FastAPI test client"""
        app.dependency_overrides[get_current_user_uid] = lambda: "test_user_123"
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    @pytest.fixture
    def mock_user_service(self):
        """Mock UserService"""
        with patch('app.api.endpoints.users.UserService') as mock:
            yield mock

    @pytest.fixture
    def mock_profile_service(self):
        """Mock ProfileService"""
        with patch('app.api.endpoints.users.ProfileService') as mock:
            yield mock

    @pytest.fixture
    def sample_user_response(self):
        """Sample user response"""
        return UserResponse(
            uid="test_user_123",
            email="test@example.com",
            display_name="Test User",
            first_name="Test",
            last_name="User",
            profile_picture_url=None,
            status="active",
            email_verified=False,
            created_at="2023-01-01T00:00:00",
            updated_at="2023-01-01T00:00:00",
            preferences={
                "notifications_enabled": True,
                "email_notifications": True,
                "push_notifications": True,
                "privacy_level": "standard",
                "language": "en",
                "theme": "light"
            }
        )

    @pytest.fixture
    def sample_profile_response(self):
        """Sample profile response"""
        return ProfileResponse(
            user_uid="test_user_123",
            bio="Test bio with enough characters to pass validation",
            location="New York",
            website=None,
            measurements={
                "unit": "cm",
                "height": 175.0,
                "weight": 70.0
            },
            style_preferences={
                "style_preferences": [],
                "fit_preference": "regular"
            },
            privacy_settings={
                "profile_visibility": "friends"
            },
            profile_completion_percentage=50.0,
            onboarding_completed=False,
            created_at="2023-01-01T00:00:00",
            updated_at="2023-01-01T00:00:00"
        )

    def test_get_current_user_profile_success(self, client, mock_user_service, sample_user_response):
        """Test successful user profile retrieval"""
        mock_user_service.get_user_by_uid = AsyncMock(return_value=sample_user_response)

        response = client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["uid"] == "test_user_123"
        assert data["email"] == "test@example.com"

        mock_user_service.get_user_by_uid.assert_called_once_with("test_user_123")

    def test_get_current_user_profile_not_found(self, client, mock_user_service):
        """Test user profile retrieval when user not found"""
        mock_user_service.get_user_by_uid = AsyncMock(return_value=None)

        response = client.get("/api/v1/users/me")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "User not found" in response.json()["detail"]

    def test_update_current_user_profile_success(self, client, mock_user_service, sample_user_response):
        """Test successful user profile update"""
        updated_user = sample_user_response.model_copy()
        updated_user.display_name = "Updated Name"

        mock_user_service.update_user = AsyncMock(return_value=updated_user)

        update_data = {
            "display_name": "Updated Name",
            "first_name": "Updated"
        }

        response = client.put("/api/v1/users/me", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["display_name"] == "Updated Name"

        mock_user_service.update_user.assert_called_once()

    def test_upload_profile_picture_success(self, client, mock_user_service):
        """Test successful profile picture upload"""
        mock_user_service.upload_profile_picture = AsyncMock(return_value="https://example.com/profile.jpg")

        # Create fake image file
        fake_image = io.BytesIO(b"fake image content")
        files = {"file": ("test.jpg", fake_image, "image/jpeg")}

        response = client.post("/api/v1/users/me/avatar", files=files)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "uploaded successfully" in data["message"]
        assert data["profile_picture_url"] == "https://example.com/profile.jpg"

        mock_user_service.upload_profile_picture.assert_called_once()

    def test_remove_profile_picture_success(self, client, mock_user_service):
        """Test successful profile picture removal"""
        mock_user_service.remove_profile_picture = AsyncMock(return_value=True)

        response = client.delete("/api/v1/users/me/avatar")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "removed successfully" in data["message"]

        mock_user_service.remove_profile_picture.assert_called_once_with("test_user_123")

    def test_remove_profile_picture_failure(self, client, mock_user_service):
        """Test profile picture removal failure"""
        mock_user_service.remove_profile_picture = AsyncMock(return_value=False)

        response = client.delete("/api/v1/users/me/avatar")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to remove" in response.json()["detail"]

    def test_get_current_user_extended_profile_success(self, client, mock_profile_service, sample_profile_response):
        """Test successful extended profile retrieval"""
        mock_profile_service.get_profile_by_user_uid = AsyncMock(return_value=sample_profile_response)

        response = client.get("/api/v1/users/me/profile")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_uid"] == "test_user_123"
        assert data["bio"] == "Test bio with enough characters to pass validation"

        mock_profile_service.get_profile_by_user_uid.assert_called_once_with("test_user_123")

    def test_get_current_user_extended_profile_not_found(self, client, mock_profile_service):
        """Test extended profile retrieval when profile not found"""
        mock_profile_service.get_profile_by_user_uid = AsyncMock(return_value=None)

        response = client.get("/api/v1/users/me/profile")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Profile not found" in response.json()["detail"]

    def test_create_current_user_profile_success(self, client, mock_profile_service, sample_profile_response):
        """Test successful profile creation"""
        mock_profile_service.create_profile = AsyncMock(return_value=sample_profile_response)

        profile_data = {
            "user_uid": "different_user",  # Should be overridden
            "bio": "Test bio with enough characters to pass validation",
            "location": "New York"
        }

        response = client.post("/api/v1/users/me/profile", json=profile_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user_uid"] == "test_user_123"

        mock_profile_service.create_profile.assert_called_once()
        # Verify user_uid was overridden
        call_args = mock_profile_service.create_profile.call_args[0][0]
        assert call_args.user_uid == "test_user_123"

    def test_update_current_user_profile_extended_success(self, client, mock_profile_service, sample_profile_response):
        """Test successful extended profile update"""
        updated_profile = sample_profile_response.model_copy()
        updated_profile.bio = "Updated bio with enough characters to pass validation"

        mock_profile_service.update_profile = AsyncMock(return_value=updated_profile)

        update_data = {
            "bio": "Updated bio with enough characters to pass validation",
            "location": "Los Angeles"
        }

        response = client.put("/api/v1/users/me/profile", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["bio"] == "Updated bio with enough characters to pass validation"

        mock_profile_service.update_profile.assert_called_once()

    def test_delete_current_user_profile_success(self, client, mock_profile_service):
        """Test successful profile deletion"""
        mock_profile_service.delete_profile = AsyncMock(return_value=True)

        response = client.delete("/api/v1/users/me/profile")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted successfully" in data["message"]

        mock_profile_service.delete_profile.assert_called_once_with("test_user_123")

    def test_delete_current_user_profile_failure(self, client, mock_profile_service):
        """Test profile deletion failure"""
        mock_profile_service.delete_profile = AsyncMock(return_value=False)

        response = client.delete("/api/v1/users/me/profile")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to delete" in response.json()["detail"]


    def test_unauthorized_request(self):
        """Test request without authentication"""
        # Create a client without dependency override for unauthorized test
        test_client = TestClient(app)

        response = test_client.get("/api/v1/users/me")

        # Should get 403 (Forbidden) due to missing Firebase token
        assert response.status_code == status.HTTP_403_FORBIDDEN

class TestAPIValidation:
    """Test API input validation"""

    @pytest.fixture
    def client(self):
        """FastAPI test client"""
        app.dependency_overrides[get_current_user_uid] = lambda: "test_user_123"
        client = TestClient(app)
        yield client
        app.dependency_overrides.clear()

    def test_update_user_invalid_data(self, client):
        """Test user update with invalid data"""
        with patch('app.api.endpoints.users.UserService') as mock_service:
            mock_service.update_user = AsyncMock(side_effect=HTTPException(status_code=404, detail="User not found"))

            # This will pass validation but fail at service level
            update_data = {
                "display_name": "Valid Name"
            }

            response = client.put("/api/v1/users/me", json=update_data)

            # Should fail at service level
            assert response.status_code == 404

    def test_create_profile_invalid_data(self, client):
        """Test profile creation with invalid data"""
        with patch('app.api.endpoints.users.ProfileService') as mock_service:
            mock_service.create_profile = AsyncMock()
            profile_data = {
                "bio": "Short",  # Too short bio
                "website": "invalid-url"  # Invalid URL format
            }

            response = client.post("/api/v1/users/me/profile", json=profile_data)

            # Should fail validation
            assert response.status_code == 422