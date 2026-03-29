export interface ClemencyGrant {
  recipient_name: string;
  warrant_url: string | null;
  district: string | null;
  sentence: string | null;
  offense: string;
  clemency_type: "pardon" | "commutation";
  grant_date: string; // YYYY-MM-DD
  source_url: string;
}

export type PageFormat = "trump2025" | "table-five" | "table-four" | "key-value";

/** Parser output — base_slug (e.g. "obama") since the parser doesn't know the specific term */
export interface ParsedStatRow {
  base_slug: string;
  fiscal_year: number;
  petitions_received: number | null;
  total_granted: number | null;
  pardons_granted: number | null;
  commutations_granted: number | null;
  petitions_denied: number | null;
  petitions_closed: number | null;
}

/** DB row shape — term_slug resolved by the scraper via terms table lookup */
export interface ClemencyStatRow {
  term_slug: string;
  fiscal_year: number;
  petitions_received: number | null;
  total_granted: number | null;
  pardons_granted: number | null;
  commutations_granted: number | null;
  petitions_denied: number | null;
  petitions_closed: number | null;
  source_url: string;
}

export interface PresidentSource {
  /** Slugs this source covers (single or pipe-separated for multi-term) */
  slugs: string[];
  /** Combined page with both pardons and commutations (Trump 2025 style) */
  combined?: string;
  /** Separate pardons page */
  pardons?: string;
  /** Separate commutations page */
  commutations?: string;
}
