from typing import List, Tuple
import os
from pydub import AudioSegment
from pydub.silence import detect_nonsilent, detect_silence
from typing import Dict, Any, Optional

class AudioProcessor:
    """Utility class for processing audio files, including splitting long recordings"""

    def __init__(self, chunk_duration_ms: int = 300000,  # 5 minutes default
                 silence_thresh: int = -40,  # dBFS threshold for silence
                 min_silence_len: int = 500):  # ms minimum silence length
        """
        Initialize audio processor.

        Args:
            chunk_duration_ms: Target chunk duration in milliseconds
            silence_thresh: Silence threshold in dBFS
            min_silence_len: Minimum silence length in ms to consider as split point
        """
        self.chunk_duration_ms = chunk_duration_ms
        self.silence_thresh = silence_thresh
        self.min_silence_len = min_silence_len

    def split_audio_by_silence(self, audio_path: str, output_dir: str) -> List[Tuple[str, float]]:
        """
        Split audio file into chunks at silence points to avoid cutting speech.

        Args:
            audio_path: Path to input audio file
            output_dir: Directory to save chunks

        Returns:
            List of tuples: (chunk_path, offset_seconds)
        """
        os.makedirs(output_dir, exist_ok=True)
        audio = AudioSegment.from_file(audio_path)
        audio_length = len(audio)

        silence_ranges = detect_silence(
            audio,
            min_silence_len=self.min_silence_len,
            silence_thresh=self.silence_thresh
        )

        # Silence endpoints can be used as split candidates
        silence_points = [end for _, end in silence_ranges]

        chunks_info = []
        current_offset = 0.0
        chunk_start = 0
        chunk_index = 0

        while chunk_start < audio_length:
            chunk_end = min(chunk_start + self.chunk_duration_ms, audio_length)
            split_point = self._find_best_split_point(chunk_start, chunk_end, silence_points)

            if split_point is None or split_point <= chunk_start:
                split_point = chunk_end

            chunk = audio[chunk_start:split_point]
            chunk_path = os.path.join(output_dir, f"chunk_{chunk_index:03d}.wav")
            chunk.export(chunk_path, format="wav")

            chunks_info.append((chunk_path, current_offset))
            current_offset += (split_point - chunk_start) / 1000.0
            chunk_start = split_point
            chunk_index += 1

        return chunks_info

    def _find_best_split_point(self, start: int, end: int, silence_points: List[int]) -> Optional[int]:
        """
        Find the best silence point to split the audio chunk.

        Args:
            start: Start position in ms
            end: End position in ms
            silence_points: List of silence end timestamps in ms

        Returns:
            Best split point in ms, or None if no good point found
        """
        valid_splits = [point for point in silence_points if start + 500 <= point <= end - 500]
        if not valid_splits:
            return None

        # Prefer the latest silence point inside the chunk window
        return max(valid_splits)

    def get_audio_info(self, audio_path: str) -> Dict[str, Any]:
        """
        Get basic information about audio file.

        Args:
            audio_path: Path to audio file

        Returns:
            Dict with duration, size, etc.
        """
        audio = AudioSegment.from_file(audio_path)

        return {
            'duration_ms': len(audio),
            'duration_seconds': len(audio) / 1000.0,
            'channels': audio.channels,
            'sample_rate': audio.frame_rate,
            'file_size_bytes': os.path.getsize(audio_path)
        }

    def is_large_file(self, audio_path: str, max_size_mb: float = 20.0,
                     max_duration_min: float = 10.0) -> bool:
        """
        Check if audio file is considered large and needs splitting.

        Args:
            audio_path: Path to audio file
            max_size_mb: Maximum file size in MB
            max_duration_min: Maximum duration in minutes

        Returns:
            True if file needs splitting
        """
        info = self.get_audio_info(audio_path)
        size_mb = info['file_size_bytes'] / (1024 * 1024)
        duration_min = info['duration_seconds'] / 60.0

        return size_mb > max_size_mb or duration_min > max_duration_min