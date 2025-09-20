from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging
from .firebase import verify_firebase_token, get_user_by_uid

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

class SecurityError(Exception):
    """Custom security exception"""
    pass

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from Firebase ID token
    Raises HTTPException if token is invalid
    Returns user claims from Firebase token
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials

        # Verify Firebase ID token
        decoded_token = verify_firebase_token(token)
        if not decoded_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return decoded_token

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_uid(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Dependency to get current user's UID
    Returns Firebase UID of authenticated user
    """
    return current_user.get("uid")

async def get_current_user_email(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Dependency to get current user's email
    Returns email of authenticated user
    """
    email = current_user.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User email not available"
        )
    return email

def verify_user_access(user_uid: str, resource_owner_uid: str) -> bool:
    """
    Verify if user has access to a resource
    Returns True if user owns the resource or has admin access
    """
    return user_uid == resource_owner_uid

async def require_user_access(
    resource_owner_uid: str,
    current_user_uid: str = Depends(get_current_user_uid)
) -> bool:
    """
    Dependency to require user access to a resource
    Raises HTTPException if user doesn't have access
    """
    if not verify_user_access(current_user_uid, resource_owner_uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: insufficient permissions"
        )
    return True

class UserPermissions:
    """Helper class for user permission checks"""

    @staticmethod
    def can_modify_user_data(current_user_uid: str, target_user_uid: str) -> bool:
        """Check if user can modify another user's data"""
        return current_user_uid == target_user_uid

    @staticmethod
    def can_access_user_data(current_user_uid: str, target_user_uid: str) -> bool:
        """Check if user can access another user's data"""
        return current_user_uid == target_user_uid

def extract_token_from_header(authorization: str) -> Optional[str]:
    """
    Extract token from Authorization header
    Expected format: "Bearer <token>"
    """
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return token
    except ValueError:
        return None

async def optional_user_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency
    Returns user claims if token is valid, None if no token or invalid token
    Does not raise exceptions for missing/invalid tokens
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        decoded_token = verify_firebase_token(token)
        return decoded_token
    except Exception as e:
        logger.debug(f"Optional auth failed: {str(e)}")
        return None

def create_error_response(message: str, status_code: int = 401) -> HTTPException:
    """Create standardized error response for authentication failures"""
    return HTTPException(
        status_code=status_code,
        detail=message,
        headers={"WWW-Authenticate": "Bearer"},
    )