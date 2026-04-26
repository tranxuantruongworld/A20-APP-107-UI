-- Table to store ASR voice + text logs per seminar session
create table if not exists public.asr_logs (
  id          uuid        primary key default gen_random_uuid(),
  seminar_id  uuid        not null references public.seminars(id) on delete cascade,
  transcript  text        not null,
  audio_url   text,               -- public URL from Supabase Storage (nullable if upload fails)
  duration_ms integer,            -- length of the recorded audio chunk in ms
  created_at  timestamptz not null default now()
);

alter table public.asr_logs enable row level security;

-- Allow anyone (presenter is authenticated via anon key in this app) to insert / select
create policy "asr_logs_insert" on public.asr_logs for insert with check (true);
create policy "asr_logs_select" on public.asr_logs for select using (true);

-- Storage bucket for audio recordings
insert into storage.buckets (id, name, public)
values ('asr-recordings', 'asr-recordings', true)
on conflict (id) do nothing;

-- Allow anyone to upload to asr-recordings bucket
create policy "asr_recordings_insert" on storage.objects
  for insert with check (bucket_id = 'asr-recordings');

-- Allow anyone to read from asr-recordings bucket
create policy "asr_recordings_select" on storage.objects
  for select using (bucket_id = 'asr-recordings');
