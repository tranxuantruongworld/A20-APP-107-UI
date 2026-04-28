-- Interactions table: supports Q&A, Polls, Surveys, Assessments, Word Cloud
CREATE TABLE IF NOT EXISTS public.interactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id      uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL CHECK (type IN ('qa', 'poll', 'survey', 'assessment', 'wordcloud')),
  title           TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN DEFAULT false,
  
  -- Config specific to type
  config          JSONB DEFAULT '{}',
  
  -- Timing
  created_at      timestamptz NOT NULL DEFAULT now(),
  activated_at    timestamptz,
  closed_at       timestamptz,
  
  -- Ordering
  display_order   INTEGER DEFAULT 0
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT USING (true);
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE USING (true);
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE USING (true);

CREATE INDEX idx_interactions_seminar ON public.interactions(seminar_id);
CREATE INDEX idx_interactions_active ON public.interactions(seminar_id, is_active);
CREATE INDEX idx_interactions_type ON public.interactions(type);

-- Poll responses table
CREATE TABLE IF NOT EXISTS public.poll_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id  uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  option_index    INTEGER NOT NULL,
  respondent_id   VARCHAR(255),
  respondent_name VARCHAR(255),
  is_anonymous    BOOLEAN DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_responses_insert" ON public.poll_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "poll_responses_select" ON public.poll_responses FOR SELECT USING (true);

CREATE INDEX idx_poll_responses_interaction ON public.poll_responses(interaction_id);
CREATE INDEX idx_poll_responses_option ON public.poll_responses(interaction_id, option_index);

-- Survey responses table (for longer form surveys)
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id  uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  question_key    VARCHAR(255) NOT NULL,
  response_text   TEXT NOT NULL,
  respondent_id   VARCHAR(255),
  respondent_name VARCHAR(255),
  is_anonymous    BOOLEAN DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_responses_insert" ON public.survey_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_responses_select" ON public.survey_responses FOR SELECT USING (true);

CREATE INDEX idx_survey_responses_interaction ON public.survey_responses(interaction_id);

-- Word Cloud responses table
CREATE TABLE IF NOT EXISTS public.wordcloud_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id  uuid NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  word            VARCHAR(255) NOT NULL,
  respondent_id   VARCHAR(255),
  is_anonymous    BOOLEAN DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wordcloud_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wordcloud_responses_insert" ON public.wordcloud_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "wordcloud_responses_select" ON public.wordcloud_responses FOR SELECT USING (true);

CREATE INDEX idx_wordcloud_responses_interaction ON public.wordcloud_responses(interaction_id);
CREATE INDEX idx_wordcloud_responses_word ON public.wordcloud_responses(word);

-- Presentation materials table
CREATE TABLE IF NOT EXISTS public.presentation_materials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seminar_id      uuid NOT NULL REFERENCES public.seminars(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  file_url        TEXT NOT NULL,
  file_type       VARCHAR(50) NOT NULL,
  file_size       INTEGER,
  uploaded_by     VARCHAR(255),
  is_visible      BOOLEAN DEFAULT true,
  display_order   INTEGER DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_insert" ON public.presentation_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "materials_select" ON public.presentation_materials FOR SELECT USING (true);
CREATE POLICY "materials_update" ON public.presentation_materials FOR UPDATE USING (true);

CREATE INDEX idx_materials_seminar ON public.presentation_materials(seminar_id);

-- Analytics view: Q&A statistics per seminar
CREATE VIEW q_and_a_stats AS
SELECT 
  q.seminar_id,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN q.question_type = 'greeting' THEN 1 END) as greeting_count,
  COUNT(CASE WHEN q.question_type = 'professional' THEN 1 END) as professional_count,
  COUNT(CASE WHEN q.is_answered = true THEN 1 END) as answered_count,
  COUNT(CASE WHEN q.is_answered = false THEN 1 END) as pending_count,
  COUNT(DISTINCT q.author_id) as unique_participants,
  AVG(CASE WHEN q.author_id IS NOT NULL THEN 1 ELSE 0 END) as engagement_rate
FROM questions q
GROUP BY q.seminar_id;

-- Update seminars table to include interaction settings
ALTER TABLE public.seminars
  ADD COLUMN IF NOT EXISTS enable_question_classification BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_polls BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_surveys BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_assessments BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_wordcloud BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_interaction_id uuid REFERENCES public.interactions(id) ON DELETE SET NULL;

CREATE INDEX idx_seminars_current_interaction ON public.seminars(current_interaction_id);

COMMENT ON TABLE public.interactions IS 'Stores different interaction types (Q&A, polls, surveys, etc) for a seminar session';
COMMENT ON TABLE public.poll_responses IS 'Responses to poll interactions';
COMMENT ON TABLE public.survey_responses IS 'Responses to survey interactions';
COMMENT ON TABLE public.wordcloud_responses IS 'Responses to word cloud interactions';
COMMENT ON TABLE public.presentation_materials IS 'Presentation materials and resources uploaded by presenters';
COMMENT ON VIEW q_and_a_stats IS 'Real-time Q&A statistics for analytics dashboard';
