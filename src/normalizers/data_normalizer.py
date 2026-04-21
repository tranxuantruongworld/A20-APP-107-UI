"""
Normalizer layer for converting API response data structures.
Handles CamelCase → snake_case conversion and data standardization.
"""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class BlazeDataNormalizer:
    """Normalize Blaze API response structure to standard format."""

    @staticmethod
    def normalize_segments(raw_segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert Blaze segments from CamelCase to snake_case.

        Input structure (from Blaze API):
        {
            "id": "...",
            "startTime": 0.5,
            "endTime": 2.3,
            "text": "...",
            "speaker": 1
        }

        Output structure (standardized for internal use):
        {
            "id": "...",
            "start": 0.5,
            "end": 2.3,
            "text": "...",
            "speaker": "Speaker 1"  # Normalized to string
        }

        Args:
            raw_segments: List of segments from Blaze API

        Returns:
            Normalized segments list
        """
        normalized = []

        for segment in raw_segments:
            try:
                # Extract fields with fallback to None if missing
                segment_id = segment.get("id")
                start_time = segment.get("startTime", 0)
                end_time = segment.get("endTime", 0)
                text = segment.get("text", "")
                speaker_id = segment.get("speaker")

                # Normalize speaker ID to string format
                if speaker_id is not None:
                    speaker = f"Speaker {speaker_id}" if isinstance(speaker_id, int) else str(speaker_id)
                else:
                    speaker = "Unknown"

                normalized_segment = {
                    "id": segment_id,
                    "start": float(start_time),
                    "end": float(end_time),
                    "text": str(text).strip(),
                    "speaker": speaker,
                    # Keep original for reference
                    "_raw_speaker_id": speaker_id
                }

                normalized.append(normalized_segment)

                logger.debug(f"Normalized segment: {speaker} [{start_time:.2f}s-{end_time:.2f}s]")

            except Exception as e:
                logger.warning(f"Error normalizing segment {segment}: {e}")
                # Skip malformed segments
                continue

        logger.info(f"Normalized {len(normalized)} segments from Blaze API")
        return normalized

    @staticmethod
    def normalize_transcription_result(blaze_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize complete Blaze transcription result.

        Args:
            blaze_result: Raw result from Blaze API

        Returns:
            Standardized result structure
        """
        # Navigate through potential nested structure
        # Blaze response might be: result -> data -> segments
        # or directly: data -> segments
        # or just: segments

        # Try to extract data from nested structure
        if "result" in blaze_result and "data" in blaze_result["result"]:
            data = blaze_result["result"]["data"]
        elif "data" in blaze_result:
            data = blaze_result["data"]
        else:
            data = blaze_result

        # Extract transcription text
        transcription = data.get("transcription", "")

        # Extract and normalize segments
        raw_segments = data.get("segments", [])
        segments = BlazeDataNormalizer.normalize_segments(raw_segments)

        # Compile metadata
        metadata = {
            "provider": "blaze",
            "model": "v2.0",
            "language": data.get("language", "vi"),
            "features": ["diarization", "refinement"],
            "raw_response_keys": list(blaze_result.keys())
        }

        normalized_result = {
            "transcription": transcription,
            "segments": segments,
            "metadata": metadata
        }

        logger.info(f"Normalized Blaze result: {len(segments)} segments, {len(transcription)} chars")
        return normalized_result


class SegmentContextAnalyzer:
    """Analyze segments to provide context for LLM."""

    @staticmethod
    def extract_speaker_context(segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze segment distribution to provide context for speaker identification.

        Args:
            segments: Normalized segments list

        Returns:
            Context dict with speaker statistics
        """
        speaker_stats = {}
        total_duration = 0
        speaker_sample_texts = {}

        for segment in segments:
            speaker = segment.get("speaker", "Unknown")
            duration = segment.get("end", 0) - segment.get("start", 0)

            # Track speaker statistics
            if speaker not in speaker_stats:
                speaker_stats[speaker] = {
                    "count": 0,
                    "total_duration": 0,
                    "avg_length": 0
                }
                speaker_sample_texts[speaker] = []

            speaker_stats[speaker]["count"] += 1
            speaker_stats[speaker]["total_duration"] += duration

            # Collect sample texts for pattern analysis
            text = segment.get("text", "")
            if text and len(speaker_sample_texts[speaker]) < 3:
                speaker_sample_texts[speaker].append(text)

            total_duration += duration

        # Calculate averages
        for speaker in speaker_stats:
            count = speaker_stats[speaker]["count"]
            if count > 0:
                speaker_stats[speaker]["avg_length"] = speaker_stats[speaker]["total_duration"] / count

        context = {
            "total_speakers": len(speaker_stats),
            "total_duration": total_duration,
            "speaker_stats": speaker_stats,
            "speaker_samples": speaker_sample_texts
        }

        logger.info(f"Extracted context: {len(speaker_stats)} speakers, total {total_duration:.1f}s")
        return context

    @staticmethod
    def create_context_prompt(context: Dict[str, Any]) -> str:
        """
        Create a context description for Gemini prompt.

        Args:
            context: Context dict from extract_speaker_context

        Returns:
            Formatted context string for prompt
        """
        speaker_stats = context.get("speaker_stats", {})
        total_duration = context.get("total_duration", 0)

        context_lines = [
            f"**Phân tích ngữ cảnh bản ghi:**",
            f"- Tổng thời gian: {total_duration:.1f} giây",
            f"- Số lượng người nói: {context.get('total_speakers', 0)}",
            ""
        ]

        # Add speaker analysis
        context_lines.append("**Chi tiết từng người nói:**")
        for speaker, stats in speaker_stats.items():
            context_lines.append(
                f"- {speaker}: {stats['count']} đoạn, "
                f"{stats['total_duration']:.1f}s tổng, "
                f"{stats['avg_length']:.1f}s trung bình"
            )

        return "\n".join(context_lines)
