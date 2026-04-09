from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from faster_whisper import WhisperModel

load_dotenv()


def _pick_device() -> str:
	"""Choose device based on environment variable or CUDA availability."""
	env_device = os.getenv("ASR_DEVICE")
	if env_device:
		return env_device

	# If CUDA is available, faster-whisper accepts "cuda".
	try:
		import torch  # type: ignore

		if torch.cuda.is_available():
			return "cuda"
	except Exception:
		pass

	return "cpu"


def _pick_compute_type(device: str) -> str:
	"""Choose compute type optimized for speed by device."""
	env_compute = os.getenv("ASR_COMPUTE_TYPE")
	if env_compute:
		return env_compute

	if device == "cuda":
		return "float16"
	return "int8"


def transcribe_audio(
	audio_path: str,
	model_size: str | None = None,
	language: str | None = None,
	beam_size: int = 1,
	vad_filter: bool = True,
) -> dict[str, Any]:
	"""Transcribe an audio file to text with fast defaults.

	Args:
		audio_path: Path to input audio file.
		model_size: Whisper model size (tiny, base, small, medium, large-v3).
		language: Language hint, e.g. "vi" or "en".
		beam_size: Keep at 1 for speed-focused transcription.
		vad_filter: Removes long silences before decoding.
	"""
	path = Path(audio_path)
	if not path.exists() or not path.is_file():
		raise FileNotFoundError(f"Audio file not found: {audio_path}")

	resolved_model_size = model_size or os.getenv("ASR_MODEL_SIZE", "small")
	device = _pick_device()
	compute_type = _pick_compute_type(device)

	model = WhisperModel(
		resolved_model_size,
		device=device,
		compute_type=compute_type,
		cpu_threads=int(os.getenv("ASR_CPU_THREADS", "4")),
	)

	segments, info = model.transcribe(
		str(path),
		language=language,
		beam_size=beam_size,
		vad_filter=vad_filter,
		condition_on_previous_text=False,
	)

	segment_rows: list[dict[str, Any]] = []
	text_parts: list[str] = []
	for segment in segments:
		cleaned = segment.text.strip()
		if not cleaned:
			continue
		text_parts.append(cleaned)
		segment_rows.append(
			{
				"start": round(float(segment.start), 2),
				"end": round(float(segment.end), 2),
				"text": cleaned,
			}
		)

	return {
		"text": " ".join(text_parts).strip(),
		"language": info.language,
		"language_probability": info.language_probability,
		"model_size": resolved_model_size,
		"device": device,
		"compute_type": compute_type,
		"segments": segment_rows,
	}
