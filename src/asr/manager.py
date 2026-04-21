from typing import List, Dict, Any, Optional
import asyncio
import logging
from .base_asr_client import BaseASRClient
from .blaze_client import BlazeClient
from .whisper_client import WhisperClient
from ..utils.audio_processor import AudioProcessor

logger = logging.getLogger(__name__)

class ASRManager:
    """
    Orchestrates ASR processing for long audio files.
    Handles chunking, failover between ASR services, and result merging.
    """

    def __init__(self):
        self.blaze_client = BlazeClient()
        self.whisper_client = WhisperClient()
        self.audio_processor = AudioProcessor()

    async def process_audio_file(self, audio_path: str, output_dir: str) -> Dict[str, Any]:
        """
        Main entry point for processing an audio file.

        Args:
            audio_path: Path to the audio file
            output_dir: Directory to store temporary chunks

        Returns:
            Merged transcription result with proper timestamps
        """
        # Check if file needs splitting
        if not self.audio_processor.is_large_file(audio_path):
            # Process as single chunk
            return await self._process_single_chunk(audio_path)

        # Split into chunks
        chunks_info = self.audio_processor.split_audio_by_silence(audio_path, output_dir)

        # Process each chunk
        chunk_results = []
        for chunk_path, offset_seconds in chunks_info:
            result = await self._process_chunk_with_failover(chunk_path)
            # Adjust timestamps by adding offset
            adjusted_result = self._adjust_timestamps(result, offset_seconds)
            chunk_results.append(adjusted_result)

        # Merge all results
        merged_result = self._merge_results(chunk_results)

        return merged_result

    async def _process_single_chunk(self, audio_path: str) -> Dict[str, Any]:
        """Process a single audio chunk without splitting."""
        return await self._process_chunk_with_failover(audio_path)

    async def _process_chunk_with_failover(self, chunk_path: str) -> Dict[str, Any]:
        """
        Process a chunk with failover logic: Try Blaze first, then Whisper.

        Args:
            chunk_path: Path to audio chunk

        Returns:
            Transcription result
        """
        try:
            # Try Blaze first (preferred for diarization)
            logger.info(f"Processing chunk {chunk_path} with Blaze")
            result = await self.blaze_client.transcribe(chunk_path)
            return result
        except Exception as e:
            logger.warning(f"Blaze failed for {chunk_path}: {e}. Falling back to Whisper")
            try:
                # Fallback to Whisper
                result = await self.whisper_client.transcribe(chunk_path)
                return result
            except Exception as e2:
                logger.error(f"Both ASR services failed for {chunk_path}: {e2}")
                raise Exception(f"ASR processing failed: Blaze ({e}), Whisper ({e2})")

    def _adjust_timestamps(self, result: Dict[str, Any], offset_seconds: float) -> Dict[str, Any]:
        """
        Adjust timestamps in result by adding offset.
        Handles both snake_case (normalized) format.

        Args:
            result: ASR result dict (normalized with snake_case keys)
            offset_seconds: Time offset to add

        Returns:
            Result with adjusted timestamps
        """
        adjusted_result = result.copy()
        if 'segments' in adjusted_result:
            for segment in adjusted_result['segments']:
                # Normalized format uses 'start' and 'end' (snake_case)
                if 'start' in segment:
                    segment['start'] += offset_seconds
                if 'end' in segment:
                    segment['end'] += offset_seconds

        return adjusted_result

    def _merge_results(self, chunk_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Merge multiple chunk results into a single result.

        Args:
            chunk_results: List of results from different chunks

        Returns:
            Merged result with continuous timestamps
        """
        merged_transcription = []
        merged_segments: List[Dict[str, Any]] = []
        merged_metadata = {
            'total_chunks': len(chunk_results),
            'providers_used': set(),
            'processing_times': []
        }

        for result in chunk_results:
            transcript = result.get('transcription', '')
            if transcript:
                merged_transcription.append(transcript.strip())

            segments = result.get('segments', []) or []
            merged_segments.extend(segments)

            if 'metadata' in result:
                meta = result['metadata']
                if 'provider' in meta:
                    merged_metadata['providers_used'].add(meta['provider'])
                if 'processing_time' in meta and meta['processing_time']:
                    merged_metadata['processing_times'].append(meta['processing_time'])

        merged_segments.sort(key=lambda seg: seg.get('start', 0))
        merged_metadata['providers_used'] = list(merged_metadata['providers_used'])

        return {
            'transcription': ' '.join(merged_transcription).strip(),
            'segments': merged_segments,
            'metadata': merged_metadata
        }

    def map_speaker_text(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Map transcription text to speaker segments.
        This is a post-processing step to improve speaker identification.

        Args:
            segments: List of segments with speaker info

        Returns:
            Segments with improved speaker mapping
        """
        normalized_segments = []
        for segment in segments:
            speaker = str(segment.get('speaker', 'Unknown')).strip()
            if speaker.lower().startswith('speaker'):
                speaker = ' '.join([word.capitalize() for word in speaker.replace('_', ' ').split()])
            elif speaker.lower() in ['unknown', 'unk', 'n/a', '']:
                speaker = 'Unknown'

            normalized_segment = {**segment, 'speaker': speaker}
            normalized_segments.append(normalized_segment)

        return normalized_segments