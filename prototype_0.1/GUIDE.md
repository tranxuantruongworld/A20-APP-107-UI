# WebSpeech AI (demo) - Documentation

## 📁 Cấu Trúc Thư Mục

```
prototype_0.1/
├── main.py                  # Entry point - FastAPI application
├── ai_service.py           # AI/Groq API logic
├── storage_service.py      # JSON storage & data management
├── app.js                  # Frontend JavaScript 
├── demo.html              # HTML template (HTML & CSS)
├── .env                    # Environment variables
├── question_log_*.json     # Data files
└── GUIDE.md
```

## 🔧 Cấu Trúc Logical

### 1. **main.py** - Backend Entry Point
- FastAPI application setup
- CORS configuration
- Request routing & validation
- Tích hợp các service modules

**Imports:**
```python
from ai_service import get_groq_similarity_check
from storage_service import (
    load_questions_from_file,
    save_question_to_file,
    find_and_update_count,
    create_merged_record,
    get_all_logs
)
```

**Endpoints:**
- `POST /api/questions` - Lưu câu hỏi mới
- `POST /api/questions/merge` - Gộp câu hỏi trùng
- `GET /api/logs` - Lấy logs câu hỏi

---

### 2. **ai_service.py** - AI Logic Module
Xử lý logic so sánh ngữ nghĩa và chuẩn hóa dữ liệu thông qua Groq API.

**Hàm chính:**

``` Python
def get_groq_similarity_check(new_content: str, old_questions_list: list) -> dict
``` 
Trách nhiệm:

- AI Inference: Gọi Groq API (Llama 3.1) kiểm tra trùng lặp (>85% ngữ nghĩa) với context 10 câu hỏi gần nhất.

- Data Sanitization: Dùng Regex loại bỏ noise (số thứ tự, bullet points) từ kết quả AI.

- Aggregation Logic: Duyệt danh sách cũ để tính tổng others_count và tạo display_message.

- Response Formatting: Ép kiểu trả về JSON chuẩn (json_object) và xử lý lỗi (Exception handling) để trả về giá trị mặc định an toàn.

**Đầu ra (Dictionary):**

is_duplicate, matched_content, synthesized_preview, others_count, display_message.

**Không phụ thuộc vào:**

- File I/O (Chỉ nhận list từ memory)

- HTTP routes (Chỉ xử lý logic nghiệp vụ AI)
### 3. storage_service.py - Data Storage Module

Xử lý file I/O và quản lý dữ liệu JSON theo từng `room_id`.

---

### Hàm chính

```python
def load_questions_from_file(room_id: str) -> List[Dict]
def save_question_to_file(room_id: str, data: Dict) -> bool
def find_and_update_count(room_id: str, matched_content: str, new_content: Optional[str], speaker_id: str) -> Dict
def create_merged_record(room_id: str, data: Dict, synthesized_content: Optional[str], speaker_id: str) -> bool
def get_all_logs(room_id: str) -> List[Dict]
```

### Trách nhiệm

- **JSON I/O:** Đọc/ghi file `question_log_{room_id}.json` (JSON Lines, append)
- **Count:** Tăng `count` khi trùng, khởi tạo `count = 1` cho câu mới
- **Merge:** Cập nhật `synthesized_content` hoặc tạo record mới (fallback)
- **Speakers:** Quản lý `involved_speakers`
- **Error Handling:** Bỏ qua dòng lỗi, xử lý exception toàn bộ I/O

---

### Đầu ra chính

- **Danh sách câu hỏi + metadata:**  
  `content, count, speaker_id, speaker_name, is_merged, timestamp, involved_speakers`

- **Kết quả cập nhật:**  
  `success, message, new_count`

---

### 4. app.js - Frontend Application

Chứa toàn bộ logic phía client (UI, speech-to-text, API).

---

### Modules

- **User ID Management:** Tạo & lưu `unique_user_id` bằng localStorage
- **Room Management:** Join/leave room, chuyển view (lobby ↔ recording)
- **Status Management:** Cập nhật trạng thái UI, animation, timer
- **Speech Recognition:** Cấu hình & xử lý Web Speech API (start/stop, transcript)
- **Data Sending:** Gửi request API (create, duplicate check, merge, force save)
- **Modal Management:** Hiển thị & xử lý modal (duplicate, confirm leave)

---

### Trách nhiệm

- Quản lý state phía client (`isInRoom`, `pendingQuestion`, UI state)
- Xử lý voice input → chuyển thành text
- Điều phối luồng gửi dữ liệu & xử lý response từ backend
- Hiển thị kết quả (duplicate, merge, success/fail)
- Đảm bảo UX realtime (status, animation, auto-stop)

---

### 5. **demo2.html** - Frontend Template
Chứa HTML & CSS
**Cấu trúc:**
- Header & Navigation
- Lobby View (Sảnh chờ)
- Recording View (Khu vực thu âm)
- Modals (Duplicate detection, Confirm leave)
- Script import:
```html
<script src="app.js" defer></script>
```

---

##  Flow Dữ Liệu

### Scenario 1: Gửi Câu Hỏi Mới

```
Frontend (app.js)
    ↓ sendData()
    ↓
Backend (main.py) POST /api/questions
    ↓
check_similarity()
    ├─ storage_service.load_questions_from_file()
    │   ↓
    │   ai_service.get_groq_similarity_check()
    │   ↓ Return: is_duplicate + others_count + display_message
    ↓
Response:
├─ Nếu trùng: return duplicate_detected + others_count
├─ Nếu không trùng: storage_service.save_question_to_file() → return saved
```

### Scenario 2: Gộp Câu Hỏi

```
Frontend (app.js)
    ↓ handleMerge()
    ↓
Backend (main.py) POST /api/questions/merge
    ↓
storage_service.find_and_update_count()
    ├─ Tìm câu cũ trong file
    ├─ Tăng count: old_count + 1
    ├─ Cập nhật nội dung (synthesized_content)
    ├─ Thêm speaker_id vào involved_speakers
    └─ Ghi lại file
```

---

##  Development Workflow

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
python main.py

# Open frontend
# File → Open → demo2.html (hoặc dùng Live Server)

**File: .env**
```
GROQ_API_KEY=your_api_key_here
```

**Used in:** `ai_service.py` → `Groq(api_key=os.getenv("GROQ_API_KEY"))`

