import { createClient } from "@supabase/supabase-js";
import type { ParsedGrant, ClemencyStatRow } from "./parsers/types.js";
import { parseSentence } from "./parsers/sentences.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
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

/** Cache of recipient name → recipient UUID */
const recipientIdCache = new Map<string, string>();

export async function getTermId(slug: string): Promise<string> {
  const cached = termIdCache.get(slug);
  if (cached) return cached;

  const { data, error } = await from("presidential_term")
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
  const { data, error } = await from("presidential_term")
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
  const { data, error } = await from("presidential_term")
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

// ---------------------------------------------------------------------------
// Recipient management
// ---------------------------------------------------------------------------

export async function getOrCreateRecipient(name: string): Promise<string> {
  const cached = recipientIdCache.get(name);
  if (cached) return cached;

  // Try to find existing recipient
  const { data: existing, error: findError } = await from("recipient")
    .select("id")
    .eq("name", name)
    .single();

  if (findError && findError.code !== "PGRST116") {
    throw new Error(`Error finding recipient "${name}": ${findError.message}`);
  }

  if (existing) {
    recipientIdCache.set(name, existing.id);
    return existing.id;
  }

  // Create new recipient
  const { data: created, error: createError } = await from("recipient")
    .insert({ name })
    .select("id")
    .single();

  if (createError || !created) {
    throw new Error(
      `Failed to create recipient "${name}": ${createError?.message}`,
    );
  }

  recipientIdCache.set(name, created.id);
  return created.id;
}

// ---------------------------------------------------------------------------
// Grant (pardon) upsertion with recipient and sentence handling
// ---------------------------------------------------------------------------

export async function upsertGrants(
  grants: ParsedGrant[],
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
        const presidential_term_id = await getTermId(slug);
        const recipient_id = await getOrCreateRecipient(g.recipient_name);

        return {
          recipient_id,
          presidential_term_id,
          warrant_url: g.warrant_url,
          district: g.district,
          offense: g.offense,
          offense_category: g.offense_category,
          pardon_type: g.pardon_type,
          grant_date: g.grant_date,
          source_url: g.source_url,
          _sentence: g.sentence,
          _recipient_name: g.recipient_name,
        };
      }),
    );

    // Deduplicate within the batch by unique key
    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const key = `${r.recipient_id}|${r.grant_date}|${r.pardon_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length < rows.length) {
      console.log(
        `  Deduped batch at index ${i}: ${rows.length} → ${deduped.length}`,
      );
    }

    // Extract sentences for later insertion
    const sentencesData: Array<{
      pardon_id: string;
      recipient_id: string;
      original_sentence: string | null;
    }> = [];

    // Insert pardons and collect their IDs for sentence insertion
    const { data: insertedPardons, error } = await from("pardon")
      .upsert(
        deduped.map((r) => ({
          recipient_id: r.recipient_id,
          presidential_term_id: r.presidential_term_id,
          warrant_url: r.warrant_url,
          district: r.district,
          offense: r.offense,
          offense_category: r.offense_category,
          pardon_type: r.pardon_type,
          grant_date: r.grant_date,
          source_url: r.source_url,
        })),
        {
          onConflict: "recipient_id,grant_date,pardon_type",
          ignoreDuplicates: false,
        },
      )
      .select("id, recipient_id");

    if (error) {
      console.error(`Error upserting batch at index ${i}:`, error.message);
      skipped += batch.length;
    } else {
      // Prepare sentences for insertion
      for (let idx = 0; idx < insertedPardons?.length; idx++) {
        const pardon = insertedPardons[idx];
        const originalData = deduped[idx];
        if (originalData._sentence) {
          sentencesData.push({
            pardon_id: pardon.id,
            recipient_id: pardon.recipient_id,
            original_sentence: originalData._sentence,
          });
        }
      }

      // Insert sentences
      if (sentencesData.length > 0) {
        await insertSentences(sentencesData);
      }

      inserted += insertedPardons?.length ?? 0;
    }
  }

  return { inserted, skipped };
}

async function insertSentences(
  sentences: Array<{
    pardon_id: string;
    recipient_id: string;
    original_sentence: string | null;
  }>,
): Promise<void> {
  if (sentences.length === 0) return;

  // Parse each sentence and expand multi-count sentences into separate rows
  const parsedRows = sentences.flatMap((s) => {
    if (!s.original_sentence) return [];

    const parsed = parseSentence(s.original_sentence);
    return parsed.map((components) => ({
      pardon_id: s.pardon_id,
      recipient_id: s.recipient_id,
      original_sentence: s.original_sentence,
      sentence_in_months: components.sentence_in_months,
      fine: components.fine,
      restitution: components.restitution,
    }));
  });

  if (parsedRows.length === 0) return;

  const { error } = await from("sentences").insert(parsedRows);

  if (error) {
    console.error("Error inserting sentences:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Statistics upsertion
// ---------------------------------------------------------------------------

export async function upsertStatistics(
  rows: ClemencyStatRow[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  // Process in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);

    const { data, error } = await from("pardon_statistics")
      .upsert(batch, {
        onConflict: "presidential_term_id,fiscal_year",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      console.error(
        `Error upserting stats batch at index ${i}:`,
        error.message,
      );
      skipped += batch.length;
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return { inserted, skipped };
}

// ---------------------------------------------------------------------------
// Sentence parsing and updating
// ---------------------------------------------------------------------------

/**
 * Update sentences with parsed data
 * This can be called after scraping to parse all unparsed sentences
 */
export async function updateParsedSentences(
  sentences: Array<{
    id: string;
    sentence_in_months: number | null;
    fine: number | null;
    restitution: number | null;
  }>,
): Promise<void> {
  if (sentences.length === 0) return;

  const { error } = await from("sentences").upsert(sentences);

  if (error) {
    throw new Error(`Failed to update parsed sentences: ${error.message}`);
  }
}

/**
 * Fetch all unparsed sentences (where sentence_in_months, fine, restitution are all null)
 */
export async function fetchUnparsedSentences(): Promise<
  Array<{
    id: string;
    original_sentence: string;
  }>
> {
  const { data, error } = await from("sentences")
    .select("id, original_sentence")
    .is("sentence_in_months", null)
    .is("fine", null)
    .is("restitution", null)
    .not("original_sentence", "is", null);

  if (error) {
    throw new Error(`Failed to fetch unparsed sentences: ${error.message}`);
  }

  return data || [];
}
