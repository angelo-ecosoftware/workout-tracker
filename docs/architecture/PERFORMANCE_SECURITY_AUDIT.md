# Batch 8 performance and security audit

This is an engineering audit of the current repository, using web-performance
guidance, OWASP Top 10/API Security/ASVS concepts, and browser security
practices as reference frameworks. It is not a certification or compliance
claim.

## Routing and loading result

The application now uses normal paths for its application routes:

- `/workouts` is the workout tracker (with `/dashboard` and `/tracker` aliases).
- `/history` is the log book.
- `/insights` is the insights page.
- `/dietary` and `/food` are the dietary page aliases.
- `/coach`, `/admin`, `/login`, and `/signin` remain supported.
- Public sessions continue to use the existing `?session=`/`?share=` query
  contract.

`src/appRouting.ts` owns path parsing, tab-to-path mapping, and legacy hash
bookmark conversion. Recognized hashes at the site root, such as
`/#/workouts`, are replaced with their canonical path. Unrecognized fragments
remain available for legitimate in-page anchors. Existing public-session and
invite query parameters are not converted into routing fragments.

The Vercel rewrite in `vercel.json` already sends extensionless non-API paths to
`/index.html`, while leaving `/api/*` and asset-like paths alone. `server.ts`
has the equivalent production static-file and SPA catch-all ordering. A local
smoke test verified `/workouts` and `/api/health` independently.

Page components remain meaningful dynamic-import boundaries in `src/App.tsx`.
Settings/profile modals and invite acceptance are now loaded only when their
own UI is rendered. The authenticated catalog prefetch was removed from the
application shell; the catalog is loaded by the workout exercise picker and
retains its existing local cache behavior.

## Measurements

Measurements come from `pnpm build` output:

- Before: main JavaScript entry `784.12 kB` raw, `204.95 kB` gzip.
- After: main JavaScript entry `539.09 kB` raw, `156.08 kB` gzip.
- Main-entry reduction: `245.03 kB` raw and `48.87 kB` gzip.
- After route splitting, representative route chunks include WorkoutDayTracker
  `90.02 kB`, DietaryView `96.05 kB`, InsightsView `55.24 kB`, WorkoutHistory
  `33.16 kB`, and AdminPortalView `24.20 kB` raw.
- The generated service worker precache grew from 32 to 69 entries. Workbox
  therefore still downloads route chunks during service-worker installation;
  runtime route loading is improved, but install-time offline precaching remains
  a separate trade-off.

No browser lab run, Core Web Vitals sample, production network waterfall, or
memory profile was available in this environment. Those metrics are therefore
not claimed.

## Performance findings

### Medium — service-worker precache limits first-install savings

`vite.config.ts` precaches generated JavaScript through the broad Workbox
`globPatterns` rule. The build produced 69 precache entries after splitting.
This preserves offline availability, but can make first install/update download
unvisited route code. Changing this requires an explicit offline caching
strategy and should not be done as a routing-only optimization.

### Medium, inferred — global header data is broader than the active route

`src/components/ui/Header.tsx` loads the user profile and workout list for
profile/settings affordances on every authenticated route. The workout hook
also loads workout data on the workout route, so overlapping reads are
possible. This was retained to preserve header/profile timing and behavior.
Measure request traces before moving the data load behind modal opening.

### Medium, inferred — external exercise descriptions are cached in localStorage

`WgerExerciseInfo.tsx` stores fetched descriptions without a size or expiration
policy. Long-lived accounts can accumulate unbounded per-exercise entries.
Add a bounded cache only with an explicit invalidation policy; do not remove it
without preserving offline guide behavior.

### Low, measured — large route chunks remain

Dietary and workout route chunks remain approximately 96 kB and 90 kB raw.
They are no longer part of the initial entry, but further feature-level
boundaries could help. This is an optimization opportunity, not evidence that
the current split is incorrect.

## Security findings

### High — unsanitized third-party HTML is rendered

`src/components/workout/WgerExerciseInfo.tsx` assigns the remote Wger
description to `dangerouslySetInnerHTML` and caches it locally without
sanitization. A compromised or malicious upstream description could inject
markup into the application. The current CSP reduces some script execution
paths but is not a substitute for sanitization.

Recommended remediation: sanitize to an explicit allowlist before rendering, or
render the supported text/format as text. Add a regression test containing
event attributes and unsafe URLs. This is safe to fix independently, but was
not changed in Batch 8 because it is outside the routing implementation.

### High — public scraper endpoints have abuse exposure

`api/product-link.ts`, `api/grocery-list.ts`, `api/barcode-lookup.ts`, and
`api/report-missing-product.ts` use wildcard CORS and do not require an
application session or apply visible rate limiting. Attackers can consume
serverless/upstream retailer resources or submit report noise. The behavior is
intentional for guest/product lookup flows, but the abuse controls are
incomplete.

Recommended remediation: add platform-level rate limiting and request size/
timeout controls, then narrow CORS where the product contract permits. Do not
make these changes by adding client-only checks.

### High — redirect-aware SSRF review is incomplete

`api/scraperRegistry.ts` allowlists the initial hostname and blocks common
private ranges, but its `fetch` calls use the default redirect behavior.
An approved retailer URL that redirects to an internal destination is not
revalidated by this code. DNS rebinding and alternate numeric/IP forms also
deserve explicit coverage.

Recommended remediation: disable redirects or follow them manually with
validation at every hop, resolve and validate destination addresses, enforce
timeouts, and add IPv4/IPv6/redirect regression tests. The existing allowlist
and private-host checks are useful but are not proof of complete SSRF defense.

### Medium — client-controlled report ownership

`api/report-missing-product.ts` accepts `userId` from the query/body and writes
it to `missing_product_reports` using the anon Supabase client. A caller can
spoof the attribution or use `anonymous`. This is an integrity concern even if
the report itself is non-sensitive.

Recommended remediation: derive ownership from a verified auth token or store
guest reports without a user identity; enforce the same rule in RLS.

### Medium — bot-defense endpoint trusts proxy input and process memory

`api/block-ip.ts` accepts forwarded IP headers and stores bans in process-local
sets. A public caller can cause false bans, and serverless instance-local state
does not provide durable enforcement. Treat forwarded headers as trusted only
behind a configured trusted proxy and move durable abuse controls to the edge
or a controlled store.

### Medium — security headers differ by deployment path

`vercel.json` defines CSP, HSTS, frame, MIME, referrer, and permissions headers,
but `server.ts` does not set equivalent headers for its production Express
static-server path. Self-hosted or companion-server deployments therefore do
not necessarily receive the Vercel header policy.

Recommended remediation: centralize the header policy or verify the Express
deployment is always behind the platform that adds these headers.

## Authentication, authorization, and storage observations

- Supabase Auth session restoration and refresh are handled in
  `src/context/AuthContext.tsx`; authenticated URLs are cleaned with
  `src/utils/authUrl.ts`.
- Client route state is not an authorization boundary. Supabase RLS remains the
  database boundary and must continue to enforce user ownership, coach links,
  and approved admin operations.
- The browser uses the Supabase anon client. No service-role key was found in
  client source.
- Workout drafts, settings, catalog data, food data, and biometric fallbacks
  are stored in browser storage by design. Logout/account deletion behavior
  must be considered before changing those caches.
- `WgerExerciseInfo` is the only confirmed unsafe HTML sink found by the static
  search. External URLs and product HTML parsing should remain treated as
  untrusted data.

## Database and network findings

- Header profile/routine reads can overlap with workout-session reads as noted
  above.
- `src/lib/db/sessions.ts` intentionally performs multiple reads for public
  session detail, including session, workout, exercises, sets, and user data.
  This is bounded per session but should be measured before being consolidated.
- Backup export/import deliberately performs many table operations to preserve
  its existing format and ordering; it is not an accidental N+1 path.
- Catalog loading is paginated in 1,000-row ranges and cached locally. This
  avoids the Supabase default row cap but performs a large first catalog read
  when the picker is opened.
- No schema/index changes were made. Query/index improvements requiring
  migrations are deferred.

## Offline findings

The routing change preserves localStorage draft/settings behavior, IndexedDB
photo storage, catalog caching, service-worker precaching, and the existing
offline queue capability. `PWAContext` still has queue flush/count integration
disabled, so automatic background session synchronization is not claimed.

The main offline performance trade-off is the broad service-worker precache.
Reducing it would improve install bandwidth but could make previously available
offline routes unavailable; it requires a separate measured offline strategy.

## Dependency audit

`pnpm audit --prod` reported two moderate advisories in transitive `qs` paths
through Express/body-parser:

- `GHSA-x5fp-wj9c-mxmx`, bracket-key array-limit bypass.
- `GHSA-4mjr-xmp4-gh2g`, attacker-controlled `isBuffer` denial of service.

The patched ranges reported by the package manager are newer than the resolved
versions. No dependency was upgraded in this batch; remediation should follow a
normal lockfile/package-manager update with regression verification.

## Deferred work

The following findings were intentionally not fixed in the routing batch:

- sanitization of Wger HTML;
- redirect-safe SSRF hardening;
- API authentication/rate limiting and request limits;
- report ownership enforcement;
- durable bot-defense storage;
- Express security-header parity;
- service-worker cache strategy;
- transitive `qs` remediation;
- database query consolidation.

They require separate security/performance characterization or deployment
decisions and are not necessary to switch the client from hash routing to path
routing.
