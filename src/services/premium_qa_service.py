from typing import Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId
from ..models import PremiumQALog, PremiumQALogStatus, Seminar
from ..database import get_database

class PremiumQAService:
    """Service for managing Premium Q&A Log processing and status updates"""

    @staticmethod
    async def create_log_entry(seminar_id: PydanticObjectId, audio_path: str) -> PremiumQALog:
        """Create a new Premium Q&A Log entry in ready state"""
        seminar = await Seminar.get(seminar_id)
        if not seminar:
            raise ValueError(f"Seminar with id {seminar_id} not found")

        log_entry = PremiumQALog(
            seminar=seminar,
            original_audio_path=audio_path,
            status=PremiumQALogStatus.READY
        )
        await log_entry.insert()
        return log_entry

    @staticmethod
    async def update_status_to_processing(log_id: PydanticObjectId) -> PremiumQALog:
        """Update log status to processing and set start time"""
        log_entry = await PremiumQALog.get(log_id)
        if not log_entry:
            raise ValueError(f"Log entry with id {log_id} not found")

        log_entry.status = PremiumQALogStatus.PROCESSING
        log_entry.processing_started_at = datetime.utcnow()
        log_entry.updated_at = datetime.utcnow()
        await log_entry.save()
        return log_entry

    @staticmethod
    async def update_status_to_completed(
        log_id: PydanticObjectId,
        raw_transcription: str,
        raw_segments: list,
        final_markdown: str,
        metadata: Dict[str, Any]
    ) -> PremiumQALog:
        """Update log status to completed with results"""
        log_entry = await PremiumQALog.get(log_id)
        if not log_entry:
            raise ValueError(f"Log entry with id {log_id} not found")

        log_entry.status = PremiumQALogStatus.COMPLETED
        log_entry.raw_transcription = raw_transcription
        log_entry.raw_segments = raw_segments
        log_entry.final_markdown = final_markdown
        log_entry.processing_completed_at = datetime.utcnow()
        log_entry.updated_at = datetime.utcnow()

        # Update metadata
        if 'total_chunks' in metadata:
            log_entry.total_chunks = metadata['total_chunks']
        if 'providers_used' in metadata:
            log_entry.asr_providers_used = metadata['providers_used']
        if 'processing_times' in metadata and metadata['processing_times']:
            log_entry.processing_time_seconds = sum(metadata['processing_times'])

        await log_entry.save()
        return log_entry

    @staticmethod
    async def update_status_to_failed(log_id: PydanticObjectId, error_message: str) -> PremiumQALog:
        """Update log status to failed with error details"""
        log_entry = await PremiumQALog.get(log_id)
        if not log_entry:
            raise ValueError(f"Log entry with id {log_id} not found")

        log_entry.status = PremiumQALogStatus.FAILED
        log_entry.error_message = error_message
        log_entry.processing_completed_at = datetime.utcnow()
        log_entry.updated_at = datetime.utcnow()
        await log_entry.save()
        return log_entry

    @staticmethod
    async def get_log_by_id(log_id: PydanticObjectId) -> Optional[PremiumQALog]:
        """Get log entry by ID"""
        return await PremiumQALog.get(log_id)

    @staticmethod
    async def get_logs_by_seminar(seminar_id: PydanticObjectId) -> list[PremiumQALog]:
        """Get all log entries for a seminar"""
        return await PremiumQALog.find(PremiumQALog.seminar.id == seminar_id).to_list()

    @staticmethod
    async def get_log_status(log_id: PydanticObjectId) -> Optional[Dict[str, Any]]:
        """Get current status and basic info for a log entry"""
        log_entry = await PremiumQALog.get(log_id)
        if not log_entry:
            return None

        return {
            'id': str(log_entry.id),
            'status': log_entry.status.value,
            'created_at': log_entry.created_at,
            'updated_at': log_entry.updated_at,
            'processing_started_at': log_entry.processing_started_at,
            'processing_completed_at': log_entry.processing_completed_at,
            'error_message': log_entry.error_message,
            'total_chunks': log_entry.total_chunks,
            'processing_time_seconds': log_entry.processing_time_seconds
        }