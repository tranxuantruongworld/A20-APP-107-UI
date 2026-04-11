from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import sys
import io

# Load biến từ file .env TRƯỚC khi import các service modules
load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Import service modules (sau khi .env đã được load)
from ai_service import get_groq_similarity_check
from storage_service import (
    load_questions_from_file,
    save_question_to_file,
    find_and_update_count,
    create_merged_record,
    get_all_logs
)

app = FastAPI()

# Cấu hình CORS (Bắt buộc để HTML gọi được API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    speaker_id: str
    room_id: str
    speaker_name: str
    content: str
    timestamp: str
    force_save: Optional[bool] = False
    synthesized_content: Optional[str] = None


def check_similarity(new_content: str, room_id: str) -> dict:
    """
    Kiểm tra xem câu hỏi mới có trùng lặp ngữ nghĩa với câu hỏi cũ không.
    Trả về kết quả so sánh từ Groq API kèm theo số người đã hỏi câu tương tự.
    
    Flow:
    1. Load danh sách câu hỏi cũ từ storage
    2. Gọi Groq API để kiểm tra tính trùng lặp
    3. Tìm count của câu trùng
    4. Tạo display message
    """
    try:
        # Bước 1: Load câu hỏi cũ
        print(f"\n🔍 Kiểm tra tính trùng lặp...")
        old_questions_list = load_questions_from_file(room_id)
        
        # Nếu không có câu hỏi cũ, không cần kiểm tra
        if not old_questions_list:
            print(f"ℹ️ File question_log_{room_id}.json rỗng hoặc không tồn tại. Không kiểm tra trùng.")
            return {"is_duplicate": False}
        
        # Bước 2: Gọi Groq API
        result = get_groq_similarity_check(new_content, old_questions_list)
        print(f"📊 Kết quả từ AI: {result}")
        
        # Bước 3: Nếu phát hiện trùng, tính số người quan tâm
        if result.get("is_duplicate"):
            matched_content = result.get("matched_content", "").strip()
            
            # Tìm kiếm câu hỏi cũ tương ứng để lấy count
            others_count = 0
            for item in old_questions_list:
                # So sánh nội dung (loại bỏ khoảng trắng thừa)
                if item["content"].strip() == matched_content:
                    others_count = item.get("count", 1)  # Lấy trực tiếp count từ item
                    break
            
            # Nếu không tìm thấy match chính xác, đặt others_count = 1
            if others_count == 0:
                others_count = 1
            
            # Bước 4: Tạo display message
            display_message = f"Có {others_count} người đã quan tâm đến chủ đề này giống bạn"
            
            result["others_count"] = others_count
            result["display_message"] = display_message
            print(f"📊 Tìm thấy: {others_count} người quan tâm câu: {matched_content[:60]}...")
        
        return result
    
    except Exception as e:
        print(f"✗ LỖI KIỂM TRA TRÙNG LẶP: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {"is_duplicate": False}

@app.post("/api/questions")
async def save_question(question: Question):
    """
    Endpoint lưu câu hỏi mới.
    
    Flow:
    1. Nếu force_save=True: Lưu thẳng không kiểm tra
    2. Nếu không: Kiểm tra tính trùng lặp
    3. Nếu trùng: Trả về kết quả duplicate detection
    4. Nếu không trùng: Lưu vào storage
    """
    try:
        data = question.model_dump()
        room_id = question.room_id
        force_save = question.force_save or False
        
        print(f"\n📨 Nhận yêu cầu từ {question.speaker_id} - Phòng: {room_id}")
        print(f"   Nội dung: {question.content[:80]}...")
        
        # Nếu force_save=True, lưu thẳng mà không kiểm tra
        if force_save:
            print(f"⚡ force_save=True - Bỏ qua kiểm tra trùng, lưu thẳng")
            if save_question_to_file(room_id, data):
                return {"status": "saved", "message": "Lưu thành công (bỏ qua kiểm tra trùng)!"}
            else:
                return {"status": "error", "message": "Lỗi lưu file"}
        
        # Kiểm tra tính trùng lặp
        print(f"🔍 Kiểm tra tính trùng lặp...")
        similarity_result = check_similarity(question.content, room_id)
        print(f"📊 Kết quả: {similarity_result}")
        
        # Nếu phát hiện trùng lặp, trả về kết quả mà không lưu
        if similarity_result.get("is_duplicate"):
            print(f"⚠️ Phát hiện trùng: {similarity_result.get('matched_content', '')[:60]}...")
            print(f"   Số người quan tâm: {similarity_result.get('others_count', 0)}")
            return {
                "status": "duplicate_detected",
                "is_duplicate": True,
                "matched_content": similarity_result.get("matched_content", ""),
                "synthesized_preview": similarity_result.get("synthesized_preview", ""),
                "others_count": similarity_result.get("others_count", 0),
                "display_message": similarity_result.get("display_message", "")
            }
        
        # Không trùng, tiến hành lưu vào file
        print(f"✓ Không phát hiện trùng - Lưu vào file")
        if save_question_to_file(room_id, data):
            return {"status": "saved", "message": "Lưu thành công!"}
        else:
            return {"status": "error", "message": "Lỗi lưu file"}
    
    except Exception as e:
        print(f"✗ LỖI TẠI ENDPOINT SAVE: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}

# Endpoint để xử lý gộp câu hỏi
@app.post("/api/questions/merge")
async def merge_question(question: Question):
    """
    Endpoint gộp câu hỏi trùng.
    
    Flow:
    1. Tìm câu hỏi cũ trong file (dựa trên matched_content)
    2. Tăng count lên 1
    3. Cập nhật nội dung if có synthesized_content
    4. Thêm speaker_id vào involved_speakers
    """
    try:
        room_id = question.room_id
        matched_content = question.content  # Content = matched_content từ frontend
        synthesized_content = question.synthesized_content
        speaker_id = question.speaker_id
        
        print(f"\n🔀 Yêu cầu gộp câu hỏi")
        print(f"   Từ: {speaker_id} - Phòng: {room_id}")
        print(f"   Nội dung câu cũ: {matched_content[:80]}...")
        print(f"   Nội dung gộp: {synthesized_content[:80] if synthesized_content else 'N/A'}...")
        
        # Tìm và cập nhật count của câu hỏi cũ
        result = find_and_update_count(room_id, matched_content, synthesized_content, speaker_id)
        
        if result["success"]:
            return {
                "status": "merged",
                "message": result["message"]
            }
        else:
            # Fallback: Tạo record gộp mới nếu không tìm thấy câu cũ
            print(f"   ⚠️ Không tìm thấy câu cũ, tạo record gộp mới")
            data = question.model_dump()
            if create_merged_record(room_id, data, synthesized_content, speaker_id):
                return {
                    "status": "merged",
                    "message": "Đã tạo record gộp mới thành công!"
                }
            else:
                return {
                    "status": "error",
                    "message": "Không thể tạo record gộp mới"
                }
    
    except Exception as e:
        print(f"✗ LỖI TẠI ENDPOINT MERGE: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}

# Endpoint để lấy logs câu hỏi của một phòng
@app.get("/api/logs")
async def get_logs(room_id: str = None):
    """
    Lấy tất cả câu hỏi đã lưu của một phòng.
    
    Query params:
        room_id: ID phòng (bắt buộc)
    """
    try:
        if not room_id:
            return {"status": "error", "message": "Vui lòng cung cấp room_id"}
        
        data = get_all_logs(room_id)
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Chạy trực tiếp port 8080
    uvicorn.run(app, host="127.0.0.1", port=8080)