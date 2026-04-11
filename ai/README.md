# AI Module CLI

This directory has two independent features:

- `asr`: speech-to-text (audio -> text)
- `tts`: offline text-to-speech (text -> audio)

Each feature owns its own CLI arguments and runner logic in its module:

- `asr/asr.py`
- `tts/tts.py`

The root entry point `run.py` only dispatches by subcommand.

## Why this avoids conflicts

- ASR args and TTS args are isolated in different subparsers.
- ASR code changes do not require touching TTS argument parsing.
- TTS code changes do not require touching ASR argument parsing.
- Shared behavior (saving JSON) stays in one place in `run.py`.

## Usage

Run from `ai/` directory:

### ASR

```bash
python run.py asr <audio_path> --language vi --beam-size 1 --save-json output/asr_result.json
```

Example:

```bash
python run.py asr data/sample.wav --model-size small --save-json output/asr_result.json
```

### TTS (offline, free)

```bash
python run.py tts --text "Xin chao" --speech-rate 190 --speech-output output/voice.wav --save-json output/tts_result.json
```

Or use a text file:

```bash
python run.py tts --text-file input.txt --speech-output output/voice.wav --save-json output/tts_result.json
```

## Development notes

- To add ASR-only options, modify `add_asr_subparser` and `run_asr_from_args` in `asr/asr.py`.
- To add TTS-only options, modify `add_tts_subparser` and `run_tts_from_args` in `tts/tts.py`.
- Do not add feature-specific flags directly in `run.py`.
