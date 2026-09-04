# Nutrition & Barcode Resolution Architecture

This document describes the multi-tier dietary resolution pipeline and the in-store scale barcode (PLU) alias resolution engine.

---

## 1. Multi-Tier Resolution Pipeline

```mermaid
flowchart TD
    Req["Request: Barcode Scan / Store Link"] --> T1["Tier 1: Supabase Hive Mind Cache (<30ms)"]
    T1 -->|Hit| Out["Return Verified Nutrition"]
    T1 -->|Miss| T2["Tier 2: Store Mobile / Product API (AH / Jumbo / OFF)"]
    T2 -->|Success| Gate["Tier 5: Strict Validation Gate"]
    T2 -->|Miss / Blocked| T3["Tier 3: Store Search Endpoints (AH / Jumbo)"]
    T3 -->|Success| Gate
    T3 -->|Miss / Blocked| T4["Tier 4: Direct Web HTML Scraper"]
    T4 -->|Success| Gate
    T4 -->|403 / Bot Block| T5["Tier 4b: Reader Proxy Fallback (Jina)"]
    T5 -->|Success| Gate
    T5 -->|Exhausted| Err["Safe Error Handshake: 'Could not resolve product'"]
    
    Gate -->|Valid & Non-Empty| Save["Auto-Cache into Supabase Hive Mind"] --> Out
    Gate -->|Blocked Title / 0 Macros| Err
```

---

## 2. In-Store Scale Barcode & PLU Alias Resolution Engine

```mermaid
flowchart TD
    Scan["User Scans In-Store Sticker (e.g. 2285623001452)"] --> Detect{"Prefix 20-29 detected?"}
    Detect -->|Yes| Extract["Extract 6-digit PLU Candidate: '285623' / '85623'"]
    Detect -->|No: Standard EAN| T1["Query Hive Mind / OFF directly"]
    
    Extract --> MatchDict{"Match in Pre-Seeded PLU Dictionary?"}
    MatchDict -->|Hit: webshopId/GTIN found| MobileFIR["Fetch Official Mobile FIR / GTIN endpoint"]
    MatchDict -->|Miss| SearchStore["Query AH Search API with extracted PLU"]
    
    MobileFIR -->|Success| SaveAlias["Auto-Save into Hive Mind with barcode=2285623001452"] --> Resolve["Return Full Macros & Deep Link"]
    SearchStore -->|Match Found| SaveAlias
    SearchStore -->|Not Found| QuickSearch["Provide 1-Tap Quick Search: 'Search in App / Web'"]
```

---

## 3. Component Details & Fallback Sequence

| Tier | Component | Strategy | Latency |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Supabase `food_items` | Checks `barcode`, `id = ean_{barcode}`, or `id = ah_wi{webshopId}` | `< 30ms` |
| **Tier 1.5** | PLU Alias Mapper | `extractScalePluCandidates()` + `BAKERY_PLU_DICTIONARY` | `< 1ms` |
| **Tier 2** | Mobile Services API | Anonymous mobile token + direct GTIN & FIR webshop ID endpoints | `~150ms` |
| **Tier 3** | Store Search Endpoints | Store search query resolution via store search APIs | `~300ms` |
| **Tier 4** | Web HTML Scraper | Server-side parsing of structured JSON-LD and Dutch nutrition tables | `~500ms` |
| **Tier 4b** | Proxy Reader | Fallback proxy when supermarket bot mitigations trigger | `~1.2s` |
| **Tier 5** | Strict Quality Gate | Verifies title cleanliness, non-zero macro validation, and unit normalization | `< 1ms` |
