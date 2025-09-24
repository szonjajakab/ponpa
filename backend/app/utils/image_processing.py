import base64
import io
import logging
from typing import Optional, Tuple, Union
from PIL import Image, ImageOps
import numpy as np

logger = logging.getLogger(__name__)


class ImageProcessingError(Exception):
    """Custom exception for image processing errors"""
    pass


class ImageProcessor:
    """Utility class for image processing operations"""

    # Supported image formats
    SUPPORTED_FORMATS = {'JPEG', 'JPG', 'PNG', 'WEBP', 'BMP'}

    # Default settings
    DEFAULT_MAX_SIZE = (1024, 1024)
    DEFAULT_QUALITY = 85
    DEFAULT_FORMAT = 'JPEG'

    @staticmethod
    def validate_image(image_data: bytes) -> bool:
        """Validate if the provided bytes represent a valid image"""
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                img.verify()
            return True
        except Exception as e:
            logger.warning(f"Image validation failed: {e}")
            return False

    @staticmethod
    def get_image_info(image_data: bytes) -> dict:
        """Get basic information about an image"""
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                return {
                    'format': img.format,
                    'size': img.size,
                    'mode': img.mode,
                    'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                }
        except Exception as e:
            raise ImageProcessingError(f"Failed to get image info: {e}")

    @staticmethod
    def resize_image(
        image_data: bytes,
        max_size: Tuple[int, int] = DEFAULT_MAX_SIZE,
        maintain_aspect_ratio: bool = True,
        upscale: bool = False
    ) -> bytes:
        """
        Resize an image while optionally maintaining aspect ratio

        Args:
            image_data: Raw image bytes
            max_size: Maximum dimensions (width, height)
            maintain_aspect_ratio: Whether to maintain aspect ratio
            upscale: Whether to allow upscaling smaller images

        Returns:
            Resized image bytes
        """
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                original_size = img.size

                if maintain_aspect_ratio:
                    # Calculate new size maintaining aspect ratio
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    new_size = img.size
                else:
                    # Resize to exact dimensions
                    new_size = max_size
                    img = img.resize(new_size, Image.Resampling.LANCZOS)

                # Don't upscale unless explicitly requested
                if not upscale and (new_size[0] > original_size[0] or new_size[1] > original_size[1]):
                    new_size = original_size
                    img = img.resize(new_size, Image.Resampling.LANCZOS)

                # Save to bytes
                output = io.BytesIO()
                save_format = img.format if img.format in ImageProcessor.SUPPORTED_FORMATS else ImageProcessor.DEFAULT_FORMAT

                # Convert RGBA to RGB for JPEG
                if save_format == 'JPEG' and img.mode in ('RGBA', 'LA'):
                    # Create white background for transparency
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                    else:
                        background.paste(img)
                    img = background

                img.save(output, format=save_format, quality=ImageProcessor.DEFAULT_QUALITY, optimize=True)
                return output.getvalue()

        except Exception as e:
            raise ImageProcessingError(f"Failed to resize image: {e}")

    @staticmethod
    def crop_image(
        image_data: bytes,
        crop_box: Tuple[int, int, int, int]
    ) -> bytes:
        """
        Crop an image to specified dimensions

        Args:
            image_data: Raw image bytes
            crop_box: (left, top, right, bottom) coordinates

        Returns:
            Cropped image bytes
        """
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                cropped = img.crop(crop_box)

                output = io.BytesIO()
                save_format = img.format if img.format in ImageProcessor.SUPPORTED_FORMATS else ImageProcessor.DEFAULT_FORMAT

                # Handle transparency for JPEG
                if save_format == 'JPEG' and cropped.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', cropped.size, (255, 255, 255))
                    if cropped.mode == 'RGBA':
                        background.paste(cropped, mask=cropped.split()[-1])
                    else:
                        background.paste(cropped)
                    cropped = background

                cropped.save(output, format=save_format, quality=ImageProcessor.DEFAULT_QUALITY)
                return output.getvalue()

        except Exception as e:
            raise ImageProcessingError(f"Failed to crop image: {e}")

    @staticmethod
    def convert_format(
        image_data: bytes,
        target_format: str = DEFAULT_FORMAT,
        quality: int = DEFAULT_QUALITY
    ) -> bytes:
        """
        Convert image to specified format

        Args:
            image_data: Raw image bytes
            target_format: Target format (JPEG, PNG, WEBP, etc.)
            quality: Quality for lossy formats (1-100)

        Returns:
            Converted image bytes
        """
        target_format = target_format.upper()
        if target_format not in ImageProcessor.SUPPORTED_FORMATS:
            raise ImageProcessingError(f"Unsupported format: {target_format}")

        try:
            with Image.open(io.BytesIO(image_data)) as img:
                output = io.BytesIO()

                # Handle transparency for JPEG
                if target_format == 'JPEG' and img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background

                # Save with appropriate parameters
                save_kwargs = {'format': target_format}
                if target_format in ('JPEG', 'WEBP'):
                    save_kwargs['quality'] = quality
                    save_kwargs['optimize'] = True
                elif target_format == 'PNG':
                    save_kwargs['optimize'] = True

                img.save(output, **save_kwargs)
                return output.getvalue()

        except Exception as e:
            raise ImageProcessingError(f"Failed to convert image format: {e}")

    @staticmethod
    def normalize_image(image_data: bytes) -> bytes:
        """
        Normalize an image for AI processing (standard size, format, etc.)

        Args:
            image_data: Raw image bytes

        Returns:
            Normalized image bytes
        """
        try:
            # First validate the image
            if not ImageProcessor.validate_image(image_data):
                raise ImageProcessingError("Invalid image data")

            # Get image info
            info = ImageProcessor.get_image_info(image_data)

            # Resize to a standard size suitable for AI processing
            resized_data = ImageProcessor.resize_image(
                image_data,
                max_size=(1024, 1024),
                maintain_aspect_ratio=True,
                upscale=False
            )

            # Convert to JPEG for consistency
            normalized_data = ImageProcessor.convert_format(
                resized_data,
                target_format='JPEG',
                quality=90
            )

            return normalized_data

        except Exception as e:
            raise ImageProcessingError(f"Failed to normalize image: {e}")

    @staticmethod
    def auto_orient(image_data: bytes) -> bytes:
        """
        Auto-orient image based on EXIF data

        Args:
            image_data: Raw image bytes

        Returns:
            Correctly oriented image bytes
        """
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                # Apply EXIF orientation
                oriented = ImageOps.exif_transpose(img)

                output = io.BytesIO()
                save_format = img.format if img.format in ImageProcessor.SUPPORTED_FORMATS else ImageProcessor.DEFAULT_FORMAT

                # Handle transparency for JPEG
                if save_format == 'JPEG' and oriented.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', oriented.size, (255, 255, 255))
                    if oriented.mode == 'RGBA':
                        background.paste(oriented, mask=oriented.split()[-1])
                    else:
                        background.paste(oriented)
                    oriented = background

                oriented.save(output, format=save_format, quality=ImageProcessor.DEFAULT_QUALITY)
                return output.getvalue()

        except Exception as e:
            raise ImageProcessingError(f"Failed to auto-orient image: {e}")

    @staticmethod
    def create_thumbnail(
        image_data: bytes,
        size: Tuple[int, int] = (150, 150),
        crop_to_square: bool = True
    ) -> bytes:
        """
        Create a thumbnail of the image

        Args:
            image_data: Raw image bytes
            size: Thumbnail size (width, height)
            crop_to_square: Whether to crop to square aspect ratio

        Returns:
            Thumbnail image bytes
        """
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                if crop_to_square:
                    # Crop to square from center
                    width, height = img.size
                    size_min = min(width, height)
                    left = (width - size_min) // 2
                    top = (height - size_min) // 2
                    right = left + size_min
                    bottom = top + size_min
                    img = img.crop((left, top, right, bottom))

                # Resize to thumbnail size
                img.thumbnail(size, Image.Resampling.LANCZOS)

                output = io.BytesIO()
                save_format = 'JPEG'  # Always use JPEG for thumbnails

                # Handle transparency
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background

                img.save(output, format=save_format, quality=ImageProcessor.DEFAULT_QUALITY)
                return output.getvalue()

        except Exception as e:
            raise ImageProcessingError(f"Failed to create thumbnail: {e}")


class Base64ImageUtils:
    """Utilities for handling base64 encoded images"""

    @staticmethod
    def encode_image(image_data: bytes) -> str:
        """
        Encode image bytes to base64 string

        Args:
            image_data: Raw image bytes

        Returns:
            Base64 encoded string
        """
        return base64.b64encode(image_data).decode('utf-8')

    @staticmethod
    def decode_image(base64_string: str) -> bytes:
        """
        Decode base64 string to image bytes

        Args:
            base64_string: Base64 encoded image string

        Returns:
            Raw image bytes
        """
        try:
            # Remove data URL prefix if present
            if base64_string.startswith('data:image/'):
                base64_string = base64_string.split(',', 1)[1]

            return base64.b64decode(base64_string)
        except Exception as e:
            raise ImageProcessingError(f"Failed to decode base64 image: {e}")

    @staticmethod
    def create_data_url(image_data: bytes, mime_type: str = 'image/jpeg') -> str:
        """
        Create a data URL from image bytes

        Args:
            image_data: Raw image bytes
            mime_type: MIME type of the image

        Returns:
            Data URL string
        """
        base64_string = Base64ImageUtils.encode_image(image_data)
        return f"data:{mime_type};base64,{base64_string}"

    @staticmethod
    def extract_from_data_url(data_url: str) -> Tuple[bytes, str]:
        """
        Extract image data and MIME type from data URL

        Args:
            data_url: Data URL string

        Returns:
            Tuple of (image_bytes, mime_type)
        """
        try:
            if not data_url.startswith('data:'):
                raise ValueError("Invalid data URL format")

            header, data = data_url.split(',', 1)
            mime_type = header.split(';')[0].split(':')[1]
            image_data = base64.b64decode(data)

            return image_data, mime_type
        except Exception as e:
            raise ImageProcessingError(f"Failed to extract from data URL: {e}")


def prepare_image_for_ai(image_data: bytes) -> bytes:
    """
    Prepare an image for AI processing by normalizing format, size, and orientation

    Args:
        image_data: Raw image bytes

    Returns:
        Processed image bytes ready for AI
    """
    processor = ImageProcessor()

    # Auto-orient the image
    oriented_data = processor.auto_orient(image_data)

    # Normalize the image
    normalized_data = processor.normalize_image(oriented_data)

    return normalized_data


def create_image_variants(image_data: bytes) -> dict:
    """
    Create multiple variants of an image (thumbnail, medium, large)

    Args:
        image_data: Raw image bytes

    Returns:
        Dictionary with different sized variants
    """
    processor = ImageProcessor()

    try:
        # Create variants
        thumbnail = processor.create_thumbnail(image_data, size=(150, 150))
        medium = processor.resize_image(image_data, max_size=(512, 512))
        large = processor.resize_image(image_data, max_size=(1024, 1024))

        return {
            'thumbnail': thumbnail,
            'medium': medium,
            'large': large,
            'original': image_data
        }
    except Exception as e:
        raise ImageProcessingError(f"Failed to create image variants: {e}")