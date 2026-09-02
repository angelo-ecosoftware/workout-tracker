# Entity Relationship Diagram (ERD)

This document provides a comprehensive overview of the database schema, all entities, attributes, data types, keys, and entity relationships for the Workout Tracker application.

---

## 📊 Visual Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        text user_id UK
        text email
        text name
        int4 last_completed_workout_order
        int4 max_workout_order
        jsonb last_set_summary_per_exercise
        timestamptz created_at
        jsonb metrics
    }

    workouts {
        text id PK
        text user_id FK
        text name
        int4 order
        _text exercise_ids
        timestamptz created_at
    }

    exercises {
        text id PK
        text user_id FK
        text name
        text type
        int4 target_sets
        int4 target_rep_min
        int4 target_rep_max
        timestamptz created_at
    }

    workout_exercises {
        uuid id PK
        text user_id FK
        text workout_id FK
        text exercise_id FK
        int4 sort_order
        timestamptz created_at
    }

    sessions {
        text id PK
        text user_id FK
        text workout_id FK
        text status
        numeric sleep_hours
        int4 energy_score
        timestamptz started_at
        timestamptz completed_at
        text notes
        jsonb photos
    }

    sets {
        text id PK
        text session_id FK
        text user_id FK
        text exercise_id FK
        int4 set_number
        numeric weight
        int4 reps
        int4 rir
        int4 duration_seconds
        int4 pain_score
        timestamptz logged_at
        timestamptz started_at
        int4 rest_seconds
    }

    workout_drafts {
        uuid id PK
        uuid user_id FK
        text workout_id FK
        jsonb inputs
        numeric sleep_hours
        int4 energy_score
        text notes
        timestamptz session_date
        timestamptz updated_at
    }

    system {
        text id PK
        text seed_version
        timestamptz updated_at
    }

    %% Relationships
    users ||--o{ workouts : "owns"
    users ||--o{ exercises : "creates"
    users ||--o{ sessions : "logs"
    users ||--o{ sets : "performs"
    users ||--o{ workout_drafts : "saves"
    users ||--o{ workout_exercises : "configures"

    workouts ||--o{ workout_exercises : "contains"
    exercises ||--o{ workout_exercises : "referenced_by"

    workouts ||--o{ sessions : "executed_in"
    workouts ||--o{ workout_drafts : "drafted_for"

    sessions ||--o{ sets : "contains"
    exercises ||--o{ sets : "tracked_in"
```

---

## 🗄️ Tables & Attributes Specification

### 1. `users`
Represents athlete user accounts and biometrics.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | **PK** | Internal unique identifier |
| `user_id` | `text` | **Unique / Indexed** | Supabase auth UID mapping |
| `email` | `text` | | User email address |
| `name` | `text` | | Athlete display name |
| `last_completed_workout_order` | `int4` | Default `0` | Order index of the last completed workout split |
| `max_workout_order` | `int4` | Default `3` | Maximum split order before cycling back to Day 1 |
| `last_set_summary_per_exercise` | `jsonb` | | Fast write-through cache of latest exercise benchmarks |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of account creation |
| `metrics` | `jsonb` | | Athlete biometrics (height, weight, DOB, gender, goals, BMI) |

---

### 2. `workouts`
Represents workout splits / routines (e.g., Day 1 Push, Day 2 Pull, Day 3 Legs).

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `text` | **PK** | Workout routine identifier (e.g. `w_1`) |
| `user_id` | `text` | **FK** $\rightarrow$ `users.user_id` | Owner athlete ID (or null for global defaults) |
| `name` | `text` | | Name of the workout routine |
| `order` | `int4` | | Sequence order index within the split cycle (1, 2, 3...) |
| `exercise_ids` | `_text` (`text[]`) | | Array of exercise IDs included in this workout |
| `created_at` | `timestamptz` | Default `now()` | Creation timestamp |

---

### 3. `exercises`
Defines individual exercises, target parameters, and measurement types.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `text` | **PK** | Exercise identifier (e.g. `ex_bench`) |
| `user_id` | `text` | **FK** $\rightarrow$ `users.user_id` | Owner athlete ID (or null for default exercises) |
| `name` | `text` | | Exercise name (e.g. "Barbell Bench Press") |
| `type` | `text` | | Movement type: `'strength'` or `'timed'` |
| `target_sets` | `int4` | | Recommended target set count |
| `target_rep_min` | `int4` | | Lower bound of rep target range |
| `target_rep_max` | `int4` | | Upper bound of rep target range |
| `created_at` | `timestamptz` | Default `now()` | Creation timestamp |

---

### 4. `workout_exercises`
Relational junction table connecting workouts to their ordered list of exercises.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | **PK** | Unique relation record ID |
| `user_id` | `text` | **FK** $\rightarrow$ `users.user_id` | User identifier |
| `workout_id` | `text` | **FK** $\rightarrow$ `workouts.id` | Target workout ID |
| `exercise_id` | `text` | **FK** $\rightarrow$ `exercises.id` | Target exercise ID |
| `sort_order` | `int4` | | Display / execution sequence order |
| `created_at` | `timestamptz` | Default `now()` | Creation timestamp |

---

### 5. `sessions`
Logs workout execution instances (both in-progress and completed).

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `text` | **PK** | Session identifier (e.g. `s_1714000000000`) |
| `user_id` | `text` | **FK** $\rightarrow$ `users.user_id` | Athlete who performed the session |
| `workout_id` | `text` | **FK** $\rightarrow$ `workouts.id` | Workout routine executed |
| `status` | `text` | | Session state: `'in_progress'` or `'completed'` |
| `sleep_hours` | `numeric` | | Readiness sleep duration (hours) |
| `energy_score` | `int4` | | Athlete energy rating (1–5) |
| `started_at` | `timestamptz` | Default `now()` | Workout start timestamp |
| `completed_at` | `timestamptz` | Nullable | Workout finish timestamp |
| `notes` | `text` | Nullable | Session reflection / workout notes |
| `photos` | `jsonb` | Nullable | Array of uploaded progress photo URLs |

---

### 6. `sets`
Individual sets executed during a workout session.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `text` | **PK** | Set identifier (e.g. `set_1714000000000_1`) |
| `session_id` | `text` | **FK** $\rightarrow$ `sessions.id` | Associated workout session |
| `user_id` | `text` | **FK** $\rightarrow$ `users.user_id` | Athlete identifier |
| `exercise_id` | `text` | **FK** $\rightarrow$ `exercises.id` | Exercise performed |
| `set_number` | `int4` | | Sequential set index (1, 2, 3...) |
| `weight` | `numeric` | Nullable | Weight lifted in kg (`null` for timed exercises) |
| `reps` | `int4` | Nullable | Repetitions completed (`null` for timed exercises) |
| `rir` | `int4` | Nullable | Reps in Reserve (0–4) |
| `duration_seconds` | `int4` | Nullable | Duration in seconds (for timed holds / planks) |
| `pain_score` | `int4` | Nullable | Pain / joint discomfort score (0–10) |
| `logged_at` | `timestamptz` | Default `now()` | Timestamp when set was recorded |
| `started_at` | `timestamptz` | Nullable | Start timestamp for assisted set execution |
| `rest_seconds` | `int4` | Nullable | Actual rest duration in seconds before next set |

---

### 7. `workout_drafts`
Local-first / autosaved draft sessions in progress.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `uuid` | **PK** | Draft identifier |
| `user_id` | `uuid` | **FK** $\rightarrow$ `users.id` | Athlete identifier |
| `workout_id` | `text` | **FK** $\rightarrow$ `workouts.id` | Workout routine being drafted |
| `inputs` | `jsonb` | | Uncommitted set inputs and field state |
| `sleep_hours` | `numeric` | Nullable | Pre-workout readiness sleep hours |
| `energy_score` | `int4` | Nullable | Pre-workout energy rating |
| `notes` | `text` | Nullable | Draft workout notes |
| `session_date` | `timestamptz` | Nullable | Scheduled or started date |
| `updated_at` | `timestamptz` | Default `now()` | Last autosave timestamp |

---

### 8. `system`
Global system state and seeding tracking.

| Attribute | Data Type | Constraint | Description |
|---|---|---|---|
| `id` | `text` | **PK** | System config key (e.g. `'singleton'`) |
| `seed_version` | `text` | | Applied database schema / seed version |
| `updated_at` | `timestamptz` | Default `now()` | Last updated timestamp |

---

## 🔗 Foreign Key & Cardinality Summary

1. **`users` (1) $\rightarrow$ (N) `workouts`**: A user can create and customize multiple workout routines.
2. **`users` (1) $\rightarrow$ (N) `exercises`**: A user can create custom exercises alongside defaults.
3. **`users` (1) $\rightarrow$ (N) `sessions`**: A user logs numerous workout sessions over time.
4. **`users` (1) $\rightarrow$ (N) `sets`**: Every recorded set is attributed directly to an athlete.
5. **`workouts` (1) $\rightarrow$ (N) `workout_exercises` $\leftarrow$ (1) `exercises`**: Many-to-Many junction connecting routines with ordered exercises.
6. **`workouts` (1) $\rightarrow$ (N) `sessions`**: Multiple workout execution logs reference a routine template.
7. **`sessions` (1) $\rightarrow$ (N) `sets`**: A session contains multiple completed sets across various exercises.
8. **`exercises` (1) $\rightarrow$ (N) `sets`**: An exercise has historical performance records across sessions.
9. **`workouts` (1) $\rightarrow$ (N) `workout_drafts`**: Temporary autosaved work-in-progress state.
