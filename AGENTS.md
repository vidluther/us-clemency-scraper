# AGENTS.md

This document provides context for agentic coding agents working in this repository.

## Project Overview

A TypeScript scraper for presidential clemency (pardons and commutations) data from the DOJ website. Data is stored in Supabase PostgreSQL.

## Commands

### Package Manager

Use `pnpm` exclusively. Never use `npm`, `yarn`, or `bun`.

```bash
pnpm install           # Install dependencies
```

### Build & Run

```bash
pnpm run scrape              # Run scraper (all presidents)
pnpm run scrape:all         # Same as above
pnpm run scrape:trump2       # Scrape Trump 2025-present
pnpm run scrape:biden       # Scrape Biden 2021-2025
pnpm run scrape:trump1      # Scrape Trump 2017-2021
pnpm run scrape:obama       # Scrape Obama 2009-2017
pnpm run scrape:bush        # Scrape Bush 2001-2009
```

### Linting

```bash
pnpm run lint               # Run oxlint on src/
```

No formatter is configured. The codebase uses oxlint for linting only.

### Testing

```bash
pnpm run test                         # Run all tests
pnpm vitest run                       # Run all tests (explicit)
pnpm vitest run <file>                # Run single test file
pnpm vitest run -t "<test name>"      # Run tests matching name pattern
pnpm vitest                           # Run in watch mode
```

Tests use vitest. Test files should be placed in `tests/` directory.

### TypeScript

```bash
npx tsc --noEmit             # Type check without emitting
```

## Code Style

### Language

- TypeScript only. Target: ES2022, Module: ESNext.
- ESM module system (`"type": "module"` in package.json).

### Imports

1. Always use `.js` extension in import paths:

   ```typescript
   import { fetchPageHtml } from "./browser.js";
   import type { ClemencyGrant } from "./parsers/types.js";
   ```

2. Use `import type` for type-only imports:

   ```typescript
   import type { ClemencyGrant } from "./parsers/types.js";
   ```

3. Group imports logically:
   - External packages first
   - Internal modules second

### Naming Conventions

- **Variables and functions:** `snake_case`

  ```typescript
  const grant_date = "2025-01-21";
  function parseDate(text: string) { ... }
  ```

- **Constants:** `SCREAMING_SNAKE_CASE`

  ```typescript
  const SCHEMA = "pardonned";
  const PRESIDENT_SOURCES: PresidentSource[] = [ ... ];
  ```

- **Type/Interface names:** `PascalCase`

  ```typescript
  interface ClemencyGrant { ... }
  type PageFormat = "trump2025" | "table-five" | "table-four" | "key-value";
  ```

- **Interface fields:** `snake_case` (to match database columns)

  ```typescript
  interface ClemencyGrant {
    recipient_name: string;
    warrant_url: string | null;
    clemency_type: "pardon" | "commutation";
  }
  ```

- **Private/local helper functions:** lowercase, descriptive
  ```typescript
  function parseDate(text: string): string | null { ... }
  function buildGrant(...) { ... }
  ```

### Functions

- Use `async/await` for asynchronous operations. Never use `.then()` chains.
- Use arrow functions for callbacks:

  ```typescript
  rows.each((_i, row) => { ... });
  headings.filter((_i, h) => parseDate($(h).text()) !== null);
  ```

- Use JSDoc comments for public functions explaining purpose and return values.
- Use named exports, not default exports.

### Types

- Use TypeScript strict mode. The tsconfig has `"strict": true`.
- Prefer `interface` over `type` for object shapes.
- Use union types for finite sets of strings:
  ```typescript
  type PageFormat = "trump2025" | "table-five" | "table-four" | "key-value";
  ```
- Use `| null` for optional fields (not `?`). Be explicit about nullability.

### Error Handling

- Use `throw new Error()` with descriptive messages:

  ```typescript
  throw new Error(`Term not found for slug "${slug}": ${error?.message}`);
  ```

- Use `try/finally` for cleanup operations:

  ```typescript
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return await page.content();
  } finally {
    await page.close();
  }
  ```

- Process-level error handling:
  ```typescript
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
  ```

### Code Organization

- `src/` contains all TypeScript source files.
- `src/parsers/` contains HTML parsing logic for different page formats.
- `supabase/` contains database migrations and config.
- `tests/` contains test files.

### Comments

- Do not add comments unless explicitly requested.
- Code should be self-documenting through clear naming.
- JSDoc comments are acceptable for public API documentation.

## Database

- Supabase PostgreSQL with custom schema `pardonned`.
- Local development uses Supabase CLI (`supabase start`).
- Environment variables required:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`

## External APIs

This scraper uses:

- **Playwright** for browser automation (headless Chromium).
- **Cheerio** for HTML parsing (jQuery-like API).
- **Supabase client** for database operations.

## Testing Strategy

Currently no tests exist. When adding tests:

- Place test files in `tests/` directory.
- Use vitest framework.
- File naming: `filename.test.ts` pattern.
- Run specific tests with: `pnpm vitest run tests/specific.test.ts`

## Git

Use `but` (GitButler CLI) instead of `git` for version control operations. See the `but` skill for details.
