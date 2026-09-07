# 🎯 User-Centric Priority Roadmap (Phases 1 to 6)

This document organizes all planned features, ideas, and enhancements from [docs/roadmap/IDEAS.md](docs/roadmap/IDEAS.md) into a **user-first, value-driven execution plan**. 

Prioritization is structured by **direct athlete & coach impact**, moving from daily active workout UX to intelligence, automation, and compliance.

---

```
┌────────────────────────────────────────────────────────────────────────┐
│                   USER VALUE PROGRESSION ROADMAP                       │
├────────────────────────────────────────────────────────────────────────┤
│  Phase 1: Active Workout Flow, Onboarding & Habit Loops (Highest ROI)  │
│  Phase 2: Exercise Intelligence, Drugstore Nutrition & Form Videos     │
│  Phase 3: AI Coaching, Cached Responses & Overload Velocity Analytics  │
│  Phase 4: Cardio & Endurance Tracking Engine                           │
│  Phase 5: Document & PDF Export Engine (Cardio-Only Scope)             │
│  Phase 6: Enterprise Security, Wearables & EU Compliance Dossier       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Phase 1: Active Workout Flow, Onboarding & Habit Loops (Daily Athlete Experience)
> **User Goal**: *"Make logging my daily sets fast, rewarding, and hands-free while I'm sweating in the gym, with a clean skippable start."*

| Priority | Feature Name | Why the User Cares | Psychological Driver | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P1.1** | **Workout Completion "PR Celebration" Modal** | Seeing total tonnage (e.g. *12,450 kg lifted*) and new 1RM record badges with confetti at the end of a session delivers instant closure and accomplishment. | **Peak-End Rule** | 🟢 **Completed** |
| **P1.2** | **Weekly Consistency Streak & Activity Heatmap** | A 7-day pill bar (`[M] [T] [W] [T] [F] [S] [S]`) and *"🔥 4-Week Streak"* counter at the top of the Logbook motivates athletes never to break the chain. | **Goal-Gradient & Zeigarnik Effect** | 🟢 **Completed** |
| **P1.3** | **Rest Timer Auto-Start & Vibration Buzz** | Checking off a set row (`[ ✓ ]`) automatically triggers the background rest timer and vibrates the phone when rest is over so athletes don't need to stare at their screen. | **Mental Offloading** | 🟢 **Completed** |
| **P1.4** | **Interactive Skippable Onboarding Flow** | Fast 4-step onboarding (Goals $\rightarrow$ Experience $\rightarrow$ Equipment $\rightarrow$ Biometrics) with prominent *"Skip for Now & Explore"* button so lifters aren't blocked. | **User Freedom & Control** | 🟢 **Completed** |
| **P1.5** | **In-App Searchable FAQ in Settings** | Instant help accordion in Settings answering common questions about sets, barcode scanning, coach sharing, and backups. | **Self-Service Support** | 🟢 **Completed** |
| **P1.6** | **Supermarket Macro Sanity Validation `[BUG-004]`** | Automatically verifies that scraped food items obey $(4 \times P) + (4 \times C) + (9 \times F) \approx \text{kcal}$ to prevent corrupted dietary logs. | **Trust & Reliability** | 🟢 **Completed** |

---

## 🏋️ Phase 2: Exercise Intelligence, Drugstore Nutrition & Form Guidance
> **User Goal**: *"Show me exactly how to perform an exercise, what muscles should be working, and let me scan vitamins & drugstore snacks."*

| Priority | Feature Name | Why the User Cares | Implementation Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P2.1** | **Minimalist `(i)` Exercise Guide Drawer** | Tapping a sleek `(i)` badge opens an overlay with looping execution animations (WebP) and muscle cues instead of cluttering active set rows. | Hybrid dataset (`hasaneyldrm` + `free-exercise-db`) | ⏳ Queued |
| **P2.2** | **Interactive WGER Muscle Anatomy Heatmap** | Visual anterior & posterior SVG body diagrams showing primary and secondary target muscles highlighted in red. | `wger-project/wger` SVG vector layers | ⏳ Queued |
| **P2.3** | **Drugstore Nutrition & Vitamins (Kruidvat, Etos, Holland & Barrett)** | Allows scanning and pasting protein bars, creatine, vitamins, and health supplements from Dutch drugstore chains into the dietary log. | Scrapers & EAN search for `kruidvat.nl`, `etos.nl`, `hollandandbarrett.nl` | ⏳ Queued |
| **P2.4** | **Form Tutorial Video Links & Technique Notes** | 1-tap link to 1080p biomechanical form breakdowns and coach technique notes. | In-app modal / WebM video stream | ⏳ Queued |

---

## 🤖 Phase 3: AI Coaching, Cached Responses & Overload Velocity
> **User Goal**: *"Give me instant AI coaching on my training and diet without waiting or lag, and tell me if I'm progressing."*

| Priority | Feature Name | Why the User Cares | Implementation Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P3.1** | **Sub-50ms Cached AI Response Architecture** | Semantic & exact-key response caching in Supabase/localStorage so repeated workout and meal questions answer instantly with zero lag or API limits. | `ai_response_cache` with context hashing & tiered TTL | ⏳ Queued |
| **P3.2** | **AI Diet & Macro Target Optimizer** | Suggests 3 quick meal options to hit remaining daily macros based on grocery items the user frequently buys or has in their pantry. | Contextual LLM prompt generator | ⏳ Queued |
| **P3.3** | **Progressive Overload Velocity Tracker** | Week-over-week velocity curve showing true strength progression on compound lifts (Squat, Bench, Deadlift, Overhead Press). | Brzycki / Epley 1RM velocity algorithms | ⏳ Queued |
| **P3.4** | **Fatigue & Deload Recommender** | Cross-references logged sleep ($\le 6\text{h}$) and energy ($\le 4/10$) with volume tonnage drops to recommend scheduled deloads before injury occurs. | Automated load optimization heuristic | ⏳ Queued |

---

## 🏃 Phase 4: Cardio & Endurance Tracking Engine
> **User Goal**: *"Let me log runs, cycling, rowing, and HIIT alongside my lifting routines with pace, distance, and heart rate metrics."*

| Priority | Feature Name | Why the User Cares | Implementation Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P4.1** | **Cardio Session Logger (Distance, Duration, Pace, HR)** | Dedicated logging module for running, cycling, rowing, and HIIT workouts with splits and heart rate zone tagging. | New `cardio_sessions` schema & UI | ⏳ Queued |
| **P4.2** | **Cardio vs. Strength Interference Balancing** | Tracks cardiovascular energy expenditure against weekly lifting volume to help hybrid athletes optimize recovery. | Biometric correlation engine | ⏳ Queued |
| **P4.3** | **Cardio Milestone Badges (5k, 10k, Half-Marathon)** | Automatic PR detection for fastest 1km, 5km, 10km pace and longest duration. | Client-side milestone parser | ⏳ Queued |

---

## 📄 Phase 5: Document & PDF Architecture (Cardio-Only Scope)
> **User Goal**: *"Give me clean, downloadable PDF summaries of my endurance training, caloric burn, and gym pocket guides."*

| Priority | Feature Name | Why the User Cares | Implementation Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P5.1** | **Monthly Cardio Athlete Milestone PDF** | Clean downloadable PDF report summarizing monthly distance, pace progression, VO2 max trends, and BMI response. | Client-side `@react-pdf/renderer` | ⏳ Queued |
| **P5.2** | **Dietary & Cardio Energy Expenditure PDF** | Weekly summary linking caloric expenditure from cardio sessions with dietary macro intake for endurance athletes. | Serverless / client-side PDF export | ⏳ Queued |
| **P5.3** | **1-Page Gym Pocket Guide Routine Exporter** | 1-click printable black-and-white cheat-sheet of active workout splits with set/rep targets and QR codes. | High-contrast single-page PDF generator | ⏳ Queued |

---

## 🛡️ Phase 6: Enterprise Security, ENISA & EU Compliance Dossier
> **User Goal**: *"Ensure my health, biometric, and personal data complies with the highest European cybersecurity and privacy laws."*

| Priority | Feature Name | Why the User Cares | Implementation Scope | Status |
| :---: | :--- | :--- | :--- | :---: |
| **P6.1** | **GDPR Article 17 ("Right to be Forgotten") 1-Tap Purge** | Guarantees users can permanently erase their entire account, logs, and photos in 1 click. | Automated PostgreSQL + S3 cascade | ⏳ Queued |
| **P6.2** | **EU Cybersecurity (NIS2, CRA, DORA, ENISA) Audit Dossier** | Automated security compliance audit PDF documenting TLS 1.3 encryption, SBOM dependency tracking, and RBAC policies. | Automated compliance report builder | ⏳ Queued |
| **P6.3** | **Zero-Knowledge Biometric Vault & MFA Readiness** | Client-side encrypted biometrics and multi-factor authentication support. | WebAuthn / TOTP security layer | ⏳ Queued |

---

## 🚦 Execution Tracker

| Phase | Focus Area | Impact Level | Status |
| :--- | :--- | :---: | :---: |
| **Phase 1** | Active Workout Flow & Habit Loops (PR Confetti, Streaks, Rest Vibration) | 🌟 Maximum Daily ROI | ⏳ Ready to Start |
| **Phase 2** | Exercise Intelligence & Anatomy Heatmaps (WGER, GIFs, `(i)` Guide) | 🏋️ High Visual Value | ⏳ Queued |
| **Phase 3** | Actionable Analytics & Overload Velocity (1RM Velocity, Deload AI) | 📈 High Coaching Value | ⏳ Queued |
| **Phase 4** | Cardio & Endurance Tracking Engine (Distance, Pace, HR Zones) | 🏃 Hybrid Fitness Scope | ⏳ Queued |
| **Phase 5** | Document & PDF Reporting Engine (Cardio PDFs, Program Pocket Guide) | 📄 Utility & Portability | ⏳ Queued |
| **Phase 6** | Enterprise Security & EU Compliance Dossier (NIS2, CRA, DORA, GDPR) | 🛡️ Regulatory Standard | ⏳ Queued |
