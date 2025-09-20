import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException, UploadFile
import io

from app.services.wardrobe_service import ClothingItemService, OutfitService
from app.models.wardrobe import (
    ClothingItemCreate, ClothingItemUpdate, ClothingItemResponse,
    OutfitCreate, OutfitUpdate, OutfitResponse,
    ClothingCategory, ClothingSize, Color
)


class TestClothingItemService:
    """Test ClothingItemService class"""

    @pytest.fixture
    def mock_firestore_helper(self):
        """Mock FirestoreHelper for testing"""
        with patch('app.services.wardrobe_service.FirestoreHelper') as mock:
            yield mock

    @pytest.fixture
    def mock_storage_bucket(self):
        """Mock Firebase Storage bucket"""
        with patch('app.services.wardrobe_service.get_storage_bucket') as mock:
            yield mock

    @pytest.fixture
    def sample_clothing_item_create(self):
        """Sample clothing item creation data"""
        return ClothingItemCreate(
            name="Test Shirt",
            category=ClothingCategory.TOPS,
            brand="Test Brand",
            size=ClothingSize.M,
            colors=[Color(name="Blue", hex_code="#0000FF")],
            description="A test shirt",
            tags=["casual", "cotton"]
        )

    @pytest.fixture
    def sample_clothing_item_doc(self):
        """Sample clothing item document from Firestore"""
        return {
            "id": "item_123",
            "user_uid": "user_456",
            "name": "Test Shirt",
            "category": "tops",
            "brand": "Test Brand",
            "size": "M",
            "colors": [{"name": "Blue", "hex_code": "#0000FF"}],
            "description": "A test shirt",
            "image_urls": ["https://example.com/image.jpg"],
            "tags": ["casual", "cotton"],
            "is_favorite": False,
            "wear_count": 0,
            "created_at": 1234567890,
            "updated_at": 1234567890
        }

    @pytest.mark.asyncio
    async def test_create_clothing_item_success(self, mock_firestore_helper, sample_clothing_item_create):
        """Test successful clothing item creation"""
        mock_firestore_helper.create_document.return_value = True

        result = await ClothingItemService.create_clothing_item("user_123", sample_clothing_item_create)

        assert isinstance(result, ClothingItemResponse)
        assert result.user_uid == "user_123"
        assert result.name == "Test Shirt"
        assert result.category == ClothingCategory.TOPS

        mock_firestore_helper.create_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_clothing_item_firestore_failure(self, mock_firestore_helper, sample_clothing_item_create):
        """Test clothing item creation when Firestore operation fails"""
        mock_firestore_helper.create_document.return_value = False

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.create_clothing_item("user_123", sample_clothing_item_create)

        assert exc_info.value.status_code == 500
        assert "Failed to create clothing item" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_clothing_item_success(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test successful clothing item retrieval"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc

        result = await ClothingItemService.get_clothing_item("user_456", "item_123")

        assert isinstance(result, ClothingItemResponse)
        assert result.id == "item_123"
        assert result.user_uid == "user_456"
        assert result.name == "Test Shirt"

        mock_firestore_helper.get_document.assert_called_once_with("clothing_items", "item_123")

    @pytest.mark.asyncio
    async def test_get_clothing_item_not_found(self, mock_firestore_helper):
        """Test clothing item retrieval when item doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        result = await ClothingItemService.get_clothing_item("user_456", "nonexistent_item")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_clothing_item_wrong_user(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test clothing item retrieval with wrong user"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.get_clothing_item("wrong_user", "item_123")

        assert exc_info.value.status_code == 403
        assert "Access denied" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_user_clothing_items_success(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test successful user clothing items retrieval"""
        mock_firestore_helper.query_documents.return_value = [sample_clothing_item_doc]

        result = await ClothingItemService.get_user_clothing_items("user_456")

        assert len(result) == 1
        assert isinstance(result[0], ClothingItemResponse)
        assert result[0].user_uid == "user_456"

        mock_firestore_helper.query_documents.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_clothing_items_with_filters(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test user clothing items retrieval with filters"""
        mock_firestore_helper.query_documents.return_value = [sample_clothing_item_doc]

        result = await ClothingItemService.get_user_clothing_items(
            "user_456",
            category=ClothingCategory.TOPS,
            is_favorite=True,
            limit=50
        )

        assert len(result) == 1
        mock_firestore_helper.query_documents.assert_called_once()

        # Verify filters were applied
        call_args = mock_firestore_helper.query_documents.call_args
        filters = call_args[1]['filters']
        assert ("user_uid", "==", "user_456") in filters
        assert ("category", "==", "tops") in filters
        assert ("is_favorite", "==", True) in filters

    @pytest.mark.asyncio
    async def test_update_clothing_item_success(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test successful clothing item update"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc
        mock_firestore_helper.update_document.return_value = True

        update_data = ClothingItemUpdate(
            name="Updated Shirt",
            is_favorite=True
        )

        result = await ClothingItemService.update_clothing_item("user_456", "item_123", update_data)

        assert isinstance(result, ClothingItemResponse)
        assert result.name == "Updated Shirt"
        assert result.is_favorite is True

        mock_firestore_helper.update_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_clothing_item_not_found(self, mock_firestore_helper):
        """Test clothing item update when item doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        update_data = ClothingItemUpdate(name="Updated Shirt")

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.update_clothing_item("user_456", "nonexistent_item", update_data)

        assert exc_info.value.status_code == 404
        assert "Clothing item not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_delete_clothing_item_success(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test successful clothing item deletion"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc
        mock_firestore_helper.delete_document.return_value = True

        result = await ClothingItemService.delete_clothing_item("user_456", "item_123")

        assert result is True
        mock_firestore_helper.delete_document.assert_called_once_with("clothing_items", "item_123")

    @pytest.mark.asyncio
    async def test_delete_clothing_item_not_found(self, mock_firestore_helper):
        """Test clothing item deletion when item doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.delete_clothing_item("user_456", "nonexistent_item")

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_upload_clothing_item_image_success(self, mock_firestore_helper, mock_storage_bucket, sample_clothing_item_doc):
        """Test successful clothing item image upload"""
        # Mock file
        file_content = b"fake image content"
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "image/jpeg"
        mock_file.filename = "test.jpg"
        mock_file.read = AsyncMock(return_value=file_content)

        # Mock storage bucket
        mock_bucket = Mock()
        mock_blob = Mock()
        mock_blob.public_url = "https://example.com/image.jpg"
        mock_bucket.blob.return_value = mock_blob
        mock_storage_bucket.return_value = mock_bucket

        # Mock Firestore
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc
        mock_firestore_helper.update_document.return_value = True

        result = await ClothingItemService.upload_clothing_item_image("user_456", "item_123", mock_file)

        assert result == "https://example.com/image.jpg"

        # Verify storage operations
        mock_bucket.blob.assert_called_once()
        mock_blob.upload_from_string.assert_called_once_with(file_content, content_type="image/jpeg")
        mock_blob.make_public.assert_called_once()

    @pytest.mark.asyncio
    async def test_upload_clothing_item_image_invalid_file_type(self, mock_firestore_helper, mock_storage_bucket, sample_clothing_item_doc):
        """Test clothing item image upload with invalid file type"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc

        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "text/plain"

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.upload_clothing_item_image("user_456", "item_123", mock_file)

        assert exc_info.value.status_code == 400
        assert "must be an image" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_upload_clothing_item_image_file_too_large(self, mock_firestore_helper, mock_storage_bucket, sample_clothing_item_doc):
        """Test clothing item image upload with file too large"""
        # 6MB file (over 5MB limit)
        large_content = b"x" * (6 * 1024 * 1024)
        mock_file = Mock(spec=UploadFile)
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=large_content)

        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc

        with pytest.raises(HTTPException) as exc_info:
            await ClothingItemService.upload_clothing_item_image("user_456", "item_123", mock_file)

        assert exc_info.value.status_code == 400
        assert "less than 5MB" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_increment_wear_count_success(self, mock_firestore_helper, sample_clothing_item_doc):
        """Test successful wear count increment"""
        mock_firestore_helper.get_document.return_value = sample_clothing_item_doc
        mock_firestore_helper.update_document.return_value = True

        result = await ClothingItemService.increment_wear_count("user_456", "item_123")

        assert result is True
        mock_firestore_helper.update_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_increment_wear_count_item_not_found(self, mock_firestore_helper):
        """Test wear count increment when item not found"""
        mock_firestore_helper.get_document.return_value = None

        result = await ClothingItemService.increment_wear_count("user_456", "nonexistent_item")

        assert result is False


class TestOutfitService:
    """Test OutfitService class"""

    @pytest.fixture
    def mock_firestore_helper(self):
        """Mock FirestoreHelper for testing"""
        with patch('app.services.wardrobe_service.FirestoreHelper') as mock:
            yield mock

    @pytest.fixture
    def sample_outfit_create(self):
        """Sample outfit creation data"""
        return OutfitCreate(
            name="Casual Friday",
            description="Comfortable work outfit",
            clothing_item_ids=["item_1", "item_2"],
            tags=["casual", "work"],
            occasion="work"
        )

    @pytest.fixture
    def sample_outfit_doc(self):
        """Sample outfit document from Firestore"""
        return {
            "id": "outfit_123",
            "user_uid": "user_456",
            "name": "Casual Friday",
            "description": "Comfortable work outfit",
            "clothing_item_ids": ["item_1", "item_2"],
            "tags": ["casual", "work"],
            "occasion": "work",
            "is_favorite": False,
            "wear_count": 0,
            "created_at": 1234567890,
            "updated_at": 1234567890
        }

    @pytest.fixture
    def sample_clothing_item_doc(self):
        """Sample clothing item document"""
        return {
            "id": "item_1",
            "user_uid": "user_456",
            "name": "Test Item",
            "category": "tops"
        }

    @pytest.mark.asyncio
    async def test_create_outfit_success(self, mock_firestore_helper, sample_outfit_create, sample_clothing_item_doc):
        """Test successful outfit creation"""
        # Mock clothing items exist
        mock_firestore_helper.get_document.side_effect = [
            sample_clothing_item_doc,  # item_1
            sample_clothing_item_doc   # item_2
        ]
        mock_firestore_helper.create_document.return_value = True

        result = await OutfitService.create_outfit("user_456", sample_outfit_create)

        assert isinstance(result, OutfitResponse)
        assert result.user_uid == "user_456"
        assert result.name == "Casual Friday"
        assert len(result.clothing_item_ids) == 2

        # Verify clothing items were checked
        assert mock_firestore_helper.get_document.call_count == 2
        mock_firestore_helper.create_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_outfit_clothing_item_not_found(self, mock_firestore_helper, sample_outfit_create):
        """Test outfit creation when clothing item doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            await OutfitService.create_outfit("user_456", sample_outfit_create)

        assert exc_info.value.status_code == 400
        assert "not found" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_create_outfit_wrong_user_clothing_item(self, mock_firestore_helper, sample_outfit_create):
        """Test outfit creation with clothing item belonging to wrong user"""
        wrong_user_item = {
            "id": "item_1",
            "user_uid": "wrong_user",
            "name": "Test Item",
            "category": "tops"
        }
        mock_firestore_helper.get_document.return_value = wrong_user_item

        with pytest.raises(HTTPException) as exc_info:
            await OutfitService.create_outfit("user_456", sample_outfit_create)

        assert exc_info.value.status_code == 400
        assert "Access denied" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_outfit_success(self, mock_firestore_helper, sample_outfit_doc):
        """Test successful outfit retrieval"""
        mock_firestore_helper.get_document.return_value = sample_outfit_doc

        result = await OutfitService.get_outfit("user_456", "outfit_123")

        assert isinstance(result, OutfitResponse)
        assert result.id == "outfit_123"
        assert result.user_uid == "user_456"

        mock_firestore_helper.get_document.assert_called_once_with("outfits", "outfit_123")

    @pytest.mark.asyncio
    async def test_get_outfit_not_found(self, mock_firestore_helper):
        """Test outfit retrieval when outfit doesn't exist"""
        mock_firestore_helper.get_document.return_value = None

        result = await OutfitService.get_outfit("user_456", "nonexistent_outfit")

        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_outfits_success(self, mock_firestore_helper, sample_outfit_doc):
        """Test successful user outfits retrieval"""
        mock_firestore_helper.query_documents.return_value = [sample_outfit_doc]

        result = await OutfitService.get_user_outfits("user_456")

        assert len(result) == 1
        assert isinstance(result[0], OutfitResponse)
        assert result[0].user_uid == "user_456"

        mock_firestore_helper.query_documents.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_outfit_success(self, mock_firestore_helper, sample_outfit_doc, sample_clothing_item_doc):
        """Test successful outfit update"""
        mock_firestore_helper.get_document.side_effect = [
            sample_outfit_doc,          # Get outfit
            sample_clothing_item_doc,   # Verify clothing item
            sample_clothing_item_doc    # Verify clothing item
        ]
        mock_firestore_helper.update_document.return_value = True

        update_data = OutfitUpdate(
            name="Updated Outfit",
            clothing_item_ids=["item_1", "item_2"]
        )

        result = await OutfitService.update_outfit("user_456", "outfit_123", update_data)

        assert isinstance(result, OutfitResponse)
        assert result.name == "Updated Outfit"

        mock_firestore_helper.update_document.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_outfit_success(self, mock_firestore_helper, sample_outfit_doc):
        """Test successful outfit deletion"""
        mock_firestore_helper.get_document.return_value = sample_outfit_doc
        mock_firestore_helper.delete_document.return_value = True

        result = await OutfitService.delete_outfit("user_456", "outfit_123")

        assert result is True
        mock_firestore_helper.delete_document.assert_called_once_with("outfits", "outfit_123")

    @pytest.mark.asyncio
    async def test_increment_outfit_wear_count_success(self, mock_firestore_helper, sample_outfit_doc):
        """Test successful outfit wear count increment"""
        mock_firestore_helper.get_document.return_value = sample_outfit_doc
        mock_firestore_helper.update_document.return_value = True

        # Mock ClothingItemService.increment_wear_count
        with patch('app.services.wardrobe_service.ClothingItemService.increment_wear_count') as mock_increment:
            mock_increment.return_value = True

            result = await OutfitService.increment_wear_count("user_456", "outfit_123")

            assert result is True

            # Verify clothing items' wear counts were incremented
            assert mock_increment.call_count == 2  # Two items in outfit
            mock_firestore_helper.update_document.assert_called_once()