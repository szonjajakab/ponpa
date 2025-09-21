from typing import List, Optional, Dict, Any
from uuid import uuid4
from fastapi import HTTPException, UploadFile, status
import logging
from collections import defaultdict
from PIL import Image
import io

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

    @staticmethod
    async def get_user_clothing_items(
        user_uid: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ClothingItemResponse]:
        """Get all clothing items for a user with optional filtering"""
        try:
            # Build query filters
            query_filters = [("user_uid", "==", user_uid)]

            if filters:
                for key, value in filters.items():
                    if key == 'tags' and isinstance(value, list):
                        # For tags, we'll filter after the query since Firestore array-contains
                        # only supports single values
                        continue
                    else:
                        query_filters.append((key, "==", value))

            # Query documents
            docs = FirestoreHelper.query_documents(
                "clothing_items",
                filters=query_filters,
                order_by=[("created_at", "desc")],
                limit=limit + offset,  # Get extra for potential tag filtering
                offset=offset
            )

            # Convert to ClothingItem objects and apply tag filtering
            items = []
            for doc_data in docs:
                clothing_item = ClothingItem.from_firestore(doc_data)
                if clothing_item:
                    # Apply tag filtering if specified
                    if filters and 'tags' in filters:
                        item_tags = set(clothing_item.tags)
                        filter_tags = set(filters['tags'])
                        if not filter_tags.intersection(item_tags):
                            continue

                    items.append(_convert_clothing_item_to_response(clothing_item))

            # Apply limit after tag filtering
            return items[:limit]

        except Exception as e:
            logger.error(f"Error getting user clothing items: {str(e)}")
            return []

    @staticmethod
    async def upload_clothing_item_images(
        item_id: str,
        user_uid: str,
        files: List[UploadFile]
    ) -> List[str]:
        """Upload images for a clothing item"""
        try:
            # Verify item exists and belongs to user
            item = await ClothingItemService.get_clothing_item(item_id, user_uid)
            if not item:
                raise ValueError("Clothing item not found")

            # Validate files
            for file in files:
                if not file.content_type or not file.content_type.startswith('image/'):
                    raise ValueError(f"File {file.filename} is not an image")

                if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
                    raise ValueError(f"File {file.filename} is too large (max 5MB)")

            # Upload files to storage
            bucket = get_storage_bucket()
            if not bucket:
                raise ValueError("Storage bucket not available")

            uploaded_urls = []

            for file in files:
                # Generate unique filename
                file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
                blob_name = f"clothing_items/{user_uid}/{item_id}/{uuid4()}.{file_extension}"

                # Upload to Firebase Storage
                blob = bucket.blob(blob_name)
                blob.upload_from_file(file.file, content_type=file.content_type)
                blob.make_public()

                uploaded_urls.append(blob.public_url)

            # Update clothing item with new image URLs
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if doc_data:
                clothing_item = ClothingItem.from_firestore(doc_data)
                if clothing_item:
                    # Add new URLs to existing ones
                    current_urls = [str(url) for url in clothing_item.image_urls]
                    all_urls = current_urls + uploaded_urls

                    # Validate total count
                    if len(all_urls) > 10:
                        raise ValueError("Maximum 10 images allowed per item")

                    # Update the item
                    clothing_item.image_urls = all_urls
                    clothing_item.update_timestamp()

                    FirestoreHelper.update_document(
                        "clothing_items",
                        item_id,
                        clothing_item.to_firestore()
                    )

            return uploaded_urls

        except Exception as e:
            logger.error(f"Error uploading clothing item images: {str(e)}")
            raise

    @staticmethod
    async def delete_clothing_item_images(
        item_id: str,
        user_uid: str,
        image_urls: List[str]
    ) -> bool:
        """Delete specific images from a clothing item"""
        try:
            # Verify item exists and belongs to user
            item = await ClothingItemService.get_clothing_item(item_id, user_uid)
            if not item:
                return False

            # Get current item data
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                return False

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item:
                return False

            # Remove specified URLs
            current_urls = [str(url) for url in clothing_item.image_urls]
            updated_urls = [url for url in current_urls if url not in image_urls]

            # Update the item
            clothing_item.image_urls = updated_urls
            clothing_item.update_timestamp()

            success = FirestoreHelper.update_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            # Delete files from storage
            bucket = get_storage_bucket()
            if bucket:
                for url in image_urls:
                    try:
                        # Extract blob name from URL
                        if f"clothing_items/{user_uid}/{item_id}/" in url:
                            blob_name = url.split('/')[-1]
                            full_blob_name = f"clothing_items/{user_uid}/{item_id}/{blob_name}"
                            blob = bucket.blob(full_blob_name)
                            blob.delete()
                    except Exception as e:
                        logger.warning(f"Failed to delete storage file {url}: {str(e)}")

            return success

        except Exception as e:
            logger.error(f"Error deleting clothing item images: {str(e)}")
            return False

    @staticmethod
    async def record_wear(item_id: str, user_uid: str) -> Optional[ClothingItemResponse]:
        """Record that a clothing item was worn"""
        try:
            # Get current item
            doc_data = FirestoreHelper.get_document("clothing_items", item_id)
            if not doc_data:
                return None

            clothing_item = ClothingItem.from_firestore(doc_data)
            if not clothing_item or clothing_item.user_uid != user_uid:
                return None

            # Increment wear count
            clothing_item.increment_wear_count()

            # Save to Firestore
            success = FirestoreHelper.update_document(
                "clothing_items",
                item_id,
                clothing_item.to_firestore()
            )

            if success:
                return _convert_clothing_item_to_response(clothing_item)
            return None

        except Exception as e:
            logger.error(f"Error recording wear for item {item_id}: {str(e)}")
            return None

    @staticmethod
    async def get_clothing_analytics(
        user_uid: str,
        category: Optional[ClothingCategory] = None
    ) -> Dict[str, Any]:
        """Get clothing item analytics for a user"""
        try:
            # Build query filters
            filters = [("user_uid", "==", user_uid)]
            if category:
                filters.append(("category", "==", category.value))

            # Get all items
            docs = FirestoreHelper.query_documents(
                "clothing_items",
                filters=filters
            )

            if not docs:
                return {
                    "total_items": 0,
                    "items_by_category": {},
                    "favorite_items": 0,
                    "average_wear_count": 0,
                    "most_worn_items": [],
                    "least_worn_items": []
                }

            # Process analytics
            items = []
            category_counts = defaultdict(int)
            favorite_count = 0
            total_wear_count = 0

            for doc_data in docs:
                clothing_item = ClothingItem.from_firestore(doc_data)
                if clothing_item:
                    items.append(clothing_item)
                    category_counts[clothing_item.category.value] += 1
                    if clothing_item.is_favorite:
                        favorite_count += 1
                    total_wear_count += clothing_item.wear_count

            # Sort by wear count
            items_by_wear = sorted(items, key=lambda x: x.wear_count, reverse=True)

            most_worn = []
            least_worn = []

            if items_by_wear:
                # Get top 5 most worn
                for item in items_by_wear[:5]:
                    if item.wear_count > 0:
                        most_worn.append({
                            "id": item.id,
                            "name": item.name,
                            "wear_count": item.wear_count,
                            "category": item.category.value
                        })

                # Get top 5 least worn (excluding never worn)
                least_worn_candidates = [item for item in reversed(items_by_wear) if item.wear_count > 0]
                for item in least_worn_candidates[:5]:
                    least_worn.append({
                        "id": item.id,
                        "name": item.name,
                        "wear_count": item.wear_count,
                        "category": item.category.value
                    })

            return {
                "total_items": len(items),
                "items_by_category": dict(category_counts),
                "favorite_items": favorite_count,
                "average_wear_count": round(total_wear_count / len(items), 2) if items else 0,
                "most_worn_items": most_worn,
                "least_worn_items": least_worn
            }

        except Exception as e:
            logger.error(f"Error getting clothing analytics: {str(e)}")
            return {}


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
        outfit_id: str,
        user_uid: str,
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
    async def delete_outfit(outfit_id: str, user_uid: str) -> bool:
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

    @staticmethod
    async def get_user_outfits(
        user_uid: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[OutfitResponse]:
        """Get all outfits for a user with optional filtering"""
        try:
            # Build query filters
            query_filters = [("user_uid", "==", user_uid)]

            if filters:
                for key, value in filters.items():
                    if key == 'tags' and isinstance(value, list):
                        # For tags, we'll filter after the query since Firestore array-contains
                        # only supports single values
                        continue
                    else:
                        query_filters.append((key, "==", value))

            # Query documents
            docs = FirestoreHelper.query_documents(
                "outfits",
                filters=query_filters,
                order_by=[("created_at", "desc")],
                limit=limit + offset,  # Get extra for potential tag filtering
                offset=offset
            )

            # Convert to Outfit objects and apply tag filtering
            outfits = []
            for doc_data in docs:
                outfit = Outfit.from_firestore(doc_data)
                if outfit:
                    # Apply tag filtering if specified
                    if filters and 'tags' in filters:
                        outfit_tags = set(outfit.tags)
                        filter_tags = set(filters['tags'])
                        if not filter_tags.intersection(outfit_tags):
                            continue

                    outfits.append(_convert_outfit_to_response(outfit))

            # Apply limit after tag filtering
            return outfits[:limit]

        except Exception as e:
            logger.error(f"Error getting user outfits: {str(e)}")
            return []

    @staticmethod
    async def record_wear(outfit_id: str, user_uid: str) -> Optional[OutfitResponse]:
        """Record that an outfit was worn"""
        try:
            # Get current outfit
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                return None

            outfit = Outfit.from_firestore(doc_data)
            if not outfit or outfit.user_uid != user_uid:
                return None

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
                return _convert_outfit_to_response(outfit)
            return None

        except Exception as e:
            logger.error(f"Error recording wear for outfit {outfit_id}: {str(e)}")
            return None

    @staticmethod
    async def upload_outfit_image(
        outfit_id: str,
        user_uid: str,
        file: UploadFile
    ) -> str:
        """Upload image for an outfit"""
        try:
            # Verify outfit exists and belongs to user
            outfit = await OutfitService.get_outfit(outfit_id, user_uid)
            if not outfit:
                raise ValueError("Outfit not found")

            # Validate file
            if not file.content_type or not file.content_type.startswith('image/'):
                raise ValueError(f"File {file.filename} is not an image")

            if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
                raise ValueError(f"File {file.filename} is too large (max 5MB)")

            # Upload file to storage
            bucket = get_storage_bucket()
            if not bucket:
                raise ValueError("Storage bucket not available")

            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
            blob_name = f"outfits/{user_uid}/{outfit_id}/{uuid4()}.{file_extension}"

            # Upload to Firebase Storage
            blob = bucket.blob(blob_name)
            blob.upload_from_file(file.file, content_type=file.content_type)
            blob.make_public()

            image_url = blob.public_url

            # Update outfit with new image URL
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if doc_data:
                outfit_obj = Outfit.from_firestore(doc_data)
                if outfit_obj:
                    outfit_obj.image_url = image_url
                    outfit_obj.update_timestamp()

                    FirestoreHelper.update_document(
                        "outfits",
                        outfit_id,
                        outfit_obj.to_firestore()
                    )

            return image_url

        except Exception as e:
            logger.error(f"Error uploading outfit image: {str(e)}")
            raise

    @staticmethod
    async def delete_outfit_image(
        outfit_id: str,
        user_uid: str
    ) -> bool:
        """Delete the outfit image"""
        try:
            # Get current outfit data
            doc_data = FirestoreHelper.get_document("outfits", outfit_id)
            if not doc_data:
                return False

            outfit = Outfit.from_firestore(doc_data)
            if not outfit or outfit.user_uid != user_uid:
                return False

            if not outfit.image_url:
                return True  # No image to delete

            # Remove image URL from outfit
            old_image_url = str(outfit.image_url)
            outfit.image_url = None
            outfit.update_timestamp()

            success = FirestoreHelper.update_document(
                "outfits",
                outfit_id,
                outfit.to_firestore()
            )

            # Delete file from storage
            bucket = get_storage_bucket()
            if bucket and old_image_url:
                try:
                    # Extract blob name from URL
                    if f"outfits/{user_uid}/{outfit_id}/" in old_image_url:
                        blob_name = old_image_url.split('/')[-1]
                        full_blob_name = f"outfits/{user_uid}/{outfit_id}/{blob_name}"
                        blob = bucket.blob(full_blob_name)
                        blob.delete()
                except Exception as e:
                    logger.warning(f"Failed to delete storage file {old_image_url}: {str(e)}")

            return success

        except Exception as e:
            logger.error(f"Error deleting outfit image: {str(e)}")
            return False

    @staticmethod
    async def get_outfit_analytics(user_uid: str) -> Dict[str, Any]:
        """Get outfit analytics for a user"""
        try:
            # Get all outfits
            docs = FirestoreHelper.query_documents(
                "outfits",
                filters=[("user_uid", "==", user_uid)]
            )

            if not docs:
                return {
                    "total_outfits": 0,
                    "outfits_by_occasion": {},
                    "outfits_by_season": {},
                    "favorite_outfits": 0,
                    "average_wear_count": 0,
                    "most_worn_outfits": [],
                    "least_worn_outfits": []
                }

            # Process analytics
            outfits = []
            occasion_counts = defaultdict(int)
            season_counts = defaultdict(int)
            favorite_count = 0
            total_wear_count = 0

            for doc_data in docs:
                outfit = Outfit.from_firestore(doc_data)
                if outfit:
                    outfits.append(outfit)
                    if outfit.occasion:
                        occasion_counts[outfit.occasion] += 1
                    if outfit.season:
                        season_counts[outfit.season] += 1
                    if outfit.is_favorite:
                        favorite_count += 1
                    total_wear_count += outfit.wear_count

            # Sort by wear count
            outfits_by_wear = sorted(outfits, key=lambda x: x.wear_count, reverse=True)

            most_worn = []
            least_worn = []

            if outfits_by_wear:
                # Get top 5 most worn
                for outfit in outfits_by_wear[:5]:
                    if outfit.wear_count > 0:
                        most_worn.append({
                            "id": outfit.id,
                            "name": outfit.name,
                            "wear_count": outfit.wear_count,
                            "occasion": outfit.occasion
                        })

                # Get top 5 least worn (excluding never worn)
                least_worn_candidates = [outfit for outfit in reversed(outfits_by_wear) if outfit.wear_count > 0]
                for outfit in least_worn_candidates[:5]:
                    least_worn.append({
                        "id": outfit.id,
                        "name": outfit.name,
                        "wear_count": outfit.wear_count,
                        "occasion": outfit.occasion
                    })

            return {
                "total_outfits": len(outfits),
                "outfits_by_occasion": dict(occasion_counts),
                "outfits_by_season": dict(season_counts),
                "favorite_outfits": favorite_count,
                "average_wear_count": round(total_wear_count / len(outfits), 2) if outfits else 0,
                "most_worn_outfits": most_worn,
                "least_worn_outfits": least_worn
            }

        except Exception as e:
            logger.error(f"Error getting outfit analytics: {str(e)}")
            return {}