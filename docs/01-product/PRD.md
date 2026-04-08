# PRD: Hệ thống Quản lý Q&A Trực Tiếp (Voice Agent Moderator)
**Version:** MVP v0.1  
**Project ID:** AI20K-168  
**Status:** Draft for Planning  

---

## 1. Giới thiệu dự án (Overview)
Dự án nhằm giải quyết tình trạng hỗn loạn trong các phiên Q&A tại hội thảo bằng cách sử dụng Trợ lý ảo (Voice Agent). Hệ thống sẽ thay thế hoặc hỗ trợ Moderator con người trong việc thu thập, phân loại và điều phối luồng đặt câu hỏi.

### Mục tiêu của MVP v0.1:
- Xây dựng luồng xử lý giọng nói thời gian thực (Real-time Pipeline).
- Tự động hóa khâu lọc và nhóm câu hỏi trùng lặp để tiết kiệm thời gian.
- Xuất báo cáo (Log) sau sự kiện một cách tự động.

---

## 2. Luồng nghiệp vụ (User Flow)
1. **Khán giả:** Phát biểu qua micro hoặc ứng dụng web.
2. **Hệ thống (ASR):** Chuyển đổi giọng nói thành văn bản ngay lập tức.
3. **Bộ não AI (NLP):**
    - Phân tích nội dung.
    - Nhóm các câu hỏi có cùng chủ đề.
    - Đánh giá mức độ ưu tiên (Relevance).
4. **Voice Agent (TTS):** Đọc câu hỏi đã được tổng hợp cho Diễn giả trả lời.
5. **Admin Dashboard:** Moderator (người thật) giám sát, có quyền can thiệp (Bỏ qua/Ưu tiên) câu hỏi.

---

## 3. Danh sách tính năng (Scope of Work)

### 3.1. Nhóm tính năng Core (P0 - Phải có trong v0.1)
* **Real-time Transcription:** Chuyển giọng nói tiếng Việt sang văn bản với độ trễ < 2s.
* **Question Clustering:** Thuật toán sử dụng Vector Similarity để nhóm các câu hỏi trùng ý tứ.
* **Summarization:** Tóm tắt các câu hỏi dài dòng thành ý chính súc tích.
* **Basic Dashboard:** Giao diện web hiển thị danh sách câu hỏi đang chờ theo thứ tự ưu tiên.

### 3.2. Nhóm tính năng bổ trợ (P1 - Ưu tiên sau)
* **Speaker Diarization:** Phân biệt danh tính người hỏi dựa trên giọng nói.
* **Tone of Voice:** Tùy chỉnh giọng đọc của Voice Agent (Nam/Nữ, Trang trọng/Thân thiện).
* **Integration:** Kết nối hiển thị câu hỏi lên màn hình LED của hội trường.

---

## 4. Đặc tả kỹ thuật đề xuất (Tech Stack)

| Thành phần | Công nghệ | Lý do chọn |
| :--- | :--- | :--- |
| **Frontend** | React + Tailwind CSS | Đảm bảo tốc độ phản hồi và dễ scale giao diện quản lý. |
| **Backend** | FastAPI (Python) | Tối ưu cho xử lý dữ liệu AI và WebSockets (Real-time). |
| **Speech-to-Text** | Whisper Large-v3 (Turbo) | Hiện là SOTA cho tiếng Việt, có thể tự host để giảm latency. |
| **LLM Engine** | GPT-4o / Claude 3.5 | Xử lý logic hội thoại và phân loại câu hỏi phức tạp. |
| **Text-to-Speech** | FPT.AI hoặc Azure TTS | Giọng đọc tiếng Việt tự nhiên nhất hiện nay. |
| **Database** | MongoDB + Atlas Vector Search | Phù hợp với schema linh hoạt của Q&A metadata và vẫn hỗ trợ semantic search. |

---

## 5. Kế hoạch Planning & Rủi ro (Risk Management)

### Các điểm cần làm kỹ trong khâu Planning:
1.  **Xử lý Noise (Tiếng ồn):** Môi trường hội thảo rất nhiễu. Cần xác định filter lọc tạp âm đầu vào.
2.  **Độ trễ hệ thống:** Cần đo lường tổng thời gian (Round-trip time) từ lúc nhận audio đến khi AI phát ngôn. Mục tiêu v0.1 là < 5 giây.
3.  **Kịch bản dự phòng:** Nếu AI không hiểu câu hỏi (Hallucination), Moderator người thật phải có nút bấm "Mute" hoặc "Skip" ngay lập tức.

---

## 6. Tiêu chí nghiệm thu (Acceptance Criteria)
- [ ] Hệ thống nhận diện đúng > 90% nội dung câu hỏi tiếng Việt thông thường.
- [ ] Tự động phát hiện và cảnh báo được ít nhất 80% câu hỏi trùng lặp.
- [ ] Dashboard cập nhật dữ liệu real-time qua WebSockets mà không cần load lại trang.
- [ ] Xuất được file Excel/Markdown log Q&A ngay sau khi đóng phiên.

---