# Worklog

Ghi lại các quyết định kỹ thuật, phân công, và brainstorming của nhóm.

> Cập nhật **bất cứ khi nào** nhóm ra quyết định kỹ thuật quan trọng hoặc thay đổi hướng đi.

---

### [ADR-1] Kiến trúc Giao tiếp Realtime: WebSocket thay vì Polling — 08/04/2026
**Bối cảnh:** Admin Dashboard cần hiển thị câu hỏi từ khán giả ngay lập tức để Moderator duyệt kịp thời trong sự kiện trực tiếp.

**Các lựa chọn đã xem xét:**

- HTTP Polling: Dễ triển khai nhưng gây độ trễ lớn và lãng phí tài nguyên server.

- WebSocket: Kết nối hai chiều liên tục, độ trễ cực thấp, phù hợp cho streaming audio và update UI realtime.

**Quyết định:** Chọn WebSocket để đảm bảo tính thời thực cho luồng đẩy câu hỏi lên Dashboard và truyền nhận audio stream từ client.

**Hệ quả:** Cần xử lý được vấn đề chuyển đổi ARS realtime khi nhận audio stream từ người dùng, đồng bộ realtime với admin dashboard.

### [ADR-2] Đồng bộ hóa Pipeline AI qua Hệ sinh thái Hugging Face — 08/04/2026
**Bối cảnh:** Nhóm cần đảm bảo tính nhất quán giữa các mô hình STT, LLM và TTS để đẩy nhanh tốc độ triển khai và dễ dàng bảo trì code.

**Các lựa chọn đã xem xét:**
- Tự tìm kiếm các mô hình chạy local: Chất lượng thấp, khó triển khai.
- Sử dụng API hỗn hợp (OpenAI, ElevenLabs, Google): Chất lượng cao nhưng khó quản lý key, chi phí biến động và khó đồng bộ hóa định dạng dữ liệu.

- Hệ sinh thái Hugging Face (Transformers, Diffusers, Optimum): Cung cấp thư viện thống nhất, hỗ trợ tải mô hình local (tăng tính riêng tư) và cộng đồng hỗ trợ cực lớn.

**Quyết định:** Sử dụng Hugging Face làm nền tảng chủ đạo cho toàn bộ các mô hình AI trong dự án. Cụ thể:

- STT (Task 3.2): Sử dụng openai/whisper-large-v3 hoặc bản distil qua thư viện transformers.

- LLM (Task 2.2, 2.3): Sử dụng các dòng Open-source như Llama-3 hoặc Mistral-7B để xử lý gộp (clustering) và xếp hạng (ranking).

- TTS (Task 3.3): Triển khai các mô hình TTS từ Hugging Face để chuyển văn bản sang giọng nói.

**Hệ quả:** Đồng bộ hóa định dạng Tensor/Input, dễ dàng tối ưu hóa bằng Hugging Face Optimum (để chạy nhanh hơn trên CPU/GPU). Chấp nhận có thể tốn chi phí để triển khai tại giai đoạn này.

### Sprint 1: 08/04 → 12/04/2026

| Task ID | Người thực hiện | Trạng thái | Note |
| :--- | :--- | :--- | :--- |
| **Task 1.1** | Trường | ⏳ Chờ | |
| **Task 1.2** | Trường | ⏳ Chờ | |
| **Task 2.1** | Bân | 🔄 Đang làm | |
| **Task 2.2** | Bân | ⏳ Chờ | |
| **Task 2.3** | Bân | ⏳ Chờ | |
| **Task 2.4** | Bân | ⏳ Chờ | |
| **Task 3.2** | Triểu, Trường | 🔄 Đang làm | |
| **Task 3.3** | Triểu, Trường | 🔄 Đang làm | |

---


## Template

### Quyết định kỹ thuật

```markdown
### [ADR-N] Tiêu đề quyết định — DD/MM/YYYY

**Bối cảnh:** Vấn đề cần giải quyết là gì?

**Các lựa chọn đã xem xét:**
- Option A: ...
- Option B: ...

**Quyết định:** Chọn option nào và tại sao.

**Hệ quả:** Những gì bị ảnh hưởng / trade-off.
```

### Phân công

```markdown
### Sprint N — DD/MM → DD/MM/YYYY

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| | | | |
```

### Brainstorming

```markdown
### Brainstorm: [Chủ đề] — DD/MM/YYYY

**Câu hỏi:** ...

**Các ý tưởng:**
- Ý tưởng 1: ...
- Ý tưởng 2: ...

**Kết luận:** ...
```

---

## Ví dụ

### [ADR-1] Dùng TypeScript thay vì Python — 30/03/2026

**Bối cảnh:** Cả nhóm cần chọn 1 ngôn ngữ chính để xây dựng agent. Có 2 thành viên quen Python, 1 thành viên quen TypeScript.

**Các lựa chọn đã xem xét:**
- **Python**: Ecosystem ML tốt hơn, syntax đơn giản, thành viên quen hơn.
- **TypeScript**: Type safety, dễ refactor khi project lớn, nhiều library AI mới ra bản TS trước.

**Quyết định:** Chọn TypeScript vì project này focus vào agent architecture, không cần ML library nặng. Type safety sẽ giúp bắt lỗi sớm hơn khi codebase phình ra.

**Hệ quả:** 2 thành viên Python cần học TypeScript cơ bản (ước tính 1 tuần). Sẽ không dùng được `langchain` Python trực tiếp.

---

### [ADR-2] Lưu conversation history bằng file JSON — 03/04/2026

**Bối cảnh:** Agent cần nhớ context giữa các lần chạy. Cần chọn storage.

**Các lựa chọn đã xem xét:**
- **In-memory array**: Đơn giản nhất nhưng mất khi restart.
- **File JSON**: Persistent, không cần setup, dễ inspect bằng tay.
- **SQLite**: Có thể query, tốt cho production nhưng overkill cho prototype.
- **Redis**: Fast nhưng cần chạy thêm service.

**Quyết định:** File JSON cho giai đoạn prototype. Thiết kế interface `MemoryStore` để sau này swap sang SQLite không cần sửa logic agent.

**Hệ quả:** Không query được theo thời gian hay user. Chấp nhận được ở giai đoạn này.

---

### Sprint 1 — 31/03 → 06/04/2026

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| Setup TypeScript project + CI | Văn A | 01/04 | ✅ Xong |
| Implement agent loop cơ bản | Thị B | 02/04 | ✅ Xong |
| Tool: `search_web` (Brave API) | Văn C | 03/04 | ✅ Xong |
| Tool: `read_file`, `write_file` | Thị B | 05/04 | ✅ Xong |
| Conversation memory (JSON) | Văn A | 06/04 | ✅ Xong |
| README + setup docs | Văn C | 06/04 | ✅ Xong |

---

### Sprint 2 — 07/04 → 13/04/2026

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| Fix infinite loop: thêm `max_iterations` | Thị B | 08/04 | 🔄 Đang làm |
| Tool: `run_tests` (chạy pytest) | Văn C | 10/04 | ⏳ Chờ |
| Sliding window memory | Văn A | 09/04 | ⏳ Chờ |
| Demo prep + slides | Cả nhóm | 13/04 | ⏳ Chờ |

---

### Brainstorm: Tính năng cho demo — 05/04/2026

**Câu hỏi:** Demo tuần tới nên show gì để ấn tượng nhất trong 5 phút?

**Các ý tưởng:**
- **Ý tưởng 1 (Văn A):** Cho agent đọc 1 file Python có bug, tự fix, rồi chạy test để verify. Trực quan, dễ hiểu.
- **Ý tưởng 2 (Thị B):** Agent tự build 1 tính năng nhỏ từ mô tả bằng tiếng Việt. Show khả năng hiểu ngôn ngữ tự nhiên.
- **Ý tưởng 3 (Văn C):** Agent review PR, comment vào từng dòng code có vấn đề. Gần với use case thực tế nhất.

**Pros/Cons:**
| Ý tưởng | Pros | Cons |
|---|---|---|
| Fix bug | Dễ làm, chắc chắn chạy được | Ít "wow" hơn |
| Build từ mô tả | Ấn tượng nhất | Có thể fail nếu prompt phức tạp |
| Review PR | Thực tế, liên quan trực tiếp đến khóa học | Cần setup GitHub webhook |

**Kết luận:** Chọn ý tưởng 1 (fix bug) cho demo chính vì đảm bảo. Nếu còn thời gian sẽ show thêm ý tưởng 2 như bonus.

---

### Bug quan trọng: Tool call loop vô hạn — 04/04/2026

**Triệu chứng:** Agent gọi `search_web` liên tục không dừng khi tool trả về lỗi network.

**Root cause:** Không có stop condition khi tool raise exception. Agent nhận `"error": "timeout"` nhưng interpret là cần thử lại.

**Fix:** Thêm 2 điều kiện dừng:
1. `max_iterations = 10` — hard stop sau 10 vòng
2. Nếu tool trả về lỗi 3 lần liên tiếp → dừng và báo user

**Code thay đổi:** `src/agent.ts` lines 45-67

**Học được:** Luôn thiết kế stop condition trước khi implement retry logic.
