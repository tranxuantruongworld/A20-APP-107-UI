# Voice Benchmark Guide

## 1) Tao bo du lieu danh gia giong noi

Du an su dung FLEURS Vietnamese (`google/fleurs`, subset `vi_vn`) de tao benchmark set local.

```bash
python tests/datasets/build_voice_eval_dataset.py --num-samples 100 --split validation
```

Sau khi chay xong:

- Audio nam trong `tests/data/voice_eval/audio/`
- Manifest nam trong `tests/data/voice_eval/manifest.jsonl`

Moi dong trong manifest co format:

```json
{"id": "fleurs_vi_0001", "audio_path": ".../sample_0001.wav", "text": "...", "duration_sec": 4.12, "source": "google/fleurs:vi_vn"}
```

## 2) Chay test benchmark

```bash
pytest tests/test_voice_benchmark.py -m benchmark
```

Report benchmark duoc tao tai:

- `storage/benchmarks/asr_benchmark.json`
- `storage/benchmarks/tts_benchmark.json`

## 3) Bo benchmark khuyen nghi de cai thien model

### ASR

- `WER` (word error rate): cang thap cang tot
- `CER` (character error rate): cang thap cang tot
- `avg_rtf` (real-time factor): thoi gian xu ly / thoi luong audio
- `p95_latency_sec`: do tre phan vi 95%
- `success_rate`: ty le file xu ly thanh cong

Moc ban dau goi y:

- WER <= 0.55
- CER <= 0.35
- avg_rtf <= 2.00
- success_rate >= 0.90

### TTS

- `success_rate`: ty le tao file audio thanh cong
- `p95_latency_sec`: do tre tao audio
- `avg_output_bytes`: proxy de phat hien file output bi rong

Moc ban dau goi y:

- success_rate = 1.00
- p95_latency_sec <= 8s
- avg_output_bytes > 0

## 4) Bien moi truong de tune benchmark threshold

ASR:

- `ASR_BENCHMARK_MODEL` (mac dinh: `small`)
- `ASR_BENCHMARK_LANGUAGE` (mac dinh: `vi`)
- `ASR_MAX_WER` (mac dinh: `0.55`)
- `ASR_MAX_AVG_RTF` (mac dinh: `2.00`)
- `ASR_MIN_SUCCESS_RATE` (mac dinh: `0.90`)
- `VOICE_EVAL_MAX_SAMPLES` (mac dinh: `25`)
- `VOICE_EVAL_MANIFEST` (manifest tuy chinh)

TTS:

- `TTS_MIN_SUCCESS_RATE` (mac dinh: `1.0`)
- `TTS_MAX_P95_LATENCY` (mac dinh: `8.0`)
