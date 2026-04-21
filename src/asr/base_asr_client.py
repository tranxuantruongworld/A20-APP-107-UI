from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import asyncio

class BaseASRClient(ABC):
    """Base class for ASR clients to ensure consistent output format"""

    @abstractmethod
    async def transcribe(self, audio_path: str, **kwargs) -> Dict[str, Any]:
        """
        Transcribe audio file to text with optional features like diarization.

        Args:
            audio_path: Path to audio file
            **kwargs: Additional parameters

        Returns:
            Dict containing:
            - transcription: Full text transcription
            - segments: List of segments with timestamps and speaker info
            - metadata: Additional info like processing time, etc.
        """
        pass

    @abstractmethod
    def get_supported_features(self) -> Dict[str, bool]:
        """
        Return supported features of this ASR client.

        Returns:
            Dict with feature flags:
            - diarization: Speaker identification
            - refinement: Text refinement/cleanup
            - async_support: Async processing
        """
        pass