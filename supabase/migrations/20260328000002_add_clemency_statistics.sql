CREATE TABLE pardonned.clemency_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term_slug TEXT NOT NULL REFERENCES pardonned.terms(slug),
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
  UNIQUE(term_slug, fiscal_year)
);

GRANT ALL ON pardonned.clemency_statistics TO anon, authenticated;
