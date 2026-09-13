# Workout Tracker Roadmap & Edge Cases TODO

This document tracks identified architectural improvements, edge case handling, analytics features, and performance optimizations.

## Master tracker rules

This file is the master checklist for planned work. Detailed knowledge remains
in supporting documents; nothing is deleted or moved as part of this structure.

- **Status**: `[ ]` pending, `[x]` completed, and `BLOCKED` is written beside
  an item only when an external dependency prevents progress.
- **IDs**: Every tracked item has a stable ID. Supporting documents should link
  to these IDs instead of creating duplicate active checkboxes.
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

- [x] **TIM-001 — Wall-Clock Time Delta for Background/Locked Screen Resiliency**
  - **Issue**: Standard `setInterval` ticks throttle or pause when phone screens lock or users switch apps (e.g. Spotify).
  - **Action**: Refactor timers in `AssistedTimedTracker.tsx` to compute elapsed time using `Date.now()` target end times and `visibilitychange` listeners rather than naive tick counters.

- [x] **TIM-002 — Workout Session Auto-Save & Abandonment Recovery**
  - **Issue**: Accidental tab closures, reloads, or device crashes mid-workout lose in-progress sets and entry timestamps.
  - **Action**: Persist in-progress workout draft state to `localStorage` / `IndexedDB`.
  - **Action**: Implement a timeout threshold (e.g., auto-discard or prompt to restore sessions older than 3 hours).

---

## 2. Metric Calculations & Exercise Types

- [x] **MET-001 — Bodyweight Exercises Volume Tracking**
  - **Context**: Working sets for unweighted bodyweight movements (pull-ups, dips, push-ups) are logged with `0 kg` added weight.
  - **Action**: Track progression via **Total Reps** so users don't see $0\text{ kg}$ total volume on bodyweight days.

---

## 3. Insights & Analytics Roadmap

- [x] **INS-001 — Per-Exercise Progressive Overload Curves**
  - **Action**: Add individual exercise drill-down views showing estimated 1RM trajectory, max weight over time, and rep volume trends across 30/60/90 days.

- [ ] **INS-002 — Muscle Group Fatigue & Weekly Set Distribution**
  - **Action**: Categorize exercises by primary/secondary muscle groups (Chest, Back, Legs, Shoulders, Arms, Core) and visualize weekly set volume against standard hypertrophy targets (10–20 sets/week).

- [x] **INS-003 — Rest Interval Discipline Analysis**
  - **Action**: Compare actual recorded rest times against target rest intervals to highlight pacing consistency and rest discipline.

---

## 4. Storage, PWA Offline Experience & Media Optimization

- [x] **STO-001 — Client-Side Image Compression**
  - **Issue**: Modern mobile camera photos range from 3–8 MB, quickly consuming Supabase storage quotas and slowing down uploads on gym cellular networks.
  - **Action**: Compress images via HTML Canvas WebP with high-resolution $2160\text{p}$ bounds and muscle-definition edge preservation before uploading to Supabase `media` bucket.

- [x] **STO-002 — Offline Sync & Queueing (PWA Resiliency)**
  - **Issue**: Gym basements with poor cellular reception fail Supabase completion requests.
  - **Action**: Queue offline session completions and set logs in `IndexedDB` and trigger background sync once connectivity is restored via `navigator.onLine` and `window.addEventListener('online')`.

---

## 5. Backlog & Active Ideas
*For expanded product ideas, anatomy guides, and role-based permissions, see [IDEAS.md](IDEAS.md).*

- [ ] **BACK-001 — Homepage & Landing Experience**
- [ ] **BACK-002 — Water Intake Tracking**
- [ ] **BACK-003 — Barcode Product Scanner (Albert Heijn / Open Food Facts Indexing)**
- [ ] **BACK-004 — WGER Exercise Library & Muscle Target Visuals (Red Target Anatomy)**
- [ ] **BACK-005 — 1:1 Exercise Video & Form Guidance Links**
- [ ] **BACK-006 — S3 / Storage Image Compression Pipeline**
- [ ] **BACK-007 — Dietary Input Leading Zero (`0`) Input Bug Fix**
- [ ] **BACK-008 — Last Known Weight Set Auto-Population Review**
- [ ] **BACK-009 — Sleep Hours & Energy Level Persistence in Session History**
- [ ] **BACK-010 — Role-Based Access Control (Athlete / Coach / Admin)**

---

## 6. Beginner Experience TODOs

These items should improve the beginner journey without filling the active
session screen with explanatory content.

### Product TODOs

- [ ] **BEGIN-001 — Clear “What Do I Do Now?” Starting State**
  - Show the current workout, estimated duration, and a clear `Start Here`
    action.
  - Example: `Today's workout: Upper Body A · Estimated time: 45 minutes`.

- [ ] **BEGIN-002 — Beginner-Safe Defaults**
  - Provide a suggested starting weight.
  - Provide suggested reps and rest time.
  - Warn users not to increase weight too quickly.
  - Keep clear form and safety cues available from the exercise guide.

- [ ] **BEGIN-003 — Guided First Workout**
  - Guide a new user through starting a workout, opening an exercise guide,
    entering weight and reps, completing a set, resting, and submitting.
  - Keep this guidance in onboarding or a coach-mark flow rather than the
    permanent session layout.

- [ ] **BEGIN-004 — Actionable Progression Explanations**
  - Explain why progression is recommended.
  - Example: `You completed all target reps with good control. Next time, try
    adding 2.5 kg.`
  - Make clear that progression is recommended, not mandatory.

- [ ] **BEGIN-005 — Clear Recovery Guidance**
  - Explain whether training is appropriate based on previous workouts, sleep,
    energy, soreness, and planned training days.
  - Keep detailed explanations behind a recovery help/info action.

- [ ] **BEGIN-006 — Beginner-Friendly Empty States**
  - Replace empty messages with a clear next action.
  - Explain how to create a routine, log a first workout, or add a meal.

- [ ] **BEGIN-007 — Safety and Trust Information**
  - Explain private data handling.
  - Explain custom GIF ownership.
  - Explain bodyweight visibility.
  - Explain how shared routines work.
  - Explain what happens when a workout is deleted.

### FAQ-only content

Only the basic terminology belongs in the FAQ instead of the active session
page:

- [ ] **FAQ-001 — What is a set?**
- [ ] **FAQ-002 — What are reps?**
- [ ] **FAQ-003 — What is rest time?**
- [ ] **FAQ-004 — How heavy should I start?**
- [ ] **FAQ-005 — When should I increase weight?**
- [ ] **FAQ-006 — What does 1RM mean?**

FAQ rules:

- Do not place the full explanations permanently on the session page.
- Link to the FAQ from relevant labels or help icons.
- Use short contextual tooltips only when the user is likely to be confused.
- Keep safety-critical form cues available directly in the exercise guide.

---

## 7. Authentication & Account Security

- [ ] **AUTH-001 — Verified Email and Password Sign-In**
  - Add email/password registration directly in the app alongside Google sign-in.
  - Send a verification email before activating the account.
  - Prevent unverified users from signing in to protected application areas.
  - Provide safe resend-verification and expired-link recovery flows.
  - Support password reset without revealing whether an email address exists.
  - Rate-limit registration, login, resend, and password-reset attempts.
  - Keep authentication errors clear for users but avoid account enumeration.
  - Preserve the existing session, redirect, and account-isolation behavior.

  Automatic tests:

  - A verified email can sign in successfully.
  - An unverified email cannot enter protected routes.
  - Verification changes the account to an allowed sign-in state.
  - Expired or reused verification links fail safely.
  - Resend and reset responses do not reveal whether an account exists.
  - Repeated authentication attempts are rate-limited.

  Manual test:

  1. Register with a new email address.
  2. Confirm the verification email is received.
  3. Try signing in before verification and confirm access is blocked.
  4. Verify the address and sign in successfully.
  5. Test resend verification, an expired link, password reset, and logout.
  6. Confirm Google sign-in still works and no account data crosses users.

---

## 8. Workout and Nutrition Connection

- [ ] **DIET-001 — Estimate Calorie Balance from Sessions and Food Logs**
  - Connect completed workout sessions with the user's food and meal logs.
  - Estimate daily and weekly calorie intake from logged foods, meals, and
    recipes.
  - Estimate expenditure using profile data, activity, and completed sessions.
  - Show an estimated calorie balance or range rather than presenting a single
    number as fact.
  - Clearly label missing food logs, missing profile data, and uncertainty.
  - Use multi-day trends instead of deciding whether the user is in a deficit
    from one workout or one day.
  - Keep bodyweight trends separate from estimates and never present this as
    medical advice.

  Automatic tests:

  - A completed session contributes to the correct user's estimate only.
  - Food logs and workouts from different users never affect each other.
  - Missing food, body metric, or session data produces an honest incomplete
    state instead of a false deficit.
  - Daily and weekly estimates use the correct date and timezone.
  - Deleted sessions are excluded from recalculated estimates.
  - The result includes an uncertainty or estimation status.

  Manual test:

  1. Log food for a day and complete a workout.
  2. Confirm the estimate includes both sources.
  3. Add another meal and confirm the estimate updates.
  4. Delete the workout and confirm it is removed from the recalculation.
  5. Switch accounts and confirm neither user's nutrition or workout data
     affects the other.