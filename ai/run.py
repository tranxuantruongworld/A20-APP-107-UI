from __future__ import annotations

import argparse
import json
from pathlib import Path

from asr.asr import add_asr_subparser, run_asr_from_args
from tts.tts import add_tts_subparser, run_tts_from_args


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Run AI utilities")
	subparsers = parser.add_subparsers(dest="feature", required=True)
	add_asr_subparser(subparsers)
	add_tts_subparser(subparsers)

	return parser.parse_args()


def main() -> None:
	args = parse_args()
	if args.feature == "asr":
		result = run_asr_from_args(args)
	elif args.feature == "tts":
		result = run_tts_from_args(args)
		print(f"Generated speech file: {result['output_audio']}")
	else:
		raise ValueError(f"Unsupported feature: {args.feature}")

	output_path = Path(args.save_json)
	output_path.parent.mkdir(parents=True, exist_ok=True)
	output_path.write_text(
		json.dumps(result, ensure_ascii=False, indent=2),
		encoding="utf-8",
	)


if __name__ == "__main__":
	main()
