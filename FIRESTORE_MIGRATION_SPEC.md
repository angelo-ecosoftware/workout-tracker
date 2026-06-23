# Minimal Gym Journal — Firestore Migration Specification

## 1. Full Firestore Schema Design

### Collections & Document Structure

**`users` (Collection)**
Stores user profile, progression state, and performance cache.
*   **Document ID:** `userId` (from Firebase Auth)
*   **Fields:**
    *   `email`: string
    *   `name`: string
    *   `lastCompletedWorkoutOrder`: number (Strict linear sequencing: `current + 1`)
    *   `maxWorkoutOrder`: number (Required: Defines the maximum order sequence before looping)
    *   `lastSetSummaryPerExercise`: map (Strict write-through cache updated ONLY on session completion)
        *   `[exerciseId]`: object
            *   `lastWeight`: number
            *   `lastReps`: number
            *   `lastSessionId`: string
    *   `createdAt`: timestamp

**`workouts` (Collection)**
Global/static templates for the 3-day split (or any structure).
*   **Document ID:** Auto-generated or predefined (e.g., `day1_upper_v_taper`)
*   **Fields:**
    *   `name`: string (e.g., "Day 1 - Upper (V-Taper)")
    *   `order`: number (1, 2, 3... used for rotation logic)
    *   `exerciseIds`: array of strings (References to documents in the `exercises` collection)

**`exercises` (Collection)**
The global, single source of truth for all exercises. Prevents data duplication.
*   **Document ID:** Auto-generated
*   **Fields:**
    *   `name`: string (e.g., "Lat Pulldown")
    *   `type`: string (`"strength"` or `"timed"`)

**`sessions` (Collection)**
Represents one instance of checking into the gym and executing a workout. Lightweight container.
*   **Document ID:** Auto-generated (`sessionId`)
*   **Fields:**
    *   `userId`: string (Reference to user)
    *   `workoutId`: string (Reference to workout template)
    *   `status`: string (`"in_progress"` | `"completed"`)
    *   `startedAt`: timestamp
    *   `completedAt`: timestamp | null

**`sets` (Collection)**
The atomic unit of performance logging.
*   **Document ID:** Auto-generated (`setId`)
*   **Fields:**
    *   `sessionId`: string
    *   `userId`: string (Needed for fast composite index queries by user & exercise)
    *   `exerciseId`: string
    *   `setNumber`: number
    *   `weight`: number | null (Only if type == "strength")
    *   `reps`: number | null (Only if type == "strength")
    *   `rir`: number | null (Optional)
    *   `durationSeconds`: number | null (Only if type == "timed")
    *   `painScore`: number (0-10, optional)
    *   `loggedAt`: timestamp

---

## 2. Mapping from Old SQL → Firebase

| Old PostgreSQL/Drizzle Concept | New Firestore Concept | Explanation |
| :--- | :--- | :--- |
| **`users` Table** | `users` Collection | Direct mapping, but `cycleIndex` is replaced by `lastCompletedWorkoutOrder` for robust dynamic rotation. Includes `lastSetSummaryPerExercise` for cached progression. |
| **`workouts` Table** | `workouts` Collection | Becomes a static template. Does not embed nested exercise metadata. |
| **`exercises` Table** | `exercises` Collection | Acts as the global library. Removed `workout_id` foreign key. Workouts now hold an array of `exerciseIds`. |
| **`sessions` Table** | `sessions` Collection | No longer stores deep JSON nested exercise arrays. Purely a structural header. |
| **`sets` Table** | `sets` Collection | No longer relies on `JOIN` logic. We will query sets strictly by `sessionId` on the client. |

---

## 3. Data Flow

### A. Session Creation Flow
1. **App opens**: Fetch `users/{userId}` to get `lastCompletedWorkoutOrder` and `maxWorkoutOrder`. All values must be explicitly defined.
2. **Determine Next Workout**: Calculate the next index using linear sequencing:
   *   `nextWorkoutOrder = lastCompletedWorkoutOrder + 1`
   *   `IF nextWorkoutOrder > maxWorkoutOrder THEN nextWorkoutOrder = 1`
   *   *Integrity Check:* If the workout order sequence is missing or there are gaps, the system MUST stop rotation and throw `WORKOUT_ORDER_CORRUPTION`.
3. **Start Session**: Create a new document in the `sessions` collection with `status: "in_progress"`.
4. **Load Exercises**: Using the `exerciseIds` array from the chosen workout, fetch documents from the `exercises` collection.

### B. Set Logging Flow
1. **User completes a set**: The user inputs weight/reps (strength) or duration (timed) in the UI.
2. **Immediate Save**: Create a new document in the `sets` collection with the corresponding `sessionId`, `exerciseId`, and performance data.
3. **Offline Support**: Firestore's local cache ensures this logs instantly (<30s UX requirement) even if reception is poor in the gym.

### C. Progression Evaluation Flow (Application Layer)
1. **Hierarchical Lookup**: System MUST follow this strict deterministic fallback for lookup:
    - *PRIMARY:* Check `lastSetSummaryPerExercise[exerciseId]` in the user profile cache.
    - *SECONDARY:* Check the latest completed session summary (if cache is known stale).
    - *TERTIARY:* Query `sets` collection directly (ONLY as a recovery operation).
2. **Evaluate in-memory**: 
    - *Strength:* If the cached `lastReps` hit the max reps, the application prompts a weight increase recommendation based on `lastWeight` for today.
    - *Timed:* If the duration was comfortably hit, the application suggests a longer duration.
3. **Strict Cache Consistency Rule**: `lastSetSummaryPerExercise` MUST be treated as a write-through cache. It is updated ONLY when a session is marked `completed`. It MUST NEVER be updated during live set logging. If cache and session mismatch, session data is the source of truth, and the cache MUST be completely overwritten (built from source).
4. **No Schema Rules:** Progression logic is strictly evaluated inside the frontend state. Firestore only stores the raw performance numbers.

---

## 4. Key Architectural Differences (SQL vs Firestore)

*   **No Joins, No Foreign Keys:** In SQL, you'd `JOIN sessions ON sets.session_id`. In Firestore, we simply query `collection("sets").where("sessionId", "==", currentSessionId)`. The client pieces the data together.
*   **Normalized Array References:** Instead of a junction table for many-to-many `workouts_exercises`, workouts store an array of `exerciseIds`. This represents a fundamental shift to document scaling where limits (like maximum array size) are perfectly fine since a workout rarely exceeds 20 exercises.
*   **Separation of Engine vs DB:** We no longer rely on complex triggers or backend ORM queries to sort out progression. Firestore acts solely as a persistent, offline-first JSON store. Progression rules, RIR evaluation, and rotation logic live 100% in the application execution engine.
*   **Offline-First Native:** Moving away from a Postgres backend allows the React / mobile layer to continue logging sets uninterrupted deep in a gym with no valid internet—it will automatically sync when connected.

---

## 5. Firestore Optimizations & Indexing Strategy

### A. Required Composite Indexes
To support performant reads at scale and minimize latency, the following composite indexes must be configured in Firebase:

*   **`sets` collection:**
    *   `(exerciseId ASC, sessionId ASC)` — For historical performance scans.
    *   `(userId ASC, exerciseId ASC)` — For fast progression queries across sessions without scanning all users.
    *   `(sessionId ASC, setNumber ASC)` — To fetch sets in explicit order for a given workout.

### B. Data Integrity Contracts (No Invalid States)
Strict validation rules MUST be enforced on all writes:
*   **`sets` collection:**
    *   MUST NOT contain both `weight` AND `durationSeconds`.
    *   Enforce `strength`: `weight` + `reps` only.
    *   Enforce `timed`: `durationSeconds` only.
*   **`sessions` collection:**
    *   MUST NOT be marked completed if no sets exist.
*   **`users` collection:**
    *   MUST always have `lastCompletedWorkoutOrder` and `maxWorkoutOrder` defined.

### C. System Failure Behavior (Hard Fail Conditions)
The system MUST explicitly handle unexpected states without attempting dangerous automatic recovery:
*   **Missing Workout Order Sequence:** STOP SYSTEM -> throw `WORKOUT_ORDER_CORRUPTION`.
*   **Missing Firestore Index:** STOP QUERY -> throw `FIRESTORE_INDEX_MISSING_ERROR`.
*   **Corrupted Progression Cache:** REBUILD FROM SOURCE OF TRUTH (query `sets` collection to rebuild).
*   **Invalid Set Payload:** REJECT WRITE (enforce at application/rule layer).

### D. Summary of Optimization & Hardening Fixes
*   **Fix 1: Safe Linear Workout Sequencing**: Moved to a strict `+ 1` sequenced rotation. `maxWorkoutOrder` dictates the boundary limit explicitly. Modulo math is removed. Broken integrity intentionally throws a hard error.
*   **Fix 2: Write-Through Progression Caching**: The `lastSetSummaryPerExercise` acts as a read-optimized primary cache, strictly written only at the end of a session. Scanning full collection history is explicitly labeled as a Tertiary fallback (recovery only), ensuring `O(1)` load time and cost containment.
*   **Fix 3: Strong Query Guarantees**: Any lookup lacking a predefined composite index will immediately halt, signaling a developer error via `FIRESTORE_INDEX_MISSING_ERROR`.
