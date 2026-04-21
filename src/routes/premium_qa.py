from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, UploadFile, File
from beanie import PydanticObjectId
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import tempfile
import shutil
import logging

from ..models import User, RoleEnum, Seminar
from ..services.premium_qa_service import PremiumQAService
from ..api.deps import RoleChecker
from ..asr.manager import ASRManager
from ..services.post_processing import MeetingProcessor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Premium Q&A"])
STORAGE_DIR = Path("storage/premium_qa")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

async def validate_seminar_speaker(seminar_id: str, current_user: User) -> Seminar:
    """
    Validate that the current user is the speaker/owner of the seminar.
    Only the seminar creator (speaker) can record audio and create Q&A logs.

    Args:
        seminar_id: The seminar ID to validate
        current_user: The current user attempting to access

    Returns:
        Seminar object if validation passes

    Raises:
        HTTPException: If seminar not found or user is not the speaker/owner
    """
    try:
        seminar_obj_id = PydanticObjectId(seminar_id)
        seminar = await Seminar.get(seminar_obj_id)

        if not seminar:
            logger.warning(f"Seminar {seminar_id} not found")
            raise HTTPException(status_code=404, detail="Seminar not found")

        # Check if current user is the seminar creator/speaker
        if str(seminar.user.id) != str(current_user.id):
            logger.warning(f"User {current_user.id} attempted to access seminar {seminar_id} owned by {seminar.user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the seminar speaker/creator can access this resource"
            )

        return seminar

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error validating seminar speaker for {seminar_id}")
        raise HTTPException(status_code=500, detail="Internal error during validation")

async def process_premium_qa_log(log_id: str, audio_path: str):
    log_obj_id = PydanticObjectId(log_id)
    try:
        logger.info(f"Starting background processing for Premium Q&A log {log_id}")
        await PremiumQAService.update_status_to_processing(log_obj_id)

        temp_dir = Path(tempfile.mkdtemp(prefix="premium_qa_"))
        try:
            asr_manager = ASRManager()
            meeting_processor = MeetingProcessor()

            logger.info(f"Processing audio file: {audio_path}")
            asr_result = await asr_manager.process_audio_file(audio_path, str(temp_dir))
            raw_transcription = asr_result.get("transcription", "")
            raw_segments = asr_result.get("segments", []) or []
            metadata = asr_result.get("metadata", {})

            logger.info(f"Performing advanced speaker identification for {len(raw_segments)} segments")
            raw_segments = await meeting_processor.identify_speakers_advanced(raw_segments, raw_transcription)

            logger.info("Generating final Q&A markdown")
            final_markdown = await meeting_processor.process_transcription(
                raw_transcription,
                raw_segments,
            )

            logger.info(f"Updating log {log_id} to completed status")
            await PremiumQAService.update_status_to_completed(
                log_obj_id,
                raw_transcription,
                raw_segments,
                final_markdown,
                metadata
            )
            logger.info(f"Premium Q&A log {log_id} processing completed successfully")

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    except Exception as e:
        logger.exception(f"Premium Q&A background processing failed for log {log_id}: {e}")
        try:
            await PremiumQAService.update_status_to_failed(log_obj_id, str(e))
        except Exception as save_exc:
            logger.exception(f"Failed to update log {log_id} status to failed: {save_exc}")


@router.post("/process-log")
async def trigger_premium_qa_processing(
    seminar_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(lambda: None),  # Will validate later
    audio_file: Optional[UploadFile] = File(None),
    audio_path: Optional[str] = None,
):
    """
    Trigger Premium Q&A log processing for a seminar.

    Only the seminar speaker/creator can trigger this. Creates a new log entry and starts background processing.
    """
    # Validate seminar speaker/ownership first
    seminar = await validate_seminar_speaker(seminar_id, current_user)

    if audio_file is None and not audio_path:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="audio_file or audio_path is required")

    if audio_file is not None:
        file_name = f"premium_qa_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{audio_file.filename}"
        saved_path = STORAGE_DIR / file_name
        with saved_path.open("wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        audio_path = str(saved_path)

    if audio_path is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Missing audio path after upload")

    audio_path_obj = Path(audio_path)
    if not audio_path_obj.exists():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Audio file not found")

    try:
        seminar_obj_id = PydanticObjectId(seminar_id)
        log_entry = await PremiumQAService.create_log_entry(seminar_obj_id, audio_path)
        background_tasks.add_task(process_premium_qa_log, str(log_entry.id), audio_path)

        logger.info(f"Premium Q&A processing started for seminar {seminar_id} by speaker/owner {current_user.id}")

        return {
            "message": "Premium Q&A log processing started",
            "log_id": str(log_entry.id),
            "status": "processing"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to start Premium Q&A processing")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/log/{log_id}")
async def get_premium_qa_log(
    log_id: str,
    current_user: User = Depends(lambda: None)  # Will validate later
):
    """
    Get Premium Q&A log by ID.

    Only the seminar speaker/creator can access this.
    Returns the current status and final markdown if completed.
    """
    try:
        log_obj_id = PydanticObjectId(log_id)
        log_entry = await PremiumQAService.get_log_by_id(log_obj_id)

        if not log_entry:
            raise HTTPException(status_code=404, detail="Log entry not found")

        # Validate seminar speaker/ownership
        await validate_seminar_speaker(str(log_entry.seminar.id), current_user)

        response = {
            "id": str(log_entry.id),
            "seminar_id": str(log_entry.seminar.id),
            "status": log_entry.status.value,
            "created_at": log_entry.created_at,
            "updated_at": log_entry.updated_at,
            "original_audio_path": log_entry.original_audio_path,
            "error_message": log_entry.error_message,
            "processing_started_at": log_entry.processing_started_at,
            "processing_completed_at": log_entry.processing_completed_at,
            "total_chunks": log_entry.total_chunks,
            "processing_time_seconds": log_entry.processing_time_seconds
        }

        if log_entry.status == log_entry.status.COMPLETED:
            response.update({
                "raw_transcription": log_entry.raw_transcription,
                "final_markdown": log_entry.final_markdown
            })

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching Premium Q&A log {log_id}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/logs/seminar/{seminar_id}")
async def get_seminar_qa_logs(
    seminar_id: str,
    current_user: User = Depends(lambda: None)  # Will validate later
):
    """
    Get all Premium Q&A logs for a seminar.

    Only the seminar speaker/creator can access this.
    """
    # Validate seminar speaker/ownership first
    seminar = await validate_seminar_speaker(seminar_id, current_user)

    try:
        seminar_obj_id = PydanticObjectId(seminar_id)
        logs = await PremiumQAService.get_logs_by_seminar(seminar_obj_id)

        return [
            {
                "id": str(log.id),
                "status": log.status.value,
                "created_at": log.created_at,
                "updated_at": log.updated_at,
                "original_audio_path": log.original_audio_path
            }
            for log in logs
        ]

    except Exception as e:
        logger.exception(f"Error listing Premium Q&A logs for seminar {seminar_id}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")