CREATE SCHEMA IF NOT EXISTS pardonned;

CREATE TABLE pardonned.terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  president_name TEXT NOT NULL,
  term_number SMALLINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pardonned.clemency_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES pardonned.terms(id),
  recipient_name TEXT NOT NULL,
  warrant_url TEXT,
  district TEXT,
  sentence TEXT,
  offense TEXT NOT NULL,
  clemency_type TEXT NOT NULL CHECK (clemency_type IN ('pardon', 'commutation')),
  grant_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(term_id, recipient_name, grant_date, clemency_type)
);

CREATE INDEX idx_clemency_grants_term_id ON pardonned.clemency_grants(term_id);
CREATE INDEX idx_clemency_grants_grant_date ON pardonned.clemency_grants(grant_date);
CREATE INDEX idx_clemency_grants_clemency_type ON pardonned.clemency_grants(clemency_type);

-- Grant API access to the pardonned schema
GRANT USAGE ON SCHEMA pardonned TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA pardonned TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned GRANT ALL ON TABLES TO anon, authenticated;
