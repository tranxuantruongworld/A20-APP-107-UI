from typing import Dict, Any, List, Optional
import google.generativeai as genai
import os
import logging
import json
import sys
from datetime import datetime
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# Handle imports flexibly for both module and script execution
try:
    from ..normalizers import SegmentContextAnalyzer
except (ImportError, ValueError):
    # Fallback for direct script execution
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from normalizers.data_normalizer import SegmentContextAnalyzer

logger = logging.getLogger(__name__)

class MeetingProcessor:
    """
    Post-processing service using Gemini API for Q&A extraction and speaker identification.
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Thiếu GEMINI_API_KEY trong file .env")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemma-3-4b-it')

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((Exception,))
    )
    async def process_transcription(
        self,
        raw_transcription: str,
        segments: List[Dict[str, Any]],
        seminar_title: Optional[str] = None
    ) -> str:
        """
        Process raw transcription and segments into formatted Q&A markdown with retry logic.

        Args:
            raw_transcription: Full text transcription
            segments: List of segments with timestamps and speaker info (snake_case normalized)
            seminar_title: Optional seminar title for context

        Returns:
            Formatted markdown with Q&A pairs and speaker identification
        """
        logger.info(f"Starting Gemini post-processing for seminar: {seminar_title}")
        try:
            # Prepare context from segments
            context = SegmentContextAnalyzer.extract_speaker_context(segments)
            context_prompt = SegmentContextAnalyzer.create_context_prompt(context)
            segments_text = self._format_segments_for_prompt(segments)

            # Create the system prompt with context awareness
            system_prompt = self._create_system_prompt(seminar_title, context_prompt)

            # Create the user prompt with transcription data
            user_prompt = f"""
Dưới đây là bản ghi âm hội thảo với thông tin chi tiết:

{context_prompt}

**Bản ghi đầy đủ:**
{raw_transcription}

**Các đoạn với thời gian và người nói:**
{segments_text}

Hãy xử lý bản ghi này theo hướng dẫn đã nêu.
"""

            # Generate response using Gemini
            response = self.model.generate_content(
                f"{system_prompt}\n\n{user_prompt}",
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent formatting
                    max_output_tokens=8192,
                )
            )

            markdown_result = response.text.strip()

            # Validate and clean the output
            result = self._validate_and_clean_markdown(markdown_result)
            logger.info(f"Gemini post-processing completed for seminar: {seminar_title}")
            return result

        except Exception as e:
            logger.error(f"Error in Gemini post-processing for seminar {seminar_title}: {e}")
            raise Exception(f"LLM post-processing failed: {str(e)}")

    def _format_segments_for_prompt(self, segments: List[Dict[str, Any]]) -> str:
        """Format segments into readable text for the prompt."""
        formatted_segments = []

        for i, segment in enumerate(segments):
            start_time = segment.get('start', 0)
            end_time = segment.get('end', 0)
            text = segment.get('text', '').strip()
            speaker = segment.get('speaker', 'Unknown')

            # Format timestamp as MM:SS
            start_min = int(start_time // 60)
            start_sec = int(start_time % 60)
            end_min = int(end_time // 60)
            end_sec = int(end_time % 60)

            timestamp = f"[{start_min:02d}:{start_sec:02d}-{end_min:02d}:{end_sec:02d}]"

            formatted_segments.append(f"{timestamp} {speaker}: {text}")

        return "\n".join(formatted_segments)

    def _create_system_prompt(self, seminar_title: Optional[str] = None, context: str = "") -> str:
        """Create the system prompt for Gemini with context-aware analysis."""
        title_context = f" của hội thảo '{seminar_title}'" if seminar_title else ""

        return f"""Bạn là một trợ lý AI chuyên nghiệp xử lý bản ghi âm hội thảo{title_context}.

NHIỆM VỤ: Phân tích bản ghi âm và trích xuất thông tin Q&A một cách chính xác.

HƯỚNG DẪN CHI TIẾT:

1. **ĐỊNH DANH VAI TRÒ VÀ ĐÍNH CHÍNH DIARIZATION:**
   - ASR đã cung cấp nhãn người nói (Speaker 1, 2, 3...). Dựa trên ngữ cảnh:
     * Phân loại người nói thành: Diễn giả, MC/Host, Khán giả
     * Có thể gộp hoặc sửa lại nhãn nếu phát hiện lỗi diarization (ví dụ: cùng người được gán 2 ID)
     * Dùng các bằng chứng: nội dung (kỹ thuật → Diễn giả; điều hành → MC), độ dài câu, mẫu hội thoại
   - Nếu không rõ vai trò, sử dụng "Người tham gia X"
   - Đảm bảo nhãn người nói được đính chính trước khi xuất Q&A

2. **BẢO TOÀN VĂN PHONG:**
   - Giữ NGUYÊN 100% văn phong, khẩu ngữ, từ đệm gốc
   - Không sửa đổi, không làm văn vẻ, không thêm thắt
   - Bảo tồn tính tự nhiên của ngôn ngữ nói

3. **TRÍCH XUẤT Q&A:**
   - Tìm tất cả cặp Hỏi - Đáp trong hội thảo
   - Mỗi cặp phải có:
     * **Câu hỏi:** Nội dung câu hỏi (có thể từ khán giả hoặc diễn giả)
     * **Người hỏi:** Vai trò của người đặt câu hỏi (sau khi đã đính chính diarization)
     * **Câu trả lời:** Nội dung trả lời
     * **Người trả lời:** Vai trò của người trả lời (sau khi đã đính chính)
   - Nếu không có câu trả lời rõ ràng, ghi chú "Chưa có câu trả lời"

4. **CẤU TRÚC OUTPUT:**
   - Sử dụng định dạng Markdown chuẩn
   - Bắt đầu bằng tiêu đề hội thảo (nếu có)
   - Liệt kê các cặp Q&A theo thứ tự thời gian
   - Bao gồm timestamp cho mỗi Q&A (nếu có thể xác định)

ĐỊNH DẠNG MARKDOWN:

# Tên Hội Thảo

## Tổng quan
[Thông tin chung về hội thảo]

## Các câu hỏi và trả lời

### Q&A 1 - [Timestamp]
**Câu hỏi từ [Người hỏi]:**
[Đầy đủ nội dung câu hỏi]

**Trả lời từ [Người trả lời]:**
[Đầy đủ nội dung câu trả lời]

### Q&A 2 - [Timestamp]
...

QUAN TRỌNG:
- Chỉ xuất Q&A thực sự, không bịa đặt
- Nếu không có Q&A nào, ghi rõ "Không tìm thấy cặp Q&A rõ ràng trong bản ghi"
- Ưu tiên độ chính xác cao hơn số lượng
- Đảm bảo nhãn người nói được đính chính trước khi xuất Q&A"""

    def _validate_and_clean_markdown(self, markdown: str) -> str:
        """
        Validate and clean the generated markdown.

        Args:
            markdown: Raw markdown from Gemini

        Returns:
            Cleaned and validated markdown
        """
        # Basic validation - ensure it starts with # (heading)
        if not markdown.strip().startswith('#'):
            # Add a default header if missing
            markdown = f"# Bản Ghi Q&A Hội Thảo\n\n{markdown}"

        # Remove any excessive whitespace
        lines = markdown.split('\n')
        cleaned_lines = []

        for line in lines:
            # Remove trailing whitespace
            cleaned_lines.append(line.rstrip())

        # Remove excessive blank lines (more than 2 consecutive)
        final_lines = []
        blank_count = 0

        for line in cleaned_lines:
            if line.strip() == '':
                blank_count += 1
                if blank_count <= 2:
                    final_lines.append(line)
            else:
                blank_count = 0
                final_lines.append(line)

        return '\n'.join(final_lines).strip()

    async def identify_speakers_advanced(
        self,
        raw_segments: list,
        raw_transcription: str
    ) -> list:
        """
        Advanced speaker identification using LLM analysis.

        Args:
            raw_segments: Raw segments with basic speaker info
            raw_transcription: Full transcription text

        Returns:
            Segments with improved speaker identification using LLM
        """
        logger.info("Starting advanced speaker identification with LLM")
        try:
            # Prompt engineering cho Gemini: Yêu cầu phân tích ngữ cảnh và đính chính Diarization
            prompt = f"""
            Bạn là một AI chuyên gia phân tích hội nghị. Dựa trên bản ghi âm thô và các đoạn phân đoạn từ hệ thống ASR, hãy thực hiện các bước sau:

            1. **Phân tích ngữ cảnh**: Đọc toàn bộ bản ghi âm để hiểu nội dung hội nghị, vai trò của từng người nói (ví dụ: người dẫn chương trình, diễn giả, người tham gia Q&A).

            2. **Đính chính Diarization**: Hệ thống ASR đã gán nhãn người nói (speaker ID: 1, 2, 3,...). Nếu nhãn này sai (ví dụ: cùng một người bị gán nhiều ID hoặc ngược lại), hãy gộp hoặc sửa lại nhãn để logic nhất. Sử dụng ngữ cảnh để xác định vai trò thực tế.

            3. **Xuất kết quả**: Trả về danh sách các đoạn phân đoạn đã cập nhật, với nhãn người nói chính xác. Mỗi đoạn bao gồm: id, start_time, end_time, text, speaker (cập nhật nếu cần).

            Dữ liệu đầu vào:
            - Bản ghi âm thô: {raw_transcription}
            - Các đoạn phân đoạn: {json.dumps(raw_segments, ensure_ascii=False)}

            Trả về dưới dạng JSON: {{"updated_segments": [list of updated segments]}}
            """

            # Sử dụng self.model thay vì self.gemini_client (đã sửa lỗi)
            response = await self.model.generate_content_async(prompt)
            result = json.loads(response.text)
            updated_segments = result.get("updated_segments", raw_segments)  # Fallback nếu không có cập nhật
            return updated_segments

        except Exception as e:
            logger.error(f"Error in advanced speaker identification: {e}")
            # Fallback to basic heuristic if LLM fails
            return self._identify_speakers_basic(raw_segments)

    def _create_speaker_identification_prompt(self, segments: List[Dict[str, Any]], raw_transcription: str) -> str:
        """Create prompt for LLM-based speaker identification."""
        # Group segments by speaker for analysis
        speaker_groups = {}
        for segment in segments:
            speaker = str(segment.get('speaker', 'Unknown')).strip()
            if speaker not in speaker_groups:
                speaker_groups[speaker] = []
            speaker_groups[speaker].append(segment)

        # Create analysis text for each speaker
        speaker_analysis = []
        for speaker, speaker_segments in speaker_groups.items():
            # Get sample text from this speaker (first few segments)
            sample_texts = []
            for seg in speaker_segments[:5]:  # Limit to first 5 segments
                text = seg.get('text', '').strip()
                if text:
                    sample_texts.append(f"• {text}")

            speaker_analysis.append(f"""
**{speaker}:**
{chr(10).join(sample_texts)}
""")

        return f"""Bạn là chuyên gia phân tích bản ghi âm hội thảo. Hãy phân tích và định danh vai trò của từng người nói dựa trên nội dung họ nói.

**BẢN GHI ĐẦY ĐỦ:**
{raw_transcription[:2000]}...  # Truncate for token limits

**PHÂN TÍCH CHI TIẾT THEO NGƯỜI NÓI:**
{chr(10).join(speaker_analysis)}

**HƯỚNG DẪN PHÂN LOẠI:**
1. **Diễn giả**: Người trình bày chính, chuyên gia, có nội dung chuyên sâu, giải thích kỹ thuật
2. **MC/Host**: Người điều hành, giới thiệu, đặt câu hỏi cho diễn giả, điều phối chương trình
3. **Khán giả**: Người tham gia từ khán phòng, đặt câu hỏi, thảo luận
4. **Người điều hành kỹ thuật**: Thông báo kỹ thuật, hướng dẫn tham gia

**YÊU CẦU:**
- Phân tích nội dung nói để xác định vai trò
- Sử dụng định dạng: "Tên gốc -> Vai trò mới"
- Nếu không rõ, giữ nguyên hoặc dùng "Người tham gia X"
- Tập trung vào đặc điểm ngôn ngữ và nội dung

**OUTPUT FORMAT:**
Tên gốc 1 -> Diễn giả 1
Tên gốc 2 -> MC 1
Tên gốc 3 -> Khán giả 1
..."""

    def _parse_speaker_identification_response(self, response_text: str) -> Dict[str, str]:
        """Parse LLM response to extract speaker mapping."""
        mapping = {}
        lines = response_text.strip().split('\n')

        for line in lines:
            line = line.strip()
            if '->' in line:
                parts = line.split('->', 1)
                if len(parts) == 2:
                    original = parts[0].strip()
                    new_role = parts[1].strip()
                    mapping[original] = new_role

        return mapping

    def _identify_speakers_basic(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Basic heuristic speaker identification as fallback.

        Args:
            segments: Raw segments with basic speaker info

        Returns:
            Segments with basic speaker normalization
        """
        normalized_segments = []
        speaker_map: Dict[str, str] = {}
        next_generic_index = 1

        for segment in segments:
            speaker = str(segment.get('speaker', 'Unknown')).strip()
            if not speaker or speaker.lower() in ['unknown', 'unk', 'n/a']:
                speaker = 'Unknown'

            if speaker.lower().startswith('speaker'):
                speaker = ' '.join([part.capitalize() for part in speaker.replace('_', ' ').split()])
            elif speaker == 'Unknown':
                speaker = 'Unknown'
            else:
                if speaker not in speaker_map:
                    speaker_map[speaker] = f"Người tham gia {next_generic_index}"
                    next_generic_index += 1
                speaker = speaker_map[speaker]

            normalized_segment = {**segment, 'speaker': speaker}
            normalized_segments.append(normalized_segment)

        return normalized_segments