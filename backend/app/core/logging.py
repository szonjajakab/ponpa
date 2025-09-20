import logging
import sys
from typing import Dict, Any
from .config import get_settings

def setup_logging() -> None:
    """Configure application logging"""
    settings = get_settings()

    # Configure logging level
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Configure logging format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Set specific loggers
    loggers_config = {
        "uvicorn": log_level,
        "uvicorn.error": log_level,
        "uvicorn.access": log_level,
        "firebase_admin": logging.WARNING,  # Reduce Firebase noise
        "google.cloud": logging.WARNING,    # Reduce Google Cloud noise
        "app": log_level,  # Our application logs
    }

    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module"""
    return logging.getLogger(f"app.{name}")

class StructuredLogger:
    """Helper for structured logging with consistent format"""

    def __init__(self, name: str):
        self.logger = get_logger(name)

    def info(self, message: str, extra: Dict[str, Any] = None):
        """Log info message with optional extra context"""
        if extra:
            self.logger.info(f"{message} | {extra}")
        else:
            self.logger.info(message)

    def error(self, message: str, extra: Dict[str, Any] = None, exc_info: bool = False):
        """Log error message with optional extra context"""
        if extra:
            self.logger.error(f"{message} | {extra}", exc_info=exc_info)
        else:
            self.logger.error(message, exc_info=exc_info)

    def warning(self, message: str, extra: Dict[str, Any] = None):
        """Log warning message with optional extra context"""
        if extra:
            self.logger.warning(f"{message} | {extra}")
        else:
            self.logger.warning(message)

    def debug(self, message: str, extra: Dict[str, Any] = None):
        """Log debug message with optional extra context"""
        if extra:
            self.logger.debug(f"{message} | {extra}")
        else:
            self.logger.debug(message)