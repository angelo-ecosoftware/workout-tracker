# Workout Tracker Architecture & Component Structure

This document defines the modular domain-driven and reusable component folder structure for the Workout Tracker application.

---

## 📁 Directory Hierarchy

```text
src/
├── components/
│   ├── ui/                        # 🧩 Universal / Atomic Reusable UI Components
│   │   ├── ConfirmModal.tsx       # Generic confirm / alert dialog
│   │   ├── ErrorBoundary.tsx      # App-level error wrapper
│   │   ├── Header.tsx             # Main navigation & status bar
│   │   ├── Button.tsx             # (Reusable buttons if extracted)
│   │   └── Card.tsx               # (Reusable theme card wrappers)
│   │
│   ├── modals/                    # 🪟 App-Level Dialogs & Configuration Modals
│   │   ├── ProfileModal.tsx       # User profile & target setup
│   │   ├── SettingsModal.tsx      # System settings, backups, dark mode
│   │   ├── WelcomeModal.tsx       # Onboarding & intro modal
│   │   └── RoutineEditorModal.tsx # Routine creator & editor
│   │
│   ├── workout/                   # 🏋️ Workout & Routine Domain Components
│   │   ├── WorkoutDayTracker.tsx  # Main routine tracker container
│   │   ├── WorkoutHistory.tsx     # Past session history & logs
│   │   ├── PublicSessionView.tsx  # Public shareable session view
│   │   ├── ExerciseSearchPicker.tsx # Search & picker dropdown
│   │   ├── ExerciseProgressionCard.tsx # 1RM & progression stats
│   │   ├── WgerExerciseInfo.tsx   # Wger API exercise info guide
│   │   └── assisted/              # ⏱️ Assisted Set/Timer System
│   │       ├── AssistedTimedTracker.tsx
│   │       ├── AssistedSetCard.tsx
│   │       ├── AssistedRestTimerCard.tsx
│   │       └── AssistedCompletedCard.tsx
│   │
│   ├── dietary/                   # 🥗 Nutrition & Meal Tracking Domain
│   │   ├── DietaryView.tsx        # Main dietary dashboard
│   │   ├── DietarySandbox.tsx     # Custom food sandbox & calculator
│   │   ├── MealSection.tsx        # Extracted meal accordion/cards
│   │   ├── MacroProgressBar.tsx   # Extracted progress gauges
│   │   └── FoodSearchModal.tsx    # Extracted food lookup modal
│   │
│   ├── insights/                  # 📊 Analytics & Biometrics Domain
│   │   ├── InsightsView.tsx       # Trends, volume, charts & graphs
│   │   ├── BiometricCard.tsx      # Weight & body measurements
│   │   └── VolumeChart.tsx        # Workout load visualizer
│   │
│   └── auth/                      # 🔐 Authentication Components
│       └── LoginScreen.tsx        # Auth form & provider login
│
├── hooks/                         # 🪝 Reusable Domain & State Hooks
│   ├── useAssistedTracker.ts      # Active workout set & rest timer machine
│   ├── useDietary.ts              # Meal & macro management hook
│   ├── useWorkoutSession.ts       # Active workout sheet & logs hook
│   └── useDebounce.ts             # Generic utility hook
│
├── context/                       # 🌐 Global Application Contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── PWAContext.tsx
│
├── lib/                           # ⚙️ Data Layer, APIs, Storage & DB
│   ├── db/                        # Drizzle / Supabase DB CRUD modules
│   │   ├── workouts.ts
│   │   ├── sessions.ts
│   │   ├── users.ts
│   │   ├── biometrics.ts
│   │   └── backup.ts
│   ├── bakeryPluDictionary.ts     # Pre-seeded PLU dictionary & scale barcode matcher
│   ├── barcodeService.ts          # Multi-tier barcode & hive-mind resolver
│   ├── storeBranding.ts           # Store badges, clean titles & deep linking
│   ├── dietaryData.ts
│   ├── foodSearch.ts
│   ├── exerciseSearch.ts
│   ├── insightsEngine.ts
│   ├── storage.ts
│   ├── supabase.ts
│   └── supabaseData.ts
│
├── utils/                         # 🛠️ Pure Helpers & Utilities
│   ├── sound.ts                   # Audio & haptic alarms
│   ├── imageCompressor.ts         # Image compression
│   ├── draftPhotoStorage.ts       # Photo cache & IndexedDB
│   └── offlineQueue.ts            # PWA offline sync queue
│
├── types/ or models.ts            # 🏷️ TypeScript Types & Schemas
└── data/                          # 📦 Static Datasets (exerciseCatalog.ts)
```

---

## 🎯 Architecture Principles
1. **Zero CSS/Layout Regressions**: Sub-components must maintain 1:1 Tailwind CSS classes, wrapper element semantics, and exact styling.
2. **Domain Encapsulation**: Components are organized by feature domain (`workout`, `dietary`, `insights`, `auth`) with shared items in `ui` and `modals`.
3. **Small, Focused Files**: Each subcomponent and custom hook targets under ~200 lines for readability and maintainability.
4. **Isolated Business Logic**: Business logic, intervals, and state machines are placed in `hooks/` to keep UI components purely presentational.
