from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl, validator

from .base import BaseFirestoreModel


class ClothingCategory(str, Enum):
    """Enum for clothing categories"""
    TOPS = "tops"
    BOTTOMS = "bottoms"
    DRESSES = "dresses"
    OUTERWEAR = "outerwear"
    SHOES = "shoes"
    ACCESSORIES = "accessories"
    UNDERWEAR = "underwear"
    ACTIVEWEAR = "activewear"
    FORMAL = "formal"
    CASUAL = "casual"


class ClothingSize(str, Enum):
    """Enum for clothing sizes"""
    XS = "XS"
    S = "S"
    M = "M"
    L = "L"
    XL = "XL"
    XXL = "XXL"
    XXXL = "XXXL"
    # Number sizes
    SIZE_0 = "0"
    SIZE_2 = "2"
    SIZE_4 = "4"
    SIZE_6 = "6"
    SIZE_8 = "8"
    SIZE_10 = "10"
    SIZE_12 = "12"
    SIZE_14 = "14"
    SIZE_16 = "16"
    SIZE_18 = "18"
    SIZE_20 = "20"


class Color(BaseModel):
    """Color information for clothing items"""
    name: str = Field(..., min_length=1, max_length=50, description="Color name")
    hex_code: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Navy Blue",
                "hex_code": "#000080"
            }
        }
    }


class ClothingItem(BaseFirestoreModel):
    """Model for individual clothing items in a wardrobe"""
    id: Optional[str] = Field(None, description="Unique identifier")
    user_uid: str = Field(..., description="Owner's user ID")
    name: str = Field(..., min_length=1, max_length=100, description="Item name")
    category: ClothingCategory = Field(..., description="Clothing category")
    brand: Optional[str] = Field(None, max_length=50, description="Brand name")
    size: Optional[ClothingSize] = Field(None, description="Clothing size")
    colors: List[Color] = Field(default_factory=list, description="Item colors")
    description: Optional[str] = Field(None, max_length=500, description="Item description")
    image_urls: List[HttpUrl] = Field(default_factory=list, description="Item images")
    purchase_date: Optional[datetime] = Field(None, description="Purchase date")
    purchase_price: Optional[float] = Field(None, ge=0, description="Purchase price")
    tags: List[str] = Field(default_factory=list, description="Custom tags")
    is_favorite: bool = Field(default=False, description="Favorite item flag")
    wear_count: int = Field(default=0, ge=0, description="Number of times worn")
    last_worn: Optional[datetime] = Field(None, description="Last time worn")
    condition: Optional[str] = Field(None, description="Item condition")
    notes: Optional[str] = Field(None, max_length=1000, description="Personal notes")

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 20:
            raise ValueError('Maximum 20 tags allowed')
        for tag in v:
            if len(tag) > 30:
                raise ValueError('Tag length must be 30 characters or less')
        return v

    @validator('image_urls')
    def validate_image_urls(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 images allowed')
        return v

    def increment_wear_count(self):
        """Increment wear count and update last worn date"""
        self.wear_count += 1
        self.last_worn = datetime.now()
        self.update_timestamp()

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document format"""
        data = super().to_firestore()

        # Convert colors to dictionaries
        if self.colors:
            data['colors'] = [color.model_dump() for color in self.colors]

        # Convert image URLs to strings
        if self.image_urls:
            data['image_urls'] = [str(url) for url in self.image_urls]

        # Convert datetime fields to timestamps
        if self.purchase_date:
            data['purchase_date'] = self.purchase_date.timestamp()
        if self.last_worn:
            data['last_worn'] = self.last_worn.timestamp()

        return data

    @classmethod
    def from_firestore(cls, doc_data: Dict[str, Any]) -> Optional['ClothingItem']:
        """Create instance from Firestore document"""
        if not doc_data:
            return None

        # Convert timestamps back to datetime
        if 'purchase_date' in doc_data and doc_data['purchase_date']:
            doc_data['purchase_date'] = datetime.fromtimestamp(doc_data['purchase_date'])
        if 'last_worn' in doc_data and doc_data['last_worn']:
            doc_data['last_worn'] = datetime.fromtimestamp(doc_data['last_worn'])

        # Convert color dictionaries back to Color objects
        if 'colors' in doc_data and doc_data['colors']:
            doc_data['colors'] = [Color(**color) for color in doc_data['colors']]

        return super().from_firestore(doc_data)


class Outfit(BaseFirestoreModel):
    """Model for outfit combinations"""
    id: Optional[str] = Field(None, description="Unique identifier")
    user_uid: str = Field(..., description="Owner's user ID")
    name: str = Field(..., min_length=1, max_length=100, description="Outfit name")
    description: Optional[str] = Field(None, max_length=500, description="Outfit description")
    clothing_item_ids: List[str] = Field(..., min_items=1, description="IDs of clothing items in outfit")
    tags: List[str] = Field(default_factory=list, description="Outfit tags")
    occasion: Optional[str] = Field(None, max_length=50, description="Occasion type")
    season: Optional[str] = Field(None, max_length=20, description="Season")
    weather: Optional[str] = Field(None, max_length=50, description="Weather conditions")
    image_url: Optional[HttpUrl] = Field(None, description="Outfit image")
    is_favorite: bool = Field(default=False, description="Favorite outfit flag")
    wear_count: int = Field(default=0, ge=0, description="Number of times worn")
    last_worn: Optional[datetime] = Field(None, description="Last time worn")

    @validator('clothing_item_ids')
    def validate_clothing_items(cls, v):
        if len(v) > 20:
            raise ValueError('Maximum 20 items per outfit')
        return v

    @validator('tags')
    def validate_tags(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v

    def increment_wear_count(self):
        """Increment wear count and update last worn date"""
        self.wear_count += 1
        self.last_worn = datetime.now()
        self.update_timestamp()

    def to_firestore(self) -> Dict[str, Any]:
        """Convert to Firestore document format"""
        data = super().to_firestore()

        # Convert image URL to string
        if self.image_url:
            data['image_url'] = str(self.image_url)

        # Convert datetime to timestamp
        if self.last_worn:
            data['last_worn'] = self.last_worn.timestamp()

        return data

    @classmethod
    def from_firestore(cls, doc_data: Dict[str, Any]) -> Optional['Outfit']:
        """Create instance from Firestore document"""
        if not doc_data:
            return None

        # Convert timestamp back to datetime
        if 'last_worn' in doc_data and doc_data['last_worn']:
            doc_data['last_worn'] = datetime.fromtimestamp(doc_data['last_worn'])

        return super().from_firestore(doc_data)


# API Models for requests/responses

class ClothingItemCreate(BaseModel):
    """Model for creating new clothing items"""
    name: str = Field(..., min_length=1, max_length=100)
    category: ClothingCategory
    brand: Optional[str] = Field(None, max_length=50)
    size: Optional[ClothingSize] = None
    colors: List[Color] = Field(default_factory=list)
    description: Optional[str] = Field(None, max_length=500)
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    tags: List[str] = Field(default_factory=list)
    condition: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=1000)


class ClothingItemUpdate(BaseModel):
    """Model for updating clothing items"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[ClothingCategory] = None
    brand: Optional[str] = Field(None, max_length=50)
    size: Optional[ClothingSize] = None
    colors: Optional[List[Color]] = None
    description: Optional[str] = Field(None, max_length=500)
    purchase_date: Optional[datetime] = None
    purchase_price: Optional[float] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    condition: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=1000)


class ClothingItemResponse(BaseModel):
    """Model for clothing item API responses"""
    id: str
    user_uid: str
    name: str
    category: ClothingCategory
    brand: Optional[str]
    size: Optional[ClothingSize]
    colors: List[Color]
    description: Optional[str]
    image_urls: List[str]
    purchase_date: Optional[datetime]
    purchase_price: Optional[float]
    tags: List[str]
    is_favorite: bool
    wear_count: int
    last_worn: Optional[datetime]
    condition: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class OutfitCreate(BaseModel):
    """Model for creating new outfits"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    clothing_item_ids: List[str] = Field(..., min_items=1)
    tags: List[str] = Field(default_factory=list)
    occasion: Optional[str] = Field(None, max_length=50)
    season: Optional[str] = Field(None, max_length=20)
    weather: Optional[str] = Field(None, max_length=50)


class OutfitUpdate(BaseModel):
    """Model for updating outfits"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    clothing_item_ids: Optional[List[str]] = Field(None, min_items=1)
    tags: Optional[List[str]] = None
    occasion: Optional[str] = Field(None, max_length=50)
    season: Optional[str] = Field(None, max_length=20)
    weather: Optional[str] = Field(None, max_length=50)
    is_favorite: Optional[bool] = None


class OutfitResponse(BaseModel):
    """Model for outfit API responses"""
    id: str
    user_uid: str
    name: str
    description: Optional[str]
    clothing_item_ids: List[str]
    tags: List[str]
    occasion: Optional[str]
    season: Optional[str]
    weather: Optional[str]
    image_url: Optional[str]
    is_favorite: bool
    wear_count: int
    last_worn: Optional[datetime]
    created_at: datetime
    updated_at: datetime