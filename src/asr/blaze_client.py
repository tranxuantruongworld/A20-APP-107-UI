import os
from typing import Dict, Any
import httpx
import asyncio
import logging
import sys
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .base_asr_client import BaseASRClient

# Handle imports flexibly
try:
    from ..normalizers import BlazeDataNormalizer
except (ImportError, ValueError):
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from normalizers.data_normalizer import BlazeDataNormalizer

logger = logging.getLogger(__name__)

class BlazeClient(BaseASRClient):
    def __init__(self):
        self.token = os.getenv("BLAZE_TOKEN")
        self.base_url = "https://api.blaze.vn/v1/stt/execute"
        if not self.token:
            raise ValueError("Thiếu BLAZE_TOKEN trong file .env")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError, httpx.HTTPStatusError))
    )
    async def transcribe(self, audio_path: str, **kwargs) -> Dict[str, Any]:
        """
        Async transcription using Blaze API v2.0 with full options and retry logic.
        """
        logger.info(f"Starting Blaze transcription for {audio_path}")
        headers = {'Authorization': f'Bearer {self.token}'}
        params = {
            'model': 'v2.0',
            'language': kwargs.get('language', 'vi'),
            'enable_segments': 'true',
            'enable_refinement': 'true',
            'lazy_process': 'false'
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0)) as client:
                with open(audio_path, 'rb') as audio_file:
                    files = {'audio_file': (os.path.basename(audio_path), audio_file, 'audio/wav')}
                    response = await client.post(self.base_url, params=params, headers=headers, files=files)

            if response.status_code != 200:
                logger.error(f"Blaze API error {response.status_code}: {response.text}")
                response.raise_for_status()

            # Parse response and normalize
            blaze_raw_response = response.json()
            logger.debug(f"Blaze raw response keys: {blaze_raw_response.keys()}")
            
            result = BlazeDataNormalizer.normalize_transcription_result(blaze_raw_response)
            logger.info(f"Blaze transcription completed for {audio_path}")
            return result

        except Exception as e:
            logger.error(f"Blaze transcription failed for {audio_path}: {str(e)}")
            raise

    def get_supported_features(self) -> Dict[str, bool]:
        return {
            'diarization': True,
            'refinement': True,
            'async_support': True
        }