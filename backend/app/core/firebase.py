import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from google.cloud import firestore as firestore_client
from google.cloud import storage as gcs_client
from typing import Optional, Dict, Any, List
import logging
from .config import get_settings

logger = logging.getLogger(__name__)

# Global Firebase clients
_firestore_client: Optional[firestore_client.Client] = None
_storage_client: Optional[gcs_client.Client] = None
_storage_bucket: Optional[gcs_client.Bucket] = None

def initialize_firebase() -> bool:
    """
    Initialize Firebase Admin SDK with service account credentials
    Returns True if initialization was successful, False otherwise
    """
    global _firestore_client, _storage_client, _storage_bucket

    settings = get_settings()

    if not settings.firebase_project_id:
        logger.warning("Firebase not initialized: FIREBASE_PROJECT_ID not set")
        return False

    try:
        # Check if Firebase is already initialized
        if firebase_admin._apps:
            logger.info("Firebase already initialized")
            return True

        # Initialize Firebase Admin SDK
        if settings.firebase_service_account_path:
            # Use service account file
            cred = credentials.Certificate(settings.firebase_service_account_path)
            logger.info(f"Initializing Firebase with service account: {settings.firebase_service_account_path}")
        else:
            # Use default credentials (for Cloud Run/GCP environments)
            cred = credentials.ApplicationDefault()
            logger.info("Initializing Firebase with application default credentials")

        firebase_admin.initialize_app(cred, {
            'projectId': settings.firebase_project_id,
            'storageBucket': settings.firebase_storage_bucket
        })

        # Initialize Firestore client
        _firestore_client = firestore.client()
        logger.info("Firestore client initialized")

        # Initialize Storage client
        if settings.firebase_storage_bucket:
            # Remove gs:// prefix if present
            bucket_name = settings.firebase_storage_bucket
            if bucket_name.startswith('gs://'):
                bucket_name = bucket_name[5:]  # Remove 'gs://' prefix

            _storage_client = storage.bucket(bucket_name)
            _storage_bucket = _storage_client
            logger.info(f"Storage bucket initialized: {bucket_name}")
        else:
            _storage_client = storage.bucket()
            _storage_bucket = _storage_client
            logger.info("Storage bucket initialized with default bucket")

        logger.info("Firebase Admin SDK initialized successfully")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {str(e)}")
        return False

def get_firestore_client() -> Optional[firestore_client.Client]:
    """Get Firestore client instance"""
    if _firestore_client is None:
        logger.warning("Firestore client not initialized. Call initialize_firebase() first.")
    return _firestore_client

def get_storage_bucket() -> Optional[gcs_client.Bucket]:
    """Get Firebase Storage bucket instance"""
    if _storage_bucket is None:
        logger.warning("Storage bucket not initialized. Call initialize_firebase() first.")
    return _storage_bucket

def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify Firebase ID token and return decoded claims
    Returns user claims if valid, None if invalid
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        logger.warning(f"Invalid Firebase token: {str(e)}")
        return None

def get_user_by_uid(uid: str) -> Optional[auth.UserRecord]:
    """
    Get Firebase user by UID
    Returns UserRecord if found, None if not found
    """
    try:
        user_record = auth.get_user(uid)
        return user_record
    except auth.UserNotFoundError:
        logger.warning(f"User not found: {uid}")
        return None
    except Exception as e:
        logger.error(f"Error getting user {uid}: {str(e)}")
        return None

class FirestoreHelper:
    """Helper class for common Firestore operations"""

    @staticmethod
    def create_document(collection: str, document_id: str, data: dict) -> bool:
        """Create a document in Firestore"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            db.collection(collection).document(document_id).set(data)
            logger.info(f"Document created: {collection}/{document_id}")
            return True
        except Exception as e:
            logger.error(f"Error creating document {collection}/{document_id}: {str(e)}")
            return False

    @staticmethod
    def get_document(collection: str, document_id: str) -> Optional[dict]:
        """Get a document from Firestore"""
        try:
            db = get_firestore_client()
            if not db:
                return None

            doc_ref = db.collection(collection).document(document_id)
            doc = doc_ref.get()

            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting document {collection}/{document_id}: {str(e)}")
            return None

    @staticmethod
    def update_document(collection: str, document_id: str, data: dict) -> bool:
        """Update a document in Firestore"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            db.collection(collection).document(document_id).update(data)
            logger.info(f"Document updated: {collection}/{document_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating document {collection}/{document_id}: {str(e)}")
            return False

    @staticmethod
    def delete_document(collection: str, document_id: str) -> bool:
        """Delete a document from Firestore"""
        try:
            db = get_firestore_client()
            if not db:
                return False

            db.collection(collection).document(document_id).delete()
            logger.info(f"Document deleted: {collection}/{document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {collection}/{document_id}: {str(e)}")
            return False

    @staticmethod
    def query_documents(
        collection: str,
        filters: List[tuple] = None,
        order_by: List[tuple] = None,
        limit: int = None,
        offset: int = None
    ) -> List[Dict[str, Any]]:
        """Query documents from Firestore with filters and ordering"""
        try:
            db = get_firestore_client()
            if not db:
                return []

            # Start with collection reference
            query = db.collection(collection)

            # Apply filters
            if filters:
                for field, operator, value in filters:
                    query = query.where(field, operator, value)

            # Apply ordering
            if order_by:
                for field, direction in order_by:
                    if direction.lower() == "desc":
                        query = query.order_by(field, direction=firestore_client.Query.DESCENDING)
                    else:
                        query = query.order_by(field, direction=firestore_client.Query.ASCENDING)

            # Apply offset
            if offset and offset > 0:
                query = query.offset(offset)

            # Apply limit
            if limit:
                query = query.limit(limit)

            # Execute query
            docs = query.stream()

            results = []
            for doc in docs:
                doc_data = doc.to_dict()
                doc_data['id'] = doc.id  # Include document ID
                results.append(doc_data)

            logger.info(f"Queried {len(results)} documents from {collection}")
            return results

        except Exception as e:
            logger.error(f"Error querying documents from {collection}: {str(e)}")
            return []