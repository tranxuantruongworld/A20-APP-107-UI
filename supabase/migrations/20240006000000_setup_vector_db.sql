-- 1. Bật pgvector (để lưu mảng số)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Thêm cột description VÀ embedding cho hội thảo 
ALTER TABLE public.seminars 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Thêm cột cho bảng questions (lưu vector câu hỏi, độ liên quan và cờ nhạy cảm)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS embedding vector(768),
ADD COLUMN IF NOT EXISTS relevance_score float,
ADD COLUMN IF NOT EXISTS is_sensitive boolean DEFAULT false;

-- 4. Tạo hàm RPC tìm câu hỏi trùng lặp trong cùng 1 hội thảo
CREATE OR REPLACE FUNCTION match_question_duplicates(
  query_embedding vector(768),
  match_threshold float,
  p_seminar_id uuid
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM questions q
  WHERE q.seminar_id = p_seminar_id
    AND q.embedding IS NOT NULL
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT 1; -- Chỉ lấy câu giống nhất
END;
$$;

-- 5. Tạo hàm RPC tính độ liên quan giữa câu hỏi và hội thảo
CREATE OR REPLACE FUNCTION calculate_relevance(
  question_vec vector(768),
  p_seminar_id uuid
)
RETURNS float
LANGUAGE plpgsql
AS $$
DECLARE
  sim float;
BEGIN
  SELECT 1 - (embedding <=> question_vec) INTO sim
  FROM seminars
  WHERE id = p_seminar_id;
  RETURN sim;
END;
$$;