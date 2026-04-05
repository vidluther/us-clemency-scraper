import { createClient } from "@supabase/supabase-js";
import type { ParsedGrant } from "./parsers/types.js";
import { parseSentence } from "./parsers/sentences.js";

function getEnvVars(): { url: string; key: string } {
  const missing: string[] = [];

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) missing.push("SUPABASE_URL");

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!key) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s):\n${missing.map((m) => `  - ${m}`).join("\n")}`,
    );
  }

  return { url: supabaseUrl!, key: key! };
}

const { url: supabaseUrl, key: supabaseKey } = getEnvVars();
const supabase = createClient(supabaseUrl, supabaseKey);

const SCHEMA = "pardonned";

function from(table: string) {
  return supabase.schema(SCHEMA).from(table);
}

const termIdCache = new Map<string, string>();

export async function getTermId(slug: string): Promise<string> {
  const cached = termIdCache.get(slug);
  if (cached) return cached;

  const { data, error } = await from("administrations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    throw new Error(
      `Could not find an administration for  "${slug}": ${error?.message}`,
    );
  }

  termIdCache.set(slug, data.id);
  return data.id;
}

export async function getTermForDate(
  slugs: string[],
  grantDate: string,
): Promise<string> {
  if (slugs.length === 1) return slugs[0];

  const { data, error } = await from("administrations")
    .select("id, slug, start_date, end_date")
    .in("slug", slugs)
    .order("start_date");

  if (error || !data?.length) {
    throw new Error(`administration not found for slugs ${slugs.join(", ")}`);
  }

  for (const term of data) {
    const start = term.start_date;
    const end = term.end_date || "9999-12-31";
    if (grantDate >= start && grantDate < end) {
      termIdCache.set(term.slug, term.id);
      return term.slug;
    }
  }

  const last = data[data.length - 1];
  termIdCache.set(last.slug, last.id);
  return last.slug;
}

export async function upsertGrants(
  grants: ParsedGrant[],
  slugs: string[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < grants.length; i += 50) {
    const batch = grants.slice(i, i + 50);

    const rows = await Promise.all(
      batch.map(async (g) => {
        const slug = await getTermForDate(slugs, g.grant_date);
        const administration = await getTermId(slug);
        const parsed = g.sentence ? parseSentence(g.sentence) : [];
        const first = parsed[0] ?? null;

        return {
          administration,
          recipient_name: g.recipient_name,
          clemency_type: g.pardon_type,
          grant_date: g.grant_date,
          warrant_url: g.warrant_url,
          source_url: g.source_url,
          district: g.district,
          offense: g.offense,
          offense_category: g.offense_category,
          sentence_in_months: first?.sentence_in_months ?? null,
          fine: first?.fine ?? null,
          restitution: first?.restitution ?? null,
          original_sentence: g.sentence ?? null,
        };
      }),
    );

    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const key = `${r.administration}|${r.recipient_name}|${r.grant_date}|${r.clemency_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length < rows.length) {
      console.log(
        `  Deduped batch at index ${i}: ${rows.length} → ${deduped.length}`,
      );
    }

    const { data, error } = await from("pardons")
      .upsert(deduped, {
        onConflict: "administration,recipient_name,grant_date,clemency_type",
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
