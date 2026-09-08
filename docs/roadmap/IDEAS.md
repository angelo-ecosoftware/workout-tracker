# 💡 Product Roadmap, Ideas & Active Engineering Queue (IDEAS.md)

This document is the master engineering and architectural backlog for the **Workout Tracker** platform. It is organized into three distinct sections:
1. **PART I: Active Engineering Queue & Priority Remediation** (Direct athlete feedback: loading speeds, navigation, redundant modules, insights, dietary, recipes & DB cleanup).
2. **PART II: Domain Feature & Architecture Roadmap** (Intelligence, dietary ecosystem, coaching, and compliance).
3. **PART III: Resolved Defects & Engineering Archive** (Verified historical fixes).

---

# PART I: Active Engineering Queue & Priority Remediation

This section tracks immediate, high-priority fixes and performance enhancements requested for the active sprint.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     ACTIVE ENGINEERING QUEUE                            │
├───────┬─────────────────────────────────────────────────┬───────────────┤
│ ID    │ Focus Area                                      │ Status        │
├───────┼─────────────────────────────────────────────────┼───────────────┤
│ DEV-01│ Performance: Initial Loading Speed & Asset Flow │ 🚀 In Queue   │
│ DEV-02│ UX Clean: Remove "Fetching exercise guide..."   │ 🚀 In Queue   │
│ DEV-03│ Auth/Navigation: Mobile Back-Button Login Loop  │ 🚀 In Queue   │
│ DEV-04│ Analytics: Complete Insights Page Re-Edit       │ 🚀 In Queue   │
│ DEV-05│ Dietary: One-Tap Meal Presets & Easy Logging    │ 🚀 In Queue   │
│ DEV-06│ Nutrition: Recipe Catalog & Product Directory   │ 🚀 In Queue   │
│ DEV-07│ Database: Schema Pruning of Unused Attributes   │ 🚀 In Queue   │
└───────┴─────────────────────────────────────────────────┴───────────────┘
```

---

### [DEV-01] Initial Loading Speed & Web Performance Optimization
> *"Loading speed is weird for a fast website."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Core Performance / PWA Bundler Architecture
* **Problem Analysis:**
  * While Vite compiles fast, initial load latency is observed on cold starts, low-bandwidth connections, and mobile webviews.
  * Monolithic bundling in [src/App.tsx](src/App.tsx) imports heavy views (`DietaryView`, `InsightsView`, `AdminPortalView`, `WorkoutHistory`) synchronously upon initial mount, increasing the First Contentful Paint (FCP) and Time to Interactive (TTI).
  * Static fonts, heavy icons, and large inline SVG paths in the anatomy heatmap are parsed during initial JavaScript bundle evaluation.
* **Remediation Specification:**
  1. **Route/Tab Code Splitting via `React.lazy()` & `Suspense`:**
     * Lazy-load `DietaryView`, `InsightsView`, `AdminPortalView`, and heavy modal components (`ComplianceDossierModal`, `DeleteAccountModal`, `WelcomeModal`).
     * Keep only `WorkoutDayTracker` and core header in the initial critical rendering chunk.
  2. **Vite Manual Chunk Splitting:**
     * Configure `vite.config.ts` `rollupOptions.output.manualChunks` to isolate vendor libraries (`@supabase/supabase-js`, `lucide-react`, `fuse.js`, `chart.js` / canvas utilities) into separate, permanently cached chunks.
  3. **Aggressive Asset Caching & ServiceWorker Pre-cache:**
     * Optimize Workbox PWA runtime caching to serve critical app shell assets from CacheStorage with a `stale-while-revalidate` policy.

---

### [DEV-02] Remove Redundant "Fetching exercise guide..." In-Card Module
> *"Fetching excercise guide.... Module must be removed."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Workout Tracker UX / Component Pruning
* **Affected Files:**
  - `src/components/workout/WgerExerciseInfo.tsx`
  - `src/components/workout/tracker/ExerciseCard.tsx`
* **Problem Analysis:**
  * In [src/components/workout/WgerExerciseInfo.tsx](src/components/workout/WgerExerciseInfo.tsx#L80), when an exercise card is expanded, it displays:
    ```tsx
    <div className="text-[10px] text-gray-500 font-mono italic animate-pulse">
      Fetching exercise guide...
    </div>
    ```
  * This inline text creates an unneeded loading flicker directly in the active set-entry view.
  * Since Phase 2 delivered the dedicated, minimalist `(i)` button opening [src/components/workout/ExerciseGuideDrawer.tsx](src/components/workout/ExerciseGuideDrawer.tsx) (with offline anatomy, GIFs, cues, and tutorials), having an inline guide fetcher inside every card is redundant and clutters active lifting.
* **Remediation Specification:**
  1. Completely remove `<WgerExerciseInfo />` invocation from [src/components/workout/tracker/ExerciseCard.tsx](src/components/workout/tracker/ExerciseCard.tsx).
  2. Clean up and decommission [src/components/workout/WgerExerciseInfo.tsx](src/components/workout/WgerExerciseInfo.tsx).
  3. Consolidate all exercise form cues, instructions, and anatomy exclusively into `ExerciseGuideDrawer.tsx`.

---

### [DEV-03] Mobile Back-Button Loop & Sign-In Screen Flashing
> *"Sign in issue after login when going back."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Authentication / History Stack Management
* **Affected Files:**
  - `src/App.tsx`
  - `src/utils/authUrl.ts`
  - `src/context/AuthContext.tsx`
* **Problem Analysis:**
  * After logging in via Google OAuth or email, pressing the browser's hardware/gesture back button navigates backward into historical browser session states (`/`, OAuth redirect URLs, or login screen routes).
  * This causes the login modal to flash or drops the user into an unauthenticated state despite having an active GoTrue session.
* **Remediation Specification:**
  1. Upon successful token exchange in [src/context/AuthContext.tsx](src/context/AuthContext.tsx), immediately purge historical auth entries using `window.history.replaceState(null, '', window.location.pathname + '#tracker')`.
  2. In [src/App.tsx](src/App.tsx), implement a hardened `popstate` listener: if an authenticated session exists and the target route is empty, `/`, or matches login URLs, intercept the event and reset `history.pushState` to the active application tab.
  3. When an authenticated user is on the root tab (`#tracker`), pressing back should either minimize the PWA (on Android) or remain on `#tracker` rather than reopening login screens.

---

### [DEV-04] Complete Insights & Analytics Page Re-Edit
> *"Insights page need re-edit."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Athletic Analytics / Coaching UX
* **Affected Files:**
  - `src/components/insights/InsightsView.tsx`
  - `src/lib/insightsEngine.ts`
* **Problem Analysis:**
  * The current Insights tab displays vanity metrics (e.g. lifetime tonnage, arbitrary ratios) that do not give lifters actionable feedback on what to do in their next workout.
  * Visual layout is cluttered on mobile screens, requiring excessive scrolling.
* **Remediation Specification:**
  1. **Progressive Overload Velocity Cards:**
     * Highlight true strength progression on compound lifts (Bench, Squat, Deadlift, Overhead Press) showing $1\text{RM}$ velocity (kg gained per month).
  2. **Weekly Volume vs. Optimal Target Range:**
     * Clear muscle group bars displaying current weekly sets logged vs. hypertrophy benchmarks ($10\text{--}20$ sets = optimal green, $<10$ = under-trained, $>25$ = over-fatigued).
  3. **Deload & Fatigue Advisor:**
     * Synthesize sleep hours, energy ratings, and volume drop-offs into a single concise status badge (e.g. *"🟢 Prime to Push"*, *"⚡ High Fatigue — Consider Deload"*).
  4. **Mobile Ergonomics:**
     * Implement clean category tabs (*Strength*, *Volume*, *Recovery*) instead of one long scrolling wall of charts.

---

### [DEV-05] Dietary Meals & One-Tap Preset Logging
> *"Dietary meals are needed to easy log."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Nutrition Engine / Dietary Logging UX
* **Affected Files:**
  - `src/components/dietary/DietaryView.tsx`
  - `src/lib/dietaryData.ts`
  - `supabase/migrations/`
* **Problem Analysis:**
  * Athletes frequently eat the same meals every day (e.g., *Post-Workout Shake: 40g Whey + 300ml Milk + 1 Banana + 50g Oats*).
  * Currently, users must search and log each individual food item one by one, creating friction and leading to missed logs.
* **Remediation Specification:**
  1. **Meal Presets / Combo Templates (`user_meal_templates`):**
     * Allow athletes to bundle multiple food items into a named meal (e.g. *"Post-Workout Shake"*, *"Breakfast Bowl"*, *"Chicken & Rice Prep"*).
  2. **1-Tap Meal Logging:**
     * Tap *"Log Meal"* $\rightarrow$ Select preset $\rightarrow$ Automatically logs all sub-items and their portions in one atomic action.
  3. **"Save Current Meal as Template":**
     * Option in the daily diary to save any logged meal slot (Breakfast, Lunch, Dinner, Snack) directly as a reusable template.

---

### [DEV-06] Integrated Recipe Search Catalog & Product Directory
> *"So we need a recipe search catalog and a product catalog."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Food Catalog / Recipe Discovery Architecture
* **Affected Files:**
  - `src/components/dietary/`
  - `src/lib/foodSearch.ts`
  - `api/`
* **Problem Analysis:**
  * Athletes need inspiration for high-protein meals with known macros per serving, as well as an easy way to browse verified supermarket products by category rather than relying solely on barcode scans.
* **Remediation Specification:**
  1. **Structured Product Catalog Browser:**
     * Categorized supermarket product directory (*High Protein*, *Dairy & Eggs*, *Meats & Poultry*, *Grains & Carbs*, *Bakery*, *Snacks*).
     * Instant search with filter pills by store (AH, Jumbo, Dirk, PLUS, Aldi, Lidl).
  2. **High-Protein Recipe Catalog:**
     * Pre-seeded catalog of fitness recipes (e.g., *Protein Pancakes*, *High-Protein Chicken Burrito Bowl*, *Overnight Proats*).
     * Calculates total calories, protein, carbs, and fat per serving.
     * 1-tap *"Add Ingredients to Grocery List"* or *"Log This Recipe to Diary"*.

---

### [DEV-07] Database Schema Audit & Lean Pruning
> *"We need to update our database for unused attributes entities or relations."* — Angelo

* **Status:** 🚀 In Queue
* **Domain:** Supabase PostgreSQL Schema / Drizzle ORM Health
* **Affected Files:**
  - `supabase/migrations/`
  - `src/types/supabase.ts`
  - `drizzle/`
* **Problem Analysis:**
  * Over iterative feature phases, migrations have accumulated redundant columns, deprecated flags, and obsolete tables that are no longer referenced in frontend application code.
* **Remediation Specification:**
  1. **Schema Inspection & Usage Audit:**
     * Audit all columns across all 20 tables (`users`, `user_roles`, `coach_athlete_links`, `exercises`, `workouts`, `sessions`, `sets`, `body_logs`, `food_items`, etc.).
  2. **Clean Deprecated & Redundant Columns:**
     * Remove obsolete columns (e.g., redundant text fields where JSONB is now canonical, legacy scraper columns, unindexed temp keys).
  3. **Foreign Key & Index Optimization:**
     * Verify all foreign key constraints have `ON DELETE CASCADE` or `ON DELETE SET NULL`.
     * Add indexes to high-frequency query paths (`sessions.user_id`, `sets.session_id`, `body_logs.user_id`, `exercises.user_id`).
  4. **Pristine Drizzle & TypeScript Sync:**
     * Re-generate clean Supabase TypeScript interfaces in [src/types/supabase.ts](src/types/supabase.ts) matching the audited production schema.

---
---

# PART II: Product Architecture & Features Roadmap

## 1. Exercise Intelligence, Anatomy & Biomechanics
* **P2.1 Minimalist `(i)` Guide Drawer (Completed):** Clean slide-over overlay with looping execution cues and accurate anatomy.
* **P2.2 WGER Vector Muscle Heatmap (Completed):** Front & back SVG anatomical body highlights (neon primary, red secondary).
* **P2.3 Form Tutorials & 1-Exercise Rule (Completed):** Clean single-movement search for YouTube 1080p and TikTok deep-links without composite phrasing.

---

## 2. Dietary & Supermarket Ingestion Architecture
* **On-Demand Supermarket Resolver:** Real-time GTIN and URL parsing for Dutch supermarkets (AH, Jumbo, Dirk, PLUS, Aldi, Lidl).
* **Atwater Macro Validation Formula:** Guarantees $(4 \times P) + (4 \times C) + (9 \times F) \approx \text{kcal}$ to prevent corrupted dietary logs.
* **Crawlee Batch Ingestion (Future):** Asynchronous fallback crawler for large-scale grocery catalog harvesting.

---

## 3. Cognitive Ergonomics & Habit Loops
* **PR Confetti Celebration Modal (Completed):** Delivers immediate dopamine reinforcement on session completion.
* **Weekly Consistency Streak (Completed):** 7-day pill indicator (`[M] [T] [W] [T] [F] [S] [S]`) tracking weekly adherence.
* **Rest Timer Auto-Start & Vibration (Completed):** Checking a set row automatically begins rest countdown with 1s haptic buzz upon completion.
* **Interactive 4-Step Walkthrough (Completed):** Interactive routine builder with practice set-row logging in Settings & FAQ.

---

## 4. Enterprise Security, ENISA & EU Compliance
* **GDPR Article 17 ("Right to be Forgotten") (Completed):** 1-Tap atomic cascade purge via `public.purge_user_account_gdpr(UUID)` + S3 storage purge with 5s safety lock.
* **EU Cybersecurity Audit Dossier (Completed):** Live in-app dossier generator (TLS 1.3, CRA SBOM, RLS Matrix, GDPR Art. 9/17 map) with Markdown/JSON export.
* **Special Category Biometrics Protection (Completed):** Bodyweight, BMI, and body fat % default private with explicit coach-share consent.

---
---

# PART III: Resolved Defects & Engineering Archive

This section logs completed defect resolutions for traceability and audit history.

* **[BUG-001] Exercise Card Collapsed-by-Default:** All workout exercise cards start collapsed by default; state persists per user/routine.
* **[BUG-002] Set Row Stepper Ergonomics:** Streamlined `[-] [ 20 kg ] [+]` integrated steppers with 1-tap checkmark.
* **[BUG-003] Albert Heijn Shared List Resolution:** Multi-tier mobile GraphQL + HTML web fallback for supermarket lists.
* **[BUG-004] Macro Sanity Validation:** Mathematical Atwater sanitization preventing negative numbers or portion mismatches.
* **[BUG-005] Mobile History & Back-Swipe Trap:** History barrier states preventing back-swipes from exiting authenticated sessions.
* **[BUG-006] Dynamic ID Remapping on JSON Import:** Generates fresh UUIDs and updates foreign keys during backup restoration.
* **[BUG-007] Mobile Swipe-Back OAuth 404:** Intercepts OAuth callback URLs and replaces with clean `#tracker` route.
* **[BUG-008] Compound Exercise Name Cleanup:** Enforced 1-exercise-1-movement taxonomy across catalog and database.
* **[BUG-009] Coach Invite UUID Type Collision:** Resolved `link_` string collision on UUID columns; seeded and validated pending invites.
* **[BUG-010] Ghost Pending Athlete Rows in Roster:** Disabled auto-invite creation on modal open and filtered revoked links.
* **[BUG-011] Redundant UI Terms Pruning:** Removed confusing `auto-saved` and `auto-filled` badges from workout tracker.
* **[BUG-012] Collapsible Exercise Chevron Icons:** Replaced confusing eye icons with standard `ChevronDown` and `ChevronUp` indicators.
