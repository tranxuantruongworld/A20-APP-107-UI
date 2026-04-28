-- 1. Table to store ASR voice + text logs per seminar session
create table if not exists public.asr_logs (
  id          uuid        primary key default gen_random_uuid(),
  seminar_id  uuid        not null references public.seminars(id) on delete cascade,
  transcript  text        not null,
  audio_url   text,
  duration_ms integer,
  created_at  timestamptz not null default now()
);

alter table public.asr_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='asr_logs' and policyname='asr_logs_insert') then
    create policy "asr_logs_insert" on public.asr_logs for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='asr_logs' and policyname='asr_logs_select') then
    create policy "asr_logs_select" on public.asr_logs for select using (true);
  end if;
end $$;

-- 2. Add answer_id to questions — points to the asr_log row that answered it
alter table public.questions
  add column if not exists answer_id uuid references public.asr_logs(id) on delete set null;

-- 3. Storage bucket for audio recordings
insert into storage.buckets (id, name, public)
values ('asr-recordings', 'asr-recordings', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='asr_recordings_insert') then
    create policy "asr_recordings_insert" on storage.objects
      for insert with check (bucket_id = 'asr-recordings');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='asr_recordings_select') then
    create policy "asr_recordings_select" on storage.objects
      for select using (bucket_id = 'asr-recordings');
  end if;
end $$;
