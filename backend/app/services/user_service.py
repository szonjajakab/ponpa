from typing import Optional, Dict, Any
import logging
from datetime import datetime
from fastapi import HTTPException, UploadFile
import uuid

from ..core.firebase import FirestoreHelper, get_storage_bucket
from ..models.user import User, UserCreate, UserUpdate, UserResponse
from ..models.profile import Profile, ProfileCreate, ProfileUpdate, ProfileResponse

logger = logging.getLogger(__name__)

class UserService:
    """Service layer for user management"""

    USERS_COLLECTION = "users"
    PROFILES_COLLECTION = "profiles"

    @staticmethod
    async def create_user(user_data: UserCreate) -> UserResponse:
        """Create a new user in Firestore"""
        try:
            # Check if user already exists
            existing_user = await UserService.get_user_by_uid(user_data.uid)
            if existing_user:
                raise HTTPException(status_code=409, detail="User already exists")

            # Create user object
            user = User(
                uid=user_data.uid,
                email=user_data.email,
                display_name=user_data.display_name,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone_number=user_data.phone_number
            )

            # Save to Firestore
            user_doc = user.to_firestore()
            success = FirestoreHelper.create_document(
                UserService.USERS_COLLECTION,
                user.uid,
                user_doc
            )

            if not success:
                raise HTTPException(status_code=500, detail="Failed to create user")

            logger.info(f"User created successfully: {user.uid}")
            return UserResponse.from_user(user)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    @staticmethod
    async def get_user_by_uid(uid: str) -> Optional[UserResponse]:
        """Get user by UID"""
        try:
            user_doc = FirestoreHelper.get_document(UserService.USERS_COLLECTION, uid)
            if not user_doc:
                return None

            user = User.from_firestore(user_doc, uid)
            if not user:
                return None

            return UserResponse.from_user(user)

        except Exception as e:
            logger.error(f"Error getting user {uid}: {str(e)}")
            return None

    @staticmethod
    async def update_user(uid: str, user_update: UserUpdate) -> UserResponse:
        """Update user information"""
        try:
            # Get existing user
            existing_user_doc = FirestoreHelper.get_document(UserService.USERS_COLLECTION, uid)
            if not existing_user_doc:
                raise HTTPException(status_code=404, detail="User not found")

            # Create user object from existing data
            user = User.from_firestore(existing_user_doc, uid)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Update fields that are provided
            update_data = user_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(user, field) and value is not None:
                    setattr(user, field, value)

            # Update timestamp
            user.update_timestamp()

            # Save to Firestore
            user_doc = user.to_firestore()
            success = FirestoreHelper.update_document(
                UserService.USERS_COLLECTION,
                uid,
                user_doc
            )

            if not success:
                raise HTTPException(status_code=500, detail="Failed to update user")

            logger.info(f"User updated successfully: {uid}")
            return UserResponse.from_user(user)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user {uid}: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    @staticmethod
    async def delete_user(uid: str) -> bool:
        """Delete user and associated profile"""
        try:
            # Delete user profile first
            FirestoreHelper.delete_document(UserService.PROFILES_COLLECTION, uid)

            # Delete user
            success = FirestoreHelper.delete_document(UserService.USERS_COLLECTION, uid)

            if success:
                logger.info(f"User deleted successfully: {uid}")

            return success

        except Exception as e:
            logger.error(f"Error deleting user {uid}: {str(e)}")
            return False

    @staticmethod
    async def upload_profile_picture(uid: str, file: UploadFile) -> str:
        """Upload profile picture to Firebase Storage"""
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")

            # Validate file size (max 5MB)
            file_content = await file.read()
            if len(file_content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File size must be less than 5MB")

            # Get storage bucket
            bucket = get_storage_bucket()
            if not bucket:
                raise HTTPException(status_code=500, detail="Storage not available")

            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'jpg'
            filename = f"profile_pictures/{uid}_{uuid.uuid4().hex}.{file_extension}"

            # Upload to Firebase Storage
            blob = bucket.blob(filename)
            blob.upload_from_string(file_content, content_type=file.content_type)

            # Make the file publicly accessible
            blob.make_public()

            # Get public URL
            public_url = blob.public_url

            # Update user document with new profile picture URL
            user_doc = FirestoreHelper.get_document(UserService.USERS_COLLECTION, uid)
            if user_doc:
                user = User.from_firestore(user_doc, uid)
                if user:
                    user.profile_picture_url = public_url
                    user.update_timestamp()
                    FirestoreHelper.update_document(
                        UserService.USERS_COLLECTION,
                        uid,
                        user.to_firestore()
                    )

            logger.info(f"Profile picture uploaded successfully for user: {uid}")
            return public_url

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading profile picture for user {uid}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload profile picture")

    @staticmethod
    async def remove_profile_picture(uid: str) -> bool:
        """Remove profile picture"""
        try:
            # Get user to check current profile picture
            user_doc = FirestoreHelper.get_document(UserService.USERS_COLLECTION, uid)
            if not user_doc:
                raise HTTPException(status_code=404, detail="User not found")

            user = User.from_firestore(user_doc, uid)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Remove from storage if exists
            if user.profile_picture_url:
                try:
                    bucket = get_storage_bucket()
                    if bucket:
                        # Extract filename from URL
                        filename = user.profile_picture_url.split('/')[-1]
                        if filename.startswith('profile_pictures%2F'):
                            # URL decode the filename
                            import urllib.parse
                            filename = urllib.parse.unquote(filename)

                        blob = bucket.blob(f"profile_pictures/{filename}")
                        if blob.exists():
                            blob.delete()
                except Exception as e:
                    logger.warning(f"Could not delete file from storage: {str(e)}")

            # Update user document
            user.profile_picture_url = None
            user.update_timestamp()

            success = FirestoreHelper.update_document(
                UserService.USERS_COLLECTION,
                uid,
                user.to_firestore()
            )

            if success:
                logger.info(f"Profile picture removed successfully for user: {uid}")

            return success

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error removing profile picture for user {uid}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to remove profile picture")

class ProfileService:
    """Service layer for profile management"""

    PROFILES_COLLECTION = "profiles"

    @staticmethod
    async def create_profile(profile_data: ProfileCreate) -> ProfileResponse:
        """Create a new profile"""
        try:
            # Check if profile already exists
            existing_profile = await ProfileService.get_profile_by_user_uid(profile_data.user_uid)
            if existing_profile:
                raise HTTPException(status_code=409, detail="Profile already exists for this user")

            # Create profile object
            profile = Profile(
                user_uid=profile_data.user_uid,
                bio=profile_data.bio,
                location=profile_data.location
            )

            # Calculate initial completion percentage
            profile.calculate_completion_percentage()

            # Save to Firestore
            profile_doc = profile.to_firestore()
            success = FirestoreHelper.create_document(
                ProfileService.PROFILES_COLLECTION,
                profile.user_uid,
                profile_doc
            )

            if not success:
                raise HTTPException(status_code=500, detail="Failed to create profile")

            logger.info(f"Profile created successfully for user: {profile.user_uid}")
            return ProfileResponse.from_profile(profile)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    @staticmethod
    async def get_profile_by_user_uid(user_uid: str) -> Optional[ProfileResponse]:
        """Get profile by user UID"""
        try:
            profile_doc = FirestoreHelper.get_document(ProfileService.PROFILES_COLLECTION, user_uid)
            if not profile_doc:
                return None

            profile = Profile.from_firestore(profile_doc, user_uid)
            if not profile:
                return None

            return ProfileResponse.from_profile(profile)

        except Exception as e:
            logger.error(f"Error getting profile for user {user_uid}: {str(e)}")
            return None

    @staticmethod
    async def update_profile(user_uid: str, profile_update: ProfileUpdate) -> ProfileResponse:
        """Update profile information"""
        try:
            # Get existing profile
            existing_profile_doc = FirestoreHelper.get_document(ProfileService.PROFILES_COLLECTION, user_uid)
            if not existing_profile_doc:
                raise HTTPException(status_code=404, detail="Profile not found")

            # Create profile object from existing data
            profile = Profile.from_firestore(existing_profile_doc, user_uid)
            if not profile:
                raise HTTPException(status_code=404, detail="Profile not found")

            # Update fields that are provided
            update_data = profile_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                if hasattr(profile, field) and value is not None:
                    setattr(profile, field, value)

            # Recalculate completion percentage
            profile.update_profile_completion()

            # Save to Firestore
            profile_doc = profile.to_firestore()
            success = FirestoreHelper.update_document(
                ProfileService.PROFILES_COLLECTION,
                user_uid,
                profile_doc
            )

            if not success:
                raise HTTPException(status_code=500, detail="Failed to update profile")

            logger.info(f"Profile updated successfully for user: {user_uid}")
            return ProfileResponse.from_profile(profile)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating profile for user {user_uid}: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    @staticmethod
    async def delete_profile(user_uid: str) -> bool:
        """Delete profile"""
        try:
            success = FirestoreHelper.delete_document(ProfileService.PROFILES_COLLECTION, user_uid)

            if success:
                logger.info(f"Profile deleted successfully for user: {user_uid}")

            return success

        except Exception as e:
            logger.error(f"Error deleting profile for user {user_uid}: {str(e)}")
            return False