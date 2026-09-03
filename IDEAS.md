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

### 2.1 Mobile Barcode Scanner for Product Indexing (Albert Heijn & Retail)
- **Concept**: Scan physical product barcodes (EAN-13 / UPC) directly from the mobile PWA/camera.
- **Flow**:
  1. Camera scans barcode via `BarcodeDetector` / camera stream.
  2. System checks local offline cache / IndexedDB first.
  3. If missing, queries Open Food Facts / product API for Albert Heijn and Dutch grocery items.
  4. Automatically maps and indexes macros (`kcal`, `protein`, `carbs`, `fat`, `fiber`, `sugars` per 100g) into global & user database.
  5. Prompts user to log custom portion grams directly into today's dietary tracker.

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
