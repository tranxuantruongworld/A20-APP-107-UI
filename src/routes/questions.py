# from __future__ import annotations

# import os
# import shutil
# from datetime import datetime, timezone
# from pathlib import Path
# from uuid import uuid4

# from fastapi import APIRouter, File, Form, HTTPException, UploadFile
# from pydantic import BaseModel, Field

# from ..asr.asr import transcribe_audio
# from ..services.ai_service import get_groq_similarity_check
# from ..services.question_storage import (
#     create_merged_record,
#     find_and_update_count,
#     get_all_logs,
#     load_questions_from_file,
#     save_question_to_file,
# )

# router = APIRouter(prefix="/api/questions", tags=["Questions"])

# STORAGE_DIR = Path("storage")
# STORAGE_DIR.mkdir(exist_ok=True)

# # In-memory store — thay bằng database khi cần persistence
# QUESTIONS: list[dict] = []


# class TextQuestionIn(BaseModel):
#     room_id: str = Field(min_length=1)
#     speaker_name: str = Field(min_length=1)
#     speaker_id: str = Field(min_length=1)
#     content: str = Field(min_length=1)
#     source: str = "text"


# class QuestionIn(BaseModel):
#     speaker_id: str = Field(min_length=1)
#     room_id: str = Field(min_length=1)
#     speaker_name: str = Field(min_length=1)
#     content: str = Field(min_length=1)
#     timestamp: str | None = None
#     force_save: bool = False
#     synthesized_content: str | None = None
#     source: str = "text"


# def _save_question(
#     room_id: str,
#     speaker_name: str,
#     speaker_id: str,
#     content: str,
#     source: str,
#     transcript_meta: dict | None = None,
# ) -> dict:
#     """Build a question record, add it to the in-memory list, and persist it.

#     Args:
#         room_id: Conference room identifier.
#         speaker_name: Display name of the audience member.
#         speaker_id: Unique client-generated speaker identifier.
#         content: Cleaned question text.
#         source: Origin of the question ("text" or "voice").
#         transcript_meta: Optional ASR metadata dict (language, confidence, model).

#     Returns:
#         The newly created question dict with id and created_at fields.
#     """
#     question = {
#         "id": str(uuid4()),
#         "room_id": room_id,
#         "speaker_name": speaker_name,
#         "speaker_id": speaker_id,
#         "content": content.strip(),
#         "source": source,
#         "created_at": datetime.now(timezone.utc).isoformat(),
#         "transcript_meta": transcript_meta,
#     }
#     QUESTIONS.append(question)
#     save_question_to_file(room_id, question)
#     return question


# def _check_similarity(new_content: str, room_id: str) -> dict:
#     """Load existing questions for a room and run the Groq duplicate check.

#     Returns ``{"is_duplicate": False}`` immediately when the room has no prior
#     questions, avoiding an unnecessary API call.

#     Args:
#         new_content: Text of the incoming question.
#         room_id: Conference room identifier used to scope the log lookup.

#     Returns:
#         Similarity result dict from ``get_groq_similarity_check``.
#     """
#     old_questions_list = load_questions_from_file(room_id)
#     if not old_questions_list:
#         return {"is_duplicate": False}
#     return get_groq_similarity_check(new_content, old_questions_list)


# def _format_duplicate_response(similarity_result: dict) -> dict:
#     """Convert a raw similarity result into the standard duplicate API response.

#     Args:
#         similarity_result: Dict returned by ``get_groq_similarity_check``.

#     Returns:
#         Response dict with status ``"duplicate_detected"`` and all duplicate
#         metadata fields expected by the frontend.
#     """
#     return {
#         "status": "duplicate_detected",
#         "is_duplicate": True,
#         "matched_content": similarity_result.get("matched_content", ""),
#         "synthesized_preview": similarity_result.get("synthesized_preview", ""),
#         "others_count": similarity_result.get("others_count", 0),
#         "display_message": similarity_result.get("display_message", ""),
#     }


# @router.post("")
# async def api_submit_question(payload: QuestionIn):
#     """Submit a question with optional AI duplicate detection.

#     When ``force_save=True`` the question is persisted immediately without
#     calling the Groq similarity API. Otherwise the question is checked for
#     semantic duplicates first; if one is found the endpoint returns
#     ``{"status": "duplicate_detected", ...}`` without saving.

#     Body (JSON): QuestionIn fields — room_id, speaker_id, speaker_name,
#     content, source, force_save, synthesized_content, timestamp.

#     Returns:
#     - ``{"status": "saved", "question": {...}}`` on a new unique question.
#     - Duplicate detection payload when a match is found.
#     """
#     cleaned = payload.content.strip()
#     if not cleaned:
#         raise HTTPException(status_code=422, detail="Question text is empty")

#     if payload.force_save:
#         question = _save_question(
#             room_id=payload.room_id.strip(),
#             speaker_name=payload.speaker_name.strip(),
#             speaker_id=payload.speaker_id.strip(),
#             content=cleaned,
#             source=(payload.source or "text").strip() or "text",
#         )
#         return {"status": "saved", "question": question}

#     similarity_result = _check_similarity(cleaned, payload.room_id.strip())
#     if similarity_result.get("is_duplicate"):
#         return _format_duplicate_response(similarity_result)

#     question = _save_question(
#         room_id=payload.room_id.strip(),
#         speaker_name=payload.speaker_name.strip(),
#         speaker_id=payload.speaker_id.strip(),
#         content=cleaned,
#         source=(payload.source or "text").strip() or "text",
#     )
#     return {"status": "saved", "question": question}


# @router.post("/text")
# async def api_submit_text_question(payload: TextQuestionIn):
#     """
#     Nhận câu hỏi dạng text từ khán giả qua Web/App.

#     Body (JSON):
#     - room_id: ID phòng hội thảo
#     - speaker_name: Tên hiển thị của khán giả
#     - speaker_id: ID định danh duy nhất (tạo ở client, lưu localStorage)
#     - content: Nội dung câu hỏi
#     - source: Nguồn gửi, mặc định "text"

#     Returns:
#     - status: "saved"
#     - question: Object câu hỏi vừa lưu (kèm id, created_at)
#     """
#     cleaned = payload.content.strip()
#     if not cleaned:
#         raise HTTPException(status_code=422, detail="Question text is empty")

#     similarity_result = _check_similarity(cleaned, payload.room_id.strip())
#     if similarity_result.get("is_duplicate"):
#         return _format_duplicate_response(similarity_result)

#     question = _save_question(
#         room_id=payload.room_id.strip(),
#         speaker_name=payload.speaker_name.strip(),
#         speaker_id=payload.speaker_id.strip(),
#         content=cleaned,
#         source=payload.source.strip() or "text",
#     )
#     return {"status": "saved", "question": question}


# @router.post("/voice")
# async def api_submit_voice_question(
#     room_id: str = Form(...),
#     speaker_name: str = Form(...),
#     speaker_id: str = Form(...),
#     source: str = Form("voice"),
#     file: UploadFile = File(...),
# ):
#     """
#     Nhận câu hỏi dạng voice (audio file) từ khán giả, chạy ASR để chuyển thành text rồi lưu.

#     Form fields:
#     - room_id, speaker_name, speaker_id: Metadata người hỏi
#     - source: Nguồn gửi, mặc định "voice"
#     - file: File audio (webm/wav/mp3...) ghi từ micro trên trình duyệt

#     Xử lý:
#     1. Lưu file tạm vào storage/
#     2. Chạy faster-whisper (ASR) để transcript audio → text tiếng Việt
#     3. Lưu câu hỏi kèm metadata ASR (language, confidence, model)
#     4. Xóa file tạm dù thành công hay lỗi

#     Returns:
#     - status: "saved"
#     - question: Object câu hỏi
#     - transcript: Kết quả đầy đủ từ Whisper (segments, language_probability...)

#     Lỗi 422 nếu audio không chứa lời nói.
#     """
#     suffix = Path(file.filename or "question.webm").suffix or ".webm"
#     temp_path = STORAGE_DIR / f"voice_{uuid4().hex}{suffix}"

#     with temp_path.open("wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     try:
#         transcription = transcribe_audio(str(temp_path), language="vi", beam_size=1)
#         spoken_text = str(transcription.get("text", "")).strip()
#         if not spoken_text:
#             raise HTTPException(status_code=422, detail="No speech recognized from audio")

#         similarity_result = _check_similarity(spoken_text, room_id.strip())
#         if similarity_result.get("is_duplicate"):
#             return {
#                 **_format_duplicate_response(similarity_result),
#                 "transcript": transcription,
#             }

#         question = _save_question(
#             room_id=room_id.strip(),
#             speaker_name=speaker_name.strip(),
#             speaker_id=speaker_id.strip(),
#             content=spoken_text,
#             source=source.strip() or "voice",
#             transcript_meta={
#                 "language": transcription.get("language"),
#                 "language_probability": transcription.get("language_probability"),
#                 "model_size": transcription.get("model_size"),
#             },
#         )

#         return {
#             "status": "saved",
#             "question": question,
#             "transcript": transcription,
#         }
#     finally:
#         if temp_path.exists():
#             os.remove(temp_path)


# @router.get("")
# async def api_get_questions(room_id: str | None = None):
#     """
#     Lấy danh sách câu hỏi đã lưu trong phiên (in-memory).

#     Query params:
#     - room_id (optional): Lọc theo phòng. Bỏ trống để lấy tất cả.

#     Returns:
#     - count: Số lượng câu hỏi
#     - items: Danh sách câu hỏi, sắp xếp theo thứ tự nhận vào
#     """
#     if room_id:
#         filtered = [row for row in QUESTIONS if row.get("room_id") == room_id]
#         return {"count": len(filtered), "items": filtered}
#     return {"count": len(QUESTIONS), "items": QUESTIONS}


# @router.post("/merge")
# async def api_merge_question(payload: QuestionIn):
#     """Merge a duplicate question into an existing one, incrementing its count.

#     ``payload.content`` must be the exact text of the *existing* question to
#     merge into (i.e. the ``matched_content`` returned by the duplicate check).
#     ``payload.synthesized_content`` is the optional AI-synthesized text to
#     replace the original content with.

#     Falls back to creating a brand-new merged record when the original cannot
#     be located in the log file.

#     Returns:
#     - ``{"status": "merged", "message": "..."}`` on success.
#     - ``{"status": "error", "message": "..."}`` on failure.
#     """
#     room_id = payload.room_id.strip()
#     matched_content = payload.content.strip()
#     synthesized_content = (payload.synthesized_content or "").strip() or None
#     speaker_id = payload.speaker_id.strip()

#     result = find_and_update_count(
#         room_id=room_id,
#         matched_content=matched_content,
#         new_content=synthesized_content,
#         speaker_id=speaker_id,
#     )
#     if result.get("success"):
#         return {"status": "merged", "message": result.get("message", "Merged")}

#     fallback_data = payload.model_dump()
#     if create_merged_record(room_id, fallback_data, synthesized_content, speaker_id):
#         return {"status": "merged", "message": "Created new merged record"}

#     return {"status": "error", "message": "Merge failed"}


# @router.get("/logs")
# async def api_get_logs(room_id: str | None = None):
#     """Return all persisted question records for a room from the JSONL log.

#     Query params:
#     - room_id (required): Conference room identifier.

#     Returns:
#     - ``{"status": "ok", "count": int, "items": [...]}`` on success.
#     - ``{"status": "error", "message": "..."}`` when room_id is omitted.
#     """
#     if not room_id:
#         return {"status": "error", "message": "room_id is required"}
#     data = get_all_logs(room_id)
#     return {"status": "ok", "count": len(data), "items": data}
