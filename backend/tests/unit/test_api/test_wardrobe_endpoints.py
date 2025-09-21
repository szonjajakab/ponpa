import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status
import json
from datetime import datetime

from app.main import app
from app.models.wardrobe import ClothingCategory, ClothingSize
from app.services.wardrobe_service import ClothingItemService, OutfitService
from app.core.security import get_current_user_uid


@pytest.fixture(autouse=True)
def override_dependencies():
    """Override FastAPI dependencies for testing"""
    def mock_auth():
        return "test_user_123"

    app.dependency_overrides[get_current_user_uid] = mock_auth
    yield
    app.dependency_overrides.clear()


client = TestClient(app)


class TestClothingItemEndpoints:
    """Test clothing item API endpoints"""

    @pytest.fixture
    def mock_user_uid(self):
        """Mock user UID for authentication"""
        return "test_user_123"

    @pytest.fixture
    def sample_clothing_item_response(self):
        """Sample clothing item response"""
        return {
            "id": "item_123",
            "user_uid": "test_user_123",
            "name": "Test Shirt",
            "category": "tops",
            "brand": "Test Brand",
            "size": "M",
            "colors": [{"name": "Blue", "hex_code": "#0000FF"}],
            "description": "A test shirt",
            "image_urls": ["https://example.com/image.jpg"],
            "purchase_date": "2023-01-15T00:00:00",
            "purchase_price": 29.99,
            "tags": ["casual", "cotton"],
            "is_favorite": False,
            "wear_count": 0,
            "last_worn": None,
            "condition": "new",
            "notes": "Test notes",
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }

    @pytest.fixture
    def sample_clothing_item_create(self):
        """Sample clothing item create data"""
        return {
            "name": "New Shirt",
            "category": "tops",
            "brand": "New Brand",
            "size": "L",
            "colors": [{"name": "Red", "hex_code": "#FF0000"}],
            "description": "A new shirt",
            "purchase_price": 39.99,
            "tags": ["new", "red"],
            "condition": "new",
            "notes": "New shirt notes"
        }

    @patch.object(ClothingItemService, "get_user_clothing_items")
    def test_get_clothing_items_success(self, mock_get_items, sample_clothing_item_response):
        """Test successful retrieval of clothing items"""
        mock_get_items.return_value = [sample_clothing_item_response]

        response = client.get("/api/v1/wardrobe/clothing-items")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Shirt"
        mock_get_items.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "get_user_clothing_items")
    def test_get_clothing_items_with_filters(self, mock_get_items, mock_auth, mock_user_uid):
        """Test clothing items retrieval with filters"""
        mock_auth.return_value = mock_user_uid
        mock_get_items.return_value = []

        response = client.get(
            "/api/v1/wardrobe/clothing-items?category=tops&size=M&is_favorite=true&limit=10",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        mock_get_items.assert_called_once()
        call_args = mock_get_items.call_args
        assert call_args[0][0] == mock_user_uid  # user_uid
        assert call_args[1]["filters"]["category"] == "tops"
        assert call_args[1]["filters"]["size"] == "M"
        assert call_args[1]["filters"]["is_favorite"] is True
        assert call_args[1]["limit"] == 10

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "get_clothing_item")
    def test_get_clothing_item_success(self, mock_get_item, mock_auth, mock_user_uid, sample_clothing_item_response):
        """Test successful retrieval of a specific clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_get_item.return_value = sample_clothing_item_response

        response = client.get(
            "/api/v1/wardrobe/clothing-items/item_123",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "item_123"
        assert data["name"] == "Test Shirt"
        mock_get_item.assert_called_once_with("item_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "get_clothing_item")
    def test_get_clothing_item_not_found(self, mock_get_item, mock_auth, mock_user_uid):
        """Test retrieval of non-existent clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_get_item.return_value = None

        response = client.get(
            "/api/v1/wardrobe/clothing-items/nonexistent",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "create_clothing_item")
    def test_create_clothing_item_success(self, mock_create, mock_auth, mock_user_uid,
                                        sample_clothing_item_create, sample_clothing_item_response):
        """Test successful creation of clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_create.return_value = sample_clothing_item_response

        response = client.post(
            "/api/v1/wardrobe/clothing-items",
            headers={"Authorization": "Bearer test_token"},
            json=sample_clothing_item_create
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Shirt"
        mock_create.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "create_clothing_item")
    def test_create_clothing_item_validation_error(self, mock_create, mock_auth, mock_user_uid):
        """Test creation with validation error"""
        mock_auth.return_value = mock_user_uid
        mock_create.side_effect = ValueError("Invalid data")

        response = client.post(
            "/api/v1/wardrobe/clothing-items",
            headers={"Authorization": "Bearer test_token"},
            json={"name": "Test", "category": "tops"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid data" in response.json()["detail"]

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "update_clothing_item")
    def test_update_clothing_item_success(self, mock_update, mock_auth, mock_user_uid, sample_clothing_item_response):
        """Test successful update of clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_update.return_value = sample_clothing_item_response

        update_data = {"name": "Updated Shirt", "is_favorite": True}
        response = client.put(
            "/api/v1/wardrobe/clothing-items/item_123",
            headers={"Authorization": "Bearer test_token"},
            json=update_data
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Test Shirt"
        mock_update.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "update_clothing_item")
    def test_update_clothing_item_not_found(self, mock_update, mock_auth, mock_user_uid):
        """Test update of non-existent clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_update.return_value = None

        response = client.put(
            "/api/v1/wardrobe/clothing-items/nonexistent",
            headers={"Authorization": "Bearer test_token"},
            json={"name": "Updated"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "delete_clothing_item")
    def test_delete_clothing_item_success(self, mock_delete, mock_auth, mock_user_uid):
        """Test successful deletion of clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_delete.return_value = True

        response = client.delete(
            "/api/v1/wardrobe/clothing-items/item_123",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"]
        mock_delete.assert_called_once_with("item_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "delete_clothing_item")
    def test_delete_clothing_item_not_found(self, mock_delete, mock_auth, mock_user_uid):
        """Test deletion of non-existent clothing item"""
        mock_auth.return_value = mock_user_uid
        mock_delete.return_value = False

        response = client.delete(
            "/api/v1/wardrobe/clothing-items/nonexistent",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "record_wear")
    def test_record_clothing_item_wear_success(self, mock_record, mock_auth, mock_user_uid, sample_clothing_item_response):
        """Test successful recording of clothing item wear"""
        mock_auth.return_value = mock_user_uid
        updated_item = sample_clothing_item_response.copy()
        updated_item["wear_count"] = 1
        mock_record.return_value = updated_item

        response = client.post(
            "/api/v1/wardrobe/clothing-items/item_123/wear",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["wear_count"] == 1
        mock_record.assert_called_once_with("item_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "get_clothing_analytics")
    def test_get_clothing_analytics_success(self, mock_analytics, mock_auth, mock_user_uid):
        """Test successful retrieval of clothing analytics"""
        mock_auth.return_value = mock_user_uid
        analytics_data = {
            "total_items": 10,
            "items_by_category": {"tops": 5, "bottoms": 3, "shoes": 2},
            "favorite_items": 3,
            "average_wear_count": 2.5,
            "most_worn_items": [],
            "least_worn_items": []
        }
        mock_analytics.return_value = analytics_data

        response = client.get(
            "/api/v1/wardrobe/analytics/clothing-items",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_items"] == 10
        assert data["favorite_items"] == 3
        mock_analytics.assert_called_once_with(mock_user_uid, None)


class TestOutfitEndpoints:
    """Test outfit API endpoints"""

    @pytest.fixture
    def mock_user_uid(self):
        """Mock user UID for authentication"""
        return "test_user_123"

    @pytest.fixture
    def sample_outfit_response(self):
        """Sample outfit response"""
        return {
            "id": "outfit_123",
            "user_uid": "test_user_123",
            "name": "Test Outfit",
            "description": "A test outfit",
            "clothing_item_ids": ["item_1", "item_2"],
            "tags": ["casual", "summer"],
            "occasion": "casual",
            "season": "summer",
            "weather": "warm",
            "image_url": "https://example.com/outfit.jpg",
            "is_favorite": False,
            "wear_count": 0,
            "last_worn": None,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }

    @pytest.fixture
    def sample_outfit_create(self):
        """Sample outfit create data"""
        return {
            "name": "New Outfit",
            "description": "A new outfit",
            "clothing_item_ids": ["item_1", "item_2"],
            "tags": ["new", "casual"],
            "occasion": "work",
            "season": "spring",
            "weather": "mild"
        }

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "get_user_outfits")
    def test_get_outfits_success(self, mock_get_outfits, mock_auth, mock_user_uid, sample_outfit_response):
        """Test successful retrieval of outfits"""
        mock_auth.return_value = mock_user_uid
        mock_get_outfits.return_value = [sample_outfit_response]

        response = client.get(
            "/api/v1/wardrobe/outfits",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Outfit"
        mock_get_outfits.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "get_outfit")
    def test_get_outfit_success(self, mock_get_outfit, mock_auth, mock_user_uid, sample_outfit_response):
        """Test successful retrieval of a specific outfit"""
        mock_auth.return_value = mock_user_uid
        mock_get_outfit.return_value = sample_outfit_response

        response = client.get(
            "/api/v1/wardrobe/outfits/outfit_123",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "outfit_123"
        assert data["name"] == "Test Outfit"
        mock_get_outfit.assert_called_once_with("outfit_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "get_outfit")
    def test_get_outfit_not_found(self, mock_get_outfit, mock_auth, mock_user_uid):
        """Test retrieval of non-existent outfit"""
        mock_auth.return_value = mock_user_uid
        mock_get_outfit.return_value = None

        response = client.get(
            "/api/v1/wardrobe/outfits/nonexistent",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "create_outfit")
    def test_create_outfit_success(self, mock_create, mock_auth, mock_user_uid,
                                 sample_outfit_create, sample_outfit_response):
        """Test successful creation of outfit"""
        mock_auth.return_value = mock_user_uid
        mock_create.return_value = sample_outfit_response

        response = client.post(
            "/api/v1/wardrobe/outfits",
            headers={"Authorization": "Bearer test_token"},
            json=sample_outfit_create
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Outfit"
        mock_create.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "create_outfit")
    def test_create_outfit_validation_error(self, mock_create, mock_auth, mock_user_uid):
        """Test creation with validation error"""
        mock_auth.return_value = mock_user_uid
        mock_create.side_effect = ValueError("Invalid clothing items")

        response = client.post(
            "/api/v1/wardrobe/outfits",
            headers={"Authorization": "Bearer test_token"},
            json={"name": "Test", "clothing_item_ids": ["invalid_item"]}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid clothing items" in response.json()["detail"]

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "update_outfit")
    def test_update_outfit_success(self, mock_update, mock_auth, mock_user_uid, sample_outfit_response):
        """Test successful update of outfit"""
        mock_auth.return_value = mock_user_uid
        mock_update.return_value = sample_outfit_response

        update_data = {"name": "Updated Outfit", "is_favorite": True}
        response = client.put(
            "/api/v1/wardrobe/outfits/outfit_123",
            headers={"Authorization": "Bearer test_token"},
            json=update_data
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Test Outfit"
        mock_update.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "delete_outfit")
    def test_delete_outfit_success(self, mock_delete, mock_auth, mock_user_uid):
        """Test successful deletion of outfit"""
        mock_auth.return_value = mock_user_uid
        mock_delete.return_value = True

        response = client.delete(
            "/api/v1/wardrobe/outfits/outfit_123",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"]
        mock_delete.assert_called_once_with("outfit_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "record_wear")
    def test_record_outfit_wear_success(self, mock_record, mock_auth, mock_user_uid, sample_outfit_response):
        """Test successful recording of outfit wear"""
        mock_auth.return_value = mock_user_uid
        updated_outfit = sample_outfit_response.copy()
        updated_outfit["wear_count"] = 1
        mock_record.return_value = updated_outfit

        response = client.post(
            "/api/v1/wardrobe/outfits/outfit_123/wear",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["wear_count"] == 1
        mock_record.assert_called_once_with("outfit_123", mock_user_uid)

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "get_outfit_analytics")
    def test_get_outfit_analytics_success(self, mock_analytics, mock_auth, mock_user_uid):
        """Test successful retrieval of outfit analytics"""
        mock_auth.return_value = mock_user_uid
        analytics_data = {
            "total_outfits": 5,
            "outfits_by_occasion": {"casual": 3, "work": 2},
            "outfits_by_season": {"summer": 2, "spring": 3},
            "favorite_outfits": 1,
            "average_wear_count": 1.2,
            "most_worn_outfits": [],
            "least_worn_outfits": []
        }
        mock_analytics.return_value = analytics_data

        response = client.get(
            "/api/v1/wardrobe/analytics/outfits",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_outfits"] == 5
        assert data["favorite_outfits"] == 1
        mock_analytics.assert_called_once_with(mock_user_uid)


class TestImageUploadEndpoints:
    """Test image upload endpoints"""

    @pytest.fixture
    def mock_user_uid(self):
        """Mock user UID for authentication"""
        return "test_user_123"

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "upload_clothing_item_images")
    def test_upload_clothing_item_images_success(self, mock_upload, mock_auth, mock_user_uid):
        """Test successful upload of clothing item images"""
        mock_auth.return_value = mock_user_uid
        mock_upload.return_value = ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]

        # Create mock files
        files = [
            ("files", ("image1.jpg", b"fake image data", "image/jpeg")),
            ("files", ("image2.jpg", b"fake image data", "image/jpeg"))
        ]

        response = client.post(
            "/api/v1/wardrobe/clothing-items/item_123/images",
            headers={"Authorization": "Bearer test_token"},
            files=files
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "Successfully uploaded 2 images" in data["message"]
        assert len(data["image_urls"]) == 2
        mock_upload.assert_called_once()

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(ClothingItemService, "upload_clothing_item_images")
    def test_upload_too_many_images(self, mock_upload, mock_auth, mock_user_uid):
        """Test upload with too many images"""
        mock_auth.return_value = mock_user_uid

        # Create 11 mock files (exceeds limit)
        files = [(f"files", (f"image{i}.jpg", b"fake image data", "image/jpeg")) for i in range(11)]

        response = client.post(
            "/api/v1/wardrobe/clothing-items/item_123/images",
            headers={"Authorization": "Bearer test_token"},
            files=files
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Maximum 10 images allowed" in response.json()["detail"]

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    @patch.object(OutfitService, "upload_outfit_image")
    def test_upload_outfit_image_success(self, mock_upload, mock_auth, mock_user_uid):
        """Test successful upload of outfit image"""
        mock_auth.return_value = mock_user_uid
        mock_upload.return_value = "https://example.com/outfit.jpg"

        files = {"file": ("outfit.jpg", b"fake image data", "image/jpeg")}

        response = client.post(
            "/api/v1/wardrobe/outfits/outfit_123/image",
            headers={"Authorization": "Bearer test_token"},
            files=files
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "uploaded successfully" in data["message"]
        assert data["image_url"] == "https://example.com/outfit.jpg"
        mock_upload.assert_called_once()


class TestAuthenticationErrors:
    """Test authentication error handling"""

    def test_unauthorized_access(self):
        """Test access without authentication token"""
        response = client.get("/api/v1/wardrobe/clothing-items")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    def test_invalid_token(self, mock_auth):
        """Test access with invalid token"""
        mock_auth.side_effect = Exception("Invalid token")

        response = client.get(
            "/api/v1/wardrobe/clothing-items",
            headers={"Authorization": "Bearer invalid_token"}
        )

        # The security dependency should handle this, but if it reaches the endpoint
        # it would be a 500 error from the authentication function
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_500_INTERNAL_SERVER_ERROR]


class TestValidationErrors:
    """Test request validation errors"""

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    def test_invalid_create_data(self, mock_auth):
        """Test creation with invalid data"""
        mock_auth.return_value = "test_user"

        # Missing required fields
        response = client.post(
            "/api/v1/wardrobe/clothing-items",
            headers={"Authorization": "Bearer test_token"},
            json={"name": ""}  # Empty name should fail validation
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @patch("app.api.endpoints.wardrobe.get_current_user_uid")
    def test_invalid_query_parameters(self, mock_auth):
        """Test invalid query parameters"""
        mock_auth.return_value = "test_user"

        response = client.get(
            "/api/v1/wardrobe/clothing-items?limit=-1",  # Negative limit should fail
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY