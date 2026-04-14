from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Form
from fastapi.responses import FileResponse

from ..tts.tts import text_to_speech

router = APIRouter(prefix="/tts", tags=["TTS"])

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)


@router.post("/generate")
async def api_generate_voice(
    text: str = Form(...),
    background_tasks: BackgroundTasks = None,
):
    """
    Nhận text, tổng hợp giọng nói offline (pyttsx3) và trả về file .wav.

    Form fields:
    - text: Nội dung cần đọc

    Xóa file .wav tạm ngay sau khi response gửi xong để tránh đầy disk.

    Returns: File audio WAV phát qua loa.
    """
    output_filename = f"voice_{os.urandom(4).hex()}.wav"
    output_path = STORAGE_DIR / output_filename

    try:
        text_to_speech(text, output_path=str(output_path), voice_hint=None)

        if background_tasks is not None:
            background_tasks.add_task(os.remove, str(output_path))

        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename="output.wav",
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}
