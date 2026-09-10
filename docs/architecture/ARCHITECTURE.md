# Kinisia architecture

This guide describes the implementation that is currently in the repository. It is
intentionally organized around ownership and side effects, not file size.

## Application flow

```text
React components and contexts
        ↓
feature hooks and deterministic domain helpers
        ↓
src/lib/db/* or a deliberately named API boundary
        ↓
Supabase / IndexedDB / localStorage / external retailer APIs
```

This is a useful map, not a rule that every feature follows the same path. The
client calls Supabase directly for application data, while the Express companion
server and Vercel handlers proxy selected external retailer/catalog operations.

## Source layout and ownership

- `src/components/` owns presentation and feature composition. `WorkoutDayTracker`
  consumes `useWorkoutSession()` and does not know its internal implementation.
- `src/context/` owns cross-cutting React context, including Supabase auth state
  in `AuthContext.tsx` and PWA/install/network presentation state in `PWAContext.tsx`.
- `src/lib/db/` is the canonical client-side database-access layer. Current
  domains include `users.ts`, `biometrics.ts`, `workoutsCanonical.ts` (re-exported
  by `workouts.ts`), `sessions.ts`, `backup.ts`, `admin.ts`, and the roles domain
  modules described below.
- `src/lib/` also contains feature services and pure engines such as barcode
  resolution, exercise search, image/storage integration, and the Supabase client.
- `src/utils/` contains browser-oriented utilities, including draft photo storage
  and the IndexedDB offline queue.

New database operations belong in the appropriate `src/lib/db/<domain>.ts`
implementation. Do not create a second implementation in a component, hook,
`supabaseData.ts`, or an API handler.

## Data layer and compatibility barrels

`src/lib/supabaseData.ts` is an intentional compatibility surface. It currently
owns two active cross-cutting operations:

- `getUserProgressState`, which combines the user row, auth metadata, local
  metrics/body-log fallbacks, and completed-workout verification.
- `fetchAllCatalogExercises`, which paginates the catalog, updates the exercise
  search index, and caches the catalog in localStorage.

It also re-exports canonical functions from the DB modules so existing components
and tests can keep their imports. `src/lib/db/roles.ts` similarly re-exports the
seven roles-domain modules. These barrels are not competing data layers and
should not gain duplicate database logic. Keep them while they protect existing
consumers; migrate callers only as an intentional compatibility change.

The invariant is:

> There must be one implementation of each database operation.

## Roles and domain modules

The roles compatibility barrel delegates to focused domain modules:

- `rolesDomain.ts`: user role lookup and coach-role requests/approval.
- `privacy.ts`: privacy settings and selective peer-sharing records.
- `coaching.ts`: coach/athlete links, invitations, acceptance, and revocation.
- `routineLibrary.ts`: saved routine programs and active/deleted library entries.
- `routineProposals.ts`: coach-created routine proposals and status changes.
- `macros.ts`: active coach macro prescriptions.
- `setFeedback.ts`: coach feedback attached to workout sets.

These are domain modules, not independent services. They own Supabase calls and
domain mapping for their area. UI concerns, generic orchestration, and unrelated
database operations do not belong in them. `rolesStorage.ts` only provides
guarded local-storage access where the role domain needs it.

## Workout-session architecture

`src/components/workout/tracker/useWorkoutSession.ts` remains the React
lifecycle and orchestration boundary. Its public hook arguments, return shape,
state semantics, effect timing, and callers are stable.

Two deterministic helpers were extracted:

- `workoutSessionCalculations.ts` normalizes workout input, builds set payloads,
  calculates progression advice, and creates the celebration summary.
- `workoutSessionDraft.ts` builds draft keys and draft payloads.

The hook deliberately retains React state/effects, wall-clock and rest-timer
state, wake-lock lifecycle, photo handling, draft/autosave side effects, workout
loading, completion persistence, and celebration sequencing. These concerns
share closure, cleanup, and ordering requirements; splitting them merely to make
the file shorter would obscure ownership and risk behavior changes.

The maintenance rule is:

> Extract cohesive deterministic logic when ownership is clear; do not distribute
> tightly coupled React lifecycle state merely to reduce file size.

## API arrangement

`server.ts` is the local Express companion. It mounts health, catalog, and
retailer-related routes and adapts the Vercel handlers for local execution.
The Vercel handlers in `api/` remain the canonical implementations for the
shared grocery-list, product-link, barcode lookup, missing-product report, and
bot-defense routes. Reusing those handlers prevents local Express and deployed
Vercel behavior from drifting.

API handlers perform request-shape checks and return status codes at the boundary.
Retailer URL targets are validated by `api/scraperRegistry.ts`; product-link also
rejects shared-list URLs so the correct resolver is used. These endpoints use
their current public CORS behavior and should not be described as authenticated
application-data endpoints. Future changes to these routes should be made in
the canonical handler and then verified through both API tests and the Express
adapter.

## Offline and local persistence

Offline behavior is distributed across explicit browser persistence mechanisms:

- workout drafts, active-session markers, settings, and some profile/catalog
  fallbacks use localStorage;
- draft workout photos use `src/utils/draftPhotoStorage.ts` and IndexedDB;
- `fetchAllCatalogExercises` caches the catalog so it can be read while offline;
- `src/utils/offlineQueue.ts` defines an IndexedDB queue for completed sessions,
  including serialized photos and retry processing.

The PWA context currently reports connectivity but has the queue flush/count
integration disabled in commented code. Do not document automatic background
sync as an active behavior. Changes to these paths must preserve save keys,
serialization, cleanup, retry/idempotency behavior, and the distinction between
implemented queue capabilities and currently wired UI behavior.

## Authentication, authorization, and RLS

`AuthContext.tsx` obtains and observes the Supabase Auth session, maps the
authenticated user, and loads the application role through the roles DB module.
The browser uses the Supabase anon client; database access is therefore subject
to the deployed database policies rather than a client-side authorization claim.

The migrations under `supabase/migrations/` define the verified database
boundary. Policies use `auth.uid()` for user ownership and include explicit
approved-role/admin or accepted coach-link checks where applicable. Admin
operations live in `src/lib/db/admin.ts` and rely on the database authorization
boundary. Account deletion delegates the purge operation to the database RPC.

The retailer proxy routes are a separate boundary: they validate external
targets in the scraper registry, but the current handlers expose public
proxy/CORS behavior and must not be represented as authenticated routes.
Never bypass RLS or move privileged credentials into the client.

## Testing architecture

Tests are organized under `tests/shared`, `tests/frontend`, and `tests/backend`.
Shared domain tests target deterministic engines; frontend tests target rendered
components and hook lifecycle; backend tests target canonical DB modules, API
handlers, validation, and persistence matrices.

Database/domain tests should import the production module under test. Tests may
mock the Supabase client or use shared factories, but must not preserve a
reimplemented legacy data layer solely for convenience. Compatibility-barrel
tests are appropriate when they protect the barrel's supported import surface.
Workout-session tests should exercise the hook and its extracted production
helpers together, including drafts, progression, timer transitions, photos, and
completion sequencing. Offline tests should cover the actual localStorage or
IndexedDB utility and its failure/retry behavior.

## Refactoring invariants

1. Trace imports, callers, dynamic paths, tests, and public contracts before
   changing implementation.
2. Refactor implementation, not product behavior or UI structure.
3. Keep one source of truth for each database operation.
4. Retain compatibility barrels intentionally when they protect consumers.
5. Prefer cohesive modules over arbitrary line-count targets.
6. Treat offline persistence, retries, and cache keys as product invariants.
7. Preserve Auth, authorization, and RLS boundaries; do not infer security from
   client checks alone.
8. Delete code only after static, dynamic, test, tooling, and public-surface
   references have been ruled out.
9. Test observable behavior against the canonical production implementation.
10. Compare refactors with a baseline; a passing build alone does not prove
    behavior preservation.
