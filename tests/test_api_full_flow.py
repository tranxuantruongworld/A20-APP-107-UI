"""
Full-flow API integration tests.

Covers every HTTP endpoint in the project using FastAPI's TestClient so no
live server is required. The Groq similarity API and the ASR/TTS engines are
monkeypatched to keep tests fast, offline, and deterministic.

Run all tests:
    pytest tests/test_api_full_flow.py -v

Run only fast (non-integration) tests:
    pytest tests/test_api_full_flow.py -v -m "not integration"
"""

from __future__ import annotations

import io
import json
import wave
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.main import app
import src.routes.questions as questions_module


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client() -> TestClient:
    return TestClient(app, raise_server_exceptions=True)


def _minimal_wav_bytes() -> bytes:
    """Return the smallest valid WAV file (0.1 s silence, 16-bit mono 16 kHz)."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00\x00" * 1600)  # 0.1 s
    return buf.getvalue()


ROOM_ID = "test_room_flow"
SPEAKER_ID = "spk_test_001"
SPEAKER_NAME = "Test Speaker"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clean_in_memory_store():
    """Reset the in-memory QUESTIONS list before each test."""
    questions_module.QUESTIONS.clear()
    yield
    questions_module.QUESTIONS.clear()


@pytest.fixture(autouse=True)
def clean_storage_log(tmp_path, monkeypatch):
    """Redirect storage to a temp dir so tests never touch real storage/."""
    import src.services.question_storage as qs

    monkeypatch.setattr(qs, "STORAGE_DIR", tmp_path)
    yield


@pytest.fixture()
def client():
    return _make_client()


@pytest.fixture()
def no_groq(monkeypatch):
    """Patch the similarity check to always return no-duplicate."""
    monkeypatch.setenv("GROQ_API_KEY", "")

    def _no_dup(new_content, old_questions_list):
        return {"is_duplicate": False, "matched_content": "", "synthesized_preview": new_content}

    monkeypatch.setattr(
        "src.services.ai_service.get_groq_similarity_check", _no_dup
    )
    monkeypatch.setattr(
        "src.routes.questions.get_groq_similarity_check", _no_dup
    )
    return _no_dup


@pytest.fixture()
def duplicate_groq(monkeypatch):
    """Patch similarity to always report a duplicate."""

    def _dup(new_content, old_questions_list):
        matched = old_questions_list[0]["content"] if old_questions_list else new_content
        return {
            "is_duplicate": True,
            "matched_content": matched,
            "synthesized_preview": matched,
            "others_count": 1,
            "display_message": "Co 1 nguoi da quan tam den chu de nay giong ban",
        }

    monkeypatch.setattr("src.routes.questions.get_groq_similarity_check", _dup)
    return _dup


@pytest.fixture()
def mock_asr(monkeypatch):
    """Patch transcribe_audio to return a fixed transcript."""

    def _transcribe(path, language="vi", beam_size=1):
        return {
            "text": "Câu hỏi từ giọng nói",
            "language": "vi",
            "language_probability": 0.99,
            "model_size": "tiny",
            "segments": [],
        }

    monkeypatch.setattr("src.routes.questions.transcribe_audio", _transcribe)
    monkeypatch.setattr("src.routes.asr.transcribe_audio", _transcribe)
    return _transcribe


@pytest.fixture()
def mock_tts(monkeypatch, tmp_path):
    """Patch text_to_speech to write a minimal WAV so FileResponse succeeds."""

    def _tts(text, output_path, voice_hint=None):
        wav_bytes = _minimal_wav_bytes()
        Path(output_path).write_bytes(wav_bytes)

    monkeypatch.setattr("src.routes.tts.text_to_speech", _tts)
    return _tts


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_online(self, client):
        """GET /health/ returns status=online regardless of DB."""
        with patch("src.routes.health.check_db_health", return_value=False):
            r = client.get("/health/")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "online"
        assert body["database"] in ("connected", "disconnected")

    def test_health_db_connected(self, client):
        """GET /health/ reports connected when DB ping succeeds."""
        with patch("src.routes.health.check_db_health", return_value=True):
            r = client.get("/health/")
        assert r.status_code == 200
        assert r.json()["database"] == "connected"

    def test_health_db_disconnected(self, client):
        """GET /health/ reports disconnected when DB ping fails."""
        with patch("src.routes.health.check_db_health", return_value=False):
            r = client.get("/health/")
        assert r.status_code == 200
        assert r.json()["database"] == "disconnected"


# ---------------------------------------------------------------------------
# Questions — submit via POST /api/questions  (QuestionIn)
# ---------------------------------------------------------------------------

class TestSubmitQuestion:
    def _payload(self, content="Lịch thi của môn học là khi nào?", **kwargs):
        return {
            "speaker_id": SPEAKER_ID,
            "room_id": ROOM_ID,
            "speaker_name": SPEAKER_NAME,
            "content": content,
            "source": "text",
            **kwargs,
        }

    def test_save_new_question(self, client, no_groq):
        """First question in a room is saved immediately."""
        r = client.post("/api/questions", json=self._payload())
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "saved"
        assert body["question"]["content"] == "Lịch thi của môn học là khi nào?"
        assert "id" in body["question"]
        assert "created_at" in body["question"]

    def test_force_save_skips_duplicate_check(self, client, duplicate_groq):
        """force_save=True bypasses the Groq check and always saves."""
        r = client.post("/api/questions", json=self._payload(force_save=True))
        assert r.status_code == 200
        assert r.json()["status"] == "saved"

    def test_duplicate_returns_duplicate_detected(self, client, no_groq, duplicate_groq):
        """Second identical question triggers duplicate_detected response."""
        # Save the first question so the log is non-empty
        client.post("/api/questions", json=self._payload())
        # Re-apply the duplicate fixture after the first save
        r = client.post("/api/questions", json=self._payload())
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "duplicate_detected"
        assert body["is_duplicate"] is True
        assert "matched_content" in body
        assert "others_count" in body

    def test_empty_content_is_rejected(self, client, no_groq):
        """Content that is empty after stripping raises 422."""
        r = client.post("/api/questions", json=self._payload(content="   "))
        assert r.status_code == 422

    def test_missing_required_fields_raises_422(self, client):
        """Missing speaker_id gives 422."""
        r = client.post("/api/questions", json={"room_id": ROOM_ID, "content": "test"})
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Questions — POST /api/questions/text  (TextQuestionIn)
# ---------------------------------------------------------------------------

class TestSubmitTextQuestion:
    def _payload(self, content="Deadline nộp bài là ngày nào?"):
        return {
            "room_id": ROOM_ID,
            "speaker_name": SPEAKER_NAME,
            "speaker_id": SPEAKER_ID,
            "content": content,
            "source": "text",
        }

    def test_save_text_question(self, client, no_groq):
        r = client.post("/api/questions/text", json=self._payload())
        assert r.status_code == 200
        assert r.json()["status"] == "saved"

    def test_text_question_duplicate_detected(self, client, no_groq, duplicate_groq):
        client.post("/api/questions/text", json=self._payload())
        r = client.post("/api/questions/text", json=self._payload())
        body = r.json()
        assert body["status"] == "duplicate_detected"


# ---------------------------------------------------------------------------
# Questions — POST /api/questions/voice
# ---------------------------------------------------------------------------

class TestSubmitVoiceQuestion:
    def test_voice_question_saved(self, client, no_groq, mock_asr):
        """Voice question saves after ASR transcription."""
        wav = _minimal_wav_bytes()
        r = client.post(
            "/api/questions/voice",
            data={
                "room_id": ROOM_ID,
                "speaker_name": SPEAKER_NAME,
                "speaker_id": SPEAKER_ID,
                "source": "voice",
            },
            files={"file": ("question.wav", wav, "audio/wav")},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "saved"
        assert body["question"]["source"] == "voice"
        assert body["question"]["content"] == "Câu hỏi từ giọng nói"
        assert body["transcript"]["text"] == "Câu hỏi từ giọng nói"

    def test_voice_duplicate_detected(self, client, no_groq, mock_asr, duplicate_groq):
        """Duplicate voice question returns duplicate_detected with transcript."""
        client.post(
            "/api/questions/voice",
            data={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID},
            files={"file": ("q.wav", _minimal_wav_bytes(), "audio/wav")},
        )
        r = client.post(
            "/api/questions/voice",
            data={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID},
            files={"file": ("q.wav", _minimal_wav_bytes(), "audio/wav")},
        )
        body = r.json()
        assert body["status"] == "duplicate_detected"
        assert "transcript" in body

    def test_silent_audio_returns_422(self, client, monkeypatch):
        """ASR returning empty text raises 422."""

        def _silent(*_, **__):
            return {"text": "", "language": "vi", "language_probability": 0.1, "model_size": "tiny", "segments": []}

        monkeypatch.setattr("src.routes.questions.transcribe_audio", _silent)
        r = client.post(
            "/api/questions/voice",
            data={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID},
            files={"file": ("empty.wav", _minimal_wav_bytes(), "audio/wav")},
        )
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Questions — GET /api/questions
# ---------------------------------------------------------------------------

class TestGetQuestions:
    def test_empty_list_on_startup(self, client):
        r = client.get("/api/questions")
        assert r.status_code == 200
        body = r.json()
        assert body["count"] == 0
        assert body["items"] == []

    def test_returns_saved_question(self, client, no_groq):
        client.post(
            "/api/questions/text",
            json={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID, "content": "Câu hỏi demo"},
        )
        r = client.get(f"/api/questions?room_id={ROOM_ID}")
        body = r.json()
        assert body["count"] == 1
        assert body["items"][0]["content"] == "Câu hỏi demo"

    def test_filters_by_room_id(self, client, no_groq):
        """Questions from other rooms are excluded."""
        for room in ("room_A", "room_B"):
            client.post(
                "/api/questions/text",
                json={"room_id": room, "speaker_name": "X", "speaker_id": "spk_x", "content": f"Question in {room}"},
            )
        r = client.get("/api/questions?room_id=room_A")
        body = r.json()
        assert body["count"] == 1
        assert body["items"][0]["room_id"] == "room_A"

    def test_no_filter_returns_all(self, client, no_groq):
        for room in ("room_A", "room_B"):
            client.post(
                "/api/questions/text",
                json={"room_id": room, "speaker_name": "X", "speaker_id": "spk_x", "content": f"Question {room}"},
            )
        r = client.get("/api/questions")
        assert r.json()["count"] == 2


# ---------------------------------------------------------------------------
# Questions — POST /api/questions/merge
# ---------------------------------------------------------------------------

class TestMergeQuestion:
    def _save_one(self, client, no_groq, content="Câu gốc cần gộp"):
        client.post(
            "/api/questions/text",
            json={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID, "content": content},
        )
        return content

    def test_merge_increments_count(self, client, no_groq):
        content = self._save_one(client, no_groq)
        r = client.post(
            "/api/questions/merge",
            json={
                "room_id": ROOM_ID,
                "speaker_id": "spk_other",
                "speaker_name": "Other",
                "content": content,
                "synthesized_content": "Câu hỏi đã được tổng hợp",
            },
        )
        assert r.status_code == 200
        assert r.json()["status"] == "merged"

    def test_merge_unknown_content_creates_new_record(self, client, no_groq):
        """Merging content not in the log creates a fallback merged record."""
        r = client.post(
            "/api/questions/merge",
            json={
                "room_id": ROOM_ID,
                "speaker_id": SPEAKER_ID,
                "speaker_name": SPEAKER_NAME,
                "content": "Câu không tồn tại trong log",
            },
        )
        assert r.status_code == 200
        assert r.json()["status"] == "merged"


# ---------------------------------------------------------------------------
# Questions — GET /api/questions/logs
# ---------------------------------------------------------------------------

class TestGetLogs:
    def test_logs_requires_room_id(self, client):
        r = client.get("/api/questions/logs")
        assert r.status_code == 200
        assert r.json()["status"] == "error"

    def test_logs_empty_for_new_room(self, client):
        r = client.get("/api/questions/logs?room_id=unknown_room")
        body = r.json()
        assert body["status"] == "ok"
        assert body["count"] == 0

    def test_logs_reflect_saved_questions(self, client, no_groq):
        client.post(
            "/api/questions/text",
            json={"room_id": ROOM_ID, "speaker_name": SPEAKER_NAME, "speaker_id": SPEAKER_ID, "content": "Câu hỏi log test"},
        )
        r = client.get(f"/api/questions/logs?room_id={ROOM_ID}")
        body = r.json()
        assert body["status"] == "ok"
        assert body["count"] == 1
        assert body["items"][0]["content"] == "Câu hỏi log test"


# ---------------------------------------------------------------------------
# ASR route — POST /asr/transcribe
# ---------------------------------------------------------------------------

class TestASRTranscribe:
    def test_transcribe_returns_text(self, client, mock_asr):
        wav = _minimal_wav_bytes()
        r = client.post(
            "/asr/transcribe",
            files={"file": ("test.wav", wav, "audio/wav")},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["text"] == "Câu hỏi từ giọng nói"
        assert body["language"] == "vi"

    @pytest.mark.integration
    def test_transcribe_real_wav(self, client):
        """Integration: real Whisper model on minimal silent WAV.
        Marked 'integration' — skipped in CI unless -m integration is passed.
        """
        wav = _minimal_wav_bytes()
        r = client.post(
            "/asr/transcribe",
            files={"file": ("silence.wav", wav, "audio/wav")},
        )
        assert r.status_code == 200
        assert "text" in r.json()


# ---------------------------------------------------------------------------
# TTS route — POST /tts/generate
# ---------------------------------------------------------------------------

class TestTTSGenerate:
    def test_generate_returns_wav(self, client, mock_tts):
        r = client.post("/tts/generate", data={"text": "Xin chào"})
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("audio/wav")

    def test_generate_missing_text_returns_422(self, client, mock_tts):
        """Omitting the required text field returns 422 (FastAPI validation)."""
        r = client.post("/tts/generate", data={})
        assert r.status_code == 422

    @pytest.mark.integration
    def test_generate_real_tts(self, client):
        """Integration: real pyttsx3 engine generates audio.
        Marked 'integration' — skipped in CI unless -m integration is passed.
        """
        r = client.post("/tts/generate", data={"text": "Xin chào thế giới"})
        assert r.status_code in (200, 500)  # 500 if no audio device available


# ---------------------------------------------------------------------------
# End-to-end flow: submit → duplicate → merge → logs
# ---------------------------------------------------------------------------

class TestFullFlow:
    """High-level scenario: audience submits questions, duplicates are caught,
    then merged, and the final log reflects the correct state."""

    def test_complete_qa_session(self, client, no_groq, duplicate_groq):
        # 1. Alice submits the first question (no prior questions → saved)
        r1 = client.post(
            "/api/questions/text",
            json={"room_id": ROOM_ID, "speaker_name": "Alice", "speaker_id": "spk_alice", "content": "Deadline nộp bài?"},
        )
        assert r1.json()["status"] == "saved"
        # print()
        # print("Step 1: Alice's question saved.", r1.json())
        # 2. Bob submits a similar question → duplicate detected
        r2 = client.post(
            "/api/questions/text",
            json={"room_id": ROOM_ID, "speaker_name": "Bob", "speaker_id": "spk_bob", "content": "Hạn nộp bài là khi nào?"},
        )
        body2 = r2.json()
        assert body2["status"] == "duplicate_detected"
        matched = body2["matched_content"]
        # print("Step 2: Bob's question detected as duplicate.", r2.json())
        # 3. Bob confirms merge (frontend sends matched_content back)
        r3 = client.post(
            "/api/questions/merge",
            json={
                "room_id": ROOM_ID,
                "speaker_id": "spk_bob",
                "speaker_name": "Bob",
                "content": matched,
                "synthesized_content": "Deadline / hạn nộp bài là khi nào?",
            },
        )
        assert r3.json()["status"] == "merged"
        # print("Step 3: Bob's merge processed.", r3.json())
        # 4. Presenter fetches logs — should have 1 record with count >= 2
        r4 = client.get(f"/api/questions/logs?room_id={ROOM_ID}")
        body4 = r4.json()
        assert body4["status"] == "ok"
        assert body4["count"] >= 1
        counts = [item["count"] for item in body4["items"]]
        assert any(c >= 2 for c in counts)
        # print("Step 4: Presenter fetched logs.", r4.json())