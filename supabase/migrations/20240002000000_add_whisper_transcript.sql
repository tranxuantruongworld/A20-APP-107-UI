alter table public.asr_logs
  add column if not exists asr_model        text,
  add column if not exists refine_model     text,
  add column if not exists refined_transcript text;
