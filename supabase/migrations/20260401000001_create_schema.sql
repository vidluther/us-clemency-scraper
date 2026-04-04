-- Schema for presidential clemency data
-- Tables: administrations, pardons

CREATE SCHEMA IF NOT EXISTS pardonned;

-- Presidential administrations table
CREATE TABLE pardonned.administrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  president_name TEXT NOT NULL,
  term_number SMALLINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pardons table (flat: recipient + sentence data included)
CREATE TABLE pardonned.pardons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  administration UUID NOT NULL REFERENCES pardonned.administrations(id),
  recipient_name TEXT NOT NULL,
  clemency_type TEXT NOT NULL CHECK (clemency_type IN ('pardon', 'commutation')),
  grant_date DATE NOT NULL,
  warrant_url TEXT,
  source_url TEXT,
  district TEXT,
  offense TEXT NOT NULL,
  offense_category TEXT NOT NULL CHECK (offense_category IN (
    'violent crime', 'fraud', 'drug offense', 'FACE act',
    'immigration', 'firearms', 'financial crime', 'other'
  )),
  sentence_in_months INTEGER,
  fine DECIMAL(18, 2),
  restitution DECIMAL(18, 2),
  original_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(administration, recipient_name, grant_date, clemency_type)
);

-- Grant API access to the pardonned schema
GRANT USAGE ON SCHEMA pardonned TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pardonned TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned GRANT ALL ON TABLES TO anon, authenticated, service_role;
