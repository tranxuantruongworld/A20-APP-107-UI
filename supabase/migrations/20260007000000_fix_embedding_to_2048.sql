-- ============================================
-- FIX VECTOR DIMENSION TO 2048 (NVIDIA MODEL)
-- File: supabase/migrations/20260430_fix_embedding_to_2048.sql
-- ============================================

-- Ensure extension exists
create extension if not exists vector;

-- ============================================
-- SEMINARS.embedding => vector(2048)
-- ============================================

alter table public.seminars
drop column if exists embedding;

alter table public.seminars
add column embedding vector(2048);

-- ============================================
-- QUESTIONS.embedding => vector(2048)
-- ============================================

alter table public.questions
drop column if exists embedding;

alter table public.questions
add column embedding vector(2048);

-- ============================================
-- RECREATE RPC: duplicate detection
-- ============================================

create or replace function public.match_question_duplicates(
  query_embedding vector(2048),
  match_threshold float,
  p_seminar_id uuid
)
returns table (
  id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    q.id,
    1 - (q.embedding <=> query_embedding) as similarity
  from public.questions q
  where q.seminar_id = p_seminar_id
    and q.embedding is not null
    and 1 - (q.embedding <=> query_embedding) > match_threshold
  order by q.embedding <=> query_embedding
  limit 1;
end;
$$;

-- ============================================
-- RECREATE RPC: relevance
-- ============================================

create or replace function public.calculate_relevance(
  question_vec vector(2048),
  p_seminar_id uuid
)
returns float
language plpgsql
as $$
declare
  sim float;
begin
  select
    1 - (embedding <=> question_vec)
  into sim
  from public.seminars
  where id = p_seminar_id;

  return sim;
end;
$$;