from __future__ import annotations

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from ..asr.asr import transcribe_audio

router = APIRouter(prefix="/asr", tags=["ASR"])

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)


@router.post("/transcribe")
async def api_transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe thuần — nhận file audio, trả về text mà không lưu câu hỏi.

    Dùng để test ASR hoặc tích hợp bên ngoài pipeline câu hỏi.
    File được lưu tạm và xóa ngay sau khi xử lý xong.

    Returns: Kết quả đầy đủ từ Whisper (text, language, segments...).
    """
    file_path = STORAGE_DIR / (file.filename or "upload.audio")

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = transcribe_audio(str(file_path))
        return result
    finally:
        if file_path.exists():
            os.remove(file_path)
