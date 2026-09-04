# Product Roadmap, Ideas & Fixes (IDEAS.md)

This document captures upcoming product ideas, UX/UI fixes, architectural improvements, and feature expansions categorized by domain.

---

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

### 2.2 [BUG FIX] Dietary Portion Input Leading Zero (`0`) Deletion
- **Issue**: When entering portion sizes (grams eaten), deleting input or typing over the initial value retains a leading `0` (e.g. `0150` instead of `150`), requiring manual backspace.
- **Fix**: Sanitize numeric text input on focus/change so entering a number clears default `0` state cleanly.

---

## 3. Workout Tracking & Session Logging Fixes

### 3.1 [BUG FIX] Last Known Weight Auto-Population on New Sets
- **Issue**: Verify and ensure the last logged weight automatically pre-fills into the next set's weight input for seamless progression tracking.
- **Action**: Check `lastSetSummaryPerExercise` fallback in workout tracker component state so users do not have to re-type weights when performing straight sets.

### 3.2 [BUG FIX] Sleep Hours & Energy Level Logging in Session History
- **Issue**: Pre-workout readiness metrics (hours slept, subjective energy level from 1–5, notes) must be reliably saved and displayed in workout session history logs.
- **Action**: Ensure the session completion payload saves these recovery attributes to database logs and displays them inside workout detail summaries.

---

## 4. Media Storage & Cloud Optimization

### 4.1 Server-Side / S3 Storage Image Optimization
- **Concept**: Optimize user workout progress photos and avatar uploads stored in S3/Supabase storage buckets.
- **Action**:
  - Enforce server-side or post-upload pipeline resizing / WebP compression.
  - Generate lightweight thumbnails for grid views and full-res versions for detail view to minimize bandwidth and storage costs.

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




if not found report software developer in api