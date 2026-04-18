from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import pyttsx3


def _pick_voice(engine: pyttsx3.Engine, voice_hint: str | None) -> str | None:
	"""Pick a voice by id or name when hint is provided."""
	if not voice_hint:
		return None

	hint = voice_hint.strip().lower()
	for voice in engine.getProperty("voices"):
		voice_id = str(getattr(voice, "id", "")).lower()
		voice_name = str(getattr(voice, "name", "")).lower()
		if hint in voice_id or hint in voice_name:
			return str(getattr(voice, "id", ""))
	return None


def text_to_speech(
	text: str,
	output_path: str = "output/tts_output.wav",
	rate: int = 180,
	volume: float = 1.0,
	voice_hint: str | None = None,
) -> dict[str, Any]:
	"""Convert text to speech locally using pyttsx3 (offline, no paid API)."""
	cleaned = text.strip()
	if not cleaned:
		raise ValueError("Input text is empty")

	engine = pyttsx3.init()
	engine.setProperty("rate", int(rate))
	engine.setProperty("volume", max(0.0, min(1.0, float(volume))))

	selected_voice = _pick_voice(engine, voice_hint)
	if selected_voice:
		engine.setProperty("voice", selected_voice)

	target = Path(output_path)
	target.parent.mkdir(parents=True, exist_ok=True)
	print(f"Generating speech for text: {cleaned[:30]}... -> {target}")
	engine.save_to_file(cleaned, str(target))
	engine.runAndWait()
	print(f"Speech generated at: {target}")
	return {
		"text": cleaned,
		"output_audio": str(target),
		"rate": int(rate),
		"volume": max(0.0, min(1.0, float(volume))),
		"voice": selected_voice,
		"engine": "pyttsx3",
		"offline": True,
	}


def add_tts_subparser(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
	"""Register TTS command-line arguments."""
	tts_parser = subparsers.add_parser("tts", help="Offline text-to-speech")
	tts_parser.add_argument("--text", type=str, default=None, help="Text input for offline TTS")
	tts_parser.add_argument(
		"--text-file",
		type=str,
		default=None,
		help="Path to text file for offline TTS",
	)
	tts_parser.add_argument(
		"--speech-output",
		type=str,
		default="output/tts_output.wav",
		help="Output audio file path",
	)
	tts_parser.add_argument(
		"--speech-rate",
		type=int,
		default=180,
		help="Speech speed in words per minute",
	)
	tts_parser.add_argument(
		"--speech-volume",
		type=float,
		default=1.0,
		help="Speech volume from 0.0 to 1.0",
	)
	tts_parser.add_argument(
		"--voice",
		type=str,
		default=None,
		help="Voice id/name hint",
	)
	tts_parser.add_argument(
		"--save-json",
		type=str,
		default="output/tts_result.json",
		help="Output json file path",
	)


def run_tts_from_args(args: argparse.Namespace) -> dict[str, Any]:
	"""Execute TTS from parsed command-line args."""
	input_text = args.text
	if args.text_file:
		input_text = Path(args.text_file).read_text(encoding="utf-8")

	if not input_text:
		raise ValueError("Provide --text or --text-file for TTS")

	return text_to_speech(
		text=input_text,
		output_path=args.speech_output,
		rate=args.speech_rate,
		volume=args.speech_volume,
		voice_hint=args.voice,
	)
