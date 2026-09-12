# Workout Tracker Roadmap & Edge Cases TODO

This document tracks identified architectural improvements, edge case handling, analytics features, and performance optimizations.

## Master tracker rules

This file is the master checklist for planned work. Detailed knowledge remains
in supporting documents; nothing is deleted or moved as part of this structure.

- Use this file for task status and priority.
- Use supporting plans for requirements, design decisions, and test cases.
- Every completed item should eventually reference its commit and test.
- Do not duplicate a task in multiple active checklists.
- When two documents overlap, this master tracker links to the more detailed
  source instead of deleting historical knowledge.
- New work follows: one change, one focused test, one commit.

Supporting plans:

- [Storage, custom content, sharing, diet, and ingestion plan](../storage-sharing-plan.md)
- [Storage inventory](../storage-inventory.md)
- [Architecture documentation](../architecture/ARCHITECTURE.md)
- [Testing structure](../testing/TESTING_STRUCTURE.md)

---

## 1. Timing & Gym Tracking Edge Cases

- [x] **Wall-Clock Time Delta for Background/Locked Screen Resiliency**
  - **Issue**: Standard `setInterval` ticks throttle or pause when phone screens lock or users switch apps (e.g. Spotify).
  - **Action**: Refactor timers in `AssistedTimedTracker.tsx` to compute elapsed time using `Date.now()` target end times and `visibilitychange` listeners rather than naive tick counters.

- [x] **Workout Session Auto-Save & Abandonment Recovery**
  - **Issue**: Accidental tab closures, reloads, or device crashes mid-workout lose in-progress sets and entry timestamps.
  - **Action**: Persist in-progress workout draft state to `localStorage` / `IndexedDB`.
  - **Action**: Implement a timeout threshold (e.g., auto-discard or prompt to restore sessions older than 3 hours).

---

## 2. Metric Calculations & Exercise Types

- [x] **Bodyweight Exercises Volume Tracking**
  - **Context**: Working sets for unweighted bodyweight movements (pull-ups, dips, push-ups) are logged with `0 kg` added weight.
  - **Action**: Track progression via **Total Reps** so users don't see $0\text{ kg}$ total volume on bodyweight days.

---

## 3. Insights & Analytics Roadmap

- [x] **Per-Exercise Progressive Overload Curves**
  - **Action**: Add individual exercise drill-down views showing estimated 1RM trajectory, max weight over time, and rep volume trends across 30/60/90 days.

- [ ] **Muscle Group Fatigue & Weekly Set Distribution**
  - **Action**: Categorize exercises by primary/secondary muscle groups (Chest, Back, Legs, Shoulders, Arms, Core) and visualize weekly set volume against standard hypertrophy targets (10–20 sets/week).

- [x] **Rest Interval Discipline Analysis**
  - **Action**: Compare actual recorded rest times against target rest intervals to highlight pacing consistency and rest discipline.

---

## 4. Storage, PWA Offline Experience & Media Optimization

- [x] **Client-Side Image Compression**
  - **Issue**: Modern mobile camera photos range from 3–8 MB, quickly consuming Supabase storage quotas and slowing down uploads on gym cellular networks.
  - **Action**: Compress images via HTML Canvas WebP with high-resolution $2160\text{p}$ bounds and muscle-definition edge preservation before uploading to Supabase `media` bucket.

- [x] **Offline Sync & Queueing (PWA Resiliency)**
  - **Issue**: Gym basements with poor cellular reception fail Supabase completion requests.
  - **Action**: Queue offline session completions and set logs in `IndexedDB` and trigger background sync once connectivity is restored via `navigator.onLine` and `window.addEventListener('online')`.

---

## 5. Backlog & Active Ideas
*For expanded product ideas, anatomy guides, and role-based permissions, see [IDEAS.md](IDEAS.md).*

- [ ] **Homepage & Landing Experience**
- [ ] **Water Intake Tracking**
- [ ] **Barcode Product Scanner (Albert Heijn / Open Food Facts Indexing)**
- [ ] **WGER Exercise Library & Muscle Target Visuals (Red Target Anatomy)**
- [ ] **1:1 Exercise Video & Form Guidance Links**
- [ ] **S3 / Storage Image Compression Pipeline**
- [ ] **Dietary Input Leading Zero (`0`) Input Bug Fix**
- [ ] **Last Known Weight Set Auto-Population Review**
- [ ] **Sleep Hours & Energy Level Persistence in Session History**
- [ ] **Role-Based Access Control (Athlete / Coach / Admin)**

---

## 6. Beginner Experience TODOs

These items should improve the beginner journey without filling the active
session screen with explanatory content.

### Product TODOs

- [ ] **Clear “What Do I Do Now?” Starting State**
  - Show the current workout, estimated duration, and a clear `Start Here`
    action.
  - Example: `Today's workout: Upper Body A · Estimated time: 45 minutes`.

- [ ] **Beginner-Safe Defaults**
  - Provide a suggested starting weight.
  - Provide suggested reps and rest time.
  - Warn users not to increase weight too quickly.
  - Keep clear form and safety cues available from the exercise guide.

- [ ] **Guided First Workout**
  - Guide a new user through starting a workout, opening an exercise guide,
    entering weight and reps, completing a set, resting, and submitting.
  - Keep this guidance in onboarding or a coach-mark flow rather than the
    permanent session layout.

- [ ] **Actionable Progression Explanations**
  - Explain why progression is recommended.
  - Example: `You completed all target reps with good control. Next time, try
    adding 2.5 kg.`
  - Make clear that progression is recommended, not mandatory.

- [ ] **Clear Recovery Guidance**
  - Explain whether training is appropriate based on previous workouts, sleep,
    energy, soreness, and planned training days.
  - Keep detailed explanations behind a recovery help/info action.

- [ ] **Beginner-Friendly Empty States**
  - Replace empty messages with a clear next action.
  - Explain how to create a routine, log a first workout, or add a meal.

- [ ] **Safety and Trust Information**
  - Explain private data handling.
  - Explain custom GIF ownership.
  - Explain bodyweight visibility.
  - Explain how shared routines work.
  - Explain what happens when a workout is deleted.

### FAQ-only content

Only the basic terminology belongs in the FAQ instead of the active session
page:

- [ ] **What is a set?**
- [ ] **What are reps?**
- [ ] **What is rest time?**
- [ ] **How heavy should I start?**
- [ ] **When should I increase weight?**
- [ ] **What does 1RM mean?**

FAQ rules:

- Do not place the full explanations permanently on the session page.
- Link to the FAQ from relevant labels or help icons.
- Use short contextual tooltips only when the user is likely to be confused.
- Keep safety-critical form cues available directly in the exercise guide.