from __future__ import annotations

import json
import os
import re

from groq import Groq


def _create_groq_client() -> Groq | None:
    """Instantiate a Groq client using the GROQ_API_KEY env var.

    Returns None when the key is missing so callers can skip the API call
    gracefully instead of raising at import time.
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None
    return Groq(api_key=api_key)


def get_groq_similarity_check(new_content: str, old_questions_list: list[dict]) -> dict:
    """Check semantic duplication for a new question against previous questions.

    Calls the Groq llama-3.1-8b-instant model with temperature=0 to compare
    new_content against the last 10 items in old_questions_list.

    Args:
        new_content: The raw text of the incoming question.
        old_questions_list: List of previously saved question dicts that each
            contain at least a ``content`` key (and optionally
            ``synthesized_content`` and ``count``).

    Returns:
        A dict with keys:
        - ``is_duplicate`` (bool): True when semantic overlap > 85%.
        - ``matched_content`` (str): Exact text of the matching old question.
        - ``synthesized_preview`` (str): AI-rewritten question combining both.
        - ``others_count`` (int): Total count of users who asked the same topic.
        - ``display_message`` (str): Human-readable duplicate notice.

        Falls back to ``{"is_duplicate": False, ...}`` on any error or when
        GROQ_API_KEY is not set.
    """
    client = _create_groq_client()
    if client is None:
        return {
            "is_duplicate": False,
            "matched_content": "",
            "synthesized_preview": new_content.strip(),
        }

    try:
        old_questions_for_prompt = old_questions_list[-10:]
        old_questions_str = "\n".join(
            [
                f"- {q.get('synthesized_content') or q.get('content', '')}"
                for q in old_questions_for_prompt
            ]
        )

        system_prompt = """You are a Q&A coordination assistant.
Task: detect semantic duplicate between NEW_QUESTION and OLD_QUESTIONS.

Rules:
1. DUPLICATE if semantic overlap > 85%.
2. If duplicate, matched_content must be copied exactly from old list.
3. Do not answer the question.
4. Return JSON only.

{
  "is_duplicate": boolean,
  "matched_content": "exact old question text",
  "synthesized_preview": "professional synthesized question"
}"""

        user_message = f"""OLD_QUESTIONS:
{old_questions_str}

NEW_QUESTION:
    "{new_content}"""  # noqa: E501

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0,
            max_tokens=500,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)

        if result.get("is_duplicate") and result.get("matched_content"):
            cleaned_content = re.sub(r"^[\d\.\-\s]+", "", result["matched_content"]).strip()
            result["matched_content"] = cleaned_content

            matched = cleaned_content.lower()
            others_count = 0

            for item in old_questions_list:
                content_in_file = (
                    item.get("synthesized_content") or item.get("content", "")
                ).lower()
                if matched in content_in_file or content_in_file in matched:
                    others_count += int(item.get("count", 1))

            result["others_count"] = max(1, others_count)
            result["display_message"] = (
                f"Co {result['others_count']} nguoi da quan tam den chu de nay giong ban"
            )

        return result

    except Exception:
        return {
            "is_duplicate": False,
            "matched_content": "",
            "synthesized_preview": new_content.strip(),
        }
