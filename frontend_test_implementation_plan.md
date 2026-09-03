# Frontend Test Implementation Plan

> **Methodology**: First-Principles Behavioral Testing (Farley CD & Musk Engineering Rigor)  
> **Goal**: 100% resilient, zero-flake, dynamic frontend test suite for all UI components and custom hooks without testing implementation details.

---

## 1. Core Principles & Strict Rules

1. **Test User Outcomes & State Transitions, Never DOM Internals**:
   - Query exclusively via accessible roles (`getByRole`, `getByLabelText`, `getByText`).
   - Never query CSS classes (`.flex`, `.bg-black`) or direct tag hierarchies (`div > div > span`).
2. **Generative & Dynamic Test Data**:
   - Every test consumes randomized/parameterized factory models from `tests/shared/fixtures/factories.ts`.
   - Never rely on brittle hardcoded strings across test assertions.
3. **Zero Test Weakening**:
   - If a test fails due to a broken component, the test remains untouched; the production bug is reported and fixed.
4. **Zero-Flake Asynchrony**:
   - Always use `@testing-library/user-event` and reactive `findBy*` or `waitFor` assertions. Zero `setTimeout` or `sleep`.

---

## 2. Environment & Infrastructure Setup

### Dependencies to Install
```bash
pnpm add -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Files to Configure
- `tests/setup/frontend.setup.ts`:
  - Register `@testing-library/jest-dom/vitest`.
  - Global `afterEach(cleanup)`.
  - Mock browser APIs not in JSDOM (`window.matchMedia`, `ResizeObserver`, `IntersectionObserver`, `crypto.randomUUID`).
- `vite.config.ts`:
  - Add `test` configuration block with `environment: 'jsdom'` and setup files.
- `package.json`:
  - Add `"test:frontend": "vitest run tests/frontend"`.

---

## 3. Implementation Phases & Component Matrix

### Phase 1: Foundation & Shared UI Components (`tests/frontend/components/ui/`)
Focused on baseline UX primitives, dialogs, and navigation.

| Target Component | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`Header`** | `tests/frontend/components/ui/Header.test.tsx` | Tab switching triggers, active indicator highlight, opening settings modal. |
| **`ConfirmModal`** | `tests/frontend/components/ui/ConfirmModal.test.tsx` | Dynamic destructive/standard actions, keyboard dismiss (Esc), confirm/cancel callbacks. |
| **`ErrorBoundary`** | `tests/frontend/components/ui/ErrorBoundary.test.tsx` | Simulated component crash, fallback UI rendering, retry action. |

---

### Phase 2: Custom React Hooks (`tests/frontend/hooks/`)
Focused on headless reactive state machines, calculations, and persistence.

| Target Hook | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`useDietaryTracking`** | `tests/frontend/hooks/useDietaryTracking.test.ts` | Adding/deleting food logs, real-time macro aggregation, date navigation state. |
| **`useWorkoutSession`** | `tests/frontend/hooks/useWorkoutSession.test.ts` | Starting session, logging set reps/weights, timer state changes, workout completion dispatch. |

---

### Phase 3: Auth & Modal Domain Components (`tests/frontend/components/auth/` & `modals/`)
Focused on user settings, routine editing, and authentication states.

| Target Component | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`LoginScreen`** | `tests/frontend/components/auth/LoginScreen.test.tsx` | Guest mode bypass, email/password form validation, loading/error states. |
| **`SettingsModal`** | `tests/frontend/components/modals/SettingsModal.test.tsx` | Theme toggle, PWA install prompt trigger, export/import JSON backup flow. |
| **`ProfileModal`** | `tests/frontend/components/modals/ProfileModal.test.tsx` | Biometric metric updates (weight, body fat), target caloric calculations. |
| **`RoutineEditorModal`** | `tests/frontend/components/modals/RoutineEditorModal.test.tsx` | Adding exercises to routine, reordering exercise list, saving workout template. |

---

### Phase 4: Dietary Domain (`tests/frontend/components/dietary/`)
Focused on food search, macro display, and meal logging.

| Target Component | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`DietaryDailyMacroTotals`** | `tests/frontend/components/dietary/DietaryDailyMacroTotals.test.tsx` | Dynamic progress bar percentages for Protein, Carbs, Fat, and Calories vs target goals. |
| **`FoodSearchModal`** | `tests/frontend/components/dietary/FoodSearchModal.test.tsx` | Live search debouncing, supermarket tabs (AH/Jumbo/Dirk), portion quantity multipliers. |
| **`LoggedFoodList`** | `tests/frontend/components/dietary/LoggedFoodList.test.tsx` | Grouping by meal category (Breakfast, Lunch, Dinner, Snacks), deleting logged food entry. |

---

### Phase 5: Workout Domain & Active Tracking (`tests/frontend/components/workout/`)
Focused on the core user experience during exercise sessions.

| Target Component | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`WorkoutDayTracker`** | `tests/frontend/components/workout/WorkoutDayTracker.test.tsx` | Active routine display, exercise set logging, target rep ranges, workout finish event. |
| **`ExerciseProgressionCard`** | `tests/frontend/components/workout/ExerciseProgressionCard.test.tsx` | Previous set history comparison, progressive overload badges, 1RM trajectory metrics. |
| **`WorkoutHistory`** | `tests/frontend/components/workout/WorkoutHistory.test.tsx` | Paginated past workouts, session volume calculation, history deletion with confirmation. |

---

### Phase 6: Insights & Visualizations (`tests/frontend/components/insights/`)
Focused on metric computation and charting components.

| Target Component | File Location | Dynamic Scenarios |
| :--- | :--- | :--- |
| **`InsightsHeroMetrics`** | `tests/frontend/components/insights/InsightsHeroMetrics.test.tsx` | Weekly volume totals, workout streak counter, average intensity calculation. |
| **`WeeklyVolumeChart`** | `tests/frontend/components/insights/WeeklyVolumeChart.test.tsx` | Dynamic volume bars by muscle group, empty state handling when no sessions exist. |

---

## 4. Execution Roadmap

```text
[Step 1: Setup]
  ├── Install testing dependencies (jsdom, @testing-library/*)
  ├── Create tests/setup/frontend.setup.ts
  └── Configure vite.config.ts & package.json scripts

[Step 2: Core Primitives]
  ├── Header.test.tsx
  ├── ConfirmModal.test.tsx
  └── ErrorBoundary.test.tsx

[Step 3: Business Hooks]
  ├── useDietaryTracking.test.ts
  └── useWorkoutSession.test.ts

[Step 4: Major Workflows]
  ├── WorkoutDayTracker.test.tsx
  ├── FoodSearchModal.test.tsx
  └── SettingsModal.test.tsx

[Step 5: CI & Verification]
  ├── Run full frontend suite: `pnpm test:frontend`
  └── Run entire project suite: `pnpm test`
```
