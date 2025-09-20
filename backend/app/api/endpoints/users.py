from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import Optional

from ...core.security import get_current_user_uid, get_current_user
from ...models.user import UserResponse, UserUpdate
from ...models.profile import ProfileResponse, ProfileCreate, ProfileUpdate
from ...services.user_service import UserService, ProfileService

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user_uid: str = Depends(get_current_user_uid)):
    """
    Get current user profile

    Returns the authenticated user's profile information.
    """
    user = await UserService.get_user_by_uid(current_user_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Update current user profile

    Updates the authenticated user's profile information with the provided data.
    Only the fields provided in the request will be updated.
    """
    return await UserService.update_user(current_user_uid, user_update)

@router.post("/me/avatar", response_model=dict)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Upload profile picture

    Uploads a new profile picture for the authenticated user.
    The file must be an image and smaller than 5MB.
    """
    public_url = await UserService.upload_profile_picture(current_user_uid, file)
    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture_url": public_url
    }

@router.delete("/me/avatar", response_model=dict)
async def remove_profile_picture(current_user_uid: str = Depends(get_current_user_uid)):
    """
    Remove profile picture

    Removes the current profile picture of the authenticated user.
    """
    success = await UserService.remove_profile_picture(current_user_uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove profile picture"
        )

    return {"message": "Profile picture removed successfully"}

@router.get("/me/profile", response_model=ProfileResponse)
async def get_current_user_extended_profile(current_user_uid: str = Depends(get_current_user_uid)):
    """
    Get current user's extended profile

    Returns the authenticated user's extended profile including measurements,
    style preferences, and privacy settings.
    """
    profile = await ProfileService.get_profile_by_user_uid(current_user_uid)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return profile

@router.post("/me/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_current_user_profile(
    profile_data: ProfileCreate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Create extended profile for current user

    Creates an extended profile for the authenticated user with measurements,
    style preferences, and privacy settings.
    """
    # Override user_uid from the authenticated user
    profile_data.user_uid = current_user_uid

    return await ProfileService.create_profile(profile_data)

@router.put("/me/profile", response_model=ProfileResponse)
async def update_current_user_profile_extended(
    profile_update: ProfileUpdate,
    current_user_uid: str = Depends(get_current_user_uid)
):
    """
    Update current user's extended profile

    Updates the authenticated user's extended profile information.
    Only the fields provided in the request will be updated.
    """
    return await ProfileService.update_profile(current_user_uid, profile_update)

@router.delete("/me/profile", response_model=dict)
async def delete_current_user_profile(current_user_uid: str = Depends(get_current_user_uid)):
    """
    Delete current user's extended profile

    Deletes the authenticated user's extended profile while keeping
    the basic user account intact.
    """
    success = await ProfileService.delete_profile(current_user_uid)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )

    return {"message": "Profile deleted successfully"}

# Admin endpoints (if needed later)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user by ID (admin only)

    Returns a user's profile by their ID. This endpoint is typically
    used by administrators or for public profile viewing.
    """
    # TODO: Add admin role check or public profile visibility check
    user = await UserService.get_user_by_uid(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user