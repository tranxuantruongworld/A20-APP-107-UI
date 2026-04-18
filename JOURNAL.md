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


---
## Tuần 2 — 10/04/2026

**Thành viên:** tranxuantruongworld, BanBannBannn, trienvtran

### Đã làm
- Hoàn thiện luồng AI trong thư mục `ai` với 2 tính năng chính.
- ASR: chuyển audio sang text bằng Whisper, có CLI để chạy nhanh.
- TTS: chuyển text sang speech theo hướng offline/free.
- Refactor CLI để tách tính năng theo hướng độc lập, tránh xung đột khi phát triển.
- Bổ sung tài liệu sử dụng cho module AI, cập nhật cách chạy và output.
- Cập nhật thêm tài liệu kiến trúc và product docs (PRD review, use case, task/use case).
- Cập nhật cấu hình workspace để giảm nhiễu khi làm việc trong VS Code.
- Có commit merge và review qua các nhánh docs/main/dev trong tuần.

### Khó nhất tuần này
- Tách kiến trúc ASR và TTS để phát triển độc lập nhưng vẫn giữ một entrypoint chung, tránh lỗi phụ thuộc chéo.
- Cân bằng giữa tốc độ chạy thử, tính miễn phí (offline), và độ ổn định khi demo CLI.

### AI tool đã dùng
| Tool | Dùng để làm gì | Kết quả |
|---|---|---|
| Copilot | Hỗ trợ code/refactor luồng CLI, tách ASR-TTS, kiểm tra trước PR | Hoàn thành refactor và chạy test lệnh thành công |

### Học được
- Tách boundary theo feature ngay từ đầu giúp giảm conflict khi mở rộng tính năng.
- Luồng CLI bằng subcommand rõ ràng hơn so với gom tất cả args vào một parser.
- Với bài toán demo nhanh, ưu tiên giải pháp offline/free giúp chủ động hơn khi không có API key.

### Nếu làm lại, sẽ làm khác
- Chốt convention tách module từ đầu sprint để giảm thời gian refactor về sau.
- Viết checklist test cho từng feature sớm hơn (ASR-only, TTS-only, integration).

### Kế hoạch tuần tới
- Hoàn thiện test case cho ASR và TTS riêng biệt.
- Dọn lại output artifacts để tránh commit file sinh tự động không cần thiết.
- Bổ sung docs kiến trúc cho luồng audio end-to-end.
- Chuẩn hóa PR checklist và template mô tả thay đổi theo file.


---
## Tuần 3 — 18/04/2026

**Thành viên:** tranxuantruongworld, BanBannBannn, trienvtran

### Đã làm
- Hoàn thiện API: Xây dựng và đóng gói các endpoint core cho hệ thống, đảm bảo tính kết nối giữa module AI (ASR/TTS) và backend.
- Thiết kế Form khảo sát: Tạo bảng câu hỏi khảo sát bài toán thực tế để thu thập feedback từ người dùng tiềm năng, giúp kiểm chứng giả thuyết sản phẩm.
- Họp chốt MVP: Cùng team thảo luận và thống nhất phạm vi sản phẩm khả thi tối thiểu (MVP). Loại bỏ các tính năng "nice-to-have" để tập trung vào giá trị cốt lõi nhất.
- Chuẩn hóa luồng dữ liệu: Đảm bảo dữ liệu đi từ Audio đầu vào -> AI xử lý -> API response một cách trơn tru.

### Khó nhất tuần này
- Định nghĩa MVP: Việc phải cắt bỏ một số ý tưởng thú vị để đảm bảo tiến độ và tính khả thi của sản phẩm cuối cùng là một thử thách về mặt ra quyết định cho cả team.
- Thiết kế API tối ưu: Phải tính toán cấu trúc JSON trả về sao cho linh hoạt, đủ thông tin cho cả Frontend và các tác vụ hậu xử lý sau này.
### AI tool đã dùng
| Tool | Dùng để làm gì | Kết quả |
|---|---|---|
| Copilot | Gợi ý code boilerplate cho các endpoint API và viết validation logic. | Tăng tốc độ viết code backend, đảm bảo chuẩn RESTful. |

### Học được
- Tư duy MVP: "Làm ít nhưng chất". Tập trung giải quyết triệt để một bài toán nhỏ vẫn tốt hơn làm nhiều tính năng nhưng không hoàn thiện.
- Tầm quan trọng của khảo sát: Việc đặt bút thiết kế form giúp team nhìn nhận lại bài toán dưới góc độ người dùng, thay vì chỉ đứng ở góc độ kỹ thuật.

### Nếu làm lại, sẽ làm khác
- Nên chuẩn bị các bản phác thảo (mockup) đơn giản trước khi họp chốt MVP để mọi người dễ hình dung và ra quyết định nhanh hơn.
### Kế hoạch tuần tới
- Triển khai Integration Test: Test tích hợp toàn bộ luồng từ Client -> API -> AI Module.
- Phân tích dữ liệu từ Form khảo sát để điều chỉnh các tham số AI cho phù hợp thực tế.
- Bắt đầu xây dựng giao diện (Frontend) cơ bản dựa trên các endpoint đã hoàn thiện.
- Hoàn thiện tài liệu API (Swagger/Postman collection).