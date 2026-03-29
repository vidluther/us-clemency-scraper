import "dotenv/config";
import { fetchPageHtml, closeBrowser } from "./browser.js";
import { getAllTerms, resolveTermSlug, upsertStatistics } from "./db.js";
import { parseStatsPage } from "./parsers/stats.js";
import type { ClemencyStatRow } from "./parsers/types.js";

const STATS_URL = "https://www.justice.gov/pardon/clemency-statistics";

async function main(): Promise<void> {
  // Load all terms up front for slug resolution
  const allTerms = await getAllTerms();
  console.log(`Loaded ${allTerms.length} terms from DB`);

  console.log(`Fetching: ${STATS_URL}`);

  try {
    const html = await fetchPageHtml(STATS_URL);
    const parsed = parseStatsPage(html);

    const admins = new Set(parsed.map((r) => r.base_slug)).size;
    console.log(`Parsed ${parsed.length} rows across ${admins} administrations`);

    if (parsed.length === 0) {
      console.warn("No rows parsed — check the page structure.");
      return;
    }

    // Resolve base_slug → specific term_slug
    const rows: ClemencyStatRow[] = [];
    let skippedNoTerm = 0;

    for (const row of parsed) {
      try {
        const term_slug = resolveTermSlug(
          row.base_slug,
          row.fiscal_year,
          allTerms,
        );
        rows.push({
          term_slug,
          fiscal_year: row.fiscal_year,
          petitions_received: row.petitions_received,
          total_granted: row.total_granted,
          pardons_granted: row.pardons_granted,
          commutations_granted: row.commutations_granted,
          petitions_denied: row.petitions_denied,
          petitions_closed: row.petitions_closed,
          source_url: STATS_URL,
        });
      } catch {
        skippedNoTerm++;
      }
    }

    if (skippedNoTerm > 0) {
      console.warn(`Skipped ${skippedNoTerm} rows (no matching term)`);
    }

    const result = await upsertStatistics(rows);
    console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
  } finally {
    await closeBrowser();
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
