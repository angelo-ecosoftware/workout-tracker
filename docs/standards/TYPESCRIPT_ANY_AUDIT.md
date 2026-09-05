# TypeScript `any` Type Audit & Remediation Roadmap

This document outlines the static analysis audit of all `any` type annotations across `src/` and `api/`, categorized by architectural priority and remediation phase.

---

## 1. Executive Summary

A comprehensive scan identified **82 occurrences** of the `any` type across the codebase.

```
Total `any` instances: 82
├── Category 1: Catch Block Error Handling (catch (err: any)) → 38 (46%)
├── Category 2: Supabase Raw Row Mapping ((d: any) => ...)   → 24 (29%)
├── Category 3: Experimental / Non-Standard Web APIs          → 10 (12%)
├── Category 4: Backup / JSON Importers & Raw Payloads        → 6 (7%)
└── Category 5: React Component State & Props                 → 4 (5%)
```

---

## 2. Categorization & Risk Assessment

### Category 1: Catch Block Error Handling (38 instances — Low Risk)
- **Pattern**: `} catch (err: any) { setErrorMsg(err.message); }`
- **Locations**:
  - `src/components/workout/tracker/useWorkoutSession.ts`
  - `src/components/dietary/useDietaryTracking.ts`
  - `src/components/auth/LoginScreen.tsx`
  - `src/context/AuthContext.tsx`
  - Various modal and API handlers
- **Assessment**: Safe at runtime with standard fallbacks.
- **Remediation**: Transition to `catch (err: unknown)` paired with `err instanceof Error ? err.message : String(err)`.

### Category 2: Supabase Database Row Mappers (24 instances — Medium Priority)
- **Locations**:
  - `src/lib/supabaseData.ts`
  - `src/lib/db/sessions.ts`
  - `src/lib/db/roles.ts`
  - `src/lib/dietaryData.ts`
- **Pattern**: `const sessions: Session[] = (data || []).map((d: any) => ({ ... }))`
- **Assessment**: Dynamic Supabase responses without strict TypeScript generics. Mapper functions normalize them safely into domain models (`Session`, `WorkoutSet`, `FoodItemNutrition`).
- **Remediation**: Introduce typed database row interfaces (`DbSessionRow`, `DbSetRow`, `DbUserRoleRow`) in `src/types/supabase.ts`.

### Category 3: Experimental & Browser-Specific Web APIs (10 instances — Expected / Justified)
- **Locations**:
  - `src/context/PWAContext.tsx`: `beforeinstallprompt` event and `window.deferredInstallPrompt`.
  - `src/components/dietary/BarcodeScannerModal.tsx`: `window.BarcodeDetector` and `track.getCapabilities().torch`.
  - `src/components/workout/tracker/useWorkoutSession.ts`: `navigator.wakeLock.request('screen')`.
  - `src/utils/sound.ts`: `window.webkitAudioContext`.
- **Remediation**: Declare ambient interfaces in `src/vite-env.d.ts`.

### Category 4: Backup Export / Import JSON Payloads (6 instances — Medium Priority)
- **Locations**:
  - `src/lib/supabaseData.ts` (`importAllLogs(userId: string, data: any)`)
  - `src/lib/db/backup.ts` (`importAllLogs`, `sanitizedWorkouts`)
- **Assessment**: Unstructured user JSON file deserialization.
- **Remediation**: Introduce strict `ExportPayloadV3` schema validation.

### Category 5: React Component State & Props (4 instances — High Priority ⭐)
- **Locations**:
  - `src/components/insights/InsightsBmiCard.tsx`: `hoveredBmiDay: any | null` $\rightarrow$ typed as `BmiDataPoint | null`.
  - `src/components/insights/InsightsView.tsx`: `rawWorkoutsData: any` $\rightarrow$ typed as `{ combinedWorkouts: Workout[]; workoutsList: Workout[]; customExercisesList: Exercise[] }`.
  - `src/hooks/useAssistedTracker.ts`: `timerRef = useRef<any>(null)` $\rightarrow$ typed as `useRef<NodeJS.Timeout | number | null>(null)`.
  - `src/App.tsx`: `window.addEventListener('switch_app_tab' as any)` $\rightarrow$ typed via custom event listener signature.

---

## 3. Phased Execution Plan

| Phase | Description | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | React Component State & Props | `InsightsBmiCard.tsx`, `InsightsView.tsx`, `useAssistedTracker.ts`, `App.tsx` | **Completed** |
| **Phase 2** | Ambient Web API Declarations | `src/vite-env.d.ts`, `PWAContext.tsx`, `sound.ts`, `BarcodeScannerModal.tsx`, `useWorkoutSession.ts`, `offlineQueue.ts` | **Completed** |
| **Phase 3** | Supabase Database Row Mappers | `src/types/supabase.ts`, `src/lib/supabaseData.ts`, `src/lib/db/*.ts` | Planned |
| **Phase 4** | Catch-Block Error Normalization | Whole workspace `catch (err: unknown)` | Planned |
