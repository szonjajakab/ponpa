from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
import time

class BaseFirestoreModel(BaseModel):
    """Base model for Firestore documents with common fields"""

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    def to_firestore(self) -> Dict[str, Any]:
        """Convert model to Firestore document format"""
        data = self.model_dump()

        # Convert datetime objects to Unix timestamps for Firestore
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = int(value.timestamp())

        return data

    @classmethod
    def from_firestore(cls, doc_data: Dict[str, Any], doc_id: str = None):
        """Create model instance from Firestore document data"""
        if not doc_data:
            return None

        # Convert Unix timestamps back to datetime objects
        for key, value in doc_data.items():
            if key in ['created_at', 'updated_at'] and isinstance(value, (int, float)):
                doc_data[key] = datetime.fromtimestamp(value)

        # Add document ID if provided
        if doc_id and hasattr(cls, 'id'):
            doc_data['id'] = doc_id

        return cls(**doc_data)

    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.now()

    model_config = {
        # Allow extra fields to be ignored during validation
        "extra": "ignore",
        # Use enum values instead of enum objects
        "use_enum_values": True
    }