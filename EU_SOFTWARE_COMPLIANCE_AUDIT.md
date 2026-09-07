# EU-Oriented Secure Software Audit (EUSSA v2.3)
**Target System:** Workout Tracker (Personal Development / Hybrid Fitness Platform)  
**Repository:** `angelo-ecosoftware/workout-tracker`  
**Audit Specification:** EUSSA v2.3 (Production-Locked Master Instruction)  
**Current Audit Phase:** Phase 0 — Scope & Evidence Boundary Setup  
**Date of Audit Baseline:** 2026-09-07  
**Auditor Classification:** Automated Security, Privacy & EU Regulatory Static Analysis Engine  

---

### IMPORTANT REGULATORY & METHODOLOGICAL DISCLAIMERS
* **NO UNFOUNDED CERTIFICATION CLAIMS:** This audit report does not certify, state, or imply that the target application or operating entity is "EU Compliant," "GDPR Compliant," "CRA Compliant," "NIS2 Compliant," "ISO Certified," or "Zero Risk."
* **REPOSITORY SCOPE LIMITATION:** This assessment is strictly bounded by static repository artifacts (source code, configuration files, Infrastructure as Code, database migrations, and CI workflows) present in `workout-tracker`. Runtime cloud posture, production database states, production IAM policies, network security groups, and organizational governance cannot be observed from this repository.
* **LEGAL CONCLUSION BOUNDARY:** The evaluating system is an automated technical audit assistant and not legal counsel. This document does not constitute legal advice. Where technical gaps relate to regulatory obligations:
  > *Technical evidence indicates a potential gap relevant to [regulation/article]. Legal applicability and final legal assessment require confirmation based on organizational, contractual, operational, and factual circumstances.*
* **NEGATIVE EVIDENCE RULE:** The absence of a specific control artifact within this repository must not be interpreted as definitive proof that the control does not exist outside the repository (e.g., in edge CDN configs, cloud provider settings, or organizational policies). Such items are classified as `CANNOT VERIFY (RUNTIME/ORGANIZATIONAL)`.
* **SECRET SANITIZATION:** No live credentials, passwords, session tokens, cryptographic keys, or live user emails are reproduced in this report. Synthetic RFC 2606 placeholders are used throughout.

---

## 1. Executive Summary & Risk Profile Baseline

### 1.1 Project Overview & Architectural Topology
The target repository represents a client-side progressive web application (PWA) with a Node.js/Express companion proxy and Supabase (PostgreSQL + PostgREST + GoTrue Auth + Realtime) backend-as-a-service. The software provides workout tracking (sets, reps, progressive overload, timers), nutrition logging with barcode and Dutch supermarket scraping integrations (Albert Heijn, Dirk, Plus, Jumbo), coach-athlete roster management, and biometric tracking.

* **Frontend:** React 19 SPA, TypeScript, Vite 6, Tailwind CSS v4, Workbox PWA Service Worker.
* **Backend / API Layer:** Express 4.x / tsx Node server (`server.ts`) hosting custom proxy endpoints (`/api/barcode-lookup`, `/api/grocery-list`, `/api/product-link`, `/api/block-ip`, `/api/report-missing-product`).
* **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS), GoTrue OAuth/Password Authentication, Supabase Storage buckets (`media`), and Drizzle ORM schema definitions.
* **Third-Party Integrations:** Google Generative AI (`@google/genai`), Google OAuth, Open Food Facts API, Supermarket public web catalogs.

### 1.2 Phase 0 Risk Profile Baseline (Pre-Assessment Hypothesis)
Based on architectural topology, the baseline risk profile identifies several core risk vectors requiring rigorous technical audit in Phases 1–18:

| Domain | Baseline Concern / Vector | Regulatory / Standard Reference | Initial Hypothesis |
| :--- | :--- | :--- | :--- |
| **Special Category Data (Health/Biometrics)** | Storage of body weight, workout performance, nutritional habits, and physique progress photos. | GDPR Art. 9, Art. 25, Art. 32 | **HIGH FOCUS**: Must audit RLS policies, storage bucket public exposure, retention policies, and data export/erasure paths. |
| **Client-Side Honeypot & IP Defense** | Custom fingerprinting and permanent device ban logic in `src/utils/botDefense.ts` and `api/block-ip.ts`. | GDPR Art. 5(1)(c), Art. 6, ePrivacy Directive | **PRIVACY CONCERN**: Tracking/fingerprinting and persistent cookies/localStorage blacklisting require legitimate interest assessment and proportionality review. |
| **External Supermarket Scraping & Proxying** | Express server scraping external domains with Playwright/scrapers. | OWASP ASVS V12 (SSRF), CWE-918 | **SECURITY CONCERN**: Scraper input validation, target URL whitelisting, and bot proxy egress control. |
| **Authentication & Session Lifecycles** | OAuth redirect handlers, admin portal route isolation, token storage. | OAuth 2.0 Security BCP, ASVS V2/V3 | **SECURITY FOCUS**: CSRF token/state validation in custom redirect flows, token lifetime, and session invalidation. |
| **Accessibility & Inclusion** | Active workout timers, contrast ratios, touch targets, screen-reader cues. | EN 301 549, WCAG 2.2 AA | **ACCESSIBILITY FOCUS**: Haptic/audio alerts, form error announcements, SVG exercise muscle heatmaps. |

---

## 2. Audit Evidence Register (Section 15A Framework)

### 2.1 Repository Artifacts Inspected in Phase 0
The following configuration, manifest, and architectural artifacts were cataloged and verified during Phase 0 setup:

| Artifact Path | Artifact Class | Description & Relevance to Audit |
| :--- | :--- | :--- |
| `package.json` | Dependency Manifest | Primary library inventory, dependency constraints, script commands. |
| `tsconfig.json` | Compiler Configuration | TypeScript compiler flags (`strict`, `target`, type-checking rigor). |
| `vite.config.ts` | Bundler & PWA Config | PWA ServiceWorker caching strategy, manifest configuration, build plugins. |
| `server.ts` | Backend Server | Express route mounts, CORS policies, reverse proxy handling, security middleware. |
| `supabase/config.toml` | Supabase Local Config | Supabase local development configuration and authentication defaults. |
| `supabase/migrations/*` (14 SQL files) | Database Schema & RLS | PostgreSQL schemas, table definitions, RLS policies, trigger functions. |
| `supabase/snippets/*` (9 SQL files) | Database Patches | Relational schema definitions, RLS hardening scripts, aggregate triggers. |
| `drizzle/*` | ORM Metadata | Drizzle schema snapshots and migrations. |
| `api/*` (6 TypeScript files) | Server Endpoints | Express API handlers for barcode resolution, IP blocking, and grocery lists. |
| `src/context/AuthContext.tsx` | Identity Context | Client-side authentication state, session listener, GoTrue initialization. |
| `src/utils/botDefense.ts` | Defense Utility | Client-side fingerprinting, honeypot detection, cookie/localStorage ban mechanism. |
| `src/utils/authUrl.ts` | Auth Routing Utility | OAuth callback sanitizer, Google sign-in redirection handler. |
| `docs/architecture/*` | Architecture Documentation | High-level system design, roles architecture, barcode resolution topology. |
| `docs/standards/*` | Standards Records | Existing heuristic audits (ISO 25010, UX/UI, TypeScript audits). |

### 2.2 Execution Log
The following command execution log documents static analysis, repository queries, and tool invocations conducted during Phase 0:

| Command / Tool Executed | Purpose | Result / Output | Exit Code | Relevant Scope |
| :--- | :--- | :--- | :--- | :--- |
| `file_search: **/*` | Repository file discovery | 341 files indexed across workspace | N/A | Phase 0 Scope Mapping |
| `read_file: package.json` | Runtime dependency extraction | React 19, Vite 6, Supabase JS 2.112, Express 4.21, Tailwind CSS v4 identified | N/A | Tech Stack Inventory |
| `read_file: docs/architecture/ARCHITECTURE.md` | Component hierarchy review | Mapped domain boundaries: ui, modals, workout, dietary, insights, auth, db | N/A | Trust Boundary Setup |
| `git log -n 5 --oneline` | Baseline revision verification | Baseline commit `5badf39` verified on branch `main` | 0 | Baseline Traceability |
| *No static security scanners executed directly in Phase 0* | Architectural boundary definition | Completed manual Phase 0 static mapping | N/A | Phase 0 Setup |

### 2.3 Inaccessible Boundaries & Unverified Context
In accordance with the Negative Evidence Rule and Repository Scope Limitation, the following boundaries **cannot be inspected** from this repository and must remain classified as `CANNOT VERIFY (RUNTIME/ORGANIZATIONAL)` until external verification is provided:

1. **Production Supabase Dashboard & Project Settings:**
   * Live SSL/TLS termination cipher suites and HTTP version enforcement.
   * Supabase Auth Email rate limits, SMTP server configuration, and leaked password protection options.
   * Real-time production database backup encryption at rest (KMS key management).
   * Live Supabase Storage bucket access control configuration (specifically whether `workout-media` bucket public toggle is active in the Supabase Cloud Console).
2. **Hosting Infrastructure & Edge Routing:**
   * Vercel production deployment settings, HTTP security headers (HSTS, CSP, X-Frame-Options injected at edge).
   * Vercel DDoS mitigation, Web Application Firewall (WAF) rules, and Edge Middleware IP masking.
   * DNSSEC configuration and domain registrar lock mechanisms.
3. **Third-Party API Provider Policies:**
   * Google Cloud Console OAuth consent screen verification status and user data storage policies.
   * Google Gemini AI API data retention, logging, and model-training opt-out agreements.
   * Open Food Facts API terms and egress network reliability.
4. **Organizational & Operational Governance:**
   * Data Protection Officer (DPO) designation or Article 27 EU Representative status.
   * Formal Data Protection Impact Assessments (DPIA) for health/biometric data.
   * Incident response SLAs, breach notification procedure to Data Protection Authorities (72-hour GDPR Art. 33 requirement).
   * Vendor / Processor Data Processing Agreements (DPA) with Supabase, Vercel, and Google.

---

## 3. Architecture, Technology Inventory & STRIDE Threat Model
*(Detailed analysis to be populated in Phase 1 & Phase 4)*

### 3.1 Technology Inventory Matrix (Placeholder)
*(To be completed in Phase 1)*

### 3.2 STRIDE Threat Model & Data-Flow Diagrams (Placeholder)
*(To be completed in Phase 4 — Will include Mermaid Diagram Code Representation and equivalent structured text summaries)*

---

## 4. EU Legislative Applicability Triage Matrix
*(To be populated in Phase 2)*

| Regulation / Directive | Stated Legal Role | Material Scope Applicability | Justification & Repository Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GDPR (EU 2016/679)** | Controller / Processor | *Pending Phase 2 Triage* | Processes health/biometrics, user credentials, dietary logs. | *Queued* |
| **EU CRA (EU 2024/2847)** | Manufacturer / Developer | *Pending Phase 2 Triage* | Web application vs. commercial hardware/software product scope. | *Queued* |
| **EU NIS2 (EU 2022/2555)** | Essential/Important Entity | *Pending Phase 2 Triage* | Enterprise sector classification analysis. | *Queued* |
| **EU AI Act (EU 2024/1689)**| Provider / Deployer | *Pending Phase 2 Triage* | Evaluates `@google/genai` integration role. | *Queued* |
| **EU Data Act (EU 2023/2854)**| Data Holder / User | *Pending Phase 2 Triage* | Portability & cloud service interoperability. | *Queued* |

---

## 5. OWASP ASVS 5.0.0 Technical Security Assessment
*(To be populated in Phase 6)*

---

## 6. GDPR Privacy Architecture & Data Map
*(To be populated in Phase 7)*

---

## 7. EN 301 549 / WCAG 2.2 Accessibility Assessment
*(To be populated in Phase 8 — Itemized across Level A, Level AA, Level AAA)*

---

## 8. Supply Chain & SBOM Security Assessment
*(To be populated in Phase 11)*

---

## 9. AI Development Supply-Chain & Governance Assessment
*(To be populated in Phases 13 & 13A)*

---

## 10. Detailed Findings Log
*(To be populated in Phase 16 using canonical status enums and formatting schema)*

---

## 11. Runtime & Organizational Evidence Checklist
*(To be populated in Phase 18)*

---

## 12. Engineering Remediation Roadmap
*(To be populated in Phase 17)*

---

## 13. Phase 0 Audit Inspection Checklist (Code & Configuration Feed for Next Phases)

To execute code-level assessments across Phases 1 through 16, the following prioritized files and configurations must be audited:

### Cluster A: Authentication, Identity & Session Management (Phases 1, 4, 5)
- [ ] `src/context/AuthContext.tsx` — GoTrue client session lifecycle, token refresh loops, local storage token persistence.
- [ ] `src/utils/authUrl.ts` — OAuth redirect URL validation, browser history sanitization, open redirect defense.
- [ ] `src/components/auth/LoginScreen.tsx` — Input handling, credential transmission, honeypot layout.
- [ ] `src/utils/botDefense.ts` — Device fingerprinting algorithms, client ban storage, cookie parameters (`SameSite`, `Secure`).

### Cluster B: Database Security, Multi-Tenancy & Authorization (Phases 5, 6, 7)
- [ ] `src/lib/db/roles.ts` — RBAC role resolution (Athlete vs. Coach vs. Admin), invite token validation, privilege escalation guards.
- [ ] `supabase/migrations/20260904120000_roles_and_coaching_schema.sql` — PostgreSQL RLS policies for coaching relationship tables.
- [ ] `supabase/migrations/20260904150000_fix_invite_claiming_rls.sql` — Token claiming authorization and atomic assignment logic.
- [ ] `supabase/snippets/migration_security_rls_hardening.sql` — Row Level Security policies across workouts, sets, routines, biometrics.
- [ ] `supabase/snippets/allow_public_share_reads.sql` — Public workout sharing RLS exceptions and unauthenticated data exposure scope.

### Cluster C: Server API Egress, Proxying & Injection Risks (Phases 6, 11, 14)
- [ ] `server.ts` — Express route definitions, CORS headers, error-handling middleware, request body parsing limits.
- [ ] `api/barcode-lookup.ts` — External HTTP requests to Open Food Facts, input sanitization of scanned barcodes.
- [ ] `api/block-ip.ts` — In-memory / persistent IP blocking logic, client IP extraction (`x-forwarded-for` spoofing risks).
- [ ] `api/grocery-list.ts` & `api/product-link.ts` — URL generation, SSRF protections, external supermarket link redirection.
- [ ] `api/scraperRegistry.ts` — Headless browser execution boundaries, rate limiting, scraper timeout controls.

### Cluster D: Privacy Architecture, Health Data & Local Storage (Phases 7, 13A)
- [ ] `src/lib/storage.ts` — Local storage and IndexedDB keys, plaintext serialization of biometrics and workout drafts.
- [ ] `src/utils/draftPhotoStorage.ts` — Physique photo caching in IndexedDB / Canvas, image lifecycle before upload.
- [ ] `src/utils/imageCompressor.ts` — Client-side HTML Canvas image processing, EXIF metadata stripping (geolocation privacy).
- [ ] `src/lib/insightsEngine.ts` — Analytics calculations, biometric weight metrics, 1RM estimations.

### Cluster E: AI Governance & LLM Egress (Phases 13, 13A)
- [ ] `src/lib/ai/` (or components importing `@google/genai`) — Prompt construction, health/dietary data leaks in prompts, output validation.
- [ ] `package.json` & lockfile — Verification of `@google/genai` library integrity, license compliance, and version pin.

### Cluster F: Accessibility & Interface Semantics (Phase 8)
- [ ] `src/components/ui/Header.tsx` & `src/components/ui/ErrorBoundary.tsx` — Semantic navigation landmarks, accessible alerts.
- [ ] `src/components/workout/assisted/AssistedTimedTracker.tsx` — Aria-live timer updates, focus management, screen-reader cues.
- [ ] `src/components/workout/WgerExerciseInfo.tsx` — Text alternatives for exercise diagrams and muscle heatmaps.
- [ ] `src/components/dietary/MacroProgressBar.tsx` — Color-contrast independence, accessible value readouts.
