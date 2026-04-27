-- ASR Benchmark: stores each head-to-head comparison result
create table if not exists public.asr_benchmarks (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text,
  audio_url     text,
  duration_ms   integer     not null default 0,

  -- Model A
  model_a_name  text        not null,
  model_a_text  text        not null default '',
  model_a_ms    integer     not null default 0,

  -- Model B
  model_b_name  text        not null,
  model_b_text  text        not null default '',
  model_b_ms    integer     not null default 0,

  -- User vote: 'A', 'B', or 'tie'
  winner        text        check (winner in ('A', 'B', 'tie')),

  created_at    timestamptz not null default now()
);

alter table public.asr_benchmarks enable row level security;

create policy "asr_benchmarks_insert" on public.asr_benchmarks
  for insert with check (true);

create policy "asr_benchmarks_select" on public.asr_benchmarks
  for select using (true);

create policy "asr_benchmarks_update" on public.asr_benchmarks
  for update using (true);
