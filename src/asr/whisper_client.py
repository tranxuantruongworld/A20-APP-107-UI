import os
from typing import Dict, Any, Optional
import asyncio
import logging
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .base_asr_client import BaseASRClient

logger = logging.getLogger(__name__)

class WhisperClient(BaseASRClient):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if not self.client.api_key:
            raise ValueError("Thiếu OPENAI_API_KEY trong file .env")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((APIError, RateLimitError, APIConnectionError))
    )
    async def transcribe(self, audio_path: str, **kwargs) -> Dict[str, Any]:
        """
        Async transcription using OpenAI Whisper API with retry logic.

        Note: Whisper does not support diarization, speakers will be marked as 'Unknown'
        """
        logger.info(f"Starting Whisper transcription for {audio_path}")
        try:
            with open(audio_path, 'rb') as audio_file:
                transcription = await self.client.audio.transcriptions.create(
                    file=audio_file,
                    model="whisper-1",
                    language=kwargs.get('language', 'vi'),
                    response_format="verbose_json",  # Get timestamps
                    timestamp_granularities=["segment"]
                )

            result = self._standardize_output(transcription)
            logger.info(f"Whisper transcription completed for {audio_path}")
            return result

        except Exception as e:
            logger.error(f"Whisper transcription failed for {audio_path}: {str(e)}")
            raise Exception(f"Whisper API Error: {str(e)}")

    def _standardize_output(self, whisper_result: Any) -> Dict[str, Any]:
        """Convert Whisper API response to standardized format"""
        # Whisper provides segments with timestamps but no speaker info
        segments = []
        if hasattr(whisper_result, 'segments'):
            for segment in whisper_result.segments:
                segments.append({
                    'start': segment.get('start', 0),
                    'end': segment.get('end', 0),
                    'text': segment.get('text', ''),
                    'speaker': 'Unknown'  # Whisper doesn't do diarization
                })

        return {
            'transcription': getattr(whisper_result, 'text', ''),
            'segments': segments,
            'metadata': {
                'provider': 'openai',
                'model': 'whisper-1',
                'processing_time': None,  # Whisper doesn't provide this
                'features': []  # No diarization or refinement
            }
        }

    def get_supported_features(self) -> Dict[str, bool]:
        return {
            'diarization': False,  # Whisper doesn't support speaker identification
            'refinement': False,   # Basic transcription only
            'async_support': True
        }