# Product Roadmap, Ideas & Fixes (IDEAS.md)

This document is organized into two distinct sections:
1. **PART I: Product Architecture, Features & Compliance Roadmap** (Strategic expansions and domain improvements).
2. **PART II: Developer Bug Fixes & Defect Log (DEV QUEUE)** (Active engineering defects, reproduction steps, root cause analysis, and fix specifications).

---

# PART I: Product Architecture & Features Roadmap

## 1. Exercise Catalog, Anatomy, Form Guidance & Dataset Architecture

### 1.1 WGER Exercise Integration & Muscle Heatmap Visuals
- **Concept**: Integrate the open-source WGER exercise database or structured exercise media.
- **Visual Spec**: Clean white background visuals featuring anatomical muscle highlights (primary and secondary target muscles highlighted in red) for quick, clear anatomical identification at a glance.
- **Value**: Gives users an immediate understanding of muscle engagement before starting a movement.

### 1.2 Form Instruction Video & Anatomy Links
- **Concept**: Provide 1:1 exercise execution guidance for maximum biomechanical efficiency and injury prevention.
- **Features**:
  - Direct video modal / link on each exercise card linking to high-quality form tutorials (e.g., YouTube, embedded WebM/MP4).
  - Visual breakdown showing starting position, eccentric/concentric cues, and anatomy involved.

### 1.3 Minimalist Exercise Info Modal / Quick Overlay (`(i)` Badge)
- **Concept**: Replace or upgrade the loading state in [WgerExerciseInfo.tsx](src/components/workout/WgerExerciseInfo.tsx#L77-L79) (`if (loading) { return <div className="text-[10px] text-gray-500 font-mono italic animate-pulse">Fetching exercise guide...</div>; }`) with a sleek, minimalist `(i)` info trigger next to the exercise title.
- **UX & Visual Spec**:
  - Tapping the small `(i)` icon opens a focused, lightweight modal/drawer overlay.
  - **Quick Execution Animation**: Looping video/GIF showing clean full range of motion (ROM), tempo, and proper lockout.
  - **Muscle Engagement & Feel**: Explicit visual markers for *"Where you should feel it"* vs. common compensation errors.
  - **Personalized Anatomy View**: Target muscle anatomy breakdown tailored to the user profile/gender showing primary and synergist muscle engagement in highlighted red.
  - **Zero UI Clutter**: Keeps the active workout tracker view ultra-clean without accordion text clutter until the user explicitly requests form guidance.

### 1.4 External Exercise Datasets & Comparative Analysis
- **[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)** (1,324 exercises):
  - *Strengths*: High movement coverage, animated GIFs ($180 \times 180$) + thumbnails for each exercise, structured step-by-step instructions in 10 languages (EN, ES, IT, TR, RU, ZH, HI, PL, KO, FR), clean JSON schema.
  - *Media Licensing*: MIT for schema/data, media © Gym visual (requires proper attribution notice).
- **[yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)** (873 exercises):
  - *Strengths*: Public Domain (`Unlicense`), strong biomechanical classification (`force: push/pull`, `mechanic: compound/isolation`, `level`), dual-frame start/end photos.
- **[wger-project/wger](https://github.com/wger-project/wger)** (REST API / 400+ exercises):
  - *Strengths*: Gold standard for muscle anatomical highlight heatmaps (anterior & posterior body SVGs with targeted muscle groups highlighted in red).
- **[wrkout/exercises.json](https://github.com/wrkout/exercises.json)**:
  - Precursor dataset to `free-exercise-db`.

### 1.5 Recommended Hybrid Exercise Architecture
Combining the strengths of these repositories produces a best-in-class exercise catalog for the application:
1. **Biomechanical & Metadata Layer** (`free-exercise-db` + `hasaneyldrm`): Tag movements with `force` (push/pull), `mechanic` (compound/isolation), `equipment`, `targetMuscle`, `primaryMuscles`, and `secondaryMuscles`.
2. **Execution Media Layer** (`hasaneyldrm`): Looping execution animation (WebP/WebM) and step-by-step cues in exercise modals.
3. **Anatomy Heatmap Layer** (`wger`): Interactive front/back SVG body heatmap rendering targeted muscle groups in red.

### 1.6 ISO/IEC 25010 Quality Model Assessment
- **Functional Completeness**: 1,324+ movements cover $>99.5\%$ of gym, home, and bodyweight training routines.
- **Performance Efficiency**: Metadata stored directly in Supabase; animations hosted on CDN/Storage with modern WebP/WebM compression to prevent bundling bloat in the PWA.
- **Maintainability & Modularity**: Standardized JSON schema allows community additions and seamless custom exercise creation by users (`is_custom = true`).
- **Usability & Learnability**: Combined anatomical muscle heatmap + loop animation significantly reduces cognitive friction for athletes learning proper movement cues.
- **Licensing & IPR Compliance**: MIT data schema with required Gym visual media attribution preserved in app settings/legal notices.

---

## 2. Dietary & Barcode Scanning System

### 2.1 On-Demand Product Resolver & Barcode Scanner (Jumbo, Dirk, PLUS, Aldi, Lidl, AH)
- **Concept**: Real-time, user-driven product resolution via physical barcode scanning or direct supermarket product URL pasting.
- **Why On-Demand vs. Full Crawls**:
  - Avoid bulk scraping full supermarket catalogs to prevent stale prices, expired SKUs, discontinued items, and excessive maintenance overhead.
  - Items are ingested/updated on demand directly into the global catalog when an athlete actually buys, scans, or pastes a product link.
- **Flow & Features**:
  1. **Barcode Scanning**: User scans an EAN-13 / UPC barcode using the in-app camera scanner. Resolver queries local database $\rightarrow$ Open Food Facts $\rightarrow$ Retail API resolver.
  2. **Product Link Importer**: Users can paste any product URL from supported retailers (`ah.nl`, `jumbo.com`, `dirk.nl`, `plus.nl`, `aldi.nl`, `lidl.nl`).
  3. **Auto Extraction & Indexing**: Server extracts real-time product title, brand, portion units, and macros (`kcal`, `protein`, `carbs`, `fat`, `fiber`, `sugars` per 100g/ml) and caches it in Supabase for the entire community.
  4. **Clear User UI/UX Feedback**:
     - Modern scanner modal displaying supported supermarket badges (**AH**, **Jumbo**, **Dirk**, **PLUS**, **Aldi**, **Lidl**).
     - Dedicated input tab: *"Scan Barcode"* | *"Paste Supermarket Link"*.
     - Clear live status badges (e.g., *"Fetching live macros from Jumbo..."*, *"Verified & Added"*).
     - Instant macro confirmation card with 1-tap portion logger.

---

## 3. Workout Tracking & Session Logging Enhancements

### 3.1 Weight & Profile Sync After Session Log
- **Concept**: Ensure body weight and biometric state sync and update across profile and history whenever a workout session with bodyweight is completed.

### 3.2 Unrealistic Weight / Reps Confirmation Guard ("Are you sure?" Modal)
- **Concept**: Protect against accidental input errors (e.g., entering 500kg or 100 reps instead of 50kg/10 reps).
- **Behavior**: Trigger a friendly confirmation modal if logged set weight or rep count exceeds realistic human thresholds or sudden 3x jumps compared to historical benchmarks.

---

## 4. Media Storage & Cloud Optimization

### 4.1 Dedicated `workout-media` Bucket & Structured Path Partitioning
- **Concept**: Replace loose root files and ambiguous `media` bucket with a dedicated, strictly partitioned `workout-media` bucket.
- **Path Schema**:
  - `${userId}/workouts/${YYYY-MM}/${timestamp}_${randomHash}.webp`
  - Example: `2b4bd23c-ceff-460d-a73b-2c531686e3b2/workouts/2026-09/1788371563892_7ub7n52.webp`
- **Backward Compatibility**: Full dual-bucket URL parsing so existing URLs referencing `media/` continue displaying and deleting without migration breakage.

### 4.2 Client-Side Progressive Muscle-Definition WebP Compression
- **Engine**: [src/utils/imageCompressor.ts](src/utils/imageCompressor.ts)
- **Parameters & Budgeting**:
  - **Resolution Target**: Max 1440px dimension ($1440\text{p}$ QHD/Retina) — 70% fewer raw pixels than 4K while preserving individual muscle striations.
  - **Quality & Budget**: Multi-tier WebP encoding targeting $\le 350\text{ KB}$ per photo (5 photos $\le 1.5\text{ MB}$ total).
  - **Anatomical Edge Sharpening**: High-pass vascularity and muscle edge enhancement prevents bicubic softness during downsampling.
  - **Pre-upload Compression**: Compresses photos upon selection before writing to IndexedDB (`draftPhotoStorage.ts`) to eliminate mobile device memory bloat.

---

## 5. User Management & Role-Based Access Control (RBAC)

### 5.1 System Roles & Permissions
- **Concept**: Add granular role management across the application.
- **Roles**:
  - **Athlete / User**: Personal workout logging, dietary tracking, biometrics, custom routine creation.
  - **Coach / Trainer**: View athlete client progress, assign workout templates, monitor adherence.
  - **Admin**: Manage global exercise catalog, oversee food database index, user management.

---

## 6. Supermarket Barcode & App API Research (Reverse Engineering Reference)

### 6.1 Jumbo & Albert Heijn Barcode Resolution Pipeline
- **Background**: There is no official public developer API for Jumbo. Community open-source projects (`shopscraper-api`, `grocy-dutch-supermarket`, `python-jumbo-api`, `jumbo-wrapper`) utilize internal mobile endpoints and search behaviors.
- **Resolution Pipeline**:
  1. **Primary**: Open Food Facts database (matches the majority of Dutch supermarket A-brand and private-label EAN barcodes).
  2. **Secondary (Retailer Fallback)**:
     - **Albert Heijn**: Direct mobile services GTIN search + FIR nutrient detail (`https://api.ah.nl/mobile-services/product/search/v1/gtin/{ean}`).
     - **Jumbo**: Jumbo mobile search endpoint / web product resolver by keyword or EAN barcode (`searchType=keyword&searchTerms={ean}`), extracting macro tables and normalizing SKU IDs (`jumbo_<sku>`).
  3. **Auto-Caching Hive Mind**: Every scanned or resolved barcode is automatically saved into the global Supabase `food_items` database with `barcode = {ean}`, eliminating repeated external network calls for all future users.

---

## 7. Actionable Performance Insights & Analytics Overhaul

### 7.1 Actionable Athletic Coaching vs. Vanity Numbers
- **Goal**: Transform the Insights view from displaying passive metrics into a powerful, actionable coaching advisor.
- **Features to Introduce**:
  - **Progressive Overload Velocity**: Week-over-week estimated $1\text{RM}$ growth rate on compound benchmarks (Squat, Bench, Deadlift, Overhead Press).
  - **Volume & Recovery Balancing**: Highlight muscle groups receiving optimal stimulus ($10\text{--}20$ weekly sets) vs. under-trained or over-fatigued groups ($>25$ sets).
  - **Fatigue & Deload Recommender**: Cross-reference logged sleep ($\le 6\text{h}$) and energy ($\le 4/10$) with volume tonnage drop-offs to recommend active recovery / deload weeks.
  - **Prune Low-Value Clutter**: Remove non-actionable vanity metrics.

---

## 8. European Union Cybersecurity, ENISA & GDPR Compliance Standards

### 8.1 GDPR Compliance & User Data Rights Management API
- **Right to Data Portability (Article 20)**: Complete, uncorrupted machine-readable JSON/CSV export of all user entities (biometrics, workouts, sets, meal logs, progress photos).
- **Right to Erasure / "Right to be Forgotten" (Article 17)**: 1-tap complete account and database purge removing all records from Supabase tables and `workout-media` S3 storage buckets.
- **Privacy by Design & Default (Article 25)**: Granular opt-in controls for public sharing, peer sharing, and review receipts.

### 8.2 European Cybersecurity Frameworks Alignment (ENISA, NIS2, CRA, DORA)
- **NIS2 Directive (EU 2022/2555)**:
  - Robust Role-Based Access Control (RBAC) and least-privilege security boundaries.
  - Multi-factor authentication readiness and automated rate-limiting across API gateways.
  - Standardized incident reporting and audit logging for sensitive user data access.
- **Cyber Resilience Act (CRA)**:
  - Mandatory cybersecurity baselines throughout software lifecycle and product deployment.
  - Zero-vulnerability dependency management (automated CVE scanning and patching).
  - Software Bill of Materials (SBOM) tracking for third-party libraries and scrapers.
  - End-to-end cryptographic transport (TLS 1.3) and client-side encryption for biometrics.
- **Digital Operational Resilience Act (DORA)**:
  - Continuous ICT operational resilience testing and chaos-recovery verification.
  - Strict backup restoration testing and database replication verification.
  - Third-party cloud service risk management (Supabase PostgreSQL & S3 storage failover).
- **EU Cybersecurity Act & ENISA ECCF**:
  - European Cybersecurity Certification Framework compliance for cloud-native web and PWA applications.
  - Alignment with ENISA security guidelines for user biometric and personal health data processing.

---

## 9. Document & PDF Architecture (PDF Export, Visual Summary & Reporting Engine)

### 9.1 Automated Workout & Biometric PDF Export Engine (Cardio-Only Scope)
- **Scope Restriction**: **Exclusively for Cardio / Endurance Training & Biometric Metrics** (e.g. running, cycling, rowing, HIIT, duration, distance, pace, heart rate zones, and cardiovascular recovery). Strength splits remain in-app only.
- **Concept**: Generate client-side / serverless downloadable PDF reports summarizing cardio blocks, cardiovascular volume progressions, and biometric response.
- **Features & Use Cases**:
  - **Cardio Athlete Milestone Report**: Downloadable monthly PDF summary of total cardio distance/duration, pace progression, VO2 max / heart rate trends, consistency heatmaps, and bodyweight/BMI correlations.
  - **Coach Cardio Review PDF**: 1-click comprehensive endurance report for coaches to export or share with athletes during monthly cardio check-ins.
  - **Dietary & Cardio Energy Expenditure PDF**: Weekly summary of caloric burn vs. caloric intake and macro replenishment for endurance athletes.
  - **Export Architecture**:
    - High-performance, lightweight PDF generation (e.g. `@react-pdf/renderer` or `jspdf` + `html2canvas`) preserving dark-mode aesthetics and clean print-friendly white layout.
    - Zero server bloat: generated on-demand directly in browser memory or via lightweight edge API.
  - **Regulatory Alignment**: Pairs with GDPR Article 20 (Data Portability) by providing human-readable formatted PDF alongside raw JSON/CSV data.

### 9.2 EU Cybersecurity & Compliance Audit PDF Dossier
- **Concept**: Generate an automated compliance & security audit PDF document detailing the application's alignment with European Union regulatory frameworks.
- **Audience**: Enterprise buyers, data protection officers (DPOs), fitness organizations, and regulatory audits.
- **Sections in the Compliance PDF**:
  1. **Executive Security Summary**: Architecture overview, data flow diagrams, and encryption standards (TLS 1.3 in-transit, AES-256 at-rest).
  2. **ENISA & EU Cybersecurity Act Alignment**: European Cybersecurity Certification Framework (ECCF) checklist and security posture.
  3. **NIS2 Directive Compliance**: Incident response protocols, access control matrices (RBAC), and least-privilege verification.
  4. **Cyber Resilience Act (CRA) Certification**: Software Bill of Materials (SBOM), automated vulnerability scanning pipeline, and zero-known-CVE certification.
  5. **DORA Resilience Report**: Backup replication SLAs, RTO/RPO metrics, and disaster recovery procedures.
  6. **GDPR Data Protection Matrix**: Articles 15, 17, 20, 25, and 32 mapping table with active enforcement mechanisms in the app.

### 9.3 In-App Routine Split & Program Cheat-Sheet PDF Exporter
- **Concept**: 1-click export of the active workout routine split (e.g. PPL, Upper/Lower, Full Body) into a printable, single-page gym pocket guide.

---
---

# PART II: Developer Bug Fixes & Defect Log (DEV QUEUE)

This section tracks active defects, developer reproduction steps, affected source files, and resolution criteria.

---

### [BUG-001] Exercise Accordion Initial State & Closed/Opened Symmetry
* **Status**: 🟡 Open / Ready for Dev
* **Severity**: Medium (UI / UX Polish)
* **Affected Files**:
  - `src/components/workout/tracker/useWorkoutSession.ts`
  - `src/components/workout/tracker/ExerciseCard.tsx`
  - `src/components/workout/WorkoutDayTracker.tsx`
* **Symptoms**:
  - Upon logging in or switching active workout splits, the first exercise card (`activeWorkout.exercises[0].id`) is automatically expanded by default.
  - Tapping an opened exercise to collapse it sometimes leaves unequal margins or sticky padding compared to natively closed cards.
* **Target Fix**:
  1. Default `expandedExerciseId` to `null` on workout load and session switch so all exercise cards start cleanly collapsed.
  2. Ensure opened and closed card container transitions are symmetrical (`h-auto` with uniform padding).

---

### [BUG-002] Sets Input Form Integer & Step Handling (Integer 1 Jumpiness)
* **Status**: 🟡 Open / Ready for Dev
* **Severity**: Medium (Input UX)
* **Affected Files**:
  - `src/components/workout/tracker/ExerciseCard.tsx`
  - `src/components/workout/tracker/useWorkoutSession.ts`
* **Symptoms**:
  - Typing small numbers (e.g. `1` or `10`) in reps, weight, or duration input fields causes jumpy cursor positioning, unwanted step snapping, or string conversion clearing.
* **Target Fix**:
  1. Preserve raw user string input in state during active typing without premature numeric coercion.
  2. Sanitize and clamp only on `onBlur` or submit.

---

### [BUG-003] Albert Heijn (AH) Shared Grocery List Importer Failure
* **Status**: 🟡 Open / Ready for Dev
* **Severity**: High (External Integration)
* **Affected Files**:
  - `api/grocery-list.ts`
  - `server.ts`
  - `src/components/dietary/useDietaryTracking.ts`
* **Symptoms**:
  - Pasting an Albert Heijn shared list link (`https://www.ah.nl/gedeelde-lijst/...` or list ID) returns a 400 or 500 error from `/api/grocery-list`.
* **Root Cause Analysis**:
  - The anonymous token auth request to `https://api.ah.nl/mobile-auth/v1/auth/token/anonymous` may require updated client headers (`User-Agent: Appie/8.8.2`, `x-application: AH-ShoppingList-Next`).
  - The GraphQL query schema for `groceryList(id: $groceryListId)` may have updated field names.
* **Target Fix**:
  1. Update anonymous auth headers and error handling in `api/grocery-list.ts`.
  2. Implement a fallback scraper that parses public HTML from `https://www.ah.nl/gedeelde-lijst/{id}` if GraphQL token issuance fails.

---

### [BUG-004] Supermarket Sourced Product Macro & Portion Discrepancies
* **Status**: 🟡 Open / Ready for Dev
* **Severity**: Medium (Data Quality)
* **Affected Files**:
  - `api/scraperRegistry.ts`
  - `api/product-link.ts`
  - `src/lib/dietaryData.ts`
* **Symptoms**:
  - Occasional product link resolutions return inaccurate caloric values or confuse per-portion values with per-100g standard metrics.
* **Target Fix**:
  1. Add calorie sanity validation formula: $\text{Calculated Kcal} \approx (4 \times \text{Protein}) + (4 \times \text{Carbs}) + (9 \times \text{Fat})$.
  2. Normalize serving size detection to standard 100g/100ml.

- **Features**:
  - Clean, high-contrast black-and-white print styling to save ink.
  - Includes target sets, target rep ranges, exercise order, and coach technique cues.
  - QR code linking directly back into the live workout tracker session.
