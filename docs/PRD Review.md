
# PRD Review — Voice Agent Moderator

## Điểm mạnh
- PRD cover đầy đủ luồng xử lý từ đề bài: ASR → clustering → ưu tiên → TTS → Q&A log. Nhóm hiểu đúng bài toán.
- Phân tách P0/P1 rõ ràng — MVP scope hợp lý, có acceptance criteria cụ thể (>90% accuracy, 80% duplicate detection).
- Tech stack lựa chọn hợp lý: FastAPI + React + Whisper + pgvector. Đã bắt đầu prototype UI.

## Cần cải thiện
- **Chưa có architecture diagram** — hệ thống có 5+ components kết nối nhau, không có sơ đồ thì mỗi người hình dung khác nhau → conflict khi code.
- **Whisper self-host cần GPU** — Railway/Render free không có GPU. Cần quyết định sớm: dùng API hay self-host, vì ảnh hưởng toàn bộ cách deploy.
- **Chưa rõ deployment plan** — đề bài yêu cầu deployed online, stack nhiều service cần chọn platform sớm.

## Gợi ý tuần này (G2 — hạn cuối tuần)
- **Architecture diagram** → G2 yêu cầu bắt buộc. Vẽ 1 sơ đồ vào `docs/` cho thấy Client → ASR → NLP → DB → Dashboard + TTS kết nối ra sao, ghi rõ protocol (WebSocket/REST).
- **API working** → G2 cần có API chạy được. Setup FastAPI với 1-2 endpoint cơ bản (POST /questions, GET /questions) và deploy lên Railway — có URL thật, không localhost.
- **Quyết định ASR strategy** → Dùng Whisper API ($0.006/phút) cho MVP, self-host để sau. Ghi decision vào WORKLOG.