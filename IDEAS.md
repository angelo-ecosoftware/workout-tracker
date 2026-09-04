# Product Roadmap, Ideas & Fixes (IDEAS.md)

This document captures upcoming product ideas, UX/UI fixes, architectural improvements, and feature expansions categorized by domain.

---

## 1. Exercise Catalog, Anatomy & Form Guidance

### 1.1 WGER Exercise Integration & Muscle Heatmap Visuals
- **Concept**: Integrate the open-source WGER exercise database or structured exercise media.
- **Visual Spec**: Clean white background visuals featuring anatomical muscle highlights (primary and secondary target muscles highlighted in red) for quick, clear anatomical identification at a glance.
- **Value**: Gives users an immediate understanding of muscle engagement before starting a movement.

### 1.2 Form Instruction Video & Anatomy Links
- **Concept**: Provide 1:1 exercise execution guidance for maximum biomechanical efficiency and injury prevention.
- **Features**:
  - Direct video modal / link on each exercise card linking to high-quality form tutorials (e.g., YouTube, embedded WebM/MP4).
  - Visual breakdown showing starting position, eccentric/concentric cues, and anatomy involved.

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




https://github.com/hasaneyldrm/exercises-dataset Exercises Dataset




Ja, zeker. Ontwikkelaars hebben de interne API van de Jumbo-app (de "achterkant" waar de mobiele app mee communiceert) via reverse engineering uitgepluisd en openbare code op GitHub geplaatst.  
GitHub
+ 1

Er is namelijk geen officiële, openbare Jumbo-API voor het publiek. Toch hebben programmeurs op GitHub zogenaamde scrapers of API wrappers gemaakt om de app-data en barcodes uit te lezen.  
Pepesto

Hoe ontwikkelaars die codes uitlezen via GitHub  
GitHub
Ontwikkelaars gebruiken verschillende open-source projecten op GitHub om de EAN-codes te achterhalen:

Jumbo App Endpoint Scraping: Ontwikkelaars vangen het netwerkverkeer van hun eigen mobiele telefoon op. Hierdoor zien ze exact naar welke webadressen (endpoints) de Jumbo-app verzoeken stuurt.

Product Zoeken op EAN: Via de verborgen Jumbo API-endpoints kun je een EAN-code meesturen om het product-ID te krijgen, óf een zoekopdracht uitvoeren waar de EAN-code in de JSON-respons van het product wordt meegegeven.  
GitHub

Bestaande GitHub-Repositories:

shopscraper-api / grocy-dutch-supermarket: Scripts op GitHub die data ophalen van Jumbo en Albert Heijn. Ze matchen producten automatisch op basis van de EAN/barcode om voorraadbeheersystemen (zoals Grocy) thuis te voeden.  
GitHub

python-jumbo-api / jumbo-wrapper: Python- en Node.js-pakketten die de app-interfaces van Jumbo nabootsen.  
GitHub

Waarom doen ontwikkelaars dit?  
Pepesto
Slimme koelkasten & voorraadbeheer: Liefhebbers van home automation (zoals Home Assistant) maken een barcodescanner bij hun voorraadkast. Als ze een pak scannen, kijkt het Python-script op GitHub in de Jumbo- of AH-database welk product het is op basis van de EAN-code.

Prijsvergelijkers: Met deze scripts bouwen ontwikkelaars eigen tools om prijzen tussen Jumbo en Albert Heijn te vergelijken op basis van dezelfde EAN-codes van A-merken.

Kanttekening: Blijvend kat-en-muisspel
Omdat het geen officiële ontwikkelaars-API van Jumbo is, past Jumbo af en toe de beveiliging of de adressen van hun app-servers aan. Als Jumbo de app update, moeten de ontwikkelaars op GitHub hun code weer aanpassen om de barcodes te kunnen blijven uitlezen.