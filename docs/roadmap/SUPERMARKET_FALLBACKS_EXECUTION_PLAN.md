# 🛒 Multi-Store & Barcode Normalizer Execution Plan (37 Fallbacks)

This document outlines the step-by-step phased implementation for expanding store support (**Lidl, Aldi, Picnic, Hoogvliet, Spar**) and barcode normalization (**Item 4.1: UPC / EAN-13 / GTIN-14 checksum normalizer**).

Execution is divided into **4 distinct, minimal, single-phase increments**. Each phase will be executed and validated with test suites before moving to the next.

---

## 📋 Phase Breakdown

### 🔹 Phase 1: UPC / EAN / GTIN Barcode Normalizer & Multi-Format Fallbacks
- **Objective**: Implement barcode formatting resilience across 8-digit (EAN-8), 12-digit (UPC-A), 13-digit (EAN-13 with zero-padding), and 14-digit (GTIN-14) formats.
- **Files**:
  - `src/lib/barcodeService.ts` (Checksum validation & zero-padding variant generator)
  - `api/barcode-lookup.ts` (Iterative variant resolution across retailer backends)
  - `tests/backend/dietary/barcodeNormalization.test.ts` (Unit test suite for UPC/EAN formats)
- **Validation**: Vitest unit test suite verifying zero-padded UPC matches in DB and retailer APIs.

---

### 🔹 Phase 2: Lidl & Aldi Nederland Ingestion & Fallbacks
- **Objective**: Implement product link scrapers, barcode resolvers, and recipe/shared list parsers for Lidl and Aldi.
- **Files**:
  - `api/scraperRegistry.ts` (`lidlAdapter`, `aldiAdapter`, German/Dutch nutrition parsers)
  - `api/barcode-lookup.ts` (Lidl & Aldi GTIN catalog queries)
  - `api/grocery-list.ts` (Lidl recipe & shopping list parser)
  - `src/lib/storeBranding.ts` (Lidl & Aldi badges, colors, and search links)
  - `tests/backend/dietary/lidlAldiScrapers.test.ts` (Unit test suite)
- **Validation**: Vitest test suite testing Lidl (`lidl.nl/p/...`) and Aldi product HTML and barcode payloads.

---

### 🔹 Phase 3: Picnic, Hoogvliet & Spar Ingestion & Fallbacks
- **Objective**: Add online supermarket Picnic, Hoogvliet, and Spar product scraping, barcode resolution, and shared basket parsing.
- **Files**:
  - `api/scraperRegistry.ts` (`picnicAdapter`, `hoogvlietAdapter`, `sparAdapter`)
  - `api/barcode-lookup.ts` (Picnic, Hoogvliet & Spar search APIs)
  - `api/grocery-list.ts` (Picnic shared basket / list resolver `picnic.app/basket/...`)
  - `src/lib/storeBranding.ts` (Branding tokens and verified search URLs)
  - `tests/backend/dietary/picnicHoogvlietSparScrapers.test.ts` (Unit test suite)
- **Validation**: Vitest test suite for Picnic, Hoogvliet, and Spar.

---

### 🔹 Phase 4: System Integration, Documentation & End-to-End Verification
- **Objective**: Integrate all 37 fallback mechanisms across the UI, update architectural documentation, and run full workspace regression tests.
- **Files**:
  - `docs/architecture/BARCODE_RESOLUTION_ARCHITECTURE.md` (Update architecture reference with all 37 fallbacks)
  - `docs/roadmap/IDEAS.md` (Mark supermarket expansion complete)
  - Run full test suite (`pnpm test`) across all 400+ frontend and backend tests.
- **Validation**: 100% test pass rate with zero TypeScript errors.

---

## 🚦 Execution Status Tracker

| Phase | Description | Status | Tests |
| :--- | :--- | :---: | :---: |
| **Phase 1** | UPC / EAN / GTIN Checksum Normalizer & Multi-Format Fallbacks | ✅ Completed | 11/11 Passed |
| **Phase 2** | Lidl & Aldi Ingestion, Barcodes & List Parsers | ✅ Completed | 9/9 Passed |
| **Phase 3** | Picnic, Hoogvliet & Spar Ingestion & Basket Parsers | ✅ Completed | 11/11 Passed |
| **Phase 4** | Integration, Omni-Input Bar, Recipe Engine & Full Regression | ✅ Completed | 445/445 Passed |
