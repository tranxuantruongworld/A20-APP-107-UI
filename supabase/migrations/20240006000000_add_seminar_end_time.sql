-- Add seminar end time to control interaction cut-off for attendees.
ALTER TABLE seminars
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ NULL;

COMMENT ON COLUMN seminars.end_time IS
'When reached, attendees can still view seminar but cannot submit questions or voice input.';
