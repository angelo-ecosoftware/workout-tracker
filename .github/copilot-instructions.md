# GitHub Copilot Engineering & Architectural Instructions

## 1. Security, Credentials & Privacy Protection (ZERO-TOLERANCE / CRITICAL)
- **NEVER expose real login emails, user emails, passwords, tokens, connection strings, or API keys in source code, migrations, tests, or scripts.**
- Real authentication credentials and database secrets must ONLY reside in `.env` or `.env.local` (which are git-ignored).
- Always read credentials dynamically from `process.env` (e.g., `process.env.ADMIN_EMAIL`, `process.env.VITE_SUPABASE_URL`).
- In automated test suites, sample data, and documentation, strictly use synthetic placeholders or RFC 2606 example domains (e.g., `admin@example.com`, `user@example.com`, `coach@example.com`, `athlete@example.com`).
- Enforce GDPR Article 25 (Privacy by Design) and ENISA ECCF standards across all endpoints and data flows.

## 2. Script, Migration & Codebase Cleanliness
- **Keep the codebase clean, lean, minimal, and modular.** Do not leave ad-hoc, temporary, or redundant one-off scripts lying around.
- Maintain permanent database utilities inside `scripts/db/` using the centralized `scripts/db/client.ts` connector.
- Do not create random root scripts or duplicate loose SQL migration files. All SQL migrations must reside chronologically inside `supabase/migrations/` and snippets in `supabase/snippets/`.
- Clean up obsolete temporary files after completing operational tasks.
- Keep documentation organized strictly inside `docs/` with canonical index in `docs/README.md`. Never place duplicate `.md` files in root.

## 3. Architecture, ISO Standards & Performance Efficiency
- **ISO/IEC 25010 Quality Standards**: Prioritize functional suitability, performance efficiency, usability, and maintainability.
- **Modularity & 300 LOC Rule**: Files approaching or exceeding 300 lines of code should be logically broken down into single-responsibility sub-components, custom hooks, or utility functions under `src/utils/` or `src/lib/`.
- **DRY & Utility Extraction**: Avoid duplicating date calculations, macro scaling, and debouncing. Use shared utilities in `src/utils/` (e.g., `date.ts`, `botDefense.ts`).
- **Dynamic On-Demand Processing**: Favor on-demand barcode and URL resolvers (AH, Jumbo, Dirk, PLUS, Open Food Facts) cached in the Supabase hive-mind rather than massive static scraping dumps.

## 4. UX/UI Cognitive Ergonomics & Minimal Design
- **Minimalist Frictionless UI**: "No fluff. Log sets & leave." Keep the active workout view fast and clutter-free.
- **Touch Boundaries & Response**: Ensure touch targets meet minimum 40px boundaries with zero mobile tap delays.
- **Anatomy & Visual Clarity**: Anatomical highlights should use clean white backgrounds with targeted muscle groups highlighted in red.
- **Safety Guards**: Provide confirmation dialogs for destructive actions or extreme input anomalies without slowing down regular logging.

## 5. Preservation of Functionality & Test Integrity
- Never modify existing HTML/JSX structure, CSS/Tailwind design styling, or business logic unless explicitly requested.
- Maintain 100% passing status across all Vitest test suites (`pnpm test` must always pass).
- Automatically commit and push clean, well-scoped changes upon task completion.

