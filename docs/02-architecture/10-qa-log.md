# Premium Q&A Log Technical Guide

## 1. Executive Summary & Feature Scope

### True Intent of the Feature
The Premium Q&A Log feature is designed to transform long-form seminar audio recordings (typically >1 hour) into structured Q&A markdown logs. The core intent is to enable seminar administrators (speakers/owners) to automatically generate comprehensive meeting transcripts with speaker identification, question-answer extraction, and proper formatting while preserving the original Vietnamese language style, colloquialisms, and filler words.

### Boundaries: What This Feature DOES and DOES NOT Touch
**DOES:**
- Process audio files in `src/` directory only
- Handle audio splitting for files >20MB or >10 minutes
- Implement ASR pipeline with Blaze API v2.0 (primary) and OpenAI Whisper (fallback)
- Perform LLM post-processing using Google Gemini for speaker identification and Q&A extraction
- Store processing state and results in MongoDB
- Provide REST API endpoints for triggering and retrieving logs
- Maintain async background processing to avoid blocking API responses
- Enforce seminar ownership validation for authorization

**DOES NOT:**
- Modify any UI components or frontend code
- Change existing database schemas beyond adding PremiumQALog model
- Alter core ASR client implementations outside the premium Q&A context
- Impact other API endpoints or services
- Require changes to authentication/authorization systems beyond seminar ownership checks

## 2. Architecture & Directory Mapping

### Directory Tree
```
src/
├── asr/
│   ├── blaze_client.py          # NEW: Added data normalization, async support
│   ├── manager.py               # NEW: ASR orchestration and failover logic
│   ├── whisper_client.py        # NEW: OpenAI Whisper client implementation
│   └── base_asr_client.py       # NEW: Abstract base class for ASR clients
├── services/
│   ├── post_processing.py       # NEW: LLM service for speaker ID and Q&A extraction
│   └── premium_qa_service.py    # NEW: Data management and status tracking
├── routes/
│   └── premium_qa.py            # NEW: API endpoints for premium Q&A processing
├── utils/
│   └── audio_processor.py       # NEW: Audio chunking utilities
├── normalizers/
│   └── data_normalizer.py       # NEW: Data structure normalization layer
├── models.py                    # MODIFIED: Added PremiumQALog model
├── schemas/
   └── qa_schema.py             # NEW: Pydantic schemas for Q&A data
```

## 3. Implementation Logic (Step-by-Step)

### End-to-End Data Pipeline
1. **Audio Input Validation**: Accept audio file path, validate seminar ownership
2. **Audio Preprocessing**: Split large files (>20MB/>5min) into chunks using silence detection
3. **ASR Processing**: 
   - Primary: Blaze API v2.0 with diarization
   - Fallback: OpenAI Whisper (no diarization)
   - Accumulate timestamp offsets across chunks
4. **Data Normalization**: Convert API responses to standardized internal format
5. **Speaker Mapping**: Merge transcriptions with speaker segments
6. **LLM Post-Processing**: 
   - Speaker identification using content analysis
   - Q&A extraction with role-based formatting
   - Markdown generation with Vietnamese language preservation
7. **Result Storage**: Save final markdown and metadata to MongoDB

### Standard vs Premium Processing Paths

**Full Pipeline:**
- Uses Blaze ASR with diarization for accurate speaker separation
- Applies advanced LLM analysis for speaker role identification
- Extracts structured Q&A pairs with context preservation
- Generates comprehensive markdown with speaker labels

**Fallback:**
- Uses Whisper ASR without diarization (speakers marked as "Unknown")
- Applies basic heuristic speaker identification
- Performs simpler Q&A extraction
- Generates markdown with generic speaker labels

### Hotspots: Areas Requiring Extra Caution in PR Reviews
1. **Data Normalization Layer** (`data_normalizer.py`): Frequently modified when API schemas change
2. **Speaker Identification Prompts** (`post_processing.py`): LLM prompts need testing for accuracy
3. **Authorization Logic** (`routes/premium_qa.py`): Security-critical, validate ownership checks
4. **Audio Chunking Parameters** (`audio_processor.py`): Performance impact on processing time
5. **Database Models** (`models.py`): Schema changes affect multiple services