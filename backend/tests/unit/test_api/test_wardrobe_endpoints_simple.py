import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from fastapi import status
from datetime import datetime

from app.main import app
from app.core.security import get_current_user_uid
from app.services.wardrobe_service import ClothingItemService, OutfitService


# Override authentication for testing
def mock_get_current_user_uid():
    return "test_user_123"

app.dependency_overrides[get_current_user_uid] = mock_get_current_user_uid

client = TestClient(app)


class TestWardrobeEndpointsBasic:
    """Basic tests for wardrobe API endpoints"""

    def test_health_check(self):
        """Test basic health check"""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK

    @patch.object(ClothingItemService, "get_user_clothing_items")
    def test_get_clothing_items_basic(self, mock_get_items):
        """Test basic clothing items retrieval"""
        # Mock response
        mock_get_items.return_value = []

        response = client.get("/api/v1/wardrobe/clothing-items")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
        mock_get_items.assert_called_once()

    @patch.object(ClothingItemService, "get_clothing_item")
    def test_get_clothing_item_not_found(self, mock_get_item):
        """Test clothing item not found"""
        mock_get_item.return_value = None

        response = client.get("/api/v1/wardrobe/clothing-items/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch.object(ClothingItemService, "create_clothing_item")
    def test_create_clothing_item_basic(self, mock_create):
        """Test basic clothing item creation"""
        mock_response = {
            "id": "item_123",
            "user_uid": "test_user_123",
            "name": "Test Shirt",
            "category": "tops",
            "brand": None,
            "size": None,
            "colors": [],
            "description": None,
            "image_urls": [],
            "purchase_date": None,
            "purchase_price": None,
            "tags": [],
            "is_favorite": False,
            "wear_count": 0,
            "last_worn": None,
            "condition": None,
            "notes": None,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }
        mock_create.return_value = mock_response

        create_data = {
            "name": "Test Shirt",
            "category": "tops"
        }

        response = client.post("/api/v1/wardrobe/clothing-items", json=create_data)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Shirt"
        mock_create.assert_called_once()

    @patch.object(ClothingItemService, "delete_clothing_item")
    def test_delete_clothing_item_success(self, mock_delete):
        """Test clothing item deletion"""
        mock_delete.return_value = True

        response = client.delete("/api/v1/wardrobe/clothing-items/item_123")
        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"]

    @patch.object(ClothingItemService, "delete_clothing_item")
    def test_delete_clothing_item_not_found(self, mock_delete):
        """Test clothing item deletion not found"""
        mock_delete.return_value = False

        response = client.delete("/api/v1/wardrobe/clothing-items/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch.object(OutfitService, "get_user_outfits")
    def test_get_outfits_basic(self, mock_get_outfits):
        """Test basic outfits retrieval"""
        mock_get_outfits.return_value = []

        response = client.get("/api/v1/wardrobe/outfits")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
        mock_get_outfits.assert_called_once()

    @patch.object(OutfitService, "get_outfit")
    def test_get_outfit_not_found(self, mock_get_outfit):
        """Test outfit not found"""
        mock_get_outfit.return_value = None

        response = client.get("/api/v1/wardrobe/outfits/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @patch.object(OutfitService, "create_outfit")
    def test_create_outfit_basic(self, mock_create):
        """Test basic outfit creation"""
        mock_response = {
            "id": "outfit_123",
            "user_uid": "test_user_123",
            "name": "Test Outfit",
            "description": None,
            "clothing_item_ids": ["item_1"],
            "tags": [],
            "occasion": None,
            "season": None,
            "weather": None,
            "image_url": None,
            "is_favorite": False,
            "wear_count": 0,
            "last_worn": None,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00"
        }
        mock_create.return_value = mock_response

        create_data = {
            "name": "Test Outfit",
            "clothing_item_ids": ["item_1"]
        }

        response = client.post("/api/v1/wardrobe/outfits", json=create_data)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Outfit"
        mock_create.assert_called_once()

    @patch.object(OutfitService, "delete_outfit")
    def test_delete_outfit_success(self, mock_delete):
        """Test outfit deletion"""
        mock_delete.return_value = True

        response = client.delete("/api/v1/wardrobe/outfits/outfit_123")
        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"]

    @patch.object(ClothingItemService, "get_clothing_analytics")
    def test_get_clothing_analytics(self, mock_analytics):
        """Test clothing analytics"""
        mock_analytics.return_value = {
            "total_items": 0,
            "items_by_category": {},
            "favorite_items": 0,
            "average_wear_count": 0,
            "most_worn_items": [],
            "least_worn_items": []
        }

        response = client.get("/api/v1/wardrobe/analytics/clothing-items")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_items"] == 0
        mock_analytics.assert_called_once()

    @patch.object(OutfitService, "get_outfit_analytics")
    def test_get_outfit_analytics(self, mock_analytics):
        """Test outfit analytics"""
        mock_analytics.return_value = {
            "total_outfits": 0,
            "outfits_by_occasion": {},
            "outfits_by_season": {},
            "favorite_outfits": 0,
            "average_wear_count": 0,
            "most_worn_outfits": [],
            "least_worn_outfits": []
        }

        response = client.get("/api/v1/wardrobe/analytics/outfits")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_outfits"] == 0
        mock_analytics.assert_called_once()

    def test_validation_error_empty_name(self):
        """Test validation error for empty name"""
        create_data = {
            "name": "",  # Empty name should fail validation
            "category": "tops"
        }

        response = client.post("/api/v1/wardrobe/clothing-items", json=create_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_validation_error_missing_category(self):
        """Test validation error for missing category"""
        create_data = {
            "name": "Test Item"
            # Missing required category
        }

        response = client.post("/api/v1/wardrobe/clothing-items", json=create_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_validation_error_invalid_limit(self):
        """Test validation error for invalid limit"""
        response = client.get("/api/v1/wardrobe/clothing-items?limit=-1")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @patch.object(ClothingItemService, "create_clothing_item")
    def test_create_clothing_item_service_error(self, mock_create):
        """Test service error handling during creation"""
        mock_create.side_effect = ValueError("Invalid data")

        create_data = {
            "name": "Test Item",
            "category": "tops"
        }

        response = client.post("/api/v1/wardrobe/clothing-items", json=create_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid data" in response.json()["detail"]

    @patch.object(OutfitService, "create_outfit")
    def test_create_outfit_service_error(self, mock_create):
        """Test service error handling during outfit creation"""
        mock_create.side_effect = ValueError("Invalid clothing items")

        create_data = {
            "name": "Test Outfit",
            "clothing_item_ids": ["invalid_item"]
        }

        response = client.post("/api/v1/wardrobe/outfits", json=create_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid clothing items" in response.json()["detail"]


class TestImageUploadEndpoints:
    """Test image upload endpoints"""

    @patch.object(ClothingItemService, "upload_clothing_item_images")
    def test_upload_clothing_item_images_too_many(self, mock_upload):
        """Test upload with too many images"""
        # Create 11 mock files (exceeds limit)
        files = [("files", (f"image{i}.jpg", b"fake image data", "image/jpeg")) for i in range(11)]

        response = client.post("/api/v1/wardrobe/clothing-items/item_123/images", files=files)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Maximum 10 images allowed" in response.json()["detail"]

    @patch.object(ClothingItemService, "upload_clothing_item_images")
    def test_upload_clothing_item_images_success(self, mock_upload):
        """Test successful image upload"""
        mock_upload.return_value = ["https://example.com/image1.jpg"]

        files = [("files", ("image1.jpg", b"fake image data", "image/jpeg"))]

        response = client.post("/api/v1/wardrobe/clothing-items/item_123/images", files=files)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "Successfully uploaded 1 images" in data["message"]

    @patch.object(OutfitService, "upload_outfit_image")
    def test_upload_outfit_image_success(self, mock_upload):
        """Test successful outfit image upload"""
        mock_upload.return_value = "https://example.com/outfit.jpg"

        files = {"file": ("outfit.jpg", b"fake image data", "image/jpeg")}

        response = client.post("/api/v1/wardrobe/outfits/outfit_123/image", files=files)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "uploaded successfully" in data["message"]