-- Ensure every existing public table is included in Supabase Realtime.
-- The core schema must already exist; fail clearly if the publication is absent.
DO $$
DECLARE
  table_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    RAISE EXCEPTION 'Required Supabase publication "supabase_realtime" does not exist';
  END IF;

  FOR table_name IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
    ORDER BY CASE c.relkind WHEN 'p' THEN 0 ELSE 1 END, c.relname
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;

  IF to_regclass('public.voice_room_participants') IS NULL THEN
    RAISE EXCEPTION 'Required Realtime table public.voice_room_participants is missing';
  END IF;
END
$$;

-- DELETE events need the channel and username fields for Realtime filtering
-- and participant cleanup, not just the primary key.
ALTER TABLE public.voice_room_participants REPLICA IDENTITY FULL;
