import asyncio
import logging
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class AIUsage:
    """Track AI service usage for monitoring"""
    timestamp: datetime
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    request_duration: float
    success: bool
    error_message: Optional[str] = None


class RateLimiter:
    """Simple rate limiter for AI API calls"""

    def __init__(self, requests_per_minute: int, tokens_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.tokens_per_minute = tokens_per_minute
        self.request_timestamps: List[datetime] = []
        self.token_usage: List[tuple[datetime, int]] = []

    def can_make_request(self, estimated_tokens: int = 100) -> bool:
        """Check if we can make a request within rate limits"""
        now = datetime.now()
        one_minute_ago = now - timedelta(minutes=1)

        # Clean old timestamps
        self.request_timestamps = [ts for ts in self.request_timestamps if ts > one_minute_ago]
        self.token_usage = [(ts, tokens) for ts, tokens in self.token_usage if ts > one_minute_ago]

        # Check request rate limit
        if len(self.request_timestamps) >= self.requests_per_minute:
            return False

        # Check token rate limit
        current_tokens = sum(tokens for _, tokens in self.token_usage)
        if current_tokens + estimated_tokens > self.tokens_per_minute:
            return False

        return True

    def record_request(self, tokens_used: int):
        """Record a successful request"""
        now = datetime.now()
        self.request_timestamps.append(now)
        self.token_usage.append((now, tokens_used))


class AIService:
    """Google Generative AI service for virtual try-on functionality"""

    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[genai.GenerativeModel] = None
        self.rate_limiter: Optional[RateLimiter] = None
        self.usage_history: List[AIUsage] = []
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Google Generative AI client"""
        if not self.settings.google_ai_api_key:
            logger.warning("Google AI API key not configured - AI features will be disabled")
            return

        try:
            # Configure the API
            genai.configure(api_key=self.settings.google_ai_api_key)

            # Initialize the model
            self.client = genai.GenerativeModel(
                model_name=self.settings.google_ai_model,
                generation_config={
                    "temperature": self.settings.google_ai_temperature,
                    "max_output_tokens": self.settings.google_ai_max_tokens,
                },
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                }
            )

            # Initialize rate limiter
            self.rate_limiter = RateLimiter(
                requests_per_minute=self.settings.google_ai_rate_limit_requests_per_minute,
                tokens_per_minute=self.settings.google_ai_rate_limit_tokens_per_minute
            )

            logger.info(f"Initialized Google Generative AI with model: {self.settings.google_ai_model}")

        except Exception as e:
            logger.error(f"Failed to initialize Google Generative AI: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.client is not None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def _make_ai_request(self, prompt: str, image_data: Optional[bytes] = None) -> str:
        """Make a request to the AI service with retry logic"""
        if not self.is_available():
            raise RuntimeError("AI service is not available")

        # Check rate limits
        if not self.rate_limiter.can_make_request():
            raise RuntimeError("Rate limit exceeded, please try again later")

        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0

        try:
            # Prepare content
            if image_data:
                # For image + text prompts
                import PIL.Image
                import io
                image = PIL.Image.open(io.BytesIO(image_data))
                content = [prompt, image]
            else:
                # Text only
                content = prompt

            # Make the request
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.generate_content(content)
            )

            # Extract response text
            if response.text:
                result = response.text
                success = True
                # Estimate tokens (rough approximation)
                tokens_used = len(prompt.split()) + len(result.split())
                self.rate_limiter.record_request(tokens_used)
                return result
            else:
                raise RuntimeError("Empty response from AI service")

        except Exception as e:
            error_message = str(e)
            logger.error(f"AI request failed: {e}")
            raise
        finally:
            # Record usage
            duration = time.time() - start_time
            usage = AIUsage(
                timestamp=datetime.now(),
                model=self.settings.google_ai_model,
                prompt_tokens=len(prompt.split()) if prompt else 0,
                completion_tokens=tokens_used,
                total_tokens=tokens_used,
                request_duration=duration,
                success=success,
                error_message=error_message
            )
            self.usage_history.append(usage)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def _make_ai_image_request(self, prompt: str, user_image: Optional[bytes] = None) -> bytes:
        """Make a request to the AI service expecting an image response"""
        if not self.is_available():
            raise RuntimeError("AI service is not available")

        # Check rate limits
        if not self.rate_limiter.can_make_request():
            raise RuntimeError("Rate limit exceeded, please try again later")

        start_time = time.time()
        success = False
        error_message = None
        tokens_used = 0

        try:
            # Prepare content for image generation
            if user_image:
                import PIL.Image
                import io
                image = PIL.Image.open(io.BytesIO(user_image))
                content = [prompt, image]
            else:
                content = prompt

            # Make the request for image generation
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.generate_content(content)
            )

            # Handle image response from nanobanana
            if hasattr(response, 'parts') and response.parts:
                for part in response.parts:
                    # Check if this part contains image data
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Extract image bytes
                        image_data = part.inline_data.data
                        success = True
                        tokens_used = len(prompt.split())
                        self.rate_limiter.record_request(tokens_used)
                        return image_data
                    elif hasattr(part, 'function_call'):
                        # Handle function call responses if needed
                        continue
                    elif hasattr(part, 'text') and part.text:
                        # Sometimes image data might be in text as base64
                        import base64
                        try:
                            # Try to decode as base64
                            image_data = base64.b64decode(part.text)
                            success = True
                            tokens_used = len(prompt.split())
                            self.rate_limiter.record_request(tokens_used)
                            return image_data
                        except:
                            continue

            # If we reach here, no image was found in response
            raise RuntimeError("No image data found in AI response")

        except Exception as e:
            error_message = str(e)
            logger.error(f"AI image request failed: {e}")
            raise
        finally:
            # Record usage
            duration = time.time() - start_time
            usage = AIUsage(
                timestamp=datetime.now(),
                model=self.settings.google_ai_model,
                prompt_tokens=len(prompt.split()) if prompt else 0,
                completion_tokens=0,  # Image generation doesn't have completion tokens
                total_tokens=tokens_used,
                request_duration=duration,
                success=success,
                error_message=error_message
            )
            self.usage_history.append(usage)

    async def generate_try_on_description(
        self,
        clothing_items: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a description for a virtual try-on scenario"""
        prompt = self._build_try_on_prompt(clothing_items, user_context)
        return await self._make_ai_request(prompt)

    async def analyze_clothing_compatibility(
        self,
        clothing_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze how well clothing items work together"""
        prompt = self._build_compatibility_prompt(clothing_items)
        response = await self._make_ai_request(prompt)
        return self._parse_compatibility_response(response)

    async def suggest_outfit_improvements(
        self,
        clothing_items: List[Dict[str, Any]],
        occasion: Optional[str] = None,
        weather: Optional[str] = None
    ) -> List[str]:
        """Suggest improvements for an outfit"""
        prompt = self._build_improvement_prompt(clothing_items, occasion, weather)
        response = await self._make_ai_request(prompt)
        return self._parse_suggestions_response(response)

    async def generate_outfit_with_image(
        self,
        clothing_items: List[Dict[str, Any]],
        user_image: bytes
    ) -> str:
        """Generate try-on description with user image context"""
        prompt = self._build_image_try_on_prompt(clothing_items)
        return await self._make_ai_request(prompt, user_image)

    async def generate_try_on_image(
        self,
        clothing_items: List[Dict[str, Any]],
        user_image: Optional[bytes] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Generate actual try-on image using nanobanana model"""
        prompt = self._build_image_generation_prompt(clothing_items, user_context)

        # Make AI request and expect image response
        response = await self._make_ai_image_request(prompt, user_image)
        return response

    def _build_try_on_prompt(
        self,
        clothing_items: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build prompt for try-on description"""
        items_description = "\n".join([
            f"- {item.get('name', 'Unknown item')}: {item.get('category', 'unknown category')}, "
            f"{item.get('brand', 'no brand')}, {', '.join(item.get('colors', []))}, "
            f"size {item.get('size', 'unknown')}"
            for item in clothing_items
        ])

        context_info = ""
        if user_context:
            occasion = user_context.get('occasion', '')
            weather = user_context.get('weather', '')
            if occasion:
                context_info += f"\nOccasion: {occasion}"
            if weather:
                context_info += f"\nWeather: {weather}"

        return f"""You are a fashion stylist AI. Describe how the following clothing items would look together as an outfit, focusing on style, color coordination, and overall aesthetic.

Clothing items:
{items_description}
{context_info}

Provide a concise but detailed description of:
1. How the colors and patterns work together
2. The overall style and vibe of the outfit
3. What occasions this outfit would be suitable for
4. Any styling tips or considerations

Keep the response engaging and helpful, around 100-150 words."""

    def _build_compatibility_prompt(self, clothing_items: List[Dict[str, Any]]) -> str:
        """Build prompt for compatibility analysis"""
        items_description = "\n".join([
            f"- {item.get('name', 'Unknown item')}: {item.get('category', 'unknown category')}, "
            f"{', '.join(item.get('colors', []))}, {item.get('description', '')}"
            for item in clothing_items
        ])

        return f"""Analyze the compatibility of these clothing items as an outfit. Rate the compatibility on a scale of 1-10 and explain why.

Clothing items:
{items_description}

Please respond in the following JSON format:
{{
    "compatibility_score": <1-10>,
    "color_harmony": <1-10>,
    "style_coherence": <1-10>,
    "occasion_appropriateness": <1-10>,
    "overall_assessment": "<brief explanation>",
    "strengths": ["<strength1>", "<strength2>"],
    "areas_for_improvement": ["<improvement1>", "<improvement2>"]
}}"""

    def _build_improvement_prompt(
        self,
        clothing_items: List[Dict[str, Any]],
        occasion: Optional[str] = None,
        weather: Optional[str] = None
    ) -> str:
        """Build prompt for outfit improvement suggestions"""
        items_description = "\n".join([
            f"- {item.get('name', 'Unknown item')}: {item.get('category', 'unknown category')}"
            for item in clothing_items
        ])

        context = ""
        if occasion:
            context += f"\nOccasion: {occasion}"
        if weather:
            context += f"\nWeather: {weather}"

        return f"""Suggest 3-5 specific improvements for this outfit:

Current outfit:
{items_description}
{context}

Provide practical suggestions such as:
- Adding accessories
- Changing colors or patterns
- Adjusting fit or proportions
- Substituting items for better coordination

Format as a numbered list of specific, actionable suggestions."""

    def _build_image_try_on_prompt(self, clothing_items: List[Dict[str, Any]]) -> str:
        """Build prompt for image-based try-on"""
        items_description = ", ".join([item.get('name', 'item') for item in clothing_items])

        return f"""Looking at this person, describe how they would look wearing: {items_description}.

Consider:
- How the colors complement their appearance
- The fit and proportions on their body type
- The overall style and how it suits them
- Any styling suggestions specific to them

Provide an encouraging and detailed description of how great they would look in this outfit."""

    def _build_image_generation_prompt(
        self,
        clothing_items: List[Dict[str, Any]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build prompt for generating try-on image with nanobanana"""
        items_description = []
        for item in clothing_items:
            desc = f"{item.get('name', 'clothing item')}"
            if item.get('colors'):
                desc += f" in {', '.join(item.get('colors', []))}"
            if item.get('category'):
                desc += f" ({item.get('category')})"
            items_description.append(desc)

        outfit_desc = ", ".join(items_description)

        context_info = ""
        if user_context:
            occasion = user_context.get('occasion', '')
            weather = user_context.get('weather', '')
            style = user_context.get('style', '')
            if occasion:
                context_info += f" for {occasion}"
            if weather:
                context_info += f" in {weather} weather"
            if style:
                context_info += f" with {style} styling"

        return f"""Generate a realistic photograph showing a person wearing this complete outfit: {outfit_desc}{context_info}.

Requirements:
- Show the person wearing ALL the specified clothing items together
- Use realistic lighting and photography style
- Display the outfit clearly and accurately
- Show how the colors and pieces work together
- Create a natural, appealing composition
- Focus on how the complete outfit looks when worn

Style: Professional fashion photography, natural lighting, clear details of the clothing items."""

    def _parse_compatibility_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from compatibility analysis"""
        try:
            import json
            # Try to extract JSON from the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)
        except Exception as e:
            logger.warning(f"Failed to parse compatibility response as JSON: {e}")

        # Fallback to structured text response
        return {
            "compatibility_score": 7,
            "color_harmony": 7,
            "style_coherence": 7,
            "occasion_appropriateness": 7,
            "overall_assessment": response[:200] + "..." if len(response) > 200 else response,
            "strengths": ["AI analysis available"],
            "areas_for_improvement": ["See full response for details"]
        }

    def _parse_suggestions_response(self, response: str) -> List[str]:
        """Parse suggestions from AI response"""
        lines = response.strip().split('\n')
        suggestions = []

        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets
                suggestion = line.lstrip('0123456789.-• ')
                if suggestion:
                    suggestions.append(suggestion)

        return suggestions if suggestions else [response]

    def get_usage_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get usage statistics for the specified time period"""
        cutoff = datetime.now() - timedelta(hours=hours)
        recent_usage = [usage for usage in self.usage_history if usage.timestamp > cutoff]

        if not recent_usage:
            return {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "total_tokens": 0,
                "average_duration": 0,
                "error_rate": 0
            }

        total_requests = len(recent_usage)
        successful_requests = sum(1 for usage in recent_usage if usage.success)
        failed_requests = total_requests - successful_requests
        total_tokens = sum(usage.total_tokens for usage in recent_usage)
        average_duration = sum(usage.request_duration for usage in recent_usage) / total_requests
        error_rate = failed_requests / total_requests if total_requests > 0 else 0

        return {
            "total_requests": total_requests,
            "successful_requests": successful_requests,
            "failed_requests": failed_requests,
            "total_tokens": total_tokens,
            "average_duration": round(average_duration, 2),
            "error_rate": round(error_rate * 100, 1)
        }


# Global AI service instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """Get the global AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service