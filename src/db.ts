import { createClient } from "@supabase/supabase-js";
import type { ClemencyGrant, ClemencyStatRow } from "./parsers/types.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const SCHEMA = "pardonned";

/** Query helper that scopes all queries to the pardonned schema */
function from(table: string) {
  return supabase.schema(SCHEMA).from(table);
}

/** Cache of slug → term UUID */
const termIdCache = new Map<string, string>();

export async function getTermId(slug: string): Promise<string> {
  const cached = termIdCache.get(slug);
  if (cached) return cached;

  const { data, error } = await from("terms")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(`Term not found for slug "${slug}": ${error?.message}`);
  }

  termIdCache.set(slug, data.id);
  return data.id;
}

export async function getTermForDate(
  slugs: string[],
  grantDate: string,
): Promise<string> {
  // If only one slug, use it directly
  if (slugs.length === 1) return slugs[0];

  // For multi-term presidents, find the matching term by date
  const { data, error } = await from("terms")
    .select("id, slug, start_date, end_date")
    .in("slug", slugs)
    .order("start_date");

  if (error || !data?.length) {
    throw new Error(`Terms not found for slugs ${slugs.join(", ")}`);
  }

  for (const term of data) {
    const start = term.start_date;
    const end = term.end_date || "9999-12-31";
    if (grantDate >= start && grantDate < end) {
      termIdCache.set(term.slug, term.id);
      return term.slug;
    }
  }

  // Fallback to last term
  const last = data[data.length - 1];
  termIdCache.set(last.slug, last.id);
  return last.slug;
}

// ---------------------------------------------------------------------------
// Term resolution for statistics
// ---------------------------------------------------------------------------

interface TermRecord {
  slug: string;
  start_date: string;
  end_date: string | null;
}

/** Fetch all terms from the DB, ordered by start_date */
export async function getAllTerms(): Promise<TermRecord[]> {
  const { data, error } = await from("terms")
    .select("slug, start_date, end_date")
    .order("start_date");

  if (error || !data) {
    throw new Error(`Failed to fetch terms: ${error?.message}`);
  }

  return data;
}

/**
 * Map a base_slug (e.g. "obama") + fiscal year → specific term slug (e.g. "obama-1").
 *
 * Uses the fiscal year start date as a representative date:
 *   - FY ≤ 1976: starts Jul 1 of (FY-1)   (old FY calendar)
 *   - FY > 1976: starts Oct 1 of (FY-1)    (modern FY calendar)
 *
 * Finds the term whose [start_date, end_date) range covers that date.
 */
export function resolveTermSlug(
  baseSlug: string,
  fiscalYear: number,
  allTerms: TermRecord[],
): string {
  const matching = allTerms.filter(
    (t) => t.slug === baseSlug || t.slug.startsWith(baseSlug + "-"),
  );

  if (matching.length === 0) {
    throw new Error(`No term found matching base slug "${baseSlug}"`);
  }
  if (matching.length === 1) return matching[0].slug;

  // Multiple terms — use FY start date to pick the right one
  const month = fiscalYear <= 1976 ? "07" : "10";
  const repDate = `${fiscalYear - 1}-${month}-01`;

  // Search from newest to oldest, return first term whose start_date ≤ repDate
  const sorted = [...matching].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  );
  for (const term of sorted) {
    if (repDate >= term.start_date) return term.slug;
  }

  // Fallback to earliest term
  return matching[0].slug;
}

export async function upsertGrants(
  grants: ClemencyGrant[],
  slugs: string[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Process in batches of 50
  for (let i = 0; i < grants.length; i += 50) {
    const batch = grants.slice(i, i + 50);

    const rows = await Promise.all(
      batch.map(async (g) => {
        const slug = await getTermForDate(slugs, g.grant_date);
        const termId = await getTermId(slug);
        return {
          term_id: termId,
          recipient_name: g.recipient_name,
          warrant_url: g.warrant_url,
          district: g.district,
          sentence: g.sentence,
          offense: g.offense,
          clemency_type: g.clemency_type,
          grant_date: g.grant_date,
          source_url: g.source_url,
        };
      }),
    );

    // Deduplicate within the batch by unique key
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const key = `${r.term_id}|${r.recipient_name}|${r.grant_date}|${r.clemency_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length < rows.length) {
      console.log(
        `  Deduped batch at index ${i}: ${rows.length} → ${deduped.length}`,
      );
    }

    const { data, error } = await from("clemency_grants")
      .upsert(deduped, {
        onConflict: "term_id,recipient_name,grant_date,clemency_type",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.error(`Error upserting batch at index ${i}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return { inserted, skipped };
}

export async function upsertStatistics(
  rows: ClemencyStatRow[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Process in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);

    const { data, error } = await from("clemency_statistics")
      .upsert(batch, {
        onConflict: "term_slug,fiscal_year",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.error(`Error upserting stats batch at index ${i}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return { inserted, skipped };
}
