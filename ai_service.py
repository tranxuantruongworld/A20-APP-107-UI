# """
# AI Service Module - Xử lý tất cả logic liên quan đến Groq API
# """
from groq import Groq
import re
import json
import os

# Khởi tạo Groq Client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_groq_similarity_check(new_content: str, old_questions_list: list) -> dict:
    try:
        # Lấy 10 câu hỏi gần nhất để làm ngữ cảnh
        old_questions_for_prompt = old_questions_list[-10:]
        
        # Dùng dấu gạch đầu dòng (-) thay vì số thứ tự để tránh AI bị nhầm lẫn
        old_questions_str = "\n".join([f"- {q.get('synthesized_content') or q.get('content')}" for q in old_questions_for_prompt])
        
        system_prompt = """Bạn là trợ lý điều phối Q&A. Nhiệm vụ: Kiểm tra trùng lặp ngữ nghĩa giữa CÂU HỎI MỚI và DANH SÁCH CÂU HỎI CŨ.

QUY TẮC BẮT BUỘC:
1. TRÙNG LẶP: Nếu câu mới có cùng ý nghĩa (>85%) với bất kỳ câu cũ nào.
2. MATCHED_CONTENT: Nếu trùng, bạn PHẢI copy nguyên văn câu cũ từ danh sách. 
   - TUYỆT ĐỐI KHÔNG thêm số thứ tự (1, 2, 3), không thêm dấu gạch đầu dòng (-), không thêm ký tự lạ.
   - Chỉ lấy nội dung chữ chính xác của câu cũ.
3. TUYỆT ĐỐI KHÔNG ĐƯỢC TRẢ LỜI CÂU HỎI. synthesized_preview phải là một câu hỏi.
4. FORMAT: Chỉ trả về JSON duy nhất. Không giải thích. Không Markdown.

{
  "is_duplicate": boolean,
  "matched_content": "nội dung chính xác của câu cũ",
  "synthesized_preview": "câu hỏi tổng hợp chuyên nghiệp"
}"""

        user_message = f"""DANH SÁCH CÂU HỎI CŨ:
{old_questions_str}

CÂU HỎI MỚI CẦN KIỂM TRA:
"{new_content}" """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0,  # Giữ độ chính xác tuyệt đối
            max_tokens=500,
            response_format={"type": "json_object"} # Ép Groq trả về JSON chuẩn
        )
        
        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)

        # LỚP VỆ SINH DỮ LIỆU (Regex): Loại bỏ mọi số thứ tự hoặc dấu gạch đầu dòng AI lỡ thêm vào
        if result.get("is_duplicate") and result.get("matched_content"):
            cleaned_content = re.sub(r'^[\d\.\-\s]+', '', result["matched_content"]).strip()
            result["matched_content"] = cleaned_content

            # Logic đếm người quan tâm (Others Count)
            matched = result["matched_content"].lower()
            others_count = 0
            
            for item in old_questions_list:
                content_in_file = (item.get("synthesized_content") or item.get("content", "")).lower()
                if matched in content_in_file or content_in_file in matched:
                    others_count += item.get("count", 1)
            
            # Nếu AI báo trùng nhưng vòng lặp không tìm thấy do lệch ký tự, mặc định là 1
            result["others_count"] = max(1, others_count)
            result["display_message"] = f"Có {result['others_count']} người đã quan tâm đến chủ đề này giống bạn"
            
        return result
    
    except Exception as e:
        print(f"✗ LỖI TẠI HÀM SIMILARITY: {str(e)}")
        return {"is_duplicate": False, "matched_content": "", "synthesized_preview": ""}


# # Khởi tạo Groq Client
# client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# def get_groq_similarity_check(new_content: str, old_questions_list: list) -> dict:
#     """
#     Gọi Groq API để kiểm tra tính trùng lặp ngữ nghĩa.
    
#     Args:
#         new_content: Nội dung câu hỏi mới
#         old_questions_list: Danh sách câu hỏi cũ (list of dicts)
        
#     Returns:
#         dict: {"is_duplicate": bool, "matched_content": str, "synthesized_preview": str}
#     """
#     try:
#         print(f"ℹ️ Đang so sánh câu mới với {len(old_questions_list)} câu cũ...")
        
#         # Tạo prompt để gửi tới Groq (giới hạn 10 câu hỏi gần nhất để tránh quá dài)
#         old_questions_for_prompt = old_questions_list[-10:]
#         old_questions_str = "\n".join([f"{i+1}. {q['content']}" for i, q in enumerate(old_questions_for_prompt)])
        
#         message = f"""Câu hỏi mới: {new_content}

# Danh sách câu hỏi cũ:
# {old_questions_str}

# NHIỆM VỤ: Kiểm tra xem câu hỏi mới có trùng lặp ngữ nghĩa với câu hỏi cũ nào không.
# - Nếu có trùng: Trả về nội dung chính xác của câu cũ bị trùng (từ danh sách trên)
# - Nếu không trùng: Để "matched_content" = "" (rỗng)

# Trả về JSON thuần túy theo cấu trúc (KHÔNG có markdown code block):
# {{"is_duplicate": boolean, "matched_content": "nội dung câu cũ chính xác (nếu trùng)", "synthesized_preview": "câu hỏi tổng hợp mới"}}"""
        
#         # Gọi Groq API
#         response = client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[
#                 {
#                     "role": "system",
#                     "content": """Bạn là một Trợ lý AI chuyên nghiệp điều phối phiên Q&A trực tiếp. Nhiệm vụ của bạn là kiểm tra tính trùng lặp ngữ nghĩa giữa CÂU HỎI MỚI và DANH SÁCH CÂU HỎI CŨ.

# Quy tắc phân tích:
# - Đa ngôn ngữ & Thuật ngữ: Hiểu các thuật ngữ chuyên ngành ('deadline'='hạn chót', 'fix bug'='sửa lỗi')
# - Ngữ nghĩa cốt lõi: Hai câu hỏi là 'Duplicate' nếu chúng hướng đến cùng thông tin cần giải đáp (trùng 85%+)
# - Tính trực tiếp: Câu hỏi mới là ý bổ sung nhỏ → coi là trùng lặp

# QUAN TRỌNG: 
# 1. Khi phát hiện trùng, PHẢI trả về nội dung CHÍNH XÁC của câu cũ từ danh sách (copy-paste từ danh sách)
# 2. Chỉ trả về JSON THUẦN TÚY, KHÔNG CÓ MARKDOWN, KHÔNG CÓ GIẢI THÍCH:
# {"is_duplicate": boolean, "matched_content": "nội dung câu cũ (nếu có)", "synthesized_preview": "câu hỏi tổng hợp chuyên nghiệp"}"""
#                 },
#                 {
#                     "role": "user",
#                     "content": message
#                 }
#             ],
#             temperature=0,  # temperature=0 để AI so sánh chính xác nhất
#             max_tokens=500
#         )
        
#         # Parse kết quả từ Groq
#         result_text = response.choices[0].message.content.strip()
#         print(f"✓ Groq trả về: {result_text}")
        
#         # Tìm JSON trong response (đảm bảo xử lý markdown code block nếu có)
#         start_idx = result_text.find('{')
#         end_idx = result_text.rfind('}')
        
#         if start_idx != -1 and end_idx != -1:
#             json_str = result_text[start_idx:end_idx+1]
#             result = json.loads(json_str)
#             print(f"✓ Parse JSON thành công: is_duplicate={result.get('is_duplicate')}")
#             return result
#         else:
#             print(f"✗ Không tìm thấy JSON trong response: {result_text}")
#             return {"is_duplicate": False}
    
#     except Exception as groq_err:
#         print(f"✗ LỖI GROQ API: {str(groq_err)}")
#         print(f"  Chi tiết: {type(groq_err).__name__}")
#         if hasattr(groq_err, 'response'):
#             print(f"  Response: {groq_err.response}")
#         return {"is_duplicate": False}
