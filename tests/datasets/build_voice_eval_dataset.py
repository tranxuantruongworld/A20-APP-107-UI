from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any


def _require_deps() -> tuple[Any, Any]:
	try:
		from datasets import load_dataset  # type: ignore
		import soundfile as sf  # type: ignore
	except ImportError as exc:
		raise SystemExit(
			"Missing dependencies. Install with: pip install -r requirements.txt"
		) from exc

	return load_dataset, sf


def build_dataset(
	output_dir: Path,
	num_samples: int,
	split: str,
	seed: int,
) -> dict[str, Any]:
	"""Create a local Vietnamese speech benchmark set from HF datasets."""
	load_dataset, sf = _require_deps()

	output_dir.mkdir(parents=True, exist_ok=True)
	audio_dir = output_dir / "audio"
	audio_dir.mkdir(parents=True, exist_ok=True)
	manifest_path = output_dir / "manifest.jsonl"

	dataset_name = "google/fleurs"
	dataset_config = "vi_vn"
	transcript_key = "raw_transcription"

	try:
		ds = load_dataset(
			dataset_name,
			dataset_config,
			split=split,
			trust_remote_code=True,
		)
	except Exception as exc:
		# New `datasets` releases may reject script-based datasets like FLEURS.
		if "Dataset scripts are no longer supported" not in str(exc):
			raise
		dataset_name = "mozilla-foundation/common_voice_17_0"
		dataset_config = "vi"
		transcript_key = "sentence"
		ds = load_dataset(
			dataset_name,
			dataset_config,
			split=split,
			trust_remote_code=True,
		)

	if len(ds) == 0:
		raise ValueError("Loaded dataset is empty")

	indices = list(range(len(ds)))
	random.Random(seed).shuffle(indices)
	selected = indices[: min(num_samples, len(ds))]

	entries: list[dict[str, Any]] = []
	for rank, idx in enumerate(selected):
		row = ds[int(idx)]
		audio_info = row["audio"]
		transcript = str(row.get(transcript_key, "")).strip()
		if not transcript:
			continue

		audio_path = audio_dir / f"sample_{rank:04d}.wav"
		sf.write(
			str(audio_path),
			audio_info["array"],
			audio_info["sampling_rate"],
		)

		entries.append(
			{
				"id": f"voice_vi_{rank:04d}",
				"audio_path": str(audio_path.resolve()),
				"text": transcript,
				"duration_sec": float(audio_info.get("duration", 0.0) or 0.0),
				"source": f"{dataset_name}:{dataset_config}",
			}
		)

	with manifest_path.open("w", encoding="utf-8") as handle:
		for entry in entries:
			handle.write(json.dumps(entry, ensure_ascii=False) + "\n")

	return {
		"manifest": str(manifest_path),
		"samples": len(entries),
		"split": split,
		"dataset": dataset_name,
		"dataset_config": dataset_config,
	}


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Build local voice dataset for ASR benchmarks")
	parser.add_argument(
		"--output-dir",
		type=Path,
		default=Path("tests/data/voice_eval"),
		help="Directory to store local benchmark dataset",
	)
	parser.add_argument("--num-samples", type=int, default=100, help="Number of audio samples")
	parser.add_argument(
		"--split",
		type=str,
		default="validation",
		help="Dataset split from FLEURS (train/validation/test)",
	)
	parser.add_argument("--seed", type=int, default=42, help="Random seed")
	return parser.parse_args()


def main() -> None:
	args = parse_args()
	result = build_dataset(
		output_dir=args.output_dir,
		num_samples=args.num_samples,
		split=args.split,
		seed=args.seed,
	)
	print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
	main()
