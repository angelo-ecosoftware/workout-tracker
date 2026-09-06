# GitHub Copilot Instructions

## 1. Security & Credentials Protection (CRITICAL)
- **NEVER expose real login emails, user emails, passwords, tokens, connection strings, or API keys in source code, migrations, tests, or scripts.**
- Real authentication credentials and database secrets must ONLY reside in `.env` or `.env.local` (which are git-ignored).
- Always read credentials dynamically from `process.env` (e.g. `process.env.ADMIN_EMAIL`, `process.env.VITE_SUPABASE_URL`).
- In automated test suites, sample data, and documentation, strictly use synthetic placeholders or RFC 2606 example domains (e.g., `admin@example.com`, `user@example.com`, `coach@example.com`, `athlete@example.com`).

## 2. Script & Migration Cleanliness
- **Keep the codebase clean, lean, and minimal.** Do not leave ad-hoc, temporary, or redundant one-off scripts lying around.
- Maintain permanent database utilities inside `scripts/db/` using the centralized `scripts/db/client.ts` connector.
- Do not create random root scripts or duplicate loose SQL migration files. All SQL migrations must reside chronologically inside `supabase/migrations/` and snippets in `supabase/snippets/`.
- Clean up obsolete temporary files after completing operational tasks.

## 3. Preservation of Functionality & Design
- Never modify existing HTML/JSX structure, CSS/Tailwind design styling, or business logic unless explicitly requested.
- Maintain 100% passing status across all Vitest test suites.
- Commit and push changes automatically upon task completion.
