# Workout Tracker Roadmap & Edge Cases TODO

This document tracks identified architectural improvements, edge case handling, analytics features, and performance optimizations.

---

## 1. Timing & Gym Tracking Edge Cases

- [x] **Wall-Clock Time Delta for Background/Locked Screen Resiliency**
  - **Issue**: Standard `setInterval` ticks throttle or pause when phone screens lock or users switch apps (e.g. Spotify).
  - **Action**: Refactor timers in `AssistedTimedTracker.tsx` to compute elapsed time using `Date.now()` target end times and `visibilitychange` listeners rather than naive tick counters.

- [x] **Workout Session Auto-Save & Abandonment Recovery**
  - **Issue**: Accidental tab closures, reloads, or device crashes mid-workout lose in-progress sets and entry timestamps.
  - **Action**: Persist in-progress workout draft state to `localStorage` / `IndexedDB`.
  - **Action**: Implement a timeout threshold (e.g., auto-discard or prompt to restore sessions older than 3 hours).

---

## 2. Metric Calculations & Exercise Types

- [ ] **Bodyweight Exercises Volume Tracking**
  - **Context**: Working sets for unweighted bodyweight movements (pull-ups, dips, push-ups) are logged with `0 kg` added weight.
  - **Action**: Track progression via **Total Reps** so users don't see $0\text{ kg}$ total volume on bodyweight days.

---

## 3. Insights & Analytics Roadmap

- [x] **Per-Exercise Progressive Overload Curves**
  - **Action**: Add individual exercise drill-down views showing estimated 1RM trajectory, max weight over time, and rep volume trends across 30/60/90 days.

- [ ] **Muscle Group Fatigue & Weekly Set Distribution**
  - **Action**: Categorize exercises by primary/secondary muscle groups (Chest, Back, Legs, Shoulders, Arms, Core) and visualize weekly set volume against standard hypertrophy targets (10–20 sets/week).

- [x] **Rest Interval Discipline Analysis**
  - **Action**: Compare actual recorded rest times against target rest intervals to highlight pacing consistency and rest discipline.

---

## 4. Storage, PWA Offline Experience & Media Optimization

- [ ] **Client-Side Image Compression**
  - **Issue**: Modern mobile camera photos range from 3–8 MB, quickly consuming Supabase storage quotas and slowing down uploads on gym cellular networks.
  - **Action**: Compress images via HTML Canvas / `browser-image-compression` to `< 500 KB` WebP/JPEG before uploading to Supabase `media` bucket.

- [ ] **Offline Sync & Queueing (PWA Resiliency)**
  - **Issue**: Gym basements with poor cellular reception fail Supabase completion requests.
  - **Action**: Queue offline session completions and set logs in `IndexedDB` and trigger background sync once connectivity is restored via `navigator.onLine` and `window.addEventListener('online')`.
