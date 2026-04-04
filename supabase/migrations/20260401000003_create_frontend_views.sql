-- Frontend-friendly views that flatten joins for easy querying via PostgREST.
-- These are automatically exposed at /rest/v1/<view_name> with Accept-Profile: pardonned.

-- Flat view: pardons joined with administration info
CREATE OR REPLACE VIEW pardonned.pardon_details AS
SELECT
  p.id,
  a.id AS administration_id,
  a.slug AS administration_slug,
  p.grant_date,
  p.clemency_type,
  p.offense,
  p.offense_category,
  p.district,
  p.warrant_url,
  p.source_url,
  p.recipient_name,
  p.sentence_in_months,
  p.fine,
  p.restitution,
  p.original_sentence,
  a.president_name,
  a.term_number,
  a.start_date AS term_start_date,
  a.end_date AS term_end_date
FROM pardonned.pardons p
JOIN pardonned.administrations a ON a.id = p.administration;

-- Grant read access on views
GRANT SELECT ON pardonned.pardon_details TO anon, authenticated;
