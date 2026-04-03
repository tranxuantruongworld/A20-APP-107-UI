# Weekly Journal

Ghi lại hành trình xây dựng sản phẩm mỗi tuần — những gì đã làm, học được gì, AI giúp như thế nào.

> **Cập nhật mỗi cuối tuần** (trước khi tạo PR). Không cần dài, chỉ cần thật.

---
## Tuần 1 — 31/03/2026
Thành viên: Bân, Trường, Triển

### Đã làm
- Team up: Các thành viên kết nối, gặp gỡ, thống nhất kênh liên lạc và chọn Trường làm leader.

- Phân tích đề tài: Thảo luận các đề tài gợi ý từ chương trình, đánh giá các đề tài khả thi dựa trên khả năng thực thi, tài nguyên, mức độ hứng thú, timeline dự kiến.

- Tìm hiểu yêu cầu làm việc, cách nộp bài và nhiệm vụ theo ngày/tuần.

- Nghiên cứu sơ bộ:
  + Đọc starter code để hiểu cấu trúc của template "Building AI Agents in Python"
  + Đọc tài liệu Getting Started để nắm các bước setup và nhiệm vụ ban đầu

### Khó nhất tuần này
- Có nhiều đề tài tiềm năng, phải screening để xác định và loại trừ các đề tài phù hợp/không phù hợp.

### AI tool đã dùng
- Claude Code: Giải thích cấu trúc template "Building AI Agents in Python" → Hiểu các thành phần chính và hình dung ra các nhiệm vụ cần thực hiện.
- ChatGPT: Giải thích các thuật ngữ/công nghệ mới trong tech stack cuae các đề tài → Nắm được ở mức tổng quan, tiết kiệm thời gian tra cứu.
- ChatGPT: So sánh, đánh giá các đề tài → Hỗ trợ screening nhanh và có thêm góc nhìn.

### Học được
- Cách tiếp cận đề tài dựa trên đánh giá tính khả thi.
- Cần đặt tiêu chí rõ ràng khi ra quyết định trong team ngay từ đầu.
- Hiểu sơ bộ cấu trúc một project AI Agent.

### Nếu làm lại, sẽ làm khác
- Xác định tiêu chí chọn đề tài ngay từ đầu để giảm thời gian tranh luận.
- Giới hạn chủ đề đề tài cần phân tích để tránh lan man.
- Phân công tìm hiểu song song thay vì tự tìm hiểu độc lập, tuần tự.

### Kế hoạch tuần tới
- Chốt đề tài và phạm vi chính. Brainstorm các hướng mở rộng hoặc điều chỉnh để đảm bảo tính khả thi.
- Phác thảo kiến trúc tổng thể. 
- Xác định tech stack chính.Phân rã task. 
- Làm rõ cách hệ thống hoạt động end-to-end.
- Phân công công việc, thiết lập workflow và timeline.
- Setup cơ bản (môi trường chạy, dependencies, cấu hình `.env`)


## Template

```markdown
## Tuần N — DD/MM/YYYY

### Đã làm
-

### Khó nhất tuần này
-

### AI tool đã dùng
| Tool | Dùng để làm gì | Kết quả |
|---|---|---|
| Claude Code | | |

### Học được
-

### Nếu làm lại, sẽ làm khác
-

### Kế hoạch tuần tới
-
```

---

## Ví dụ

### Tuần 1 — 31/03/2026

**Thành viên:** Nguyễn Văn A, Trần Thị B, Lê Văn C

#### Đã làm
- Setup project TypeScript + cấu hình `.env`
- Xây dựng agent loop cơ bản: nhận input → gọi Claude API → in output
- Thêm tool `search_web` đầu tiên (dùng Brave Search API)
- Viết README cho repo nhóm

#### Khó nhất tuần này
- Tool call response của Claude trả về sai format — mất 2 tiếng debug mới phát hiện ra thiếu `"type": "tool_result"` trong message history.
- Lần đầu dùng TypeScript nên type error khá nhiều, phải học cách dùng `as` và generic.

#### AI tool đã dùng
| Tool | Dùng để làm gì | Kết quả |
|---|---|---|
| Claude Code | Giải thích Anthropic tool use API, debug message format | Giải quyết được bug trong 15 phút |
| Cursor | Autocomplete TypeScript types | Tiết kiệm khoảng 30% thời gian gõ |

#### Học được
- Tool use trong Claude hoạt động theo vòng lặp: model gọi tool → app trả kết quả → model tiếp tục. Cần giữ đúng message history.
- `zod` rất hữu ích để validate tool input schema.
- Nên đặt timeout cho API call ngay từ đầu, không để sau mới thêm.

#### Nếu làm lại, sẽ làm khác
- Setup TypeScript strict mode ngay từ đầu thay vì thêm sau (refactor mệt hơn).
- Viết unit test cho `parseToolCall()` trước khi tích hợp vào agent loop.

#### Kế hoạch tuần tới
- Thêm tool `read_file` và `write_file`
- Implement memory: lưu conversation history vào file JSON
- Thử chạy agent giải 1 bài tập thực tế

---

### Tuần 2 — 07/04/2026

**Thành viên:** Nguyễn Văn A, Trần Thị B, Lê Văn C

#### Đã làm
- Thêm tool `read_file`, `write_file`, `list_dir`
- Agent có thể tự đọc file trong repo và đề xuất refactor
- Implement conversation memory: lưu 20 message gần nhất
- Thử nghiệm: cho agent tự fix 3 bug đơn giản → thành công 2/3

#### Khó nhất tuần này
- Memory bị lỗi khi conversation quá dài (vượt context window). Phải implement sliding window: chỉ giữ system prompt + 20 message gần nhất.
- Agent đôi khi loop vô hạn khi tool trả lỗi — chưa có stop condition tốt.

#### AI tool đã dùng
| Tool | Dùng để làm gì | Kết quả |
|---|---|---|
| Claude Code | Thiết kế sliding window memory, review code agent loop | Phát hiện thêm edge case khi tool throw exception |
| Gemini CLI | So sánh approach lưu memory: file JSON vs SQLite | Tư vấn dùng JSON cho prototype, SQLite khi cần query |

#### Học được
- Context window là resource có hạn — cần thiết kế memory strategy từ sớm.
- Stop condition quan trọng không kém gì agent logic: `max_iterations`, `no_new_tool_calls`, `explicit_done`.
- AI agent review code của mình rất có ích: Claude Code tìm ra 2 potential null pointer mà mình bỏ sót.

#### Nếu làm lại, sẽ làm khác
- Viết interface `Memory` trước, rồi implement sau — thay vì hard-code array từ đầu.
- Log tất cả tool call ra file ngay từ đầu để debug dễ hơn.

#### Kế hoạch tuần tới
- Fix vòng lặp vô hạn: thêm `max_iterations = 10`
- Thêm tool `run_tests` để agent tự kiểm tra code sau khi sửa
- Demo cho instructor cuối tuần
