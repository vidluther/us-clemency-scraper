-- Frontend-friendly views that flatten joins for easy querying via PostgREST.
-- These are automatically exposed at /rest/v1/<view_name> with Accept-Profile: pardonned.

-- Pardon detail: flat join of pardon + recipient + presidential_term
CREATE OR REPLACE VIEW pardonned.pardon_detail AS
SELECT
  p.id,
  p.grant_date,
  p.pardon_type,
  p.offense,
  p.district,
  p.warrant_url,
  p.source_url,
  r.id AS recipient_id,
  r.name AS recipient_name,
  pt.id AS presidential_term_id,
  pt.slug AS presidential_term_slug,
  pt.president_name,
  pt.term_number
FROM pardonned.pardon p
JOIN pardonned.recipient r ON r.id = p.recipient_id
JOIN pardonned.presidential_term pt ON pt.id = p.presidential_term_id;

-- Pardon with sentence: includes sentence data via LEFT JOIN (not all pardons have sentences)
CREATE OR REPLACE VIEW pardonned.pardon_with_sentence AS
SELECT
  p.id,
  p.grant_date,
  p.pardon_type,
  p.offense,
  p.district,
  p.warrant_url,
  p.source_url,
  r.id AS recipient_id,
  r.name AS recipient_name,
  pt.slug AS presidential_term_slug,
  pt.president_name,
  pt.term_number,
  s.original_sentence,
  s.sentence_in_months,
  s.fine,
  s.restitution
FROM pardonned.pardon p
JOIN pardonned.recipient r ON r.id = p.recipient_id
JOIN pardonned.presidential_term pt ON pt.id = p.presidential_term_id
LEFT JOIN pardonned.sentences s ON s.pardon_id = p.id;

-- Statistics by term: pardon stats joined with president info
CREATE OR REPLACE VIEW pardonned.statistics_by_term AS
SELECT
  cs.id,
  cs.fiscal_year,
  cs.petitions_received,
  cs.total_granted,
  cs.pardons_granted,
  cs.commutations_granted,
  cs.petitions_denied,
  cs.petitions_closed,
  cs.source_url,
  pt.slug AS presidential_term_slug,
  pt.president_name,
  pt.term_number,
  pt.start_date AS term_start_date,
  pt.end_date AS term_end_date
FROM pardonned.pardon_statistics cs
JOIN pardonned.presidential_term pt ON pt.id = cs.presidential_term_id
ORDER BY cs.fiscal_year DESC;

-- Grant read access on views
GRANT SELECT ON pardonned.pardon_detail TO anon, authenticated;
GRANT SELECT ON pardonned.pardon_with_sentence TO anon, authenticated;
GRANT SELECT ON pardonned.statistics_by_term TO anon, authenticated;
