from typing import List, Optional, Dict, Any
from uuid import uuid4
from fastapi import HTTPException, UploadFile, status
import logging

from ..core.firebase import FirestoreHelper, get_storage_bucket
from ..models.wardrobe import (
    ClothingItem, ClothingItemCreate, ClothingItemUpdate, ClothingItemResponse,
    Outfit, OutfitCreate, OutfitUpdate, OutfitResponse,
    ClothingCategory
)

logger = logging.getLogger(__name__)


def _convert_clothing_item_to_response(clothing_item: ClothingItem) -> ClothingItemResponse:
    """Convert ClothingItem to ClothingItemResponse with proper URL conversion"""
    item_data = clothing_item.model_dump()
    if item_data.get('image_urls'):
        item_data['image_urls'] = [str(url) for url in clothing_item.image_urls]
    return ClothingItemResponse(**item_data)


def _convert_outfit_to_response(outfit: Outfit) -> OutfitResponse:
    """Convert Outfit to OutfitResponse with proper URL conversion"""
    outfit_data = outfit.model_dump()
    if outfit_data.get('image_url'):
        outfit_data['image_url'] = str(outfit.image_url)
    return OutfitResponse(**outfit_data)


class ClothingItemService:
    """Service for managing clothing items"""

    @staticmethod
    async def create_clothing_item(user_uid: str, item_data: ClothingItemCreate) -> ClothingItemResponse:
        """Create a new clothing item"""
        try:
            item_id = str(uuid4())

            # Create clothing item with generated ID
            clothing_item = ClothingItem(
                id=item_id,
                user_uid=user_uid,
                **item_data.model_dump()
            )

            # Save to Firestore
            success = FirestoreHelper.create_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create clothing item"
                )

            logger.info(f"Created clothing item {item_id} for user {user_uid}")
            return _convert_clothing_item_to_response(clothing_item)

        except Exception as e:
            logger.error(f"Error creating clothing item: {str(e)}")
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create clothing item"
            )

    @staticmethod
    async def get_clothing_item(user_uid: str, item_id: str) -> Optional[ClothingItemResponse]:
        """Get a clothing item by ID"""
        try:
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                return None

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item:
                return None

            # Verify ownership
            if clothing_item.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this clothing item"
                )

            return _convert_clothing_item_to_response(clothing_item)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting clothing item {item_id}: {str(e)}")
            return None

    @staticmethod
    async def get_user_clothing_items(
        user_uid: str,
        category: Optional[ClothingCategory] = None,
        is_favorite: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[ClothingItemResponse]:
        """Get all clothing items for a user with optional filtering"""
        try:
            # Build query filters
            filters = [("user_uid", "==", user_uid)]

            if category:
                filters.append(("category", "==", category.value))

            if is_favorite is not None:
                filters.append(("is_favorite", "==", is_favorite))

            # Get documents with filters
            docs = FirestoreHelper.query_documents(
                "clothing_items",
                filters=filters,
                order_by=[("created_at", "desc")],
                limit=limit,
                offset=offset
            )

            items = []
            for doc_data in docs:
                clothing_item = ClothingItem.from_firestore(doc_data)
                if clothing_item:
                    items.append(_convert_clothing_item_to_response(clothing_item))

            logger.info(f"Retrieved {len(items)} clothing items for user {user_uid}")
            return items

        except Exception as e:
            logger.error(f"Error getting clothing items for user {user_uid}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve clothing items"
            )

    @staticmethod
    async def update_clothing_item(
        user_uid: str,
        item_id: str,
        item_update: ClothingItemUpdate
    ) -> Optional[ClothingItemResponse]:
        """Update a clothing item"""
        try:
            # Get existing item
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clothing item not found"
                )

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clothing item not found"
                )

            # Verify ownership
            if clothing_item.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this clothing item"
                )

            # Update fields
            update_data = item_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(clothing_item, field, value)

            clothing_item.update_timestamp()

            # Save to Firestore
            success = FirestoreHelper.update_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update clothing item"
                )

            logger.info(f"Updated clothing item {item_id} for user {user_uid}")
            return _convert_clothing_item_to_response(clothing_item)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating clothing item {item_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update clothing item"
            )

    @staticmethod
    async def delete_clothing_item(user_uid: str, item_id: str) -> bool:
        """Delete a clothing item"""
        try:
            # Get existing item to verify ownership
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clothing item not found"
                )

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item or clothing_item.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this clothing item"
                )

            # Delete from Firestore
            success = FirestoreHelper.delete_document("clothing_items", item_id)

            if success:
                logger.info(f"Deleted clothing item {item_id} for user {user_uid}")

            return success

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting clothing item {item_id}: {str(e)}")
            return False

    @staticmethod
    async def upload_clothing_item_image(
        user_uid: str,
        item_id: str,
        file: UploadFile
    ) -> str:
        """Upload an image for a clothing item"""
        try:
            # Verify clothing item exists and user owns it
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Clothing item not found"
                )

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item or clothing_item.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this clothing item"
                )

            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image"
                )

            # Read file content
            file_content = await file.read()

            # Validate file size (5MB limit)
            if len(file_content) > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File size must be less than 5MB"
                )

            # Upload to Firebase Storage
            bucket = get_storage_bucket()
            if not bucket:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Storage service not available"
                )

            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
            blob_name = f"clothing_items/{user_uid}/{item_id}/{uuid4()}.{file_extension}"

            blob = bucket.blob(blob_name)
            blob.upload_from_string(file_content, content_type=file.content_type)
            blob.make_public()

            image_url = blob.public_url

            # Add image URL to clothing item
            clothing_item.image_urls.append(image_url)
            clothing_item.update_timestamp()

            # Update in Firestore
            success = FirestoreHelper.update_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update clothing item with image"
                )

            logger.info(f"Uploaded image for clothing item {item_id}")
            return image_url

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading image for clothing item {item_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image"
            )

    @staticmethod
    async def increment_wear_count(user_uid: str, item_id: str) -> bool:
        """Increment wear count for a clothing item"""
        try:
            # Get existing item
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                return False

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item or clothing_item.user_uid != user_uid:
                return False

            # Increment wear count
            clothing_item.increment_wear_count()

            # Save to Firestore
            success = FirestoreHelper.update_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            if success:
                logger.info(f"Incremented wear count for clothing item {item_id}")

            return success

        except Exception as e:
            logger.error(f"Error incrementing wear count for item {item_id}: {str(e)}")
            return False


class OutfitService:
    """Service for managing outfits"""

    @staticmethod
    async def create_outfit(user_uid: str, outfit_data: OutfitCreate) -> OutfitResponse:
        """Create a new outfit"""
        try:
            outfit_id = str(uuid4())

            # Verify all clothing items exist and belong to user
            for item_id in outfit_data.clothing_item_ids:
                doc_data = FirestoreHelper.get_document("clothing_items", item_id)
                if not doc_data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Clothing item {item_id} not found"
                    )

                clothing_item = ClothingItem.from_firestore(doc_data)
                if not clothing_item or clothing_item.user_uid != user_uid:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Access denied to clothing item {item_id}"
                    )

            # Create outfit
            outfit = Outfit(
                id=outfit_id,
                user_uid=user_uid,
                **outfit_data.model_dump()
            )

            # Save to Firestore
            success = FirestoreHelper.create_document(
                "outfits",
                outfit_id,
                outfit.to_firestore()
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create outfit"
                )

            logger.info(f"Created outfit {outfit_id} for user {user_uid}")
            return _convert_outfit_to_response(outfit)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating outfit: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create outfit"
            )

    @staticmethod
    async def get_outfit(user_uid: str, outfit_id: str) -> Optional[OutfitResponse]:
        """Get an outfit by ID"""
        try:
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                return None

            outfit = Outfit.from_firestore(doc_data)
            if not outfit:
                return None

            # Verify ownership
            if outfit.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this outfit"
                )

            return _convert_outfit_to_response(outfit)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting outfit {outfit_id}: {str(e)}")
            return None

    @staticmethod
    async def get_user_outfits(
        user_uid: str,
        is_favorite: Optional[bool] = None,
        occasion: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[OutfitResponse]:
        """Get all outfits for a user with optional filtering"""
        try:
            # Build query filters
            filters = [("user_uid", "==", user_uid)]

            if is_favorite is not None:
                filters.append(("is_favorite", "==", is_favorite))

            if occasion:
                filters.append(("occasion", "==", occasion))

            # Get documents with filters
            docs = FirestoreHelper.query_documents(
                "outfits",
                filters=filters,
                order_by=[("created_at", "desc")],
                limit=limit,
                offset=offset
            )

            outfits = []
            for doc_data in docs:
                outfit = Outfit.from_firestore(doc_data)
                if outfit:
                    outfits.append(_convert_outfit_to_response(outfit))

            logger.info(f"Retrieved {len(outfits)} outfits for user {user_uid}")
            return outfits

        except Exception as e:
            logger.error(f"Error getting outfits for user {user_uid}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve outfits"
            )

    @staticmethod
    async def update_outfit(
        user_uid: str,
        outfit_id: str,
        outfit_update: OutfitUpdate
    ) -> Optional[OutfitResponse]:
        """Update an outfit"""
        try:
            # Get existing outfit
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Outfit not found"
                )

            outfit = Outfit.from_firestore(doc_data)
            if not outfit:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Outfit not found"
                )

            # Verify ownership
            if outfit.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this outfit"
                )

            # Verify clothing items if being updated
            update_data = outfit_update.model_dump(exclude_unset=True)
            if 'clothing_item_ids' in update_data:
                for item_id in update_data['clothing_item_ids']:
                    doc_data = FirestoreHelper.get_document("clothing_items", item_id)
                    if not doc_data:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Clothing item {item_id} not found"
                        )

                    clothing_item = ClothingItem.from_firestore(doc_data)
                    if not clothing_item or clothing_item.user_uid != user_uid:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Access denied to clothing item {item_id}"
                        )

            # Update fields
            for field, value in update_data.items():
                setattr(outfit, field, value)

            outfit.update_timestamp()

            # Save to Firestore
            success = FirestoreHelper.update_document(
                "outfits",
                outfit_id,
                outfit.to_firestore()
            )

            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update outfit"
                )

            logger.info(f"Updated outfit {outfit_id} for user {user_uid}")
            return _convert_outfit_to_response(outfit)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating outfit {outfit_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update outfit"
            )

    @staticmethod
    async def delete_outfit(user_uid: str, outfit_id: str) -> bool:
        """Delete an outfit"""
        try:
            # Get existing outfit to verify ownership
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Outfit not found"
                )

            outfit = Outfit.from_firestore(doc_data)
            if not outfit or outfit.user_uid != user_uid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this outfit"
                )

            # Delete from Firestore
            success = FirestoreHelper.delete_document("outfits", outfit_id)

            if success:
                logger.info(f"Deleted outfit {outfit_id} for user {user_uid}")

            return success

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting outfit {outfit_id}: {str(e)}")
            return False

    @staticmethod
    async def increment_wear_count(user_uid: str, outfit_id: str) -> bool:
        """Increment wear count for an outfit and its clothing items"""
        try:
            # Get existing outfit
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                return False

            outfit = Outfit.from_firestore(doc_data)
            if not outfit or outfit.user_uid != user_uid:
                return False

            # Increment outfit wear count
            outfit.increment_wear_count()

            # Increment wear count for all clothing items in outfit
            for item_id in outfit.clothing_item_ids:
                await ClothingItemService.increment_wear_count(user_uid, item_id)

            # Save outfit to Firestore
            success = FirestoreHelper.update_document(
                "outfits",
                outfit_id,
                outfit.to_firestore()
            )

            if success:
                logger.info(f"Incremented wear count for outfit {outfit_id}")

            return success

        except Exception as e:
            logger.error(f"Error incrementing wear count for outfit {outfit_id}: {str(e)}")
            return False