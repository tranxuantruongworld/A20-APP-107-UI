from __future__ import annotations

import json
from pathlib import Path
from typing import Optional


STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)


def _question_log_path(room_id: str) -> Path:
    """Return the JSONL log file path for a given room."""
    return STORAGE_DIR / f"question_log_{room_id}.json"


def load_questions_from_file(room_id: str) -> list[dict]:
    """Load all questions for a room from its JSONL log file.

    Each line in the file is a JSON object. Malformed lines are silently
    skipped. Returns an empty list when the file does not exist.

    Args:
        room_id: Unique identifier for the conference room.

    Returns:
        List of question dicts with keys: content, speaker_id, speaker_name,
        count, is_merged, timestamp, involved_speakers, synthesized_content.
    """
    file_path = _question_log_path(room_id)
    old_questions_list: list[dict] = []

    if not file_path.exists():
        return old_questions_list

    try:
        with file_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue

                old_questions_list.append(
                    {
                        "content": data.get("content", ""),
                        "speaker_id": data.get("speaker_id", ""),
                        "speaker_name": data.get("speaker_name", ""),
                        "count": data.get("count", 1),
                        "is_merged": data.get("is_merged", False),
                        "timestamp": data.get("timestamp", ""),
                        "involved_speakers": data.get("involved_speakers", []),
                        "synthesized_content": data.get("synthesized_content", ""),
                    }
                )
    except Exception:
        return []

    return old_questions_list


def save_question_to_file(room_id: str, data: dict) -> bool:
    """Append a question record to the room's JSONL log file.

    Adds ``count=1`` to the record if not already present. Each record is
    written as a single JSON line (append mode).

    Args:
        room_id: Unique identifier for the conference room.
        data: Question dict to persist.

    Returns:
        True on success, False on any I/O error.
    """
    try:
        line_data = dict(data)
        line_data["count"] = int(line_data.get("count", 1) or 1)

        file_path = _question_log_path(room_id)
        with file_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(line_data, ensure_ascii=False) + "\n")
        return True
    except Exception:
        return False


def find_and_update_count(
    room_id: str,
    matched_content: str,
    new_content: Optional[str],
    speaker_id: str,
) -> dict:
    """Find a question in the JSONL log by its content and increment its count.

    Also updates ``content``/``synthesized_content`` when new_content is
    provided, and appends speaker_id to ``involved_speakers``.

    Args:
        room_id: Unique identifier for the conference room.
        matched_content: Exact content string used to locate the record.
        new_content: Optional synthesized text to overwrite the existing content.
        speaker_id: ID of the speaker being merged into the existing question.

    Returns:
        Dict with keys:
        - ``success`` (bool)
        - ``message`` (str): Human-readable outcome.
        - ``new_count`` (int): Updated count (only present on success).
    """
    try:
        file_path = _question_log_path(room_id)
        if not file_path.exists():
            return {"success": False, "message": "File does not exist"}

        all_lines = file_path.read_text(encoding="utf-8").splitlines(keepends=True)
        found_merge_index = -1

        for idx, line in enumerate(all_lines):
            line_stripped = line.strip()
            if not line_stripped:
                continue
            try:
                item = json.loads(line_stripped)
            except json.JSONDecodeError:
                continue

            if item.get("content", "").strip() == matched_content.strip():
                found_merge_index = idx
                break

        if found_merge_index == -1:
            return {"success": False, "message": "Matched question not found"}

        old_item = json.loads(all_lines[found_merge_index].strip())
        old_count = int(old_item.get("count", 1) or 1)
        new_count = old_count + 1
        old_item["count"] = new_count

        if new_content:
            old_item["content"] = new_content
            old_item["synthesized_content"] = new_content

        involved_speakers = old_item.get("involved_speakers")
        if not isinstance(involved_speakers, list):
            involved_speakers = []
        if speaker_id and speaker_id not in involved_speakers:
            involved_speakers.append(speaker_id)
        old_item["involved_speakers"] = involved_speakers

        all_lines[found_merge_index] = json.dumps(old_item, ensure_ascii=False) + "\n"
        file_path.write_text("".join(all_lines), encoding="utf-8")

        return {
            "success": True,
            "message": f"Merged successfully ({new_count} users interested)",
            "new_count": new_count,
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def create_merged_record(
    room_id: str,
    data: dict,
    synthesized_content: Optional[str],
    speaker_id: str,
) -> bool:
    """Fallback: create a brand-new merged record when the original is not found.

    Sets ``is_merged=True``, ``count=1``, and records speaker_id as the sole
    entry in ``involved_speakers``.

    Args:
        room_id: Unique identifier for the conference room.
        data: Original question payload dict.
        synthesized_content: Synthesized text to use as the record's content.
        speaker_id: ID of the speaker initiating the merge.

    Returns:
        True on success, False on any I/O error.
    """
    try:
        merged_data = dict(data)
        merged_data["content"] = synthesized_content or merged_data.get("content", "")
        merged_data["synthesized_content"] = synthesized_content or merged_data.get(
            "synthesized_content", ""
        )
        merged_data["count"] = 1
        merged_data["is_merged"] = True
        merged_data["involved_speakers"] = [speaker_id] if speaker_id else []
        return save_question_to_file(room_id, merged_data)
    except Exception:
        return False


def get_all_logs(room_id: str) -> list[dict]:
    """Return all raw question records from a room's JSONL log file.

    Unlike ``load_questions_from_file``, this returns the full record as
    stored on disk without reshaping the fields.

    Args:
        room_id: Unique identifier for the conference room.

    Returns:
        List of raw question dicts. Returns an empty list when the file does
        not exist or cannot be read.
    """
    file_path = _question_log_path(room_id)
    if not file_path.exists():
        return []

    rows: list[dict] = []
    try:
        with file_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except Exception:
        return []
    return rows
