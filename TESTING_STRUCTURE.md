# Testing Architecture & Directory Structure

This document outlines the testing directory conventions and structure for the Workout Tracker application, cleanly separating frontend, backend, shared utilities, and unit/domain logic.

---

## 📁 Directory Structure

```text
tests/
├── setup/                                  # Global test environment configurations
│   ├── frontend.setup.ts                   # JSDOM, @testing-library matchers & DOM cleanup
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
├── frontend/                               # React UI components & custom hook tests (JSDOM environment)
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
└── backend/                                # Database & API integration tests (Node environment)
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

## 🎯 Layer Responsibilities

| Layer | Path | Environment | Purpose |
| :--- | :--- | :--- | :--- |
| **Shared Fixtures** | `tests/shared/fixtures/` | Node / JSDOM | Mock object builders (`factories.ts`) used uniformly across UI and DB tests. |
| **Shared Helpers** | `tests/shared/helpers/` | Node / JSDOM | Common mocking utilities (e.g. Supabase, localStorage fallback helpers). |
| **Shared Domain** | `tests/shared/domain/` | Node (fast) | Pure, framework-agnostic algorithms (overload formulas, search algorithms). |
| **Frontend** | `tests/frontend/` | JSDOM | React component render tests, user event simulations, hook state lifecycle. |
| **Backend** | `tests/backend/` | Node | Database CRUD operations, data persistence, and status code matrices. |

---

## 📦 NPM Scripts

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
