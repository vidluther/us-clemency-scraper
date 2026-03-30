import * as cheerio from "cheerio";
import type { ParsedStatRow } from "./types.js";

// ---------------------------------------------------------------------------
// President heading → base slug mapping
// ---------------------------------------------------------------------------

function getSlug(headingText: string): string | null {
  const t = headingText.toLowerCase();
  if (/biden/.test(t)) return "biden";
  if (/trump/.test(t)) {
    if (/2025/.test(t)) return "trump-2";
    return "trump-1";
  }
  if (/obama/.test(t)) return "obama";
  if (/george\s+w\.?\s*bush|bush.*walker/.test(t)) return "bush-jr";
  if (/george\s+h\.?w\.?\s*bush|bush.*herbert/.test(t)) return "bush-sr";
  if (/clinton/.test(t)) return "clinton";
  if (/reagan/.test(t)) return "reagan";
  if (/carter/.test(t)) return "carter";
  if (/ford/.test(t)) return "ford";
  if (/nixon/.test(t)) return "nixon";
  if (/johnson/.test(t)) return "lbj";
  if (/kennedy/.test(t)) return "kennedy";
  if (/eisenhower/.test(t)) return "eisenhower";
  if (/truman/.test(t)) return "truman";
  // Both Roosevelts — check Franklin first
  if (/franklin/.test(t)) return "fdr";
  if (/hoover/.test(t)) return "hoover";
  if (/coolidge/.test(t)) return "coolidge";
  if (/harding/.test(t)) return "harding";
  if (/wilson/.test(t)) return "wilson";
  if (/taft/.test(t)) return "taft";
  if (/theodore/.test(t) || /roosevelt/.test(t)) return "t-roosevelt";
  if (/mckinley/.test(t)) return "mckinley";
  return null;
}

// ---------------------------------------------------------------------------
// Number parsing
// ---------------------------------------------------------------------------

function parseNum(raw: string): number | null {
  const text = raw.trim();
  if (!text || /^[-–—*]$/.test(text)) return null;
  const parts = text.split(/\s*&\s*/);
  let total = 0;
  for (const p of parts) {
    const n = parseInt(p.replace(/,/g, "").trim(), 10);
    if (isNaN(n)) return null;
    total += n;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Column detection (unchanged — handles multi-row headers with colspan/rowspan)
// ---------------------------------------------------------------------------

interface ColumnDescriptor {
  index: number;
  leafName: string;
  groupName: string;
}

interface ColMap {
  fiscal_year: number;
  pending: number[];
  received: number[];
  pardons_granted: number[];
  commutations_granted: number[];
  remissions_granted: number[];
  respites_granted: number[];
  total_granted: number[];
  denied: number[];
  closed: number[];
}

function buildColumnDescriptors(
  $: cheerio.CheerioAPI,
  table: cheerio.Cheerio<cheerio.Element>,
): ColumnDescriptor[] {
  const MAXCOLS = 20;
  const grid: (string | undefined)[][] = [];

  let headerRowIdx = 0;
  let foundDataRow = false;

  table.find("tr").each((_, tr) => {
    if (foundDataRow) return;
    const $tr = $(tr);
    if ($tr.find("td").length > 0) {
      foundDataRow = true;
      return;
    }
    const ths = $tr.find("th");
    if (!ths.length) return;

    if (!grid[headerRowIdx])
      grid[headerRowIdx] = new Array(MAXCOLS).fill(undefined);

    let colIdx = 0;
    ths.each((_, th) => {
      while (colIdx < MAXCOLS && grid[headerRowIdx]?.[colIdx] !== undefined)
        colIdx++;
      if (colIdx >= MAXCOLS) return;

      const text = $(th).text().trim();
      const colspan = Math.max(1, parseInt($(th).attr("colspan") ?? "1", 10));
      const rowspan = Math.max(1, parseInt($(th).attr("rowspan") ?? "1", 10));

      for (let r = headerRowIdx; r < headerRowIdx + rowspan; r++) {
        if (!grid[r]) grid[r] = new Array(MAXCOLS).fill(undefined);
        for (let c = colIdx; c < Math.min(colIdx + colspan, MAXCOLS); c++) {
          if (grid[r][c] === undefined) grid[r][c] = text;
        }
      }
      colIdx += colspan;
    });

    headerRowIdx++;
  });

  let totalCols = 0;
  for (const row of grid) {
    if (!row) continue;
    for (let i = row.length - 1; i >= 0; i--) {
      if (row[i] !== undefined) {
        totalCols = Math.max(totalCols, i + 1);
        break;
      }
    }
  }

  const descriptors: ColumnDescriptor[] = [];
  for (let c = 0; c < totalCols; c++) {
    let leafName = "";
    for (let r = grid.length - 1; r >= 0; r--) {
      const cell = grid[r]?.[c];
      if (cell !== undefined) {
        leafName = cell;
        break;
      }
    }
    const groupName = grid[0]?.[c] ?? leafName;
    descriptors.push({
      index: c,
      leafName: leafName.toLowerCase(),
      groupName: groupName.toLowerCase(),
    });
  }

  return descriptors;
}

function buildColMap(descs: ColumnDescriptor[]): ColMap {
  const map: ColMap = {
    fiscal_year: 0,
    pending: [],
    received: [],
    pardons_granted: [],
    commutations_granted: [],
    remissions_granted: [],
    respites_granted: [],
    total_granted: [],
    denied: [],
    closed: [],
  };

  let firstPendingGroup: string | null = null;

  for (const { index, leafName, groupName } of descs) {
    if (/fiscal.?year|^year$/i.test(groupName)) {
      map.fiscal_year = index;
    } else if (/pending/i.test(groupName)) {
      if (firstPendingGroup === null) firstPendingGroup = groupName;
      if (groupName === firstPendingGroup) map.pending.push(index);
    } else if (/received/i.test(groupName)) {
      map.received.push(index);
    } else if (/granted/i.test(groupName)) {
      if (/^p$|^pardon/i.test(leafName)) {
        map.pardons_granted.push(index);
      } else if (/^c$|^commut/i.test(leafName)) {
        map.commutations_granted.push(index);
      } else if (/^r$|^remiss/i.test(leafName)) {
        map.remissions_granted.push(index);
      } else if (/^s$|respite/i.test(leafName)) {
        map.respites_granted.push(index);
      } else {
        map.total_granted.push(index);
      }
    } else if (/denied/i.test(groupName)) {
      map.denied.push(index);
    } else if (/closed|without/i.test(groupName)) {
      map.closed.push(index);
    }
  }

  return map;
}

function sumCells(
  $: cheerio.CheerioAPI,
  cells: cheerio.Cheerio<cheerio.Element>,
  indices: number[],
): number | null {
  const nums = indices
    .map((i) => parseNum($(cells[i])?.text().trim() ?? ""))
    .filter((n): n is number => n !== null);
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseStatsPage(html: string): ParsedStatRow[] {
  const $ = cheerio.load(html);
  const results: ParsedStatRow[] = [];

  $("h2, h3").each((_, heading) => {
    const $heading = $(heading);
    const headingText = $heading.text().trim();
    if (!headingText) return;

    const tables = $heading.nextUntil("h2, h3").filter("table");
    if (!tables.length) return;

    const table = tables.first();
    const descs = buildColumnDescriptors($, table);
    const colMap = buildColMap(descs);

    if (colMap.received.length === 0 && colMap.pending.length === 0) return;

    const slug = getSlug(headingText);
    if (!slug) return;

    table.find("tr").each((_, row) => {
      const $row = $(row);
      if ($row.find("th").length > 0 && $row.find("td").length === 0) return;

      const cells = $row.find("td");
      if (!cells.length) return;

      const fyText = $(cells[colMap.fiscal_year])
        ?.text()
        .trim()
        .replace(/\s+/g, " ");
      if (!fyText) return;

      // Skip Total rows — we only want per-year data
      if (/^total/i.test(fyText)) return;

      // Extract just the 4-digit year
      const fyMatch = fyText.match(/(\d{4})/);
      if (!fyMatch) return;
      const fiscal_year = parseInt(fyMatch[1], 10);

      const pardons = sumCells($, cells, colMap.pardons_granted);
      const commutations = sumCells($, cells, colMap.commutations_granted);
      const remissions = sumCells($, cells, colMap.remissions_granted);
      const respites = sumCells($, cells, colMap.respites_granted);

      // total_granted: prefer explicit column, otherwise sum all sub-columns
      // (remissions and respites get folded in here)
      let total_granted: number | null = null;
      if (colMap.total_granted.length > 0) {
        total_granted = sumCells($, cells, colMap.total_granted);
      }
      if (total_granted === null) {
        const parts = [pardons, commutations, remissions, respites].filter(
          (n): n is number => n !== null,
        );
        if (parts.length > 0) total_granted = parts.reduce((a, b) => a + b, 0);
      }

      results.push({
        base_slug: slug,
        fiscal_year,
        petitions_received: sumCells($, cells, colMap.received),
        total_granted,
        pardons_granted: pardons,
        commutations_granted: commutations,
        petitions_denied: sumCells($, cells, colMap.denied),
        petitions_closed: sumCells($, cells, colMap.closed),
      });
    });
  });

  return results;
}
