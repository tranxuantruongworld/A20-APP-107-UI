-- Add configuration columns to seminars table
-- This stores session settings from the create session modal

ALTER TABLE seminars
ADD COLUMN IF NOT EXISTS enable_voice_ai BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_upload BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_language TEXT DEFAULT 'vi-VN',
ADD COLUMN IF NOT EXISTS moderation_level TEXT DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS extracted_keywords JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suggested_questions JSONB DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN seminars.enable_voice_ai IS 'Whether Voice AI is enabled for this session';
COMMENT ON COLUMN seminars.enable_upload IS 'Whether slide upload was used';
COMMENT ON COLUMN seminars.voice_language IS 'ASR language code: vi-VN or en-US';
COMMENT ON COLUMN seminars.moderation_level IS 'AI moderation level: strict, moderate, or relaxed';
COMMENT ON COLUMN seminars.extracted_keywords IS 'AI-extracted keywords from uploaded slides (JSON array)';
COMMENT ON COLUMN seminars.suggested_questions IS 'AI-generated suggested questions (JSON array)';
