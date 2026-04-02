-- Enable Row Level Security and lock down to read-only for anon/authenticated.
-- The scraper must use the service_role key (bypasses RLS) for write operations.

-- 1. Enable RLS on every table in the pardonned schema
ALTER TABLE pardonned.presidential_term ENABLE ROW LEVEL SECURITY;
ALTER TABLE pardonned.recipient ENABLE ROW LEVEL SECURITY;
ALTER TABLE pardonned.pardon ENABLE ROW LEVEL SECURITY;
ALTER TABLE pardonned.sentences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pardonned.pardon_statistics ENABLE ROW LEVEL SECURITY;

-- 2. Replace the overly permissive GRANT ALL with SELECT-only
REVOKE ALL ON ALL TABLES IN SCHEMA pardonned FROM anon;
GRANT SELECT ON ALL TABLES IN SCHEMA pardonned TO anon;

REVOKE ALL ON ALL TABLES IN SCHEMA pardonned FROM authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA pardonned TO authenticated;

-- 3. Fix default privileges so future tables follow the same pattern
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned
  REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned
  REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned
  GRANT SELECT ON TABLES TO authenticated;

-- 4. Read-only policies for anon
CREATE POLICY "anon_read_presidential_term"
  ON pardonned.presidential_term FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_recipient"
  ON pardonned.recipient FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_pardon"
  ON pardonned.pardon FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_sentence"
  ON pardonned.sentences FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_pardon_statistics"
  ON pardonned.pardon_statistics FOR SELECT TO anon USING (true);

-- 5. Read-only policies for authenticated (same access as anon for this public dataset)
CREATE POLICY "authenticated_read_presidential_term"
  ON pardonned.presidential_term FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_recipient"
  ON pardonned.recipient FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_pardon"
  ON pardonned.pardon FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_sentence"
  ON pardonned.sentences FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_pardon_statistics"
  ON pardonned.pardon_statistics FOR SELECT TO authenticated USING (true);
