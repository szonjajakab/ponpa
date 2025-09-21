from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from typing import List, Optional, Dict, Any
import logging

from ...core.security import get_current_user_uid, get_current_user
from ...models.wardrobe import (
    ClothingItemCreate, ClothingItemUpdate, ClothingItemResponse,
    OutfitCreate, OutfitUpdate, OutfitResponse,
    ClothingCategory, ClothingSize
)
from ...services.wardrobe_service import ClothingItemService, OutfitService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])

# Clothing Items Endpoints

@router.get("/clothing-items", response_model=List[ClothingItemResponse])
async def get_clothing_items(
    current_user_uid: str = Depends(get_current_user_uid),
    category: Optional[ClothingCategory] = Query(None, description="Filter by category"),
    size: Optional[ClothingSize] = Query(None, description="Filter by size"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    is_favorite: Optional[bool] = Query(None, description="Filter by favorite status"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Number of items to return"),
    offset: Optional[int] = Query(0, ge=0, description="Number of items to skip")
):
    """
    Get user's clothing items with optional filtering

    Returns a list of clothing items belonging to the authenticated user.
    Supports filtering by category, size, brand, favorite status, and tags.
    """
    filters = {}
    if category:
        filters['category'] = category.value
    if size:
        filters['size'] = size.value
    if brand:
        filters['brand'] = brand
    if is_favorite is not None:
        filters['is_favorite'] = is_favorite
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        if tag_list:
            filters['tags'] = tag_list

    return await ClothingItemService.get_user_clothing_items(
        current_user_uid,
        filters=filters,
        limit=limit,
        offset=offset
    )

@router.get("/clothing-items/{item_id}", response_model=ClothingItemResponse)
async def get_clothing_item(
    item_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Get a specific clothing item by ID

    Returns detailed information about a specific clothing item.
    Only the owner can access their clothing items.
    """
    item = await ClothingItemService.get_clothing_item(item_id, current_user_uid)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clothing item not found"
        )
    return item

@router.post("/clothing-items", response_model=ClothingItemResponse, status_code=status.HTTP_201_CREATED)
async def create_clothing_item(
    item_data: ClothingItemCreate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Create a new clothing item

    Creates a new clothing item in the user's wardrobe with the provided information.
    The item will be automatically associated with the authenticated user.
    """
    try:
        return await ClothingItemService.create_clothing_item(current_user_uid, item_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating clothing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create clothing item"
        )

@router.put("/clothing-items/{item_id}", response_model=ClothingItemResponse)
async def update_clothing_item(
    item_id: str,
    item_update: ClothingItemUpdate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Update a clothing item

    Updates an existing clothing item with the provided information.
    Only the owner can update their clothing items.
    """
    try:
        updated_item = await ClothingItemService.update_clothing_item(item_id, current_user_uid, item_update)
        if not updated_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clothing item not found"
            )
        return updated_item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating clothing item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update clothing item"
        )

@router.delete("/clothing-items/{item_id}", response_model=Dict[str, str])
async def delete_clothing_item(
    item_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Delete a clothing item

    Permanently deletes a clothing item from the user's wardrobe.
    This action cannot be undone. Only the owner can delete their clothing items.
    """
    success = await ClothingItemService.delete_clothing_item(item_id, current_user_uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clothing item not found"
        )

    return {"message": "Clothing item deleted successfully"}

@router.post("/clothing-items/{item_id}/images", response_model=Dict[str, Any])
async def upload_clothing_item_images(
    item_id: str,
    files: List[UploadFile] = File(...),
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Upload images for a clothing item

    Uploads one or more images for a clothing item. Maximum 10 images per item.
    Each image must be smaller than 5MB and in a supported format (JPEG, PNG, WebP).
    """
    # Validate file count first
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per item"
        )

    try:
        image_urls = await ClothingItemService.upload_clothing_item_images(item_id, current_user_uid, files)
        return {
            "message": f"Successfully uploaded {len(image_urls)} images",
            "image_urls": image_urls
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error uploading images: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload images"
        )

@router.delete("/clothing-items/{item_id}/images", response_model=Dict[str, str])
async def delete_clothing_item_images(
    item_id: str,
    image_urls: List[str],
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Delete specific images from a clothing item

    Removes specified images from a clothing item. Provide a list of image URLs to delete.
    """
    try:
        success = await ClothingItemService.delete_clothing_item_images(item_id, current_user_uid, image_urls)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clothing item not found or images not found"
            )

        return {"message": f"Successfully deleted {len(image_urls)} images"}
    except Exception as e:
        logger.error(f"Error deleting images: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete images"
        )

@router.post("/clothing-items/{item_id}/wear", response_model=ClothingItemResponse)
async def record_clothing_item_wear(
    item_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Record that a clothing item was worn

    Increments the wear count and updates the last worn date for the clothing item.
    This helps track usage statistics for wardrobe analytics.
    """
    try:
        updated_item = await ClothingItemService.record_wear(item_id, current_user_uid)
        if not updated_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clothing item not found"
            )
        return updated_item
    except Exception as e:
        logger.error(f"Error recording wear: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record wear"
        )

# Outfit Endpoints

@router.get("/outfits", response_model=List[OutfitResponse])
async def get_outfits(
    current_user_uid: str = Depends(get_current_user_uid),
    occasion: Optional[str] = Query(None, description="Filter by occasion"),
    season: Optional[str] = Query(None, description="Filter by season"),
    weather: Optional[str] = Query(None, description="Filter by weather"),
    is_favorite: Optional[bool] = Query(None, description="Filter by favorite status"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Number of outfits to return"),
    offset: Optional[int] = Query(0, ge=0, description="Number of outfits to skip")
):
    """
    Get user's outfits with optional filtering

    Returns a list of outfits belonging to the authenticated user.
    Supports filtering by occasion, season, weather, favorite status, and tags.
    """
    filters = {}
    if occasion:
        filters['occasion'] = occasion
    if season:
        filters['season'] = season
    if weather:
        filters['weather'] = weather
    if is_favorite is not None:
        filters['is_favorite'] = is_favorite
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        if tag_list:
            filters['tags'] = tag_list

    return await OutfitService.get_user_outfits(
        current_user_uid,
        filters=filters,
        limit=limit,
        offset=offset
    )

@router.get("/outfits/{outfit_id}", response_model=OutfitResponse)
async def get_outfit(
    outfit_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Get a specific outfit by ID

    Returns detailed information about a specific outfit including all clothing items.
    Only the owner can access their outfits.
    """
    outfit = await OutfitService.get_outfit(outfit_id, current_user_uid)
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )
    return outfit

@router.post("/outfits", response_model=OutfitResponse, status_code=status.HTTP_201_CREATED)
async def create_outfit(
    outfit_data: OutfitCreate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Create a new outfit

    Creates a new outfit with the specified clothing items.
    All clothing items must belong to the authenticated user.
    """
    try:
        return await OutfitService.create_outfit(current_user_uid, outfit_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating outfit: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create outfit"
        )

@router.put("/outfits/{outfit_id}", response_model=OutfitResponse)
async def update_outfit(
    outfit_id: str,
    outfit_update: OutfitUpdate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Update an outfit

    Updates an existing outfit with the provided information.
    If clothing items are updated, all items must belong to the authenticated user.
    Only the owner can update their outfits.
    """
    try:
        updated_outfit = await OutfitService.update_outfit(outfit_id, current_user_uid, outfit_update)
        if not updated_outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )
        return updated_outfit
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating outfit: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update outfit"
        )

@router.delete("/outfits/{outfit_id}", response_model=Dict[str, str])
async def delete_outfit(
    outfit_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Delete an outfit

    Permanently deletes an outfit from the user's collection.
    This action cannot be undone. Only the owner can delete their outfits.
    """
    success = await OutfitService.delete_outfit(outfit_id, current_user_uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outfit not found"
        )

    return {"message": "Outfit deleted successfully"}

@router.post("/outfits/{outfit_id}/wear", response_model=OutfitResponse)
async def record_outfit_wear(
    outfit_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Record that an outfit was worn

    Increments the wear count and updates the last worn date for the outfit.
    Also increments wear count for all clothing items in the outfit.
    """
    try:
        updated_outfit = await OutfitService.record_wear(outfit_id, current_user_uid)
        if not updated_outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )
        return updated_outfit
    except Exception as e:
        logger.error(f"Error recording outfit wear: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record outfit wear"
        )

@router.post("/outfits/{outfit_id}/image", response_model=Dict[str, str])
async def upload_outfit_image(
    outfit_id: str,
    file: UploadFile = File(...),
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Upload an image for an outfit

    Uploads a single image representing the complete outfit.
    The image must be smaller than 5MB and in a supported format (JPEG, PNG, WebP).
    """
    try:
        image_url = await OutfitService.upload_outfit_image(outfit_id, current_user_uid, file)
        return {
            "message": "Outfit image uploaded successfully",
            "image_url": image_url
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error uploading outfit image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload outfit image"
        )

@router.delete("/outfits/{outfit_id}/image", response_model=Dict[str, str])
async def delete_outfit_image(
    outfit_id: str,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Delete the outfit image

    Removes the image associated with the outfit.
    """
    try:
        success = await OutfitService.delete_outfit_image(outfit_id, current_user_uid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found or no image to delete"
            )

        return {"message": "Outfit image deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting outfit image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete outfit image"
        )

# Analytics Endpoints

@router.get("/analytics/clothing-items", response_model=Dict[str, Any])
async def get_clothing_analytics(
    current_user_uid: str = Depends(get_current_user_uid),
    category: Optional[ClothingCategory] = Query(None, description="Filter analytics by category")
):
    """
    Get clothing item analytics

    Returns analytics about the user's clothing items including:
    - Total items count
    - Items by category
    - Most/least worn items
    - Favorite items count
    - Average wear count
    """
    try:
        analytics = await ClothingItemService.get_clothing_analytics(current_user_uid, category)
        return analytics
    except Exception as e:
        logger.error(f"Error getting clothing analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get clothing analytics"
        )

@router.get("/analytics/outfits", response_model=Dict[str, Any])
async def get_outfit_analytics(
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Get outfit analytics

    Returns analytics about the user's outfits including:
    - Total outfits count
    - Most/least worn outfits
    - Outfits by occasion/season
    - Favorite outfits count
    - Average wear count
    """
    try:
        analytics = await OutfitService.get_outfit_analytics(current_user_uid)
        return analytics
    except Exception as e:
        logger.error(f"Error getting outfit analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get outfit analytics"
        )