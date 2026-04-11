"""
Storage Service Module - Xử lý đọc/ghi JSON, quản lý count và metadata
"""

import json
import os
from typing import List, Dict, Optional


def load_questions_from_file(room_id: str) -> List[Dict]:
    """
    Đọc tất cả câu hỏi từ file question_log_{room_id}.json
    
    Args:
        room_id: ID phòng
        
    Returns:
        List[Dict]: Danh sách câu hỏi với metadata (content, count, is_merged, etc.)
    """
    file_path = f"question_log_{room_id}.json"
    old_questions_list = []
    
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in lines:
                    line = line.strip()
                    if line:  # Bỏ qua dòng trống
                        try:
                            data = json.loads(line)
                            old_questions_list.append({
                                "content": data.get("content", ""),
                                "speaker_id": data.get("speaker_id", ""),
                                "speaker_name": data.get("speaker_name", ""),
                                "count": data.get("count", 1),
                                "is_merged": data.get("is_merged", False),
                                "timestamp": data.get("timestamp", ""),
                                "involved_speakers": data.get("involved_speakers", [])
                            })
                        except json.JSONDecodeError as je:
                            print(f"⚠️ Cảnh báo: Không thể parse JSON line: {line[:50]}... Lỗi: {str(je)}")
                            continue
        except Exception as file_err:
            print(f"⚠️ Cảnh báo: Lỗi đọc file {file_path}: {str(file_err)}")
            return []
    
    return old_questions_list


def save_question_to_file(room_id: str, data: Dict) -> bool:
    """
    Lưu câu hỏi mới vào file (append mode, thêm count=1)
    
    Args:
        room_id: ID phòng
        data: Dữ liệu câu hỏi (dict)
        
    Returns:
        bool: True nếu lưu thành công
    """
    try:
        data["count"] = 1  # Thêm metadata: lần đầu tiên hỏi
        file_path = f"question_log_{room_id}.json"
        
        with open(file_path, "a", encoding="utf-8") as f:
            line = json.dumps(data, ensure_ascii=False)
            f.write(line + "\n")
        
        print(f"✓ Đã lưu: {data['speaker_id']} - Phòng: {room_id}")
        return True
    except Exception as e:
        print(f"✗ LỖI LƯU FILE: {str(e)}")
        return False


def find_and_update_count(room_id: str, matched_content: str, new_content: Optional[str], 
                         speaker_id: str) -> Dict:
    """
    Tìm câu hỏi cũ trong file và tăng count lên 1, cập nhật nội dung nếu có.
    
    Args:
        room_id: ID phòng
        matched_content: Nội dung câu cũ để tìm kiếm
        new_content: Nội dung mới (synthesized_content) - optional
        speaker_id: ID người gộp
        
    Returns:
        Dict: {"success": bool, "message": str, "new_count": int}
    """
    try:
        file_path = f"question_log_{room_id}.json"
        all_lines = []
        found_merge_index = -1
        
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                all_lines = f.readlines()
        else:
            return {"success": False, "message": "File không tồn tại"}
        
        # Tìm dòng có content trùng với matched_content để cập nhật count
        for idx, line in enumerate(all_lines):
            line_stripped = line.strip()
            if line_stripped:
                try:
                    item = json.loads(line_stripped)
                    if item.get("content", "").strip() == matched_content.strip():
                        found_merge_index = idx
                        print(f"   ✓ Tìm thấy câu cũ ở dòng {idx + 1}")
                        break
                except json.JSONDecodeError:
                    continue
        
        # Nếu tìm thấy câu cũ, cập nhật count
        if found_merge_index != -1:
            try:
                old_item = json.loads(all_lines[found_merge_index].strip())
                old_count = old_item.get("count", 1)
                new_count = old_count + 1
                
                # Cập nhật metadata
                old_item["count"] = new_count
                
                if new_content:
                    old_item["content"] = new_content
                    print(f"   ✓ Cập nhật nội dung thành: {new_content[:80]}...")
                
                # Thêm involved_speakers (danh sách người đã gộp vào câu này)
                if "involved_speakers" not in old_item or not isinstance(old_item["involved_speakers"], list):
                    old_item["involved_speakers"] = []
                
                if speaker_id not in old_item["involved_speakers"]:
                    old_item["involved_speakers"].append(speaker_id)
                
                # Cập nhật dòng
                all_lines[found_merge_index] = json.dumps(old_item, ensure_ascii=False) + "\n"
                
                # Ghi lại file
                with open(file_path, "w", encoding="utf-8") as f:
                    f.writelines(all_lines)
                
                print(f"✓ Cập nhật thành công: count {old_count} → {new_count}")
                print(f"   Involved speakers: {old_item.get('involved_speakers', [])}")
                
                return {
                    "success": True,
                    "message": f"Đã gộp & cập nhật câu hỏi thành công! ({new_count} người quan tâm)",
                    "new_count": new_count
                }
            except Exception as update_err:
                print(f"✗ Lỗi cập nhật dòng: {str(update_err)}")
                return {"success": False, "message": f"Lỗi cập nhật: {str(update_err)}"}
        
        # Nếu không tìm thấy câu cũ
        else:
            print(f"   ⚠️ Không tìm thấy câu cũ")
            return {"success": False, "message": "Không tìm thấy câu hỏi cũ"}
    
    except Exception as e:
        print(f"✗ LỖI FIND_AND_UPDATE: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {"success": False, "message": str(e)}


def create_merged_record(room_id: str, data: Dict, synthesized_content: Optional[str], 
                        speaker_id: str) -> bool:
    """
    Tạo record gộp mới (fallback khi không tìm thấy câu cũ)
    
    Args:
        room_id: ID phòng
        data: Dữ liệu gốc
        synthesized_content: Nội dung tổng hợp
        speaker_id: ID người gộp
        
    Returns:
        bool: True nếu tạo thành công
    """
    try:
        data["content"] = synthesized_content if synthesized_content else data["content"]
        data["count"] = 1
        data["is_merged"] = True
        data["involved_speakers"] = [speaker_id]
        
        file_path = f"question_log_{room_id}.json"
        with open(file_path, "a", encoding="utf-8") as f:
            line = json.dumps(data, ensure_ascii=False)
            f.write(line + "\n")
        
        print(f"✓ Tạo record gộp mới thành công")
        return True
    except Exception as e:
        print(f"✗ LỖI CREATE_MERGED: {str(e)}")
        return False


def get_all_logs(room_id: str) -> List[Dict]:
    """
    Lấy tất cả câu hỏi đã lưu của một phòng
    
    Args:
        room_id: ID phòng
        
    Returns:
        List[Dict]: Danh sách dữ liệu
    """
    try:
        file_path = f"question_log_{room_id}.json"
        
        if not os.path.exists(file_path):
            return []
        
        with open(file_path, "r", encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]
    except Exception as e:
        print(f"✗ LỖI GET_ALL_LOGS: {str(e)}")
        return []
