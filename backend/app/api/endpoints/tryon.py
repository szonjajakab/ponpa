from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status, BackgroundTasks
from pydantic import BaseModel
import logging
import asyncio
import uuid

from app.core.security import get_current_user
from app.services.ai_service import get_ai_service
from app.services.wardrobe_service import ClothingItemService
from app.models.outfit import OutfitService
from app.models.tryon_session import TryOnSessionService, TryOnSessionCreate, TryOnSessionResponse, TryOnStatus
from app.utils.image_processing import prepare_image_for_ai, ImageProcessingError
from app.core.firebase import get_firestore_client, get_storage_bucket

logger = logging.getLogger(__name__)

router = APIRouter()


class TryOnRequest(BaseModel):
    """Request model for outfit try-on"""
    outfit_id: str
    user_context: Optional[Dict[str, Any]] = None
    generate_description: bool = True
    analyze_compatibility: bool = False


class TryOnResponse(BaseModel):
    """Response model for outfit try-on"""
    outfit_id: str
    try_on_description: Optional[str] = None
    compatibility_analysis: Optional[Dict[str, Any]] = None
    clothing_items: List[Dict[str, Any]]
    success: bool
    error_message: Optional[str] = None


class TryOnWithImageRequest(BaseModel):
    """Request model for try-on with user image"""
    outfit_id: str
    user_context: Optional[Dict[str, Any]] = None


@router.post("/try-on", response_model=TryOnResponse)
async def generate_try_on_description(
    request: TryOnRequest,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Generate AI description for how an outfit would look
    """
    try:
        ai_service = get_ai_service()
        if not ai_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable"
            )

        # Get the outfit and verify ownership
        outfit = await OutfitService.get_outfit(current_user_uid, request.outfit_id)
        if not outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )

        # Get clothing items for the outfit
        clothing_items = []
        for item_id in outfit.clothing_item_ids:
            try:
                item = await ClothingItemService.get_clothing_item(current_user_uid, item_id)
                if item:
                    # Convert to dict format for AI service
                    item_dict = {
                        "id": item.id,
                        "name": item.name,
                        "category": item.category,
                        "brand": item.brand,
                        "colors": [color.name for color in item.colors] if item.colors else [],
                        "size": item.size,
                        "description": item.description,
                        "tags": item.tags or [],
                        "image_urls": item.image_urls or []
                    }
                    clothing_items.append(item_dict)
            except Exception as e:
                logger.warning(f"Failed to load clothing item {item_id}: {e}")

        if not clothing_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No clothing items found for this outfit"
            )

        try_on_description = None
        compatibility_analysis = None

        # Generate try-on description
        if request.generate_description:
            try:
                try_on_description = await ai_service.generate_try_on_description(
                    clothing_items=clothing_items,
                    user_context=request.user_context
                )
            except Exception as e:
                logger.error(f"Failed to generate try-on description: {e}")
                try_on_description = "Unable to generate description at this time."

        # Analyze compatibility if requested
        if request.analyze_compatibility:
            try:
                compatibility_analysis = await ai_service.analyze_clothing_compatibility(
                    clothing_items=clothing_items
                )
            except Exception as e:
                logger.error(f"Failed to analyze compatibility: {e}")
                compatibility_analysis = {
                    "compatibility_score": 7,
                    "overall_assessment": "Analysis unavailable at this time.",
                    "error": str(e)
                }

        return TryOnResponse(
            outfit_id=request.outfit_id,
            try_on_description=try_on_description,
            compatibility_analysis=compatibility_analysis,
            clothing_items=clothing_items,
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Try-on generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate try-on description: {str(e)}"
        )


@router.post("/try-on-with-image")
async def generate_try_on_with_image(
    outfit_id: str = Form(...),
    user_context: Optional[str] = Form(None),  # JSON string
    user_image: UploadFile = File(...),
    current_user_uid: str = Depends(get_current_user)
):
    """
    Generate AI try-on description using user's uploaded image
    """
    try:
        ai_service = get_ai_service()
        if not ai_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable"
            )

        # Validate image file
        if not user_image.content_type or not user_image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file format"
            )

        # Get the outfit and verify ownership
        outfit = await OutfitService.get_outfit(current_user_uid, outfit_id)
        if not outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )

        # Process user image
        image_data = await user_image.read()
        try:
            processed_image = prepare_image_for_ai(image_data)
        except ImageProcessingError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image processing failed: {str(e)}"
            )

        # Get clothing items for the outfit
        clothing_items = []
        for item_id in outfit.clothing_item_ids:
            try:
                item = await ClothingItemService.get_clothing_item(current_user_uid, item_id)
                if item:
                    item_dict = {
                        "id": item.id,
                        "name": item.name,
                        "category": item.category,
                        "brand": item.brand,
                        "colors": [color.name for color in item.colors] if item.colors else [],
                        "size": item.size,
                        "description": item.description,
                        "tags": item.tags or [],
                        "image_urls": item.image_urls or []
                    }
                    clothing_items.append(item_dict)
            except Exception as e:
                logger.warning(f"Failed to load clothing item {item_id}: {e}")

        if not clothing_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No clothing items found for this outfit"
            )

        # Parse user context if provided
        context_dict = None
        if user_context:
            try:
                import json
                context_dict = json.loads(user_context)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in user_context, ignoring")

        # Generate try-on description with image
        try:
            try_on_description = await ai_service.generate_outfit_with_image(
                clothing_items=clothing_items,
                user_image=processed_image
            )
        except Exception as e:
            logger.error(f"Failed to generate try-on with image: {e}")
            try_on_description = "Unable to generate visual try-on at this time."

        return {
            "outfit_id": outfit_id,
            "try_on_description": try_on_description,
            "clothing_items": clothing_items,
            "success": True,
            "image_processed": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Try-on with image failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate try-on with image: {str(e)}"
        )


@router.get("/outfit-suggestions/{outfit_id}")
async def get_outfit_suggestions(
    outfit_id: str,
    occasion: Optional[str] = None,
    weather: Optional[str] = None,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Get AI-powered suggestions for improving an outfit
    """
    try:
        ai_service = get_ai_service()
        if not ai_service.is_available():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is currently unavailable"
            )

        # Get the outfit and verify ownership
        outfit = await OutfitService.get_outfit(current_user_uid, outfit_id)
        if not outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )

        # Get clothing items for the outfit
        clothing_items = []
        for item_id in outfit.clothing_item_ids:
            try:
                item = await ClothingItemService.get_clothing_item(current_user_uid, item_id)
                if item:
                    item_dict = {
                        "id": item.id,
                        "name": item.name,
                        "category": item.category,
                        "brand": item.brand,
                        "colors": [color.name for color in item.colors] if item.colors else [],
                        "size": item.size,
                        "description": item.description,
                        "tags": item.tags or []
                    }
                    clothing_items.append(item_dict)
            except Exception as e:
                logger.warning(f"Failed to load clothing item {item_id}: {e}")

        if not clothing_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No clothing items found for this outfit"
            )

        # Generate suggestions
        try:
            suggestions = await ai_service.suggest_outfit_improvements(
                clothing_items=clothing_items,
                occasion=occasion,
                weather=weather
            )
        except Exception as e:
            logger.error(f"Failed to generate suggestions: {e}")
            suggestions = ["Unable to generate suggestions at this time."]

        return {
            "outfit_id": outfit_id,
            "suggestions": suggestions,
            "context": {
                "occasion": occasion,
                "weather": weather
            },
            "success": True
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Outfit suggestions failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate outfit suggestions: {str(e)}"
        )


@router.get("/ai-service/status")
async def get_ai_service_status(
    current_user_uid: str = Depends(get_current_user)
):
    """
    Get AI service status and usage statistics
    """
    try:
        ai_service = get_ai_service()

        return {
            "available": ai_service.is_available(),
            "model": ai_service.settings.google_ai_model if ai_service.is_available() else None,
            "usage_stats_24h": ai_service.get_usage_stats(hours=24) if ai_service.is_available() else None,
            "rate_limits": {
                "requests_per_minute": ai_service.settings.google_ai_rate_limit_requests_per_minute,
                "tokens_per_minute": ai_service.settings.google_ai_rate_limit_tokens_per_minute
            } if ai_service.is_available() else None
        }
    except Exception as e:
        logger.error(f"Failed to get AI service status: {e}")
        return {
            "available": False,
            "error": str(e)
        }


# New async image generation endpoints

async def save_generated_image_to_storage(image_data: bytes, session_id: str) -> Optional[str]:
    """Save generated image to Firebase Storage and return public URL"""
    try:
        bucket = get_storage_bucket()
        if not bucket:
            raise RuntimeError("Storage bucket not available")

        # Create unique filename
        filename = f"tryon-images/{session_id}.jpg"

        # Upload to Firebase Storage
        blob = bucket.blob(filename)
        blob.upload_from_string(image_data, content_type="image/jpeg")

        # Make the file publicly accessible
        blob.make_public()

        return blob.public_url

    except Exception as e:
        logger.error(f"Failed to save generated image: {e}")
        return None


async def generate_try_on_image_task(session_id: str, user_uid: str):
    """Background task to generate try-on image"""
    try:
        # Update status to in_progress
        await TryOnSessionService.update_session_status(
            session_id=session_id,
            status=TryOnStatus.IN_PROGRESS,
            progress=10
        )

        # Get the session
        session = await TryOnSessionService.get_session(user_uid, session_id)
        if not session:
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.FAILED,
                error_message="Session not found"
            )
            return

        # Get the outfit and clothing items
        outfit = await OutfitService.get_outfit(user_uid, session.outfit_id)
        if not outfit:
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.FAILED,
                error_message="Outfit not found"
            )
            return

        # Load clothing items
        clothing_items = []
        for item_id in outfit.clothing_item_ids:
            try:
                item = await ClothingItemService.get_clothing_item(user_uid, item_id)
                if item:
                    item_dict = {
                        "id": item.id,
                        "name": item.name,
                        "category": item.category,
                        "brand": item.brand,
                        "colors": [color.name for color in item.colors] if item.colors else [],
                        "size": item.size,
                        "description": item.description,
                        "tags": item.tags or [],
                        "image_urls": item.image_urls or []
                    }
                    clothing_items.append(item_dict)
            except Exception as e:
                logger.warning(f"Failed to load clothing item {item_id}: {e}")

        if not clothing_items:
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.FAILED,
                error_message="No clothing items found"
            )
            return

        # Update progress
        await TryOnSessionService.update_session_status(
            session_id=session_id,
            status=TryOnStatus.IN_PROGRESS,
            progress=30
        )

        # Generate the image using AI
        ai_service = get_ai_service()
        if not ai_service.is_available():
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.FAILED,
                error_message="AI service not available"
            )
            return

        # Update progress
        await TryOnSessionService.update_session_status(
            session_id=session_id,
            status=TryOnStatus.IN_PROGRESS,
            progress=50
        )

        # Generate the try-on image
        try:
            from datetime import datetime
            start_time = datetime.utcnow()

            generated_image_data = await ai_service.generate_try_on_image(
                clothing_items=clothing_items,
                user_context=session.user_context
            )

            end_time = datetime.utcnow()
            generation_time = (end_time - start_time).total_seconds()

            # Update progress
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.IN_PROGRESS,
                progress=80
            )

            # Save image to Firebase Storage
            image_url = await save_generated_image_to_storage(generated_image_data, session_id)
            if not image_url:
                await TryOnSessionService.update_session_status(
                    session_id=session_id,
                    status=TryOnStatus.FAILED,
                    error_message="Failed to save generated image"
                )
                return

            # Generate description as well
            try:
                description = await ai_service.generate_try_on_description(
                    clothing_items=clothing_items,
                    user_context=session.user_context
                )
            except Exception as e:
                logger.warning(f"Failed to generate description: {e}")
                description = "Virtual try-on image generated successfully."

            # Update session as completed
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.COMPLETED,
                progress=100,
                generated_image_url=image_url,
                ai_description=description,
                generation_metadata={
                    "ai_model_used": ai_service.settings.google_ai_model,
                    "generation_time_seconds": generation_time,
                    "completed_at": datetime.utcnow().isoformat()
                }
            )

            logger.info(f"Successfully generated try-on image for session {session_id}")

        except Exception as e:
            logger.error(f"Failed to generate try-on image for session {session_id}: {e}")
            await TryOnSessionService.update_session_status(
                session_id=session_id,
                status=TryOnStatus.FAILED,
                error_message=f"Image generation failed: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Try-on generation task failed for session {session_id}: {e}")
        await TryOnSessionService.update_session_status(
            session_id=session_id,
            status=TryOnStatus.FAILED,
            error_message=f"Task failed: {str(e)}"
        )


@router.post("/generate-try-on-image")
async def start_try_on_image_generation(
    request: TryOnRequest,
    background_tasks: BackgroundTasks,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Start async try-on image generation and return session ID for polling
    """
    try:
        # Get the outfit and verify ownership
        outfit = await OutfitService.get_outfit(current_user_uid, request.outfit_id)
        if not outfit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Outfit not found"
            )

        # Create session
        session_create = TryOnSessionCreate(
            outfit_id=request.outfit_id,
            user_context=request.user_context
        )

        session = await TryOnSessionService.create_session(
            user_uid=current_user_uid,
            session_data=session_create,
            clothing_item_ids=outfit.clothing_item_ids
        )

        # Start background generation task
        background_tasks.add_task(
            generate_try_on_image_task,
            session.session_id,
            current_user_uid
        )

        return {
            "session_id": session.session_id,
            "status": session.status,
            "message": "Try-on image generation started. Use the session ID to poll for progress.",
            "poll_url": f"/api/v1/try-on-status/{session.session_id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start try-on generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start try-on generation: {str(e)}"
        )


@router.get("/try-on-status/{session_id}", response_model=TryOnSessionResponse)
async def get_try_on_status(
    session_id: str,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Get the status of a try-on image generation session
    """
    try:
        session = await TryOnSessionService.get_session(current_user_uid, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        # Calculate estimated completion time for pending/in_progress sessions
        estimated_completion_time = None
        if session.status in [TryOnStatus.PENDING, TryOnStatus.IN_PROGRESS]:
            # Rough estimate: 30-60 seconds for image generation
            if session.status == TryOnStatus.PENDING:
                estimated_completion_time = 60
            else:
                # Estimate based on progress
                remaining_progress = 100 - session.progress_percentage
                estimated_completion_time = int(remaining_progress * 0.5)  # 0.5 seconds per percent

        return TryOnSessionResponse(
            session_id=session.session_id,
            status=session.status,
            progress_percentage=session.progress_percentage,
            generated_image_url=session.generated_image_url,
            ai_description=session.ai_description,
            error_message=session.error_message,
            created_at=session.created_at,
            completed_at=session.completed_at,
            estimated_completion_time=estimated_completion_time
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get try-on status for {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session status"
        )


@router.get("/my-try-on-sessions")
async def get_my_try_on_sessions(
    limit: int = 20,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Get all try-on sessions for the current user
    """
    try:
        sessions = await TryOnSessionService.get_user_sessions(current_user_uid, limit)

        return {
            "sessions": [
                TryOnSessionResponse(
                    session_id=session.session_id,
                    status=session.status,
                    progress_percentage=session.progress_percentage,
                    generated_image_url=session.generated_image_url,
                    ai_description=session.ai_description,
                    error_message=session.error_message,
                    created_at=session.created_at,
                    completed_at=session.completed_at
                ) for session in sessions
            ],
            "total": len(sessions)
        }

    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get sessions"
        )


@router.delete("/try-on-session/{session_id}")
async def delete_try_on_session(
    session_id: str,
    current_user_uid: str = Depends(get_current_user)
):
    """
    Delete a try-on session
    """
    try:
        success = await TryOnSessionService.delete_session(current_user_uid, session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )

        return {"message": "Session deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )