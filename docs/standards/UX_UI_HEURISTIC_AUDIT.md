# 🎨 Mobile & Web UX/UI Heuristic Audit & Cognitive Ergonomics Specification

**Product:** Workout Tracker PWA / Health & Fitness Platform  
**Auditor Role:** Senior UX/UI Auditor & Product Strategist  
**Evaluation Frameworks:** Nielsen Norman Group (NN/g) Heuristics, WCAG 2.2 AA Standards, Apple Human Interface Guidelines (HIG), Google Material Design 3, and Behavioral/Psychological UX Laws.  
**Date:** September 6, 2026  

---

# PART 1: UX/UI HEURISTIC AUDIT

---

### 1. Active Workout Logging Flow (`WorkoutDayTracker` & `ExerciseSetRow`)
- **Applied UX Law**: **Hick’s Law** ($T = b \cdot \log_2(n + 1)$) & **Fitts’s Law** ($MT = a + b \log_2(2D / W)$)
- **Current Deficit**: When multiple exercise cards are expanded simultaneously with four-button increment clusters (`-2.5`, `-0.5`, `+0.5`, `+2.5`, `-1`, `+1`), the viewport presents over 30+ interactive targets per exercise. Under intense physical gym conditions (elevated heart rate, sweat, unstable grip, motion blur), target acquisition time increases exponentially and users frequently mis-tap adjacent steppers.
- **Cognitive Impact**: High decision latency and visual clutter divert focus away from lifting and pacing. Athletes experience decision fatigue while logging repeated sets.
- **Severity Rating**: **High**
- **Actionable Remediation**:
  - Enforce single-line set rows with streamlined unified steppers (`[-] [ 20 kg ] [+]`).
  - Introduce 1-tap set completion checkmarks (`[ ✓ ]`) that dim completed sets, record timestamps, and automatically advance the focus highlight to `NEXT`.

---

### 2. Dietary Omni-Input Search Bar (`FoodSearchTab` & `FoodSearchModal`)
- **Applied UX Law**: **Jakob’s Law** & **Aesthetic-Usability Effect**
- **Current Deficit**: While the 5-in-1 auto-classification (Name, EAN Barcode, Store Link, Recipe, Shared List) is highly capable, users unfamiliar with universal omni-inputs expect separate form fields or explicit mode tabs. Without immediate visual feedback before submission, users hesitate to paste complex URLs.
- **Cognitive Impact**: User anxiety regarding whether a pasted Albert Heijn, Jumbo, or recipe URL will break, fail, or pollute their food log.
- **Severity Rating**: **Medium**
- **Actionable Remediation**:
  - Render live dynamic detection chips (`[ 🍲 Recipe Link Detected ]`, `[ 🛒 Shared List Detected ]`) with an explicit "Fetch List" / "Resolve & Add" action banner.
  - Implement instant clipboard paste (`onPaste` event listener) to eliminate typing friction.

---

### 3. Logbook & Session Master-Detail View (`SessionDetailCard` & `WorkoutHistory`)
- **Applied UX Law**: **Peak-End Rule** & **Zeigarnik Effect**
- **Current Deficit**: After completing a workout or reviewing historical logs, the session summary delivers quantitative tables (sets, reps, volume, coach notes) but lacks an emotional or rewarding "peak" (e.g., celebration of personal records, volume milestones, or streak completions). The empty state merely displays "No Workouts Yet".
- **Cognitive Impact**: Decreased long-term dopamine reinforcement. Athletes miss out on habit loops (Cue $\rightarrow$ Routine $\rightarrow$ Reward), lowering 30-day retention.
- **Severity Rating**: **Medium**
- **Actionable Remediation**:
  - Introduce a celebratory Workout Completion Modal highlighting 1RM PRs, total tonnage lifted, and elapsed time with confetti particle feedback.
  - Add a weekly consistency tracker (7-day activity circles) at the top of the Logbook view.

---

### 4. Recovery & Readiness Assessment (`RecoveryAndReadinessCard`)
- **Applied UX Law**: **Miller’s Law** ($7 \pm 2$ chunks) & **Gestalt Law of Proximity**
- **Current Deficit**: Combining Sleep (hrs), Energy (1–10), Session Notes (textarea), Bodyweight (kg input), and Progress Photos (camera + gallery picker) in a single open card overloads the initial pre-workout phase.
- **Cognitive Impact**: Athletes want to start lifting immediately; confronting them with 5 simultaneous biometric forms creates friction before the first rep is logged.
- **Severity Rating**: **High**
- **Actionable Remediation**:
  - Collapse `Recovery & Readiness` by default on app launch, showing compact summary badges (`💤 8h`, `⚡ 7/10`, `⚖️ 85kg`).
  - Persist the expanded/collapsed state to `localStorage` so the UI remembers the athlete's preference.

---

### 5. Settings, Export & Peer Sharing (`SettingsModal` & `SettingsBackupSection`)
- **Applied UX Law**: **Law of Common Region** & **Error Prevention (NN/g Heuristic #5)**
- **Current Deficit**: Prior to unique ID remapping, importing a backup or shared routine file risked collision or overwriting active user routines. Visually, data backup, account switching, and visibility settings were stacked in one dense container without clear separation between destructive and non-destructive actions.
- **Cognitive Impact**: Fear of permanent data loss or accidental profile overwrites during backup/restore operations.
- **Severity Rating**: **Critical**
- **Actionable Remediation**:
  - Implement dynamic unique ID remapping on every import to guarantee cross-account safety.
  - Provide granular export scopes: "Share Routines & Exercises Only", "Full Backup", and customizable checkbox selections.

---

### 6. Navigation & Mobile History Loop (`App.tsx` & `AuthContext.tsx`)
- **Applied UX Law**: **NN/g Heuristic #3: User Control & Freedom** & **Principle of Least Surprise**
- **Current Deficit**: On mobile devices, swiping back 1–3 times navigated through browser history entries left behind by OAuth redirects, landing users back on the login screen while still authenticated.
- **Cognitive Impact**: Frustration and confusion over whether the session was terminated or logged out.
- **Severity Rating**: **High**
- **Actionable Remediation**:
  - Sanitize `window.history` via `replaceState` upon authentication.
  - Implement a root-screen back-trap ensuring mobile back gestures stay on the active tab or allow the OS to background the app.

---

# PART 2: REMEDIATION & FEATURE SPECIFICATION

---

### 2.1 Quick-Win UI Fixes (Immediate Execution)

#### Active Workout Screen
- **Row Architecture**: Enforce single-line set rows with minimal unified steppers (`[-] [ 20 kg ] [+]`).
- **Touch Targets**: Ensure buttons maintain minimum 40px touch boundaries with `touch-action: manipulation` to eliminate 300ms tap delay on mobile Safari/Chrome.
- **Contrast**: Upgrade all secondary labels and unit badges from `#555` to `#9ca3af` (minimum `5.8:1` contrast ratio).

#### Dietary Omni-Bar
- **Detection Feedback**: Display format detection chips (`[ 🍲 Recipe Link Detected ]`, `[ 🛒 Shared List Detected ]`) with an explicit "Go / Resolve" CTA button inside the input field.
- **Paste Event**: Add `onPaste` event listeners to resolve clipboard links without requiring a manual Enter keypress.

#### Recovery & Readiness Accordion
- **Initial State**: Initialize in **collapsed state by default**, displaying compact summary badges (`💤 8h`, `⚡ 7/10`, `⚖️ 85kg`).
- **Persistence**: Save expanded/collapsed preference to `localStorage` (`workout_recovery_expanded`).

---

### 2.2 UX Flow & Structural Changes

```mermaid
flowchart LR
    A[Launch App] --> B[Routines Overview (All Collapsed)]
    B --> C[Tap Active Exercise]
    C --> D[Log Set via 1-Tap Checkmark (✓)]
    D --> E[Auto-Advance Focus to NEXT Set]
    E --> F[Workout Complete -> Peak Summary Modal]
```

1. **Information Chunking (Miller's Law)**:
   - Divide session flow into 3 clear phases: **Pre-Workout Readiness** (collapsed) $\rightarrow$ **Active Exercise Sets** (one active focus at a time) $\rightarrow$ **Post-Workout Summary**.
2. **Simplified Decision Paths (Hick's Law)**:
   - Hide inactive exercises and historical reference logs until the user taps the specific exercise header.

---

### 2.3 Proposed Features & Enhancements

#### 1. Workout Completion "PR Celebration" Modal
- **Target Psychological Principle**: **Peak-End Rule**
- **User Story**: *As an athlete finishing a session, I want to see a celebratory recap highlighting my heaviest lift, total volume lifted, and new PRs so that I leave the workout feeling accomplished.*
- **Specification**:
  - Celebratory modal with confetti particle animation (`canvas-confetti`).
  - Key stats: Total Volume (kg), Sets Completed, Time Elapsed, and highlighted **"🏆 NEW 1RM PR"** badges.
  - 1-tap button: `"Share Workout Summary (Image/Text)"`.

#### 2. Weekly Consistency Streak Tracker & Activity Heatmap
- **Target Psychological Principle**: **Goal-Gradient Effect & Zeigarnik Effect**
- **User Story**: *As a lifter, I want to see my weekly workout streak and completed days at the top of my logbook so that I stay motivated not to break the habit chain.*
- **Specification**:
  - 7-day pill indicator (`[M] [T] [W] [T] [F] [S] [S]`) at the top of the Logbook view.
  - Completed days render with a neon green glow (`#C0FF00`); planned/upcoming days show subtle dashed borders.
  - Displays `"🔥 4-Week Consistency Streak"`.

#### 3. Rest Timer Auto-Start & Vibration Signal
- **Target Psychological Principle**: **Feedback Loop & Mental Offloading**
- **User Story**: *As a lifter in a busy gym, I want my rest timer to automatically start when I tap [ ✓ ] on a set and buzz my phone when rest ends so that I never lose track of rest intervals.*
- **Specification**:
  - Checking a set row automatically triggers the countdown timer in the background.
  - Invokes `navigator.vibrate([200, 100, 200])` and updates `document.title` (`(0:45) Rest | Workout Tracker`) upon expiration.
