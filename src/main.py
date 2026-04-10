from fastapi import FastAPI
from .routes import health

import os
import shutil
from pathlib import Path
from fastapi import UploadFile, File, BackgroundTasks, Form
from fastapi.responses import FileResponse
from .asr.asr import transcribe_audio
from .tts.tts import text_to_speech
app = FastAPI(title="FastAPI Mongo Starter")

# Đăng ký routes
app.include_router(health.router)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI MongoDB API"}

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

@app.post("/asr/transcribe")
async def api_transcribe_audio(file: UploadFile = File(...)):
    """Endpoint nhận file audio và trả về text (ASR)"""
    file_path = STORAGE_DIR / file.filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        result = transcribe_audio(str(file_path))
        return result
    finally:
        if file_path.exists():
            os.remove(file_path)

# @app.post("/tts/generate")
# async def api_text_to_speech(text: str, background_tasks: BackgroundTasks):
#     """Endpoint nhận text và trả về file âm thanh .wav (TTS)"""
#     output_filename = f"tts_{os.urandom(4).hex()}.wav"
#     output_path = STORAGE_DIR / output_filename
    
#     result = text_to_speech(text, output_path=str(output_path))
    
#     background_tasks.add_task(os.remove, str(output_path))
    
#     return FileResponse(
#         path=output_path, 
#         media_type="audio/wav", 
#         filename="speech.wav"
#     )

@app.post("/tts/generate")
async def api_generate_voice(text: str = Form(...), background_tasks: BackgroundTasks = None):
    """UI gửi text lên -> Nhận về file .wav để phát ra loa"""
    output_filename = f"voice_{os.urandom(4).hex()}.wav"
    output_path = STORAGE_DIR / output_filename
    
    try:
        # Gọi hàm TTS offline (không cần mạng, không cần torch)
        text_to_speech(text, output_path=str(output_path), voice_hint=None)
        
        # Xóa file sau khi gửi xong để tránh đầy bộ nhớ Docker
        background_tasks.add_task(os.remove, str(output_path))
        
        return FileResponse(
            path=output_path, 
            media_type="audio/wav", 
            filename="output.wav"
        )
    except Exception as e:
        return {"status": "error", "message": str(e)}