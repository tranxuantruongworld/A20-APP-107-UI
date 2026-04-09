from __future__ import annotations

import argparse
import json
from pathlib import Path

from asr.asr import transcribe_audio


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Run AI utilities")

	parser.add_argument(
		"audio_path",
		type=str,
		help="Path to audio file for speech-to-text",
	)
	parser.add_argument(
		"--language",
		type=str,
		default=None,
		help="Language hint like 'vi' or 'en'",
	)
	parser.add_argument(
		"--model-size",
		type=str,
		default=None,
		help="Whisper model: tiny, base, small, medium, large-v3",
	)
	parser.add_argument(
		"--beam-size",
		type=int,
		default=1,
		help="Beam size (1 is fastest)",
	)
	parser.add_argument(
		"--save-json",
		type=str,
		default="output/asr_result.json",
		help="Output json file path",
	)

	return parser.parse_args()


def main() -> None:
	args = parse_args()

	result = transcribe_audio(
		audio_path=args.audio_path,
		model_size=args.model_size,
		language=args.language,
		beam_size=args.beam_size,
		vad_filter=True,
	)

	output_path = Path(args.save_json)
	output_path.parent.mkdir(parents=True, exist_ok=True)
	output_path.write_text(
		json.dumps(result, ensure_ascii=False, indent=2),
		encoding="utf-8",
	)


if __name__ == "__main__":
	main()
