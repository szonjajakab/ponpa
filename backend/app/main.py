from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.firebase import initialize_firebase
from .core.logging import setup_logging
from .api.endpoints import users

# Setup logging first
setup_logging()
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown"""
    # Startup
    logger.info("Starting Ponpa Backend API...")

    # Initialize Firebase
    firebase_initialized = initialize_firebase()
    if firebase_initialized:
        logger.info("Firebase initialized successfully")
    else:
        logger.warning("Firebase initialization failed - continuing without Firebase features")

    logger.info("Ponpa Backend API startup complete")

    yield

    # Shutdown
    logger.info("Shutting down Ponpa Backend API...")

# Get settings
settings = get_settings()

app = FastAPI(
    title="Ponpa Backend API",
    description="Backend API for Ponpa virtual try-on mobile application",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
cors_origins = ["*"] if settings.cors_origins == "*" else settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {"message": "Ponpa Backend API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    from .core.firebase import get_firestore_client, get_storage_bucket

    # Check Firebase connections
    firestore_status = "connected" if get_firestore_client() else "disconnected"
    storage_status = "connected" if get_storage_bucket() else "disconnected"

    return {
        "status": "healthy",
        "service": "ponpa-backend",
        "firebase": {
            "firestore": firestore_status,
            "storage": storage_status
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)