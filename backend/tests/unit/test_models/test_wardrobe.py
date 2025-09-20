import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.wardrobe import (
    ClothingCategory, ClothingSize, Color,
    ClothingItem, ClothingItemCreate, ClothingItemUpdate, ClothingItemResponse,
    Outfit, OutfitCreate, OutfitUpdate, OutfitResponse
)


class TestColor:
    """Test Color model"""

    def test_valid_color(self):
        """Test valid color creation"""
        color = Color(name="Navy Blue", hex_code="#000080")
        assert color.name == "Navy Blue"
        assert color.hex_code == "#000080"

    def test_color_without_hex(self):
        """Test color creation without hex code"""
        color = Color(name="Red")
        assert color.name == "Red"
        assert color.hex_code is None

    def test_invalid_hex_code(self):
        """Test invalid hex code validation"""
        with pytest.raises(ValidationError):
            Color(name="Red", hex_code="invalid")

        with pytest.raises(ValidationError):
            Color(name="Red", hex_code="#GGG")

    def test_empty_name(self):
        """Test empty color name validation"""
        with pytest.raises(ValidationError):
            Color(name="")

    def test_long_name(self):
        """Test maximum name length validation"""
        long_name = "a" * 51
        with pytest.raises(ValidationError):
            Color(name=long_name)


class TestClothingItem:
    """Test ClothingItem model"""

    @pytest.fixture
    def sample_colors(self):
        """Sample colors for testing"""
        return [
            Color(name="Navy", hex_code="#000080"),
            Color(name="White", hex_code="#FFFFFF")
        ]

    @pytest.fixture
    def sample_clothing_item_data(self, sample_colors):
        """Sample clothing item data"""
        return {
            "id": "item_123",
            "user_uid": "user_456",
            "name": "Cotton T-Shirt",
            "category": ClothingCategory.TOPS,
            "brand": "Brand Name",
            "size": ClothingSize.M,
            "colors": sample_colors,
            "description": "Comfortable cotton t-shirt",
            "image_urls": ["https://example.com/image1.jpg"],
            "purchase_date": datetime(2023, 1, 15),
            "purchase_price": 29.99,
            "tags": ["casual", "cotton"],
            "condition": "new",
            "notes": "Perfect for summer"
        }

    def test_create_clothing_item_minimal(self):
        """Test creating clothing item with minimal data"""
        item = ClothingItem(
            user_uid="user_123",
            name="Basic Shirt",
            category=ClothingCategory.TOPS
        )

        assert item.user_uid == "user_123"
        assert item.name == "Basic Shirt"
        assert item.category == ClothingCategory.TOPS
        assert item.colors == []
        assert item.tags == []
        assert item.is_favorite is False
        assert item.wear_count == 0

    def test_create_clothing_item_full(self, sample_clothing_item_data):
        """Test creating clothing item with full data"""
        item = ClothingItem(**sample_clothing_item_data)

        assert item.id == "item_123"
        assert item.user_uid == "user_456"
        assert item.name == "Cotton T-Shirt"
        assert item.category == ClothingCategory.TOPS
        assert item.brand == "Brand Name"
        assert item.size == ClothingSize.M
        assert len(item.colors) == 2
        assert item.colors[0].name == "Navy"
        assert item.purchase_price == 29.99
        assert "casual" in item.tags

    def test_name_validation(self):
        """Test clothing item name validation"""
        # Empty name
        with pytest.raises(ValidationError):
            ClothingItem(user_uid="user_123", name="", category=ClothingCategory.TOPS)

        # Too long name
        long_name = "a" * 101
        with pytest.raises(ValidationError):
            ClothingItem(user_uid="user_123", name=long_name, category=ClothingCategory.TOPS)

    def test_tags_validation(self):
        """Test tags validation"""
        # Too many tags
        many_tags = [f"tag{i}" for i in range(21)]
        with pytest.raises(ValidationError):
            ClothingItem(
                user_uid="user_123",
                name="Test Item",
                category=ClothingCategory.TOPS,
                tags=many_tags
            )

        # Tag too long
        long_tag = "a" * 31
        with pytest.raises(ValidationError):
            ClothingItem(
                user_uid="user_123",
                name="Test Item",
                category=ClothingCategory.TOPS,
                tags=[long_tag]
            )

    def test_image_urls_validation(self):
        """Test image URLs validation"""
        # Too many images
        many_urls = [f"https://example.com/image{i}.jpg" for i in range(11)]
        with pytest.raises(ValidationError):
            ClothingItem(
                user_uid="user_123",
                name="Test Item",
                category=ClothingCategory.TOPS,
                image_urls=many_urls
            )

    def test_negative_price(self):
        """Test negative purchase price validation"""
        with pytest.raises(ValidationError):
            ClothingItem(
                user_uid="user_123",
                name="Test Item",
                category=ClothingCategory.TOPS,
                purchase_price=-10.0
            )

    def test_negative_wear_count(self):
        """Test negative wear count validation"""
        with pytest.raises(ValidationError):
            ClothingItem(
                user_uid="user_123",
                name="Test Item",
                category=ClothingCategory.TOPS,
                wear_count=-1
            )

    def test_increment_wear_count(self):
        """Test incrementing wear count"""
        item = ClothingItem(
            user_uid="user_123",
            name="Test Item",
            category=ClothingCategory.TOPS
        )

        assert item.wear_count == 0
        assert item.last_worn is None

        item.increment_wear_count()

        assert item.wear_count == 1
        assert item.last_worn is not None
        assert isinstance(item.last_worn, datetime)

    def test_to_firestore(self, sample_clothing_item_data):
        """Test conversion to Firestore format"""
        item = ClothingItem(**sample_clothing_item_data)
        firestore_data = item.to_firestore()

        assert firestore_data["id"] == "item_123"
        assert firestore_data["user_uid"] == "user_456"
        assert firestore_data["name"] == "Cotton T-Shirt"
        assert firestore_data["category"] == "tops"

        # Check colors conversion
        assert isinstance(firestore_data["colors"], list)
        assert firestore_data["colors"][0]["name"] == "Navy"

        # Check image URLs conversion
        assert isinstance(firestore_data["image_urls"], list)
        assert firestore_data["image_urls"][0] == "https://example.com/image1.jpg"

        # Check timestamp conversion
        assert isinstance(firestore_data["purchase_date"], float)

    def test_from_firestore(self, sample_clothing_item_data):
        """Test creation from Firestore data"""
        item = ClothingItem(**sample_clothing_item_data)
        firestore_data = item.to_firestore()

        # Create new item from Firestore data
        new_item = ClothingItem.from_firestore(firestore_data)

        assert new_item is not None
        assert new_item.id == item.id
        assert new_item.name == item.name
        assert new_item.category == item.category
        assert len(new_item.colors) == len(item.colors)
        assert new_item.colors[0].name == item.colors[0].name

    def test_from_firestore_empty(self):
        """Test creation from empty Firestore data"""
        result = ClothingItem.from_firestore({})
        assert result is None

        result = ClothingItem.from_firestore(None)
        assert result is None


class TestOutfit:
    """Test Outfit model"""

    @pytest.fixture
    def sample_outfit_data(self):
        """Sample outfit data"""
        return {
            "id": "outfit_123",
            "user_uid": "user_456",
            "name": "Casual Friday",
            "description": "Comfortable outfit for work",
            "clothing_item_ids": ["item_1", "item_2", "item_3"],
            "tags": ["casual", "work"],
            "occasion": "work",
            "season": "spring",
            "weather": "mild",
            "image_url": "https://example.com/outfit.jpg"
        }

    def test_create_outfit_minimal(self):
        """Test creating outfit with minimal data"""
        outfit = Outfit(
            user_uid="user_123",
            name="Simple Outfit",
            clothing_item_ids=["item_1"]
        )

        assert outfit.user_uid == "user_123"
        assert outfit.name == "Simple Outfit"
        assert outfit.clothing_item_ids == ["item_1"]
        assert outfit.tags == []
        assert outfit.is_favorite is False
        assert outfit.wear_count == 0

    def test_create_outfit_full(self, sample_outfit_data):
        """Test creating outfit with full data"""
        outfit = Outfit(**sample_outfit_data)

        assert outfit.id == "outfit_123"
        assert outfit.user_uid == "user_456"
        assert outfit.name == "Casual Friday"
        assert len(outfit.clothing_item_ids) == 3
        assert "casual" in outfit.tags
        assert outfit.occasion == "work"

    def test_empty_clothing_items(self):
        """Test validation for empty clothing items list"""
        with pytest.raises(ValidationError):
            Outfit(
                user_uid="user_123",
                name="Empty Outfit",
                clothing_item_ids=[]
            )

    def test_too_many_clothing_items(self):
        """Test validation for too many clothing items"""
        many_items = [f"item_{i}" for i in range(21)]
        with pytest.raises(ValidationError):
            Outfit(
                user_uid="user_123",
                name="Large Outfit",
                clothing_item_ids=many_items
            )

    def test_too_many_tags(self):
        """Test validation for too many tags"""
        many_tags = [f"tag{i}" for i in range(11)]
        with pytest.raises(ValidationError):
            Outfit(
                user_uid="user_123",
                name="Tagged Outfit",
                clothing_item_ids=["item_1"],
                tags=many_tags
            )

    def test_outfit_name_validation(self):
        """Test outfit name validation"""
        # Empty name
        with pytest.raises(ValidationError):
            Outfit(
                user_uid="user_123",
                name="",
                clothing_item_ids=["item_1"]
            )

        # Too long name
        long_name = "a" * 101
        with pytest.raises(ValidationError):
            Outfit(
                user_uid="user_123",
                name=long_name,
                clothing_item_ids=["item_1"]
            )

    def test_increment_wear_count(self):
        """Test incrementing outfit wear count"""
        outfit = Outfit(
            user_uid="user_123",
            name="Test Outfit",
            clothing_item_ids=["item_1"]
        )

        assert outfit.wear_count == 0
        assert outfit.last_worn is None

        outfit.increment_wear_count()

        assert outfit.wear_count == 1
        assert outfit.last_worn is not None
        assert isinstance(outfit.last_worn, datetime)

    def test_to_firestore(self, sample_outfit_data):
        """Test conversion to Firestore format"""
        outfit = Outfit(**sample_outfit_data)
        firestore_data = outfit.to_firestore()

        assert firestore_data["id"] == "outfit_123"
        assert firestore_data["user_uid"] == "user_456"
        assert firestore_data["name"] == "Casual Friday"
        assert firestore_data["clothing_item_ids"] == ["item_1", "item_2", "item_3"]

        # Check image URL conversion
        assert firestore_data["image_url"] == "https://example.com/outfit.jpg"

    def test_from_firestore(self, sample_outfit_data):
        """Test creation from Firestore data"""
        outfit = Outfit(**sample_outfit_data)
        firestore_data = outfit.to_firestore()

        # Create new outfit from Firestore data
        new_outfit = Outfit.from_firestore(firestore_data)

        assert new_outfit is not None
        assert new_outfit.id == outfit.id
        assert new_outfit.name == outfit.name
        assert new_outfit.clothing_item_ids == outfit.clothing_item_ids

    def test_from_firestore_empty(self):
        """Test creation from empty Firestore data"""
        result = Outfit.from_firestore({})
        assert result is None

        result = Outfit.from_firestore(None)
        assert result is None


class TestClothingItemCreate:
    """Test ClothingItemCreate model"""

    def test_valid_create_model(self):
        """Test valid ClothingItemCreate"""
        create_data = ClothingItemCreate(
            name="Test Shirt",
            category=ClothingCategory.TOPS,
            brand="Test Brand",
            size=ClothingSize.L,
            colors=[Color(name="Blue")]
        )

        assert create_data.name == "Test Shirt"
        assert create_data.category == ClothingCategory.TOPS
        assert create_data.brand == "Test Brand"
        assert create_data.size == ClothingSize.L
        assert len(create_data.colors) == 1

    def test_minimal_create_model(self):
        """Test minimal ClothingItemCreate"""
        create_data = ClothingItemCreate(
            name="Basic Item",
            category=ClothingCategory.CASUAL
        )

        assert create_data.name == "Basic Item"
        assert create_data.category == ClothingCategory.CASUAL
        assert create_data.colors == []
        assert create_data.tags == []


class TestClothingItemUpdate:
    """Test ClothingItemUpdate model"""

    def test_partial_update(self):
        """Test partial update model"""
        update_data = ClothingItemUpdate(
            name="Updated Name",
            is_favorite=True
        )

        assert update_data.name == "Updated Name"
        assert update_data.is_favorite is True
        assert update_data.category is None
        assert update_data.brand is None


class TestOutfitCreate:
    """Test OutfitCreate model"""

    def test_valid_outfit_create(self):
        """Test valid OutfitCreate"""
        create_data = OutfitCreate(
            name="New Outfit",
            clothing_item_ids=["item_1", "item_2"],
            occasion="party"
        )

        assert create_data.name == "New Outfit"
        assert len(create_data.clothing_item_ids) == 2
        assert create_data.occasion == "party"

    def test_minimal_outfit_create(self):
        """Test minimal OutfitCreate"""
        create_data = OutfitCreate(
            name="Basic Outfit",
            clothing_item_ids=["item_1"]
        )

        assert create_data.name == "Basic Outfit"
        assert create_data.clothing_item_ids == ["item_1"]
        assert create_data.tags == []


class TestOutfitUpdate:
    """Test OutfitUpdate model"""

    def test_partial_outfit_update(self):
        """Test partial outfit update"""
        update_data = OutfitUpdate(
            name="Updated Outfit",
            is_favorite=True
        )

        assert update_data.name == "Updated Outfit"
        assert update_data.is_favorite is True
        assert update_data.clothing_item_ids is None


class TestEnums:
    """Test enums"""

    def test_clothing_category_values(self):
        """Test ClothingCategory enum values"""
        assert ClothingCategory.TOPS == "tops"
        assert ClothingCategory.BOTTOMS == "bottoms"
        assert ClothingCategory.SHOES == "shoes"

    def test_clothing_size_values(self):
        """Test ClothingSize enum values"""
        assert ClothingSize.S == "S"
        assert ClothingSize.M == "M"
        assert ClothingSize.L == "L"
        assert ClothingSize.SIZE_10 == "10"