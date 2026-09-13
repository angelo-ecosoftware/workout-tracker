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

## Priority order

The roadmap follows four gates. A feature should not move to the next gate
while a blocking issue remains in an earlier gate.

### P0 — Make it secure

Protect users and their data before expanding functionality:

- `AUTH-001` — Verified email and password sign-in.
- `SEC-001` through `SEC-005` — RLS, Storage, authentication abuse
  protection, API validation, SSRF protection, and security monitoring.
- `PERF-001` through `PERF-005` — Capacity testing, efficient login, database
  performance, expensive-work queues, and operational monitoring.
- Storage-plan items 1, 2, 5, 6, 7, 12, 13, 14, 15, and 17 — ownership,
  account isolation, sharing permissions, private media, and safe ingestion.
- Backend RLS, Storage policies, authenticated boundaries, input validation,
  rate limiting, and security tests.

### P1 — Make it work

Make the core user journeys correct and dependable:

- `TIM-001`, `TIM-002`, and `MET-001` — reliable timers, session recovery, and
  correct workout metrics.
- `INS-001`, `INS-002`, and `INS-003` — trustworthy progress and training
  analysis.
- Storage-plan items 8, 9, 10, and 11 — input locking, reminders, rest timers,
  and external-route continuity.
- `BACK-007` and `BACK-008` — known dietary input and last-known-weight issues.

### P2 — Make it store data

Make saved information durable, scoped, recoverable, and historically correct:

- `STO-001` and `STO-002` — media handling and offline synchronization.
- `DIET-001` — connect sessions, food logs, bodyweight, goals, and trend data.
- Storage-plan items 1, 3, 4, 7, 12, and 15 — user-scoped storage, IndexedDB
  media, routine versions, account switching, GIFs, and diet sharing.
- `BACK-009` — persist sleep and energy in session history.

### P3 — Make it look good

Improve clarity and polish after the core behavior is safe and reliable:

- `UX-001` and `UX-002` — theme consistency and reusable motion.
- `BEGIN-001` through `BEGIN-007` — beginner-friendly guidance and empty
  states.
- `FAQ-001` through `FAQ-006` — terminology and help content.
- `BACK-001`, `BACK-002`, `BACK-003`, `BACK-004`, `BACK-005`, `BACK-006`, and
  `BACK-010` — broader product and presentation improvements.

Priority rules:

- Security and ownership defects block release of the affected feature.
- Correctness comes before optimization or visual polish.
- Data storage decisions must preserve user ownership and historical records.
- UI polish must not hide missing, estimated, or failed data.
- Each item still follows one change, one focused automatic test, one manual
  test, and one commit.

---

## 10. Security and Performance Hardening

These items are release gates for supporting a large public user base. They
must be completed and tested before promising support for 1,000 simultaneous
users.

### Security

- [ ] **SEC-001 — Verify Database and Storage Ownership Policies**
  - Audit every user-owned table and Storage bucket.
  - Prove that RLS and Storage policies enforce ownership server-side.
  - Test direct REST and Storage access, not only application UI behavior.

  Automatic tests:

  - User A cannot read, insert, update, or delete User B's sessions, sets,
    routines, diet logs, body logs, custom foods, or custom GIFs.
  - Anonymous requests cannot access private records.
  - Shared records expose only explicitly published fields.

  Manual test:

  - Use two accounts and direct database requests to attempt cross-account
    reads and writes.

- [ ] **SEC-002 — Protect Authentication and Account-Recovery Flows**
  - Add rate limits for login, registration, verification resend, and password
    reset.
  - Add bot protection where abuse risk is high.
  - Prevent account enumeration through generic responses.
  - Configure session lifetime, refresh-token rotation, and reauthentication
    for sensitive actions.

  Automatic tests:

  - Repeated authentication attempts are throttled.
  - Unverified users cannot access protected data.
  - Password-reset and verification responses do not reveal account existence.
  - Expired and revoked sessions are rejected.

  Manual test:

  - Exercise login, registration, verification, reset, logout, and revoked
    sessions from separate test accounts.

- [ ] **SEC-003 — Harden Public API Boundaries**
  - Add strict request validation, payload-size limits, safe error responses,
    and per-IP/per-user rate limits.
  - Review CORS per endpoint and remove wildcard access where it is not
    required.
  - Add idempotency handling to write operations that may be retried.

  Automatic tests:

  - Invalid methods, payloads, oversized requests, and malformed identifiers
    receive safe 4xx responses.
  - Rate limits activate without affecting unrelated users.
  - Retrying an idempotent write does not duplicate data.

  Manual test:

  - Send malformed, oversized, repeated, and unauthenticated requests to every
    public API in staging.

- [ ] **SEC-004 — Secure Scrapers and External URL Integrations**
  - Enforce an allowlist of approved hosts and protocols.
  - Block private IP ranges, localhost, metadata endpoints, redirects to unsafe
    targets, and authenticated/private content.
  - Apply timeouts, response-size limits, concurrency limits, and attribution
    rules.

  Automatic tests:

  - SSRF targets and unsafe redirects are rejected.
  - Unsupported hosts and protocols are rejected.
  - Timeouts and oversized responses fail safely.

  Manual test:

  - Test approved public URLs, localhost, private IPs, redirect chains, and
    malformed URLs in staging.

- [ ] **SEC-005 — Add Security Monitoring and Incident Response**
  - Scan dependencies and committed/build-time secrets.
  - Monitor authentication failures, RLS errors, rate-limit events, 5xx
    responses, unusual traffic, and storage abuse.
  - Define alerts, log retention, incident ownership, and key-rotation steps.

  Automatic tests:

  - Security and dependency scans run in CI.
  - Alert thresholds trigger for simulated auth abuse and 5xx spikes.
  - Logs do not contain passwords, access tokens, or private user data.

  Manual test:

  - Trigger test alerts and verify the documented response and credential
    rotation procedure.

### Performance and capacity

- [ ] **PERF-001 — Establish a 1,000-Concurrent-User Load Test**
  - Use a staging Vercel deployment and staging Supabase project.
  - Ramp through 10, 100, 500, and 1,000 concurrent users.
  - Test login spikes, session loading, set saves, diet logging, catalog
    access, and routine generation separately.
  - Record latency, error rate, database connections, CPU, bandwidth, function
    duration, and provider rate-limit responses.

  Automatic tests:

  - The load test runs repeatably with seeded test accounts and data.
  - Results fail the pipeline when defined latency or error budgets are
    exceeded.

  Manual test:

  - Review the report for each scenario and confirm no data crosses users or
    duplicates during retries.

- [ ] **PERF-002 — Make Authentication and Initial Load Lightweight**
  - Load only essential identity and profile data after sign-in.
  - Defer dashboard, catalog, media, and analytics requests.
  - Use loading states and independent failure boundaries for non-critical
    sections.

  Automatic tests:

  - Login does not request the full catalog or unrelated user history.
  - Non-critical request failures do not block authentication or navigation.

  Manual test:

  - Sign in on a throttled connection and confirm the core app becomes usable
    before secondary data finishes loading.

- [ ] **PERF-003 — Optimize Database Queries and Connections**
  - Review query plans, indexes, pagination, RLS performance, and connection
    pool usage for high-traffic paths.
  - Remove repeated catalog and profile queries.
  - Enforce bounded result sizes.

  Automatic tests:

  - High-traffic queries use bounded pagination and expected indexes.
  - Query latency and database error budgets are checked in staging.

  Manual test:

  - Compare query and page performance before and after indexing under load.

- [ ] **PERF-004 — Isolate Expensive AI, Scraping, and Media Work**
  - Add quotas and concurrency limits for AI generation and scraping.
  - Queue expensive work instead of blocking user requests.
  - Cache safe shared catalog data and optimize media delivery.
  - Provide a graceful fallback when a provider is unavailable.

  Automatic tests:

  - Provider failures return controlled fallback states.
  - Quotas prevent one user from exhausting shared capacity.
  - Queued jobs are idempotent and do not duplicate records.

  Manual test:

  - Simulate provider throttling and confirm workouts, sessions, and diet logs
    remain usable.

- [ ] **PERF-005 — Add Capacity Dashboards and Alerts**
  - Track request volume, p95/p99 latency, error rate, auth failures,
    database usage, storage bandwidth, queue depth, and provider limits.
  - Define warning and critical thresholds before public scale-up.

  Automatic tests:

  - Metrics are emitted for successful, failed, throttled, and queued requests.
  - Alert rules fire for simulated latency, error, and capacity spikes.

  Manual test:

  - Create a controlled spike and verify the dashboard, alert, and recovery
    workflow.

---

## 11. Mobile Store Distribution

- [ ] **RELEASE-001 — Publish Android and iOS Applications**
  - Decide whether the existing web app will use a trusted PWA, Capacitor
    wrapper, or a dedicated native shell for store distribution.
  - Ensure the mobile build uses secure production configuration and never
    includes server secrets.
  - Configure Android signing, Play App Signing, package identity, and Google
    Play release tracks.
  - Configure Apple bundle identity, certificates, provisioning, and App Store
    Connect release tracks.
  - Prepare store listings, screenshots, icons, descriptions, age ratings,
    support contact, and privacy-policy links.
  - Document account deletion, data export, authentication, subscriptions, and
    third-party service disclosures required by each store.
  - Verify deep links, OAuth redirects, external exercise links, uploads,
    offline behavior, notifications, and back navigation on real devices.
  - Release to internal testers and TestFlight before public submission.
  - Add crash reporting, version tracking, staged rollout, and rollback
    procedures.

  Automatic tests:

  - Android and iOS production builds complete without development URLs,
    test keys, debug logging, or server secrets.
  - Authentication redirects return to the correct mobile route.
  - Core workout and dietary flows work on supported mobile viewport sizes.
  - App version and environment checks prevent accidental staging/production
    mixing.

  Manual test:

  1. Install the Android internal-test build and the iOS TestFlight build.
  2. Register, verify, sign in, and sign out on both platforms.
  3. Create and complete a workout, save dietary data, and open the logbook.
  4. Test offline recovery, external links, uploads, back navigation, and
     account deletion.
  5. Submit only after store review requirements and privacy disclosures pass.

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
  - Define a consistent calorie-expenditure/TDEE calculation.
  - Incorporate the user's primary goal: fat loss, muscle gain, recomposition,
    weight maintenance, or athletic performance.
  - Use explicit and reviewable activity assumptions.
  - Require at least 2–4 weeks of trend data before giving interpretations.
  - Track food-logging consistency and bodyweight-measurement consistency.
  - Handle dates using the user's local timezone.
  - Include confidence scoring for all estimates.
  - Clearly separate estimated values from measured values.

  Automatic tests:

  - A completed session contributes to the correct user's estimate only.
  - Food logs and workouts from different users never affect each other.
  - Missing food, body metric, or session data produces an honest incomplete
    state instead of a false deficit.
  - Daily and weekly estimates use the correct date and timezone.
  - Deleted sessions are excluded from recalculated estimates.
  - The result includes an uncertainty or estimation status.
  - Goal-specific recommendations use the selected goal rather than a generic
    weight-loss assumption.
  - Estimates remain unavailable or explicitly low-confidence when less than
    2–4 weeks of trend data exists.
  - Measured values and estimated values remain distinguishable in the result.

  Manual test:

  1. Log food for a day and complete a workout.
  2. Confirm the estimate includes both sources.
  3. Add another meal and confirm the estimate updates.
  4. Delete the workout and confirm it is removed from the recalculation.
  5. Switch accounts and confirm neither user's nutrition or workout data
     affects the other.

---

## 9. Theme and Visual Consistency

- [ ] **UX-001 — Fix Black-and-White Theme Consistency**
  - Audit light and dark theme tokens across the application.
  - Ensure text, backgrounds, borders, icons, buttons, inputs, modals, charts,
    empty states, and disabled states remain readable in both themes.
  - Remove unintended black or white hard-coded colors where theme tokens are
    required.
  - Preserve intentional black-and-white branding where it is explicitly part
    of the design.
  - Test responsive and focused/hovered states on the main workout, dietary,
    settings, logbook, and authentication screens.

  Automatic tests:

  - Theme changes apply consistently to shared UI components.
  - Required text and controls meet the project's accessibility contrast target
    in both themes.
  - No major screen renders unreadable text, invisible borders, or incorrect
    disabled-state colors after switching themes.

  Manual test:

  1. Open the workout, dietary, settings, logbook, and authentication screens.
  2. Switch between light and dark themes.
  3. Check cards, inputs, modals, buttons, charts, icons, and disabled controls.
  4. Refresh the page and confirm the selected theme remains consistent.

- [ ] **UX-002 — Create a Reusable Frictionless Animation System**
  - Define shared animation primitives for page transitions, cards, lists,
    modals, loading states, success feedback, and expand/collapse interactions.
  - Make animation behavior dynamic based on the component state instead of
    duplicating page-specific animation code.
  - Keep transitions short, predictable, and supportive of the user's task.
  - Prevent layout shifts and avoid animating expensive properties such as
    large layout recalculations where possible.
  - Respect `prefers-reduced-motion` and provide a reduced or static mode.
  - Reuse the same motion language across sessions, dietary, settings,
    logbook, dashboard, and authentication screens.
  - Keep animation optional for critical actions so feedback never blocks
    saving, navigation, or workout input.

  Automatic tests:

  - Shared animation primitives render correctly in their default states.
  - State transitions do not remove or duplicate user content.
  - Reduced-motion preferences disable or simplify non-essential animation.
  - Critical actions remain usable while animations are running.
  - Reusing a primitive across pages does not leak state between instances.

  Manual test:

  1. Navigate through sessions, dietary, settings, logbook, and dashboard.
  2. Confirm page, card, modal, loading, and success transitions feel
     consistent and do not delay interaction.
  3. Trigger repeated transitions quickly and confirm there is no flicker or
     stacked animation.
  4. Enable reduced motion in the operating system and repeat the test.