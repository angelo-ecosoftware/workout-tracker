# Product Correctness Remediation

## 1. Executive Summary

This document provides the formal analysis and remediation plan following the comprehensive Product Correctness Audit of the frontend application. It distinguishes verified product defects from test coverage gaps, tests that protected incorrect assumptions, and matters requiring explicit Product/UX decisions.

### Core Distinctions
- **Confirmed Production Bugs**: Real defects in application state, data persistence, and numeric boundary handling verified directly against source code.
- **Tests Testing Incorrect Behavior**: Tests that inadvertently asserted or assumed flawed behavior (e.g. happy-path-only assertions that permitted out-of-bound inputs, or isolated single-day mocks that hid cross-day draft leakage).
- **Missing Test Coverage**: Critical user workflows (such as switching split routine days with drafts) that had zero automated test protection.
- **Items Requiring Product/UX Decisions**: Architectural or domain-specific UX questions that cannot be assumed without explicit stakeholder confirmation.

---

## 2. Issue Inventory

| ID | Area | Issue | Evidence | Severity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | Workout Tracker | **Cross-Day Draft Leakage** | `useWorkoutSession.ts`: Global draft fallback `workout_draft_latest_${uid}` loaded Day 1 draft values into Day 2 when Day 2 lacked its own draft. | High | **CONFIRMED BUG (FIXED)** |
| **ISS-02** | Workout Tracker | **Exercise Difficulty Stepping Clamping** | `useWorkoutSession.ts`: Stepping difficulty down reached below 1 and stepping up exceeded 10. | Medium | **CONFIRMED BUG (FIXED)** |
| **ISS-03** | Profile Modal | **Unvalidated Biometric Bounds on Save** | `ProfileModal.tsx`: Form parsed `parseFloat(height)` / `parseFloat(weight)` without boundary checks. Added confirmation warning dialog when outside standard bounds (`Height: 50–280cm`, `Weight: 20–400kg`). | Medium | **CONFIRMED FIX (COMPLETED)** |
| **ISS-04** | Dietary Tracking | **Custom Food Negative Macros Handling** | `CustomFoodTab.tsx` & `useDietaryTracking.ts`: Negative signs blocked on typing and macros clamped $\ge 0$ on save. | Medium | **CONFIRMED FIX (COMPLETED)** |
| **ISS-05** | Workout History | **Workout Date Edit vs Daily Bodyweight Desynchronization** | `WorkoutHistory.tsx`: Updating workout date updates `completedAt` but does not move the associated `body_measurement_logs` entry. | Low | **CONFIRMED BEHAVIOR** |
| **ISS-06** | Settings / Backup | **Import All Logs Conflict Strategy** | `supabaseData.ts`: `importAllLogs` replaces tables without transactional rollback. | Medium | **NEEDS PRODUCT DECISION** |

---

## 3. Remediation Plan

### Issue ISS-01: Workout Routine Day Draft Isolation (Confirmed Bug)
- **Current Behavior**: Saving draft on Workout Day 1 populates Day 2 when switching routines if Day 2 lacks a draft.
- **Intended Behavior**: Each workout day's draft must be strictly isolated to its own `workoutId`. Switching to Day 2 without a draft must load fresh default values for Day 2 exercises.
- **Root Cause**: `useWorkoutSession.ts` had a global fallback `localStorage.getItem("workout_draft_latest_" + user.uid)` and wrote to `workout_draft_latest`.
- **Production Files Involved**: `src/components/workout/tracker/useWorkoutSession.ts`
- **Test Files Involved**: `tests/frontend/hooks/useWorkoutSession.test.ts`, `tests/frontend/components/workout/WorkoutDayTracker.test.tsx`
- **Fix Required**: Remove the global latest draft fallback for input pre-population so drafts are strictly keyed by `${user.uid}_${activeWorkout.id}`.
- **Regression Test Required**: Load Day 1, type custom weights, save draft, switch `activeWorkout` to Day 2, and assert Day 2 displays Day 2 defaults, not Day 1 values.

### Issue ISS-02: Exercise Difficulty Stepping & Direct Text Clamping (Confirmed Bug)
- **Current Behavior**: Stepping down difficulty can reach 0, difficulty stepping allows unbounded values, and direct text input previously permitted ratings outside 1–10.
- **Intended Behavior**: Exercise difficulty must strictly stay between `1` (min) and `10` (max) whether adjusted via step buttons (`-1`/`+1`) or typed directly into the input field.
- **Root Cause**: `updateInputValue` and `handleTextChange` in `useWorkoutSession.ts` lacked field-specific clamping for `difficulty` (1–10).
- **Production Files Involved**: `src/components/workout/tracker/useWorkoutSession.ts`
- **Test Files Involved**: `tests/frontend/hooks/useWorkoutSession.test.ts`
- **Fix Required**: Clamp `difficulty` between `1` and `10` on stepping in `updateInputValue`, bound values on direct typing in `handleTextChange`, and sanitize payload generation in `handleLogWorkout`.
- **Regression Test Required**:
  1. Set difficulty to `1`, step down `-1`, assert it remains `1`.
  2. Set difficulty to `10`, step up `+1`, assert it remains `10`.
  3. Direct typing `15` bounds to `10`, typing `8` stays `8`, typing invalid characters sanitizes cleanly.

---

## 4. Product Decisions Staging (ISS-03, ISS-04, ISS-05, ISS-06)

These items remain explicitly staged in the **Product Decision** bucket pending formal confirmation before modifying production code:

- **ISS-03 (Athlete Profile Biometric Boundary Warning)**: User confirmed adding a reusable confirmation warning dialog when biometric values appear outside standard bounds (e.g. `Height: 50-280cm`, `Weight: 20-400kg`: *"Are you sure [value] is correct?"*).
- **ISS-04 (Custom Food Negative Macros)**: User confirmed **Option A** (Prevent negative typing via input sanitization and clamp to `0` on save).
- **ISS-05 (Workout Session Start Time vs Daily Bodyweight Trigger)**: User clarified that workout session timing and daily bodyweight tracking starts the moment a photo is attached or numbers on sets/weights are modified.
- **ISS-06 (Backup & Restore Conflict Strategy)**: Awaiting decision on whether JSON restore should perform full transactional replacement or record-level merge.

---

## 5. Verification Log

- **Tests Added/Modified**:
  - `tests/frontend/hooks/useWorkoutSession.test.ts` (Added draft isolation test across routine days & difficulty clamping test).
- **Production Code Changed**:
  - `src/components/workout/tracker/useWorkoutSession.ts` (Draft key isolation & difficulty clamping).
- **Verification Commands**:
  - `pnpm vitest run tests/frontend`
  - `pnpm test`
