# Testing architecture and directory structure

Tests are organized by the boundary they exercise. The production module is the
source of truth: do not retain or create a fake implementation solely to make a
test easier to write.

---

## 📁 Directory Structure

```text
tests/
├── setup/                                  # Global test environment configurations
│   ├── frontend.setup.ts                   # Testing Library matchers & DOM cleanup
│   └── backend.setup.ts                    # Node runtime setup, database & environment mocks
│
├── shared/                                 # Shared utilities across both frontend & backend
│   ├── fixtures/
│   │   └── factories.ts                    # Reusable test data factories (userFactory, workoutFactory, etc.)
│   ├── helpers/
│   │   ├── mockSupabase.ts                 # Shared mock Supabase client instances
│   │   └── testDb.ts                       # Database cleanup, seeding, and session mock helpers
│   └── domain/                             # Pure business logic & calculation engine unit tests
│       ├── exerciseSearch.test.ts          # Fuzzy search, indexing, and ranking logic
│       ├── progressionEngine.test.ts       # 1RM formulas, progressive overload & volume calculations
│       └── macroCalculator.test.ts         # Dietary, TDEE, and macro target calculations
│
├── frontend/                               # React UI components & hook tests
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginScreen.test.tsx
│   │   ├── dietary/
│   │   │   ├── DietaryDailyMacroTotals.test.tsx
│   │   │   ├── DietaryDateNavigator.test.tsx
│   │   │   └── FoodSearchModal.test.tsx
│   │   ├── insights/
│   │   │   ├── InsightsHeroMetrics.test.tsx
│   │   │   └── WeeklyVolumeChart.test.tsx
│   │   ├── modals/
│   │   │   ├── ProfileModal.test.tsx
│   │   │   ├── RoutineEditorModal.test.tsx
│   │   │   └── SettingsModal.test.tsx
│   │   ├── ui/
│   │   │   ├── ConfirmModal.test.tsx
│   │   │   ├── ErrorBoundary.test.tsx
│   │   │   └── Header.test.tsx
│   │   └── workout/
│   │       ├── ExerciseProgressionCard.test.tsx
│   │       ├── PublicSessionView.test.tsx
│   │       ├── WorkoutDayTracker.test.tsx
│   │       └── history/
│   │           └── WorkoutHistoryItem.test.tsx
│   └── hooks/
│       ├── useDietaryTracking.test.ts
│       └── useWorkoutSession.test.ts
│
└── backend/                                # Database & API integration tests
    ├── auth/
    │   ├── authLogin.test.ts
    │   ├── authSessionSecurity.test.ts
    │   └── dataBackup.test.ts
    ├── dietary/
    │   ├── backendDietaryDbDomain.test.ts
    │   └── dietaryCrudMatrix.test.ts
    ├── users/
    │   ├── backendUserDbDomain.test.ts
    │   ├── happyPathUserForms.test.ts
    │   ├── userCreationStatusCodes.test.ts
    │   ├── userDeletion.test.ts
    │   ├── userOnboardingWorkflows.test.ts
    │   ├── userPreferencesMetrics.test.ts
    │   ├── userProgressionState.test.ts
    │   └── usersCrudMatrix.test.ts
    └── workouts/
        ├── assistedTimedWorkout.test.ts
        ├── backendDbDomain.test.ts
        ├── fullEntityCrudMatrix.test.ts
        ├── happyPathWorkoutForms.test.ts
        ├── routineCreationStatusCodes.test.ts
        ├── routineDeletion.test.ts
        ├── userRoutinesCrud.test.ts
        └── workoutsExercisesCrudMatrix.test.ts
```

---

## Layer responsibilities

| Layer | Path | Environment | Purpose |
| :--- | :--- | :--- | :--- |
| **Shared Fixtures** | `tests/shared/fixtures/` | Test-runner dependent | Mock object builders (`factories.ts`) used uniformly across UI and DB tests. |
| **Shared Helpers** | `tests/shared/helpers/` | Test-runner dependent | Common mocking utilities (e.g. Supabase and local-storage fallback helpers). |
| **Shared Domain** | `tests/shared/domain/` | Node (fast) | Pure, framework-agnostic algorithms (overload formulas, search algorithms). |
| **Frontend** | `tests/frontend/` | Frontend test setup when configured | React component render tests, user event simulations, and hook state lifecycle. |
| **Backend** | `tests/backend/` | Node-oriented tests | Database CRUD operations, data persistence, API handlers, validation, and status-code matrices. |

---

## Production boundaries and test targets

### Canonical data modules

Database tests should import the relevant implementation under
`src/lib/db/`: users, biometrics, workouts, sessions, backup, admin, or the
roles-domain modules. `src/lib/db/workouts.ts` and
`src/lib/db/roles.ts` are supported compatibility barrels, so tests may also
verify their re-export contracts. Do not test an obsolete duplicate
implementation.

`src/lib/supabaseData.ts` remains an intentional compatibility surface. Existing
component tests that import it are protecting supported imports and its active
progress/catalog responsibilities. New database tests should target the
canonical domain module directly when one exists.

### Workout session

`tests/frontend/hooks/useWorkoutSession.test.ts` and the
`WorkoutDayTracker` tests exercise the public hook boundary. High-risk coverage
should use the production hook/helpers for:

- starting and loading sessions, drafts, and workouts;
- set logging, sequential progression, and rest-timer transitions;
- autosave and completion persistence;
- photos, celebration state, and error paths.

The hook remains the lifecycle/orchestration boundary. Tests should protect
observable state transitions and effect cleanup rather than require a particular
internal file split.

### Offline behavior

Offline tests should exercise the actual localStorage and IndexedDB utilities:
`src/utils/draftPhotoStorage.ts`, `src/utils/offlineQueue.ts`, and the catalog
cache path in `src/lib/supabaseData.ts`. Cover serialization, cleanup,
network/offline decisions, retry/idempotency behavior, and failure handling.
The PWA context currently exposes connectivity state but its queue flush
integration is disabled; tests must not assert automatic sync that the
application does not wire.

### API and security boundaries

API tests import the actual handlers under `api/` and, where relevant, test
their mounting through `server.ts`. Scraper tests should cover target
validation and SSRF-sensitive URL rejection as well as successful adapters.
Database authorization assumptions are tested against the canonical DB calls
and migration/RLS test coverage; client-side role state is not a substitute for
database policy enforcement.

### Fixtures and mocks

Use `tests/shared/fixtures/factories.ts` and shared Supabase helpers where
appropriate. Mocks should replace external boundaries, not reimplement the
logic under test. If a compatibility barrel is intentionally retained, a
small import/export test is preferable to duplicating all domain tests through
the barrel.

## Verification discipline

Run the narrowest relevant test command after a change, then run typecheck,
lint, build, and the full suite before declaring a refactor safe. Compare
failure signatures with the recorded baseline; totals alone are insufficient.
The repository's known baseline includes missing-DOM/localStorage environment
failures, which should be distinguished from regressions in application
behavior.

## NPM scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run tests/shared/domain",
    "test:frontend": "vitest run tests/frontend",
    "test:backend": "vitest run tests/backend",
    "test:watch": "vitest"
  }
}
```
