from __future__ import annotations

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..asr.asr import transcribe_audio

router = APIRouter(prefix="/api/questions", tags=["Questions"])

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

# In-memory store — thay bằng database khi cần persistence
QUESTIONS: list[dict] = []


class TextQuestionIn(BaseModel):
    room_id: str = Field(min_length=1)
    speaker_name: str = Field(min_length=1)
    speaker_id: str = Field(min_length=1)
    content: str = Field(min_length=1)
    source: str = "text"


def _save_question(
    room_id: str,
    speaker_name: str,
    speaker_id: str,
    content: str,
    source: str,
    transcript_meta: dict | None = None,
) -> dict:
    question = {
        "id": str(uuid4()),
        "room_id": room_id,
        "speaker_name": speaker_name,
        "speaker_id": speaker_id,
        "content": content.strip(),
        "source": source,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "transcript_meta": transcript_meta,
    }
    QUESTIONS.append(question)
    return question


@router.post("/text")
async def api_submit_text_question(payload: TextQuestionIn):
    """
    Nhận câu hỏi dạng text từ khán giả qua Web/App.

    Body (JSON):
    - room_id: ID phòng hội thảo
    - speaker_name: Tên hiển thị của khán giả
    - speaker_id: ID định danh duy nhất (tạo ở client, lưu localStorage)
    - content: Nội dung câu hỏi
    - source: Nguồn gửi, mặc định "text"

    Returns:
    - status: "saved"
    - question: Object câu hỏi vừa lưu (kèm id, created_at)
    """
    cleaned = payload.content.strip()
    if not cleaned:
        raise HTTPException(status_code=422, detail="Question text is empty")

    question = _save_question(
        room_id=payload.room_id.strip(),
        speaker_name=payload.speaker_name.strip(),
        speaker_id=payload.speaker_id.strip(),
        content=cleaned,
        source=payload.source.strip() or "text",
    )
    return {"status": "saved", "question": question}


@router.post("/voice")
async def api_submit_voice_question(
    room_id: str = Form(...),
    speaker_name: str = Form(...),
    speaker_id: str = Form(...),
    source: str = Form("voice"),
    file: UploadFile = File(...),
):
    """
    Nhận câu hỏi dạng voice (audio file) từ khán giả, chạy ASR để chuyển thành text rồi lưu.

    Form fields:
    - room_id, speaker_name, speaker_id: Metadata người hỏi
    - source: Nguồn gửi, mặc định "voice"
    - file: File audio (webm/wav/mp3...) ghi từ micro trên trình duyệt

    Xử lý:
    1. Lưu file tạm vào storage/
    2. Chạy faster-whisper (ASR) để transcript audio → text tiếng Việt
    3. Lưu câu hỏi kèm metadata ASR (language, confidence, model)
    4. Xóa file tạm dù thành công hay lỗi

    Returns:
    - status: "saved"
    - question: Object câu hỏi
    - transcript: Kết quả đầy đủ từ Whisper (segments, language_probability...)

    Lỗi 422 nếu audio không chứa lời nói.
    """
    suffix = Path(file.filename or "question.webm").suffix or ".webm"
    temp_path = STORAGE_DIR / f"voice_{uuid4().hex}{suffix}"

    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        transcription = transcribe_audio(str(temp_path), language="vi", beam_size=1)
        spoken_text = str(transcription.get("text", "")).strip()
        if not spoken_text:
            raise HTTPException(status_code=422, detail="No speech recognized from audio")

        question = _save_question(
            room_id=room_id.strip(),
            speaker_name=speaker_name.strip(),
            speaker_id=speaker_id.strip(),
            content=spoken_text,
            source=source.strip() or "voice",
            transcript_meta={
                "language": transcription.get("language"),
                "language_probability": transcription.get("language_probability"),
                "model_size": transcription.get("model_size"),
            },
        )

        return {
            "status": "saved",
            "question": question,
            "transcript": transcription,
        }
    finally:
        if temp_path.exists():
            os.remove(temp_path)


@router.get("")
async def api_get_questions(room_id: str | None = None):
    """
    Lấy danh sách câu hỏi đã lưu trong phiên (in-memory).

    Query params:
    - room_id (optional): Lọc theo phòng. Bỏ trống để lấy tất cả.

    Returns:
    - count: Số lượng câu hỏi
    - items: Danh sách câu hỏi, sắp xếp theo thứ tự nhận vào
    """
    if room_id:
        filtered = [row for row in QUESTIONS if row.get("room_id") == room_id]
        return {"count": len(filtered), "items": filtered}
    return {"count": len(QUESTIONS), "items": QUESTIONS}
