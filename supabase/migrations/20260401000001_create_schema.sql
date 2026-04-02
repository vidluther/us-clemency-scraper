-- New schema with singular table names
-- Tables: presidential_term, recipient, pardon, sentence, clemency_statistics

CREATE SCHEMA IF NOT EXISTS pardonned;

-- Presidential terms table (renamed from 'terms')
CREATE TABLE pardonned.presidential_term (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  president_name TEXT NOT NULL,
  term_number SMALLINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recipients table (new)
CREATE TABLE pardonned.recipient (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pardons table (renamed from 'clemency_grants')
CREATE TABLE pardonned.pardon (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES pardonned.recipient(id),
  presidential_term_id UUID NOT NULL REFERENCES pardonned.presidential_term(id),
  warrant_url TEXT,
  district TEXT,
  offense TEXT NOT NULL,
  offense_category TEXT NOT NULL CHECK (offense_category IN ('violent crime', 'fraud', 'drug offense', 'FACE act', 'immigration', 'firearms', 'financial crime', 'other')),
  pardon_type TEXT NOT NULL CHECK (pardon_type IN ('pardon', 'commutation')),
  grant_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recipient_id, grant_date, pardon_type)
);

-- Sentences table (new - replaces clemency_sentences)
CREATE TABLE pardonned.sentences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pardon_id UUID NOT NULL REFERENCES pardonned.pardon(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES pardonned.recipient(id) ON DELETE CASCADE,
  sentence_in_months INTEGER,
  fine DECIMAL(18, 2),
  restitution DECIMAL(18, 2),
  original_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- pardonn_statistics table
CREATE TABLE pardonned.pardon_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presidential_term_id UUID NOT NULL REFERENCES pardonned.presidential_term(id),
  fiscal_year INT NOT NULL,
  petitions_received INT,
  total_granted INT,
  pardons_granted INT,
  commutations_granted INT,
  petitions_denied INT,
  petitions_closed INT,
  source_url TEXT NOT NULL DEFAULT 'https://www.justice.gov/pardon/clemency-statistics',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(presidential_term_id, fiscal_year)
);

-- Grant API access to the pardonned schema
GRANT USAGE ON SCHEMA pardonned TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pardonned TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pardonned GRANT ALL ON TABLES TO anon, authenticated, service_role;
