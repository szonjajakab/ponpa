from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class Outfit(BaseModel):
    """Model for outfit data"""
    id: str
    user_uid: str
    name: str
    description: Optional[str] = None
    clothing_item_ids: List[str]
    tags: Optional[List[str]] = None
    occasion: Optional[str] = None
    season: Optional[str] = None
    weather: Optional[str] = None
    image_url: Optional[str] = None
    is_favorite: bool = False
    wear_count: int = 0
    last_worn: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class OutfitCreate(BaseModel):
    """Model for creating a new outfit"""
    name: str
    description: Optional[str] = None
    clothing_item_ids: List[str]
    tags: Optional[List[str]] = None
    occasion: Optional[str] = None
    season: Optional[str] = None
    weather: Optional[str] = None

class OutfitUpdate(BaseModel):
    """Model for updating an outfit"""
    name: Optional[str] = None
    description: Optional[str] = None
    clothing_item_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    occasion: Optional[str] = None
    season: Optional[str] = None
    weather: Optional[str] = None
    is_favorite: Optional[bool] = None

# Service for outfit operations
from app.core.firebase import get_firestore_client
import uuid

class OutfitService:
    """Service for managing outfits in Firestore"""

    COLLECTION_NAME = "outfits"

    @staticmethod
    async def create_outfit(user_uid: str, outfit_data: OutfitCreate) -> Outfit:
        """Create a new outfit"""
        try:
            db = get_firestore_client()
            if not db:
                raise RuntimeError("Firestore client not available")

            outfit_id = str(uuid.uuid4())
            outfit = Outfit(
                id=outfit_id,
                user_uid=user_uid,
                **outfit_data.dict()
            )

            # Save to Firestore
            doc_ref = db.collection(OutfitService.COLLECTION_NAME).document(outfit_id)
            doc_ref.set(outfit.dict())

            logger.info(f"Created outfit {outfit_id} for user {user_uid}")
            return outfit

        except Exception as e:
            logger.error(f"Failed to create outfit: {e}")
            raise

    @staticmethod
    async def get_outfit(user_uid: str, outfit_id: str) -> Optional[Outfit]:
        """Get an outfit by ID"""
        try:
            db = get_firestore_client()
            if not db:
                return None

            doc_ref = db.collection(OutfitService.COLLECTION_NAME).document(outfit_id)
            doc = doc_ref.get()

            if not doc.exists:
                return None

            data = doc.to_dict()

            # Verify user owns this outfit
            if data.get('user_uid') != user_uid:
                return None

            return Outfit(**data)

        except Exception as e:
            logger.error(f"Failed to get outfit {outfit_id}: {e}")
            return None

    @staticmethod
    async def get_outfits(user_uid: str, limit: int = 50) -> List[Outfit]:
        """Get all outfits for a user"""
        try:
            db = get_firestore_client()
            if not db:
                return []

            query = (db.collection(OutfitService.COLLECTION_NAME)
                    .where('user_uid', '==', user_uid)
                    .order_by('updated_at', direction='DESCENDING')
                    .limit(limit))

            docs = query.get()

            outfits = []
            for doc in docs:
                try:
                    outfit_data = doc.to_dict()
                    outfits.append(Outfit(**outfit_data))
                except Exception as e:
                    logger.warning(f"Failed to parse outfit {doc.id}: {e}")

            return outfits

        except Exception as e:
            logger.error(f"Failed to get outfits for user {user_uid}: {e}")
            return []

    @staticmethod
    async def update_outfit(user_uid: str, outfit_id: str, outfit_update: OutfitUpdate) -> Optional[Outfit]:
        """Update an outfit"""
        try:
            db = get_firestore_client()
            if not db:
                return None

            # First verify the outfit exists and user owns it
            existing_outfit = await OutfitService.get_outfit(user_uid, outfit_id)
            if not existing_outfit:
                return None

            doc_ref = db.collection(OutfitService.COLLECTION_NAME).document(outfit_id)

            # Build update data (only include non-None values)
            update_data = {}
            for field, value in outfit_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_data[field] = value

            update_data['updated_at'] = datetime.utcnow()

            doc_ref.update(update_data)

            # Return updated outfit
            return await OutfitService.get_outfit(user_uid, outfit_id)

        except Exception as e:
            logger.error(f"Failed to update outfit {outfit_id}: {e}")
            return None

    @staticmethod
    async def delete_outfit(user_uid: str, outfit_id: str) -> bool:
        """Delete an outfit"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            # First verify the outfit exists and user owns it
            existing_outfit = await OutfitService.get_outfit(user_uid, outfit_id)
            if not existing_outfit:
                return False

            doc_ref = db.collection(OutfitService.COLLECTION_NAME).document(outfit_id)
            await doc_ref.delete()

            logger.info(f"Deleted outfit {outfit_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete outfit {outfit_id}: {e}")
            return False

    @staticmethod
    async def mark_as_worn(user_uid: str, outfit_id: str) -> Optional[Outfit]:
        """Mark an outfit as worn (increment wear count, update last worn)"""
        try:
            existing_outfit = await OutfitService.get_outfit(user_uid, outfit_id)
            if not existing_outfit:
                return None

            db = get_firestore_client()
            if not db:
                return None

            doc_ref = db.collection(OutfitService.COLLECTION_NAME).document(outfit_id)

            update_data = {
                'wear_count': existing_outfit.wear_count + 1,
                'last_worn': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            doc_ref.update(update_data)

            return await OutfitService.get_outfit(user_uid, outfit_id)

        except Exception as e:
            logger.error(f"Failed to mark outfit {outfit_id} as worn: {e}")
            return None