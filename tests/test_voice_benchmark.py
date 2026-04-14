from __future__ import annotations

import json
import os
import re
import statistics
import time
import wave
from pathlib import Path
from typing import Any

import pytest
from jiwer import cer, wer

from src.asr.asr import transcribe_audio
from src.tts.tts import text_to_speech

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT_DIR / "tests" / "data" / "voice_eval" / "manifest.jsonl"
BENCHMARK_DIR = ROOT_DIR / "tests" / "benchmarks"


def _normalize_text(text: str) -> str:
	text = text.lower().strip()
	text = re.sub(r"[^\w\s]", " ", text)
	text = re.sub(r"\s+", " ", text)
	return text.strip()


def _load_manifest(path: Path, max_samples: int) -> list[dict[str, Any]]:
	if not path.exists():
		return []

	items: list[dict[str, Any]] = []
	with path.open("r", encoding="utf-8") as handle:
		for line in handle:
			line = line.strip()
			if not line:
				continue
			entry = json.loads(line)
			items.append(entry)

	if max_samples > 0:
		return items[:max_samples]
	return items


def _read_duration_seconds(audio_path: Path) -> float:
	with wave.open(str(audio_path), "rb") as handle:
		frames = handle.getnframes()
		framerate = handle.getframerate()
		if framerate == 0:
			return 0.0
		return float(frames) / float(framerate)


def _write_report(name: str, payload: dict[str, Any]) -> None:
	BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)
	report_file = BENCHMARK_DIR / f"{name}.json"
	report_file.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


@pytest.mark.integration
@pytest.mark.benchmark
def test_asr_benchmark_manifest() -> None:
	manifest_file = Path(os.getenv("VOICE_EVAL_MANIFEST", str(DEFAULT_MANIFEST)))
	max_samples = int(os.getenv("VOICE_EVAL_MAX_SAMPLES", "25"))
	items = _load_manifest(manifest_file, max_samples=max_samples)

	if not items:
		pytest.skip(
			"Dataset manifest is missing or empty. Run: python tests/datasets/build_voice_eval_dataset.py"
		)

	model_size = os.getenv("ASR_BENCHMARK_MODEL", "small")
	language = os.getenv("ASR_BENCHMARK_LANGUAGE", "vi")

	references: list[str] = []
	hypotheses: list[str] = []
	latencies: list[float] = []
	rtfs: list[float] = []
	errors: list[dict[str, str]] = []

	for item in items:
		audio_path = Path(item["audio_path"])
		if not audio_path.exists():
			errors.append({"id": item.get("id", "unknown"), "error": "audio not found"})
			continue

		duration = float(item.get("duration_sec", 0.0) or 0.0)
		if duration <= 0:
			duration = _read_duration_seconds(audio_path)

		start = time.perf_counter()
		try:
			result = transcribe_audio(
				audio_path=str(audio_path),
				model_size=model_size,
				language=language,
				beam_size=1,
				vad_filter=True,
			)
		except Exception as exc:
			errors.append({"id": item.get("id", "unknown"), "error": str(exc)})
			continue

		latency = time.perf_counter() - start
		latencies.append(latency)
		if duration > 0:
			rtfs.append(latency / duration)

		references.append(_normalize_text(str(item["text"])))
		hypotheses.append(_normalize_text(str(result.get("text", ""))))

	successful = len(hypotheses)
	total = len(items)
	if successful == 0:
		pytest.fail("ASR benchmark had zero successful transcriptions")

	metrics = {
		"total_samples": total,
		"successful_samples": successful,
		"success_rate": successful / total,
		"wer": wer(references, hypotheses),
		"cer": cer(references, hypotheses),
		"avg_latency_sec": statistics.mean(latencies),
		"p95_latency_sec": statistics.quantiles(latencies, n=100)[94] if len(latencies) > 1 else latencies[0],
		"avg_rtf": statistics.mean(rtfs) if rtfs else 0.0,
		"errors": errors,
		"model_size": model_size,
		"language": language,
	}

	_write_report("asr_benchmark", metrics)

	max_wer = float(os.getenv("ASR_MAX_WER", "0.55"))
	max_avg_rtf = float(os.getenv("ASR_MAX_AVG_RTF", "2.00"))
	min_success = float(os.getenv("ASR_MIN_SUCCESS_RATE", "0.90"))

	assert metrics["success_rate"] >= min_success
	assert metrics["wer"] <= max_wer
	assert metrics["avg_rtf"] <= max_avg_rtf


@pytest.mark.integration
@pytest.mark.benchmark
def test_tts_benchmark_stability(tmp_path: Path) -> None:
	texts = [
		"Xin chao, day la bai kiem tra he thong doc van ban.",
		"Toi dang danh gia chat luong va toc do cua mo hinh TTS.",
		"Neu ban nghe ro noi dung, do la dau hieu mo hinh hoat dong tot.",
	]

	latencies: list[float] = []
	byte_sizes: list[int] = []
	errors: list[str] = []

	for index, text in enumerate(texts):
		output_file = tmp_path / f"tts_{index}.wav"
		start = time.perf_counter()
		try:
			result = text_to_speech(text=text, output_path=str(output_file), rate=180, volume=1.0)
		except Exception as exc:
			errors.append(str(exc))
			continue

		latencies.append(time.perf_counter() - start)
		generated_file = Path(str(result["output_audio"]))
		if generated_file.exists():
			byte_sizes.append(generated_file.stat().st_size)

	if not latencies:
		pytest.fail(f"TTS benchmark failed for all cases: {errors}")

	metrics = {
		"total_sentences": len(texts),
		"successful_sentences": len(latencies),
		"success_rate": len(latencies) / len(texts),
		"avg_latency_sec": statistics.mean(latencies),
		"p95_latency_sec": statistics.quantiles(latencies, n=100)[94] if len(latencies) > 1 else latencies[0],
		"avg_output_bytes": statistics.mean(byte_sizes) if byte_sizes else 0.0,
		"errors": errors,
	}

	_write_report("tts_benchmark", metrics)

	min_success = float(os.getenv("TTS_MIN_SUCCESS_RATE", "1.0"))
	max_p95_latency = float(os.getenv("TTS_MAX_P95_LATENCY", "8.0"))

	assert metrics["success_rate"] >= min_success
	assert metrics["p95_latency_sec"] <= max_p95_latency
