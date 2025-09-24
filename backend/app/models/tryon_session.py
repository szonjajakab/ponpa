from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum
import uuid

class TryOnStatus(str, Enum):
    """Status of try-on image generation"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TryOnSession(BaseModel):
    """Model for tracking try-on image generation sessions"""

    # Core identifiers
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_uid: str
    outfit_id: str

    # Request data
    clothing_item_ids: List[str]
    user_context: Optional[Dict[str, Any]] = None
    user_image_url: Optional[str] = None  # If user uploaded photo

    # Generation status
    status: TryOnStatus = TryOnStatus.PENDING
    progress_percentage: int = 0

    # Results
    generated_image_url: Optional[str] = None
    generated_image_path: Optional[str] = None  # Firebase Storage path
    ai_description: Optional[str] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Error handling
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

    # AI usage tracking
    ai_model_used: Optional[str] = None
    generation_time_seconds: Optional[float] = None
    tokens_used: Optional[int] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
        use_enum_values = True


class TryOnSessionCreate(BaseModel):
    """Model for creating a new try-on session"""
    outfit_id: str
    user_context: Optional[Dict[str, Any]] = None
    user_image_data: Optional[bytes] = None


class TryOnSessionResponse(BaseModel):
    """Response model for try-on session status"""
    session_id: str
    status: TryOnStatus
    progress_percentage: int
    generated_image_url: Optional[str] = None
    ai_description: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    estimated_completion_time: Optional[int] = None  # seconds remaining


# Firebase/Firestore service for TryOnSession
import logging
from app.core.firebase import get_firestore_client

logger = logging.getLogger(__name__)

class TryOnSessionService:
    """Service for managing try-on sessions in Firestore"""

    COLLECTION_NAME = "tryon_sessions"

    @staticmethod
    async def create_session(user_uid: str, session_data: TryOnSessionCreate, clothing_item_ids: List[str]) -> TryOnSession:
        """Create a new try-on session"""
        try:
            db = get_firestore_client()
            if not db:
                raise RuntimeError("Firestore client not available")

            session = TryOnSession(
                user_uid=user_uid,
                outfit_id=session_data.outfit_id,
                clothing_item_ids=clothing_item_ids,
                user_context=session_data.user_context,
                status=TryOnStatus.PENDING
            )

            # Save to Firestore
            doc_ref = db.collection(TryOnSessionService.COLLECTION_NAME).document(session.session_id)
            await doc_ref.set(session.dict())

            logger.info(f"Created try-on session {session.session_id} for user {user_uid}")
            return session

        except Exception as e:
            logger.error(f"Failed to create try-on session: {e}")
            raise

    @staticmethod
    async def get_session(user_uid: str, session_id: str) -> Optional[TryOnSession]:
        """Get a try-on session by ID"""
        try:
            db = get_firestore_client()
            if not db:
                return None

            doc_ref = db.collection(TryOnSessionService.COLLECTION_NAME).document(session_id)
            doc = await doc_ref.get()

            if not doc.exists:
                return None

            data = doc.to_dict()

            # Verify user owns this session
            if data.get('user_uid') != user_uid:
                return None

            return TryOnSession(**data)

        except Exception as e:
            logger.error(f"Failed to get try-on session {session_id}: {e}")
            return None

    @staticmethod
    async def update_session_status(
        session_id: str,
        status: TryOnStatus,
        progress: Optional[int] = None,
        error_message: Optional[str] = None,
        generated_image_url: Optional[str] = None,
        ai_description: Optional[str] = None,
        generation_metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update session status and progress"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            doc_ref = db.collection(TryOnSessionService.COLLECTION_NAME).document(session_id)

            update_data = {
                'status': status.value,
                'updated_at': datetime.utcnow().isoformat()
            }

            if progress is not None:
                update_data['progress_percentage'] = progress

            if error_message:
                update_data['error_message'] = error_message

            if generated_image_url:
                update_data['generated_image_url'] = generated_image_url
                update_data['completed_at'] = datetime.utcnow().isoformat()

            if ai_description:
                update_data['ai_description'] = ai_description

            if generation_metadata:
                update_data.update(generation_metadata)

            # Set started_at when moving to in_progress
            if status == TryOnStatus.IN_PROGRESS and 'started_at' not in update_data:
                update_data['started_at'] = datetime.utcnow().isoformat()

            await doc_ref.update(update_data)
            logger.info(f"Updated session {session_id} to status {status}")
            return True

        except Exception as e:
            logger.error(f"Failed to update session {session_id}: {e}")
            return False

    @staticmethod
    async def get_user_sessions(user_uid: str, limit: int = 50) -> List[TryOnSession]:
        """Get all try-on sessions for a user"""
        try:
            db = get_firestore_client()
            if not db:
                return []

            query = (db.collection(TryOnSessionService.COLLECTION_NAME)
                    .where('user_uid', '==', user_uid)
                    .order_by('created_at', direction=db.DESCENDING)
                    .limit(limit))

            docs = await query.get()

            sessions = []
            for doc in docs:
                try:
                    session_data = doc.to_dict()
                    sessions.append(TryOnSession(**session_data))
                except Exception as e:
                    logger.warning(f"Failed to parse session {doc.id}: {e}")

            return sessions

        except Exception as e:
            logger.error(f"Failed to get sessions for user {user_uid}: {e}")
            return []

    @staticmethod
    async def delete_session(user_uid: str, session_id: str) -> bool:
        """Delete a try-on session"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            # First verify ownership
            session = await TryOnSessionService.get_session(user_uid, session_id)
            if not session:
                return False

            doc_ref = db.collection(TryOnSessionService.COLLECTION_NAME).document(session_id)
            await doc_ref.delete()

            logger.info(f"Deleted try-on session {session_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            return False

    @staticmethod
    async def cleanup_old_sessions(days_old: int = 30) -> int:
        """Clean up old completed/failed sessions"""
        try:
            db = get_firestore_client()
            if not db:
                return 0

            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            query = (db.collection(TryOnSessionService.COLLECTION_NAME)
                    .where('created_at', '<', cutoff_date.isoformat())
                    .where('status', 'in', ['completed', 'failed', 'cancelled']))

            docs = await query.get()
            deleted_count = 0

            for doc in docs:
                try:
                    await doc.reference.delete()
                    deleted_count += 1
                except Exception as e:
                    logger.warning(f"Failed to delete old session {doc.id}: {e}")

            logger.info(f"Cleaned up {deleted_count} old try-on sessions")
            return deleted_count

        except Exception as e:
            logger.error(f"Failed to cleanup old sessions: {e}")
            return 0