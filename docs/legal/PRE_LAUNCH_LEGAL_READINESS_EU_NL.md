# Kinisia EU/NL Pre-Launch Legal Readiness

**Status:** Working checklist — not legal advice  
**Scope:** Kinisia web application, planned Android/iOS distribution, workout
tracking, nutrition logging, AI-assisted recommendations, user-uploaded media,
sharing, and coaching features  
**Jurisdiction focus:** Netherlands and European Union  
**Owner:** Kinisia operator  
**Last reviewed:** 2026-09-13

## Important warning

This document is an engineering and business readiness checklist. It is not a
legal opinion, compliance certificate, tax opinion, or substitute for a Dutch
privacy lawyer, accountant, and business adviser.

The repository contains a technical compliance dossier that displays claims
such as “GDPR conformant,” “CRA compliant,” “ASVS verified,” and “0 known
vulnerabilities.” Those are not established by the existence of the UI or by
this document. They must not be used as public legal or security claims until
an appropriately qualified review and the required evidence exist. Consider
changing those UI labels to “technical posture,” “target,” or “not independently
verified” before launch.

## Executive launch decision

Kinisia should not be presented as legally ready merely because the app works
or the roadmap is complete. Before public launch, the operator must:

1. Identify the legal business/operator and register it where required.
2. Complete a data map and GDPR/AVG privacy assessment.
3. Sign or verify processor terms and data-processing agreements.
4. Confirm the lawful basis for health and nutrition data, including explicit
   consent where required for special-category data.
5. Confirm every external API, media source, scraper, font, icon, and dataset
   may be used for the intended commercial purpose.
6. Publish accurate privacy, terms, cookie, health disclaimer, and contact
   information.
7. Verify deletion, export, consent withdrawal, incident response, and support
   procedures.
8. Complete security, load, backup, and restore testing.
9. Complete Google Play and Apple App Store legal and technical submissions.
10. Obtain professional advice on medical-device, consumer, tax, and
    regulatory classification questions.

## Repository scan summary

The repository shows these relevant product behaviors and integrations:

- React/TypeScript web application with Vite, Express companion routes, and
  Vercel-style API handlers.
- Supabase Auth, PostgreSQL, Storage, and Realtime-related client usage.
- Workout sessions, sets, bodyweight logs, photos, nutrition logs, custom foods,
  coaching records, privacy settings, and planned sharing.
- Google OAuth and planned email verification/password authentication.
- AI routine-generation and planned AI fallback/provider usage.
- WGER exercise API usage.
- Exercise GIF/media references from `static.exercisedb.dev`.
- Open Food Facts links/API references.
- Product and recipe resolution for Albert Heijn, Jumbo, Dirk, PLUS, Lidl,
  Aldi, Picnic, Hoogvliet, and Spar.
- Jina AI Reader and external URL fetching in the product/recipe pipeline.
- YouTube and TikTok links.
- Planned Crawlee-based catalog ingestion.
- Planned Android and iOS store distribution.
- Direct dependencies declared in `package.json` and a `pnpm-lock.yaml`.

This is an inventory of code references, not proof that each provider has
approved Kinisia's use case.

## 1. Business and Dutch operating requirements

### 1.1 Identify the operator

Decide and document whether Kinisia is operated by:

- A Dutch sole proprietorship.
- A Dutch partnership or private limited company (BV).
- An existing company in another country.
- A non-commercial personal project during beta.

If operating commercially from the Netherlands, ask a Dutch accountant or
business adviser whether registration with the **Kamer van Koophandel (KVK)**
is required, which legal entity is appropriate, and when registration must
occur. Obtain the correct legal name, business address, KVK number, VAT
number, and contact details for the website, terms, privacy notice, invoices,
and app-store accounts.

### 1.2 Tax and payments

Before accepting money, confirm:

- VAT treatment and invoicing.
- OSS or other cross-border EU VAT obligations.
- Subscription renewals and cancellation handling.
- Refunds and statutory consumer rights.
- Whether Apple or Google acts as merchant of record for mobile purchases.
- Whether web and mobile pricing must be identical or clearly explained.
- Accounting treatment for Supabase, Vercel, AI, domain, and app-store costs.

Do not launch paid plans until an accountant has reviewed the chosen payment
and tax setup.

### 1.3 Public business information

Prepare a legal/contact page containing, as applicable:

- Operator legal name.
- Physical or legally permitted contact address.
- Email address for support and privacy requests.
- KVK and VAT details where required.
- Terms of service.
- Privacy notice.
- Cookie notice/preferences.
- Subprocessor list.
- Complaint and withdrawal instructions if consumers pay.

## 2. GDPR/AVG and health-data requirements

Kinisia processes more than ordinary account data. The repository references
bodyweight, BMI, body measurements, progress photos, workouts, nutrition,
energy, sleep, and health-related goals. Some of this may qualify as health
data or otherwise sensitive personal data depending on purpose and context.

### 2.1 Controller and processor map

Create a written data map for:

- Auth identity and email address.
- Google identity and profile metadata.
- Bodyweight, height, BMI, waist, photos, and notes.
- Workout sessions, sets, exercise history, and performance.
- Food logs, nutrition values, goals, and dietary notes.
- Coach/athlete links and shared data.
- Device, IP, security, and operational logs.
- Support messages and missing-product reports.
- AI prompts, generated routines, and provider retention.

For every data category record:

- Purpose.
- Data controller.
- Processor/subprocessor.
- Lawful basis.
- Special-category condition where applicable.
- Retention period.
- Storage location and transfer mechanism.
- Who can access it.
- Deletion/export behavior.

### 2.2 Lawful basis and explicit consent

Do not assume “the user signed up” is enough for all data. Obtain legal advice on
the correct basis for each purpose. For health or health-inference data, assess
whether explicit consent under GDPR Article 9 is required and how consent can
be withdrawn without making unrelated account functions impossible.

Consent must be:

- Specific and separate by purpose.
- Freely given and understandable.
- Recorded with timestamp, version, and wording.
- Withdrawable as easily as it was given.
- Distinct from acceptance of general terms.

### 2.3 Data-subject rights

Implement and test:

- Access request.
- Data export in a usable format.
- Correction.
- Deletion/account closure.
- Consent withdrawal.
- Restriction or objection where applicable.
- Human review/contact for significant automated recommendations.

Define response ownership and deadlines. A button that appears to delete data is
not enough unless database rows, Storage objects, local caches, backups, logs,
and subprocessors are handled consistently.

### 2.4 DPIA and privacy by design

Ask a privacy professional whether a Data Protection Impact Assessment is
required or prudent because Kinisia combines health-related data, profiling,
progress tracking, coaching, and AI recommendations.

The DPIA should cover:

- Necessity and proportionality.
- Risks of account crossing or coach overreach.
- Risk from incorrect calorie or training advice.
- AI prompt leakage and provider retention.
- Photo and custom-media exposure.
- Children or vulnerable users.
- International transfers.
- Mitigations and residual risk.

### 2.5 Cookies, analytics, and telemetry

Classify every cookie, local-storage key, analytics event, error report, and
telemetry endpoint as essential, preference, analytics, or marketing. Obtain
consent before non-essential tracking where required. Ensure development
telemetry endpoints are not shipped in production and redact tokens, emails,
health data, and workout details from logs.

## 3. Third-party providers and likely costs

The following are likely commercial accounts, paid tiers, or contractual
obligations. Exact prices and terms change; confirm them directly before
purchase.

### 3.1 Infrastructure

**Supabase**

- Likely the first paid infrastructure tier when database size, bandwidth,
  backups, Auth usage, Storage, or concurrent traffic exceeds free limits.
- Review plan limits, invoices, retention, backups, regions, subprocessors,
  DPA, security settings, and support.
- Confirm where EU user data is hosted and whether the selected region satisfies
  the operator's transfer requirements.
- Configure RLS, Storage policies, backups, PITR where available, and restore
  tests. A paid tier does not replace these controls.

**Vercel**

- Review commercial plan limits, serverless function concurrency, bandwidth,
  logs, retention, regions, DPA, subprocessors, and deployment access.
- Confirm production domains, environment separation, preview exposure, and
  access controls.
- A Vercel tier does not automatically provide application rate limits or
  protection for every custom endpoint.

**Domain/DNS and email**

- Renew and protect `kinisia.nl`.
- Enable registrar account MFA, registry lock where appropriate, DNSSEC if
  suitable, and renewal alerts.
- Select an email provider for verification, password reset, support, and
  transactional messages.
- Review sender authentication (SPF, DKIM, DMARC), bounce handling, abuse
  controls, DPA, retention, and EU transfer terms.

### 3.2 AI providers

The app references AI routine generation and the project discussion references
Groq. Before production use:

- Create a production provider account and billing limit.
- Keep API keys server-side; never expose them in Vite client variables or the
  browser bundle.
- Review provider terms, model license, training/retention policy, region,
  subprocessor list, DPA, and deletion options.
- Do not send unnecessary health, identity, email, photos, or private notes.
- Add prompt-injection, output-validation, quota, timeout, and fallback
  controls.
- Tell users when a recommendation is AI-generated and not medical advice.

### 3.3 Exercise and media sources

**WGER**

- Verify API terms, attribution, rate limits, commercial-use rights, and
  whether the specific exercise content may be copied into Kinisia's database.

**ExerciseDB/static GIF sources**

- Do not assume that a publicly reachable GIF is commercially reusable.
- Confirm the license and attribution requirement for each source and each
  media asset.
- Keep source URL, provider, license, attribution, import date, and removal
  contact in catalog metadata.
- User-uploaded GIFs require ownership/permission declarations and a takedown
  process.

**YouTube and TikTok**

- Linking to a provider is different from downloading, embedding, caching, or
  republishing its content.
- Follow provider terms and embed policies.
- Do not imply endorsement or use creator content outside permitted mechanisms.

### 3.4 Food, recipes, and supermarket data

Potential legal issues exist for:

- Open Food Facts data licensing and attribution/share-alike obligations.
- Supermarket trademarks, logos, product text, images, recipes, and APIs.
- Private/shared shopping lists.
- Scraping terms of service, robots rules, technical restrictions, and
  database rights.
- Nutrition-data accuracy and liability.
- Recipe copyright and substantial copying.

For every source, record:

- Provider.
- API or webpage.
- Terms URL.
- License.
- Commercial-use permission.
- Attribution text.
- Data fields copied.
- Cache duration.
- Takedown/contact process.

Use official APIs or licensed datasets first. Crawlee is an implementation
tool; it does not grant permission to scrape a website. Do not crawl private,
authenticated, blocked, or user-only content.

## 4. Open-source license review

The repository has no checked-in `LICENSE` files, so the project must not assume
that “no license file” means “no obligations.” The direct dependencies declared
in `package.json` appear to be common permissive/open-source packages, but the
complete transitive dependency tree must be verified from installed package
metadata and the lockfile.

Likely direct-license families to verify include:

- MIT: React, Vite, Supabase JS, Express, Tailwind, Vitest, Motion, Driver.js,
  and related packages.
- Apache-2.0: TypeScript, Workbox, Fuse.js, Sharp, and related packages.
- ISC/BSD-family: Lucide and other utility packages.
- Other transitive licenses: must be discovered from the full dependency tree.

Before release:

1. Generate an SPDX or CycloneDX SBOM from the exact production lockfile.
2. Export every package name, version, license, copyright notice, and source.
3. Detect GPL, AGPL, SSPL, Commons Clause, source-available, or unknown
   licenses requiring specific review.
4. Review packages used in server and client bundles separately.
5. Preserve required notices in a third-party notices page or downloadable
   file.
6. Re-run the scan on every dependency update.
7. Have counsel review any copyleft or unclear license before distribution.

No subscription is normally required to use permissive open-source packages,
but paid support, hosted services, commercial data, and app-store accounts are
separate from software-license compliance.

## 5. App-store requirements

### Google Play

Plan for:

- Google Play Console developer account.
- Identity verification and organization details.
- Android package identity and signing.
- Play App Signing.
- Data Safety form.
- Privacy-policy URL.
- Account-deletion path.
- Health/fitness declarations where applicable.
- Age/content rating.
- Permissions justification.
- Testing track and staged rollout.
- Crash reports and support contact.

### Apple App Store

Plan for:

- Apple Developer Program membership.
- Organization enrollment if publishing as a company.
- Bundle identifier, certificates, provisioning, and App Store Connect.
- App Privacy nutrition labels.
- Privacy-policy URL.
- Account deletion.
- Sign in with Apple implications if third-party social login is offered.
- Health/fitness data and medical-claim review.
- Subscription and in-app purchase rules if paid features are sold.
- TestFlight and review metadata.

Do not publish a wrapped website until it offers a stable mobile experience and
the store rules for account creation, external payment, login, privacy, and
health functionality have been reviewed.

## 6. Product claims and health-risk boundaries

Kinisia should describe itself as a fitness and nutrition tracking/coaching
product unless a medical-device assessment says otherwise.

Avoid claims that Kinisia:

- Diagnoses disease.
- Treats injuries or medical conditions.
- Guarantees fat loss or muscle gain.
- Provides medically accurate calorie-deficit decisions.
- Replaces a doctor, dietitian, physiotherapist, or trainer.

Use clear warnings for:

- Injury or pain.
- Eating-disorder risk.
- Pregnancy or medical conditions.
- Unsafe weight progression.
- AI-generated recommendations.
- Estimated calorie expenditure and body-recomposition status.

Ask a specialist whether intended purpose, claims, or automated recommendations
could bring any feature within medical-device, consumer-protection, or
professional-regulation rules.

## 7. Security, resilience, and evidence needed before launch

The legal launch file should link to evidence for:

- RLS and Storage cross-account tests.
- Auth verification, reset, revocation, and rate-limit tests.
- SSRF and public API validation tests.
- Dependency, secret, and license scans.
- SBOM generated from the production build.
- Backup and restore test.
- Account deletion and export test.
- Data-processing inventory and subprocessor register.
- Staging load test and capacity report.
- Incident-response and breach-notification procedure.
- Production environment and secret-rotation checklist.
- Mobile and browser compatibility testing.

The current repository documentation itself identifies public endpoints with
wildcard CORS and missing rate limiting as risks. Those findings should be
resolved or explicitly accepted by the operator before launch.

## 8. Recommended launch sequence

### Gate A — Business and legal identity

- Confirm operator/entity and KVK/accounting advice.
- Secure domain and business email.
- Open provider and app-store accounts in the correct legal name.
- Obtain professional review of privacy, terms, tax, and health claims.

### Gate B — Data and provider contracts

- Finish the data map and retention schedule.
- Review Supabase, Vercel, AI, email, analytics, and storage DPAs.
- Verify each catalog/media/recipe source license and attribution.
- Create the subprocessor and open-source notices.

### Gate C — Technical controls

- Enforce RLS and Storage policies.
- Add rate limits, CORS restrictions, SSRF controls, payload limits, and
  idempotency.
- Complete deletion, export, consent withdrawal, backups, and restore.
- Remove or relabel unsupported compliance claims in the product UI.

### Gate D — Test and release

- Run the security test suite and an authorized penetration test.
- Run staging load tests, including login spikes and 1,000-concurrent-user
  scenarios if that is a stated target.
- Test provider failure, offline behavior, duplicate submissions, and account
  switching.
- Run legal, privacy, accessibility, and store-review checklists.
- Release to internal Android testers and TestFlight before public rollout.

## 9. Evidence register

Do not mark this document complete with verbal assurances. Record:

- Decision.
- Owner.
- Date reviewed.
- Evidence link or file.
- Expiration/review date.
- Open risk and accepted-by person.

Suggested status values:

- `NOT STARTED`
- `IN REVIEW`
- `EVIDENCE COMPLETE`
- `BLOCKED`
- `ACCEPTED RISK`

## 10. Immediate action list

The highest-value actions before public launch are:

1. Ask a Dutch lawyer/accountant about KVK, VAT, GDPR/AVG, health data, DPIA,
   consumer law, and medical-device classification.
2. Stop presenting generated compliance-dossier claims as certifications.
3. Create the provider/subprocessor inventory and request DPAs.
4. Verify Open Food Facts, WGER, ExerciseDB, supermarket, recipe, and media
   rights before importing or republishing content.
5. Generate a real production SBOM and license report.
6. Resolve public API CORS, rate-limiting, and SSRF findings.
7. Implement and test deletion, export, consent withdrawal, backup, and
   restore.
8. Select Supabase, Vercel, email, AI, and monitoring tiers based on measured
   usage rather than guesses.
9. Complete staging load and security testing.
10. Launch a small, monitored beta before general availability.

## Final status

**Not legal-ready for public commercial launch yet.**

The repository contains useful technical architecture and planning material,
but legal readiness requires operational decisions, contracts, evidence, and
professional review that cannot be inferred from source code alone.
