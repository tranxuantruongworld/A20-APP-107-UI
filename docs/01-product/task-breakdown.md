Trường: Frontend Developer (User Interface & Dashboard)
Phụ trách: Xây dựng toàn bộ tất cả các giao diện người dùng (khán giả, admin/moderator).

Task 1.1: Web/App cho Khán giả (Audience Interface):
Tạo giao diện cho khán giả nhập câu hỏi bằng văn bản (text).
Tạo giao diện (nút bấm) thu âm trực tiếp âm thanh từ Web/App và đẩy luồng audio (voice stream) xuống backend.
Task 1.2: Admin Dashboard (Moderator UI):
Tạo giao diện realtime nhận và hiển thị danh sách các câu hỏi chờ duyệt.
Giao diện hiển thị các câu hỏi đã được nhóm (clustering) và điểm xếp hạng ưu tiên (ranking).
Các chức năng duyệt, chỉnh sửa hoặc từ chối câu hỏi.
Nút "Play" (phát qua loa - kích hoạt quy trình đọc text qua TTS).
Task 1.3: Giao diện theo dõi sự kiện / Xuất Log:
Hiển thị danh sách các câu hỏi đã được phản hồi.
Nút xuất báo cáo/QA log sau chương trình.


Bân: AI / Backend Engineer (Text, Logic & LLM)
Phụ trách: Xây dựng server backend lõi, lưu trữ và xử lý các luồng ngôn ngữ tự nhiên (NLP/LLM).

Task 2.1: Quản trị luồng CSDL và WebSocket:
Thiết kế database lưu trữ user, question, event_log, v.v.
Thiết lập kênh kết nối Websocket/SSE để đẩy câu hỏi realtime lên Admin Dashboard.

Task 2.2: Tích hợp LLM (Phân loại & Gộp - Clustering):
Viết prompt và gọi API LLM (OpenAI/Claude/..) để nhận dạng và gộp các câu hỏi có nội dung, ý nghĩa trùng lặp thành một câu đại diện.
Task 2.3: Tích hợp LLM (Xếp hạng - Ranking/Relevance):
Viết prompt/logic đánh giá độ liên quan của câu hỏi so với ngữ cảnh sự kiện để gán độ ưu tiên.
Task 2.4: API Lưu trữ và Xuất báo cáo (Q&A Log):
Tổng hợp các câu hỏi và câu trả lời để tạo ra một bản báo cáo hoàn chỉnh phục vụ cho nhu cầu tải Data ở Frontend.

Triểu: Voice Systems Engineer (Audio Pipeline, ASR & TTS)
Phụ trách: Quản lý các luồng dữ liệu Audio, chuyển đổi Giọng nói sang Văn bản.

Task 3.1: Xử lý Luồng Âm Thanh Đầu Vào (Audio Ingestion):
Nhận Audio Streaming từ Micro/Mixer trong hội trường và từ Web/App của khán giả.
Task 3.2: Tích hợp mô hình STT (Speech-to-Text / ASR):
Tích hợp mô hình (như Whisper) để chuyển luồng âm thanh theo thời gian thực thành văn bản text.
Chuyển đoạn text thô (transcript) qua cho Backend/LLM xử lý tiếp.
Task 3.3: Tích hợp mô hình TTS (Text-to-Speech / Voice Agent):
Nhận lệnh "Duyệt câu hỏi" cùng với đoạn văn bản đại diện từ Moderator Dashboard.
Gọi API TTS (như ElevenLabs, Google TTS, OpenAI TTS) để sinh ra file âm thanh.
Task 3.4: Phát Âm Thanh (Audio Playback):
Viết luồng phát đoạn âm thanh (audio file/stream) từ TTS ra cổng âm thanh kết nối với loa hội trường (hoặc trả audio về client nếu cần thiết).