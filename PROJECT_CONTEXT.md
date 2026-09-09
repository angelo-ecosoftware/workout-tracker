# PROJECT_CONTEXT.md — Kinisia Machine Specification
> **Target Audience:** Autonomous AI Coding Agents (Cursor, Windsurf, Claude Code, Gemini Flash, Copilot).  
> **Directive:** Read this document entirely before analyzing, modifying, or generating code. Treat all principles, schemas, and constraints as authoritative invariants.

---

## 1. System Overview & Core Principles

### 1.1 Project Identity & Core Objective
- **Project Name:** Kinisia (production domain: `https://kinisia.nl`)
- **Repository:** `angelo-ecosoftware/workout-tracker`
- **Core Objective:** High-performance, zero-fluff workout logbook and progressive overload split tracker for athletes. Provides instant 0-lag set logging, 1,573 verified animated demonstration GIFs, automated rest vibration timers, and certified European Union data privacy (GDPR Art. 9/17).
- **Core Manifesto:** **"NO FLUFF. LOG SETS & LEAVE."** Zero paywalls, zero social feeds, zero promotional clutter, and zero blocking network requests on the critical logging path.

### 1.2 Non-Negotiable System Invariants
1. **Sub-10ms UI Responsiveness:** Set checkoffs, rep increments, and weight adjustments must execute locally in memory and render immediately without waiting for network round-trips.
2. **Start-Before-Submit Lifecycle:** A workout session **must be explicitly started** via the single **Start Workout** header button before it can be submitted. The single **Submit Workout** button at the footer remains disabled until the session is active. Canceling reverts the session back to unstarted mode.
3. **Single Button Invariant:** Exactly **one** `Start Workout` button exists (inside the active header card) and exactly **one** `Submit Workout` button exists (at the bottom of the exercise list). Never introduce duplicate start or finish buttons.
4. **100% Animated GIF Exercise Guidance:** Never use static images for exercise demonstrations. All 1,573 exercises resolve to ExerciseDB animated `.gif` media.
5. **GDPR Art. 9 & Art. 17 Compliance:** Biometric and workout data constitute special category health data under EU GDPR. All database tables enforce Row Level Security (RLS). One-click deletion must execute an atomic cascade purge (`gdpr_article_17_purge_user`).
6. **Credential Sanitization:** **NEVER** hardcode real emails, passwords, session tokens, or API keys in source code, scripts, migrations, or documentation. Strictly use synthetic RFC-compliant placeholders (e.g., `user@example.com`, `athlete@example.com`).
7. **PWA Offline Resilience:** Standalone installed mobile web apps must function with zero network access. The full 1,573 exercise library is cached in `localStorage`, and workout photos in progress are saved to IndexedDB.

---

## 2. Technology Stack & Directory Mapping

### 2.1 Technology Architecture Matrix

| Layer | Technologies | Version / Specifications |
| :--- | :--- | :--- |
| **Frontend Framework** | React (SPA) | `^19.0.1` |
| **Language & Typings** | TypeScript (Strict Mode) | `~5.8.2` |
| **Bundler & Tooling** | Vite, `@tailwindcss/vite`, ESBuild | Vite `^6.2.3`, ESBuild `^0.25.0` |
| **Styling Engine** | Tailwind CSS v4, Motion | Tailwind `^4.1.14`, Motion `^12.23.24` |
| **PWA & Offline** | `vite-plugin-pwa`, Workbox | Workbox `^7.4.1`, Service Worker autoUpdate |
| **Database & Auth** | Supabase (PostgreSQL 15+, RLS, Auth, Storage) | `@supabase/supabase-js` `^2.112.4` |
| **Search Engine** | Fuse.js (Typo-Tolerant Client Search) | `^7.5.0` |
| **Server Runtime** | Node.js Express companion + Vercel Serverless | Express `^4.21.2`, Node `22+` |
| **Testing Suite** | Vitest, React Testing Library, JSDOM | Vitest `^4.1.11`, RTL `^16.3.3` |

### 2.2 Directory Structure & Key Logic Mapping

```
workout-tracker/
├── api/                           # Vercel serverless / Express endpoints
│   ├── barcode-lookup.ts          # Supermarket GTIN resolution (Albert Heijn, etc.)
│   ├── grocery-list.ts            # CORS-safe shared grocery list bridge
│   ├── product-link.ts            # URL nutrition table scraper (FIR standards)
│   └── scraperRegistry.ts         # Multi-store scraping registry
├── app/                           # Next.js-compatible metadata & routing standards
│   ├── robots.ts                  # MetadataRoute.Robots dynamic generator
│   └── sitemap.ts                 # MetadataRoute.Sitemap dynamic generator
├── docs/                          # Architectural documentation & ISO audits
│   ├── KINISIA_MASTER_SPECIFICATION.md # Full platform functional specification
│   ├── USER_MANUAL.md             # Athlete user guide
│   └── database/ERD.md            # Entity Relationship Diagrams
├── public/                        # Static public web assets
│   ├── robots.txt                 # Edge robots crawler directives
│   ├── sitemap.xml                # Search Console sitemap (https://kinisia.nl)
│   └── manifest.webmanifest       # PWA manifest
├── src/
│   ├── App.tsx                    # Root component, hash/route parser, auth barriers
│   ├── engine.ts                  # Progressive Overload, 1RM Brzycki, Streak logic
│   ├── models.ts                  # Shared domain TypeScript interfaces
│   ├── vite-env.d.ts              # Ambient declarations (Vercel, Next, PWA events)
│   ├── components/
│   │   ├── admin/                 # Platform administration & user inspection
│   │   ├── auth/                  # LoginScreen, authentication dialogs
│   │   ├── coach/                 # Coach portal, athlete review, set feedback
│   │   ├── dietary/               # Nutrition tracker, macro bars, barcode scanner
│   │   ├── insights/              # Volume heatmaps, 1RM curves, weight trends
│   │   ├── landing/               # Minimal WCAG 2.2 AA public landing page
│   │   ├── modals/                # Profile, routine onboarding, backup/restore
│   │   ├── routine/               # Routine split editor, day manager
│   │   ├── ui/                    # Header, Navigation, ErrorBoundary
│   │   └── workout/               # Workout tracking core
│   │       ├── ExerciseCard.tsx   # Collapsible set logging card
│   │       ├── ExerciseGuideDrawer.tsx # Animated GIF form guide & cues
│   │       ├── ExerciseSearchPicker.tsx# Catalog picker with infinite list
│   │       ├── WorkoutDayTracker.tsx   # Active workout tracking controller
│   │       ├── WorkoutHistory.tsx # Chronological log book
│   │       └── tracker/           # Start-to-finish tracking sub-components
│   │           ├── ActiveWorkoutHeaderBar.tsx # Single Start button & stopwatch
│   │           ├── AutoRestTimerModal.tsx     # Checkoff vibration countdown
│   │           ├── FinishWorkoutModal.tsx     # Post-workout metrics & photos
│   │           ├── RecoveryAndReadinessCard.tsx # Sleep & energy check-in
│   │           ├── RoutineSplitSelector.tsx   # Split tabs with [Edit] button
│   │           ├── WorkoutCompletionModal.tsx # Celebration & PR summary
│   │           ├── WorkoutSubmitButton.tsx    # Single Submit button
│   │           └── useWorkoutSession.ts       # Core reactive tracking hook
│   ├── context/
│   │   ├── AuthContext.tsx        # Supabase auth session provider
│   │   ├── PWAContext.tsx         # Standalone detection & install prompts
│   │   └── ThemeContext.tsx       # Dark theme provider
│   ├── data/
│   │   └── exerciseCatalog.ts     # 47 offline bundled compound movements
│   ├── lib/
│   │   ├── exerciseApiService.ts  # ExerciseDB thumbnail & GIF resolver
│   │   ├── exerciseSearch.ts      # Fuse.js fuzzy search engine
│   │   ├── storage.ts             # Supabase photo upload integration
│   │   ├── supabase.ts            # Supabase client singleton
│   │   └── supabaseData.ts        # Database queries, pagination, offline sync
│   └── utils/
│       ├── authUrl.ts             # OAuth URL sanitizer & navigation trap
│       ├── draftPhotoStorage.ts   # IndexedDB photo storage
│       ├── imageCompressor.ts     # Client-side Canvas image compressor
│       └── sound.ts               # Web Audio API haptic & timer bells
├── tests/
│   ├── backend/                   # Database CRUD matrices & RLS security tests
│   ├── frontend/                  # React component & hook tests (Vitest + RTL)
│   └── shared/domain/             # Engine math & algorithmic unit tests
├── server.ts                      # Express companion & Vite middleware server
├── vercel.json                    # Edge headers, static bypass & SPA rewrites
└── vite.config.ts                 # Vite config, PWA manifest & Workbox denylist
```

---

## 3. Domain Logic, Calculation Engines & Data Schemas

### 3.1 Progressive Overload Engine (`src/engine.ts`)
The `ProgressionEngine` evaluates historical performance to prescribe weights and reps:
- **1RM Calculation (Brzycki Formula):**
  $$\text{1RM} = \frac{\text{Weight}}{1.0278 - (0.0278 \times \text{Reps})}$$
- **Progression Rule:**
  - If completed reps on the final set $\ge$ `targetRepMax`, increment weight by $+2.5\text{ kg}$ on the next session.
  - If completed reps $<$ `targetRepMin`, advise volume consolidation at the current working load.
- **Outlier Guard:** Flags any entry $> 350\text{ kg}$, $> 100\text{ reps}$, or $> 3\times$ historical benchmark for explicit user confirmation.

### 3.2 Routine Streak Engine (`src/engine.ts`)
The `SessionEngine` computes consecutive completed routines across an athlete's split:
- Matches completed session dates against configured workout orders ($1 \dots N$).
- Validates that workouts are executed in structured sequence without multi-week lapses.

### 3.3 Core Database Schema (Supabase PostgreSQL)

```sql
-- Workouts (Split Routine Days)
CREATE TABLE public.workouts (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  order integer NOT NULL DEFAULT 1,
  exercise_ids text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Exercises (Master Catalog + Custom User Exercises)
CREATE TABLE public.exercises (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text, -- NULL for global catalog
  name text NOT NULL,
  type text NOT NULL DEFAULT 'strength', -- 'strength' | 'timed'
  target_sets integer NOT NULL DEFAULT 3,
  target_rep_min integer NOT NULL DEFAULT 8,
  target_rep_max integer NOT NULL DEFAULT 12,
  category text, -- 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'
  image_url text, -- ExerciseDB animated .gif URL
  is_custom boolean DEFAULT false,
  custom_cues jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Workout Sessions (Completed or In-Progress Workouts)
CREATE TABLE public.sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  workout_id text REFERENCES public.workouts(id),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric(3,1),
  energy_score integer,
  notes text,
  photo_urls text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Sets (Logged Working Sets per Exercise)
CREATE TABLE public.sets (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES public.exercises(id),
  set_number integer NOT NULL,
  weight numeric(6,2), -- in kg
  reps integer,
  duration_seconds integer,
  completed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```

### 3.4 Active Tracking State Machine (`src/components/workout/tracker/useWorkoutSession.ts`)
1. **Unstarted State (`isSessionActive: false`):**
   - Live timer is stopped (`elapsedSeconds = 0`).
   - `START WORKOUT` button rendered in `ActiveWorkoutHeaderBar`.
   - `SUBMIT WORKOUT` button at footer is rendered disabled.
2. **Active State (`isSessionActive: true`):**
   - Stopwatch ticks every second based on `sessionStartTime` (wall-clock resilient).
   - Local draft auto-saved to `localStorage` on every keystroke (`workout_draft_{userId}_{workoutId}`).
   - Checking off a set triggers `AutoRestTimerModal` (default 90s countdown + haptic pulse).
   - `SUBMIT WORKOUT` button enables and opens `FinishWorkoutModal`.
3. **Completed State:**
   - On submission confirm, saves to Supabase, logs bodyweight if entered, checks for PRs, triggers `WorkoutCompletionModal` celebration, and resets `isSessionActive` to `false`.

---

## 4. AI Coding Guidelines & Rules

### 4.1 STRICT DOs
- **DO use TypeScript strict typing throughout.** Explicitly type function parameters, return values, and component props. Never use `any` without an explicit, documented reason.
- **DO adhere to the Start-Before-Submit rule.** Never re-introduce immediate submission without an active started session.
- **DO maintain exactly one Start button and one Submit button.** Keep the start trigger in `ActiveWorkoutHeaderBar.tsx` and the submit trigger in `WorkoutSubmitButton.tsx`.
- **DO preserve the dark aesthetic.** Strict black background (`#050505`), card surface (`#121212` / `#181818`), subtle border (`#262626`), high-visibility lime accents (`#C0FF00`), and pure white primary text (`#FFFFFF`).
- **DO enforce WCAG 2.2 AA accessibility.** Ensure interactive elements have a minimum 48px $\times$ 48px touch target on mobile, use visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#C0FF00]`), and provide descriptive `aria-label` attributes.
- **DO handle edge routing in `vercel.json` and `server.ts`.** All static files (`.xml`, `.txt`, `.webmanifest`) must bypass SPA fallback rewriting.
- **DO commit and push git changes** automatically upon task completion.

### 4.2 STRICT DON'Ts
- **DON'T introduce third-party heavyweight UI component libraries.** Do not install Material UI, Chakra, AntD, or Bootstrap. Build cleanly with Tailwind CSS v4 and Lucide React icons.
- **DON'T display or hardcode production credentials.** Never expose API keys, database passwords, or personal athlete emails.
- **DON'T use static JPG/PNG photos for exercise demonstrations.** All exercise demonstrations must remain animated `.gif` files from ExerciseDB.
- **DON'T block client rendering with un-cached cloud requests.** Always check `localStorage` / memory cache first and provide instant fallback.
- **DON'T break PWA Service Worker bypasses.** Never cache `/sitemap.xml` or `/robots.txt` in the PWA Service Worker navigation fallback.

---

## 5. Development & Testing Workflow

### 5.1 Verification Commands

```bash
# 1. Type Checking (Must complete with 0 errors)
npx tsc --noEmit

# 2. Run Complete Automated Test Suite (All 121+ test files must pass)
npm test

# 3. Targeted Test Execution
npx vitest run tests/frontend/components/workout/WorkoutDayTracker.test.tsx
npx vitest run tests/frontend/hooks/useWorkoutSession.test.ts
npx vitest run tests/frontend/seo/sitemapAndRobots.test.ts

# 4. Production Build & Bundle Verification
npm run build

# 5. Local Full-Stack Development Server
npm run dev
```

### 5.2 Test Architecture Conventions
- **Framework:** Vitest with JSDOM environment (`tests/setup/frontend.setup.ts`).
- **Mocking Policy:** Mock Supabase network calls using `vi.mock('../../../src/lib/supabaseData.ts')` or factories from `tests/shared/fixtures/factories.ts`. Never perform live network I/O during unit test runs.
- **Assertion Standards:** Verify exact user-visible DOM semantics (`getByRole`, `findByText`), accessibility attributes (`aria-label`, `aria-disabled`), and state transitions.

---

## 6. Primary Domain References & URLs
- **Production URL:** `https://kinisia.nl`
- **Sitemap:** `https://kinisia.nl/sitemap.xml`
- **Robots Directives:** `https://kinisia.nl/robots.txt`
- **Full Architecture & Functional Spec:** [docs/KINISIA_MASTER_SPECIFICATION.md](docs/KINISIA_MASTER_SPECIFICATION.md)
- **Database ERD:** [docs/database/ERD.md](docs/database/ERD.md)
