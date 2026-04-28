-- Add question_type column to questions table
-- Supports: 'greeting', 'professional', 'unknown'
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'unknown';

-- Add classification_enabled column to seminars table
-- Controls whether classification badges are shown for this session
ALTER TABLE seminars
ADD COLUMN IF NOT EXISTS classification_enabled BOOLEAN DEFAULT true;

-- Create index on question_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);

-- Optional: Create index on classification status for analytics
CREATE INDEX IF NOT EXISTS idx_seminars_classification ON seminars(classification_enabled);

-- Comment for documentation
COMMENT ON COLUMN questions.question_type IS 'Classification of question: greeting, professional, or unknown. Phase 1 foundation for future full categorization.';
COMMENT ON COLUMN seminars.classification_enabled IS 'Whether to display classification badges for questions in this session. Default true - visible to all.';
