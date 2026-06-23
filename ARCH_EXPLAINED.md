# Architecture Explained: Minimal Gym Journal

## 1. App Overview
The **Minimal Gym Journal** is a streamlined, friction-free personal fitness tracking application focused on hypertrophy and strength progression. It eliminates unnecessary social features and complex planning in favor of raw input efficiency, automatic weight progression suggestions, and localized session tracking, heavily utilizing Firebase for real-time syncing and persistence.

## 2. Tech Stack & Infrastructure
- **Frontend Framework**: React 18+ powered by Vite.
- **Styling**: Tailwind CSS for responsive, mobile-first utility styling.
- **Icons**: Lucide React.
- **Backend & Database**: Firebase (Authentication & Firestore).
- **Hosting**: Designed to run as a single-page application (SPA).
- **Language**: TypeScript for strict type-safety across models and engine logic.

## 3. Core Architectural Modules

### 3.1. Data Models (`src/types.ts` / `src/models.ts`)
Defines the strict shapes of the data, seamlessly translating between the frontend state and Firestore documents:
- `UserProfile`: Contains user settings and identity.
- `Workout`: A template defining a sequence of `Exercise`s.
- `Exercise`: Contains details about target sets, target reps/time, and tracks the `lastWeight` and `lastReps` to assist with progressive overload.
- `Session`: A distinct instance of a workout being executed on a specific date. Can be marked as `completed: true` or `false` (active).
- `WorkoutSet`: An individual logged set within a Session, encompassing type (strength vs. timed), weight, reps, RIR (Reps in Reserve), duration, difficulty, and pain score.

### 3.2. Firebase Data Access Layer (`src/lib/firebaseData.ts`)
Wrapper around the Firebase SDK that abstracts Firestore complexity. It exposes asynchronous functions (e.g., `fetchDashboardData`, `startSession`, `logSet`, `deleteSessions`, `hasActiveSession`) so UI components don't interact with raw Firestore queries directly. It supports seeding initial workout templates for new users.

### 3.3. Core Logic Engine (`src/engine.ts`)
A pure TypeScript utility file that encapsulates the business logic, keeping it out of the UI components:
- **SessionEngine**: Validates and prepares active sessions.
- **SetLogger**: Validates valid strength (kg/reps) or timed (seconds) set inputs before allowing them to be written to the database.
- **ProgressionEngine**: Computes whether a user should increase their weight (e.g., +2.5kg) on the next session based on if they hit their maximum rep targets with adequate RIR.

### 3.4. State & Authentication (`src/context/AuthContext.tsx`)
A React Context provider wrapping the application that monitors Firebase's `onAuthStateChanged` hook. It securely propagates the `user` object to all child components, handles Google Sign-In and standard email/password authentication, and handles protected routing.

### 3.5. Key UI Components (`src/components/`)
- **App**: Main router that conditionally renders `Auth` or the application shell (`Dashboard`, `WorkoutDayTracker`, `WorkoutHistory`).
- **Auth**: Firebase-powered login / signup UI.
- **Dashboard**: Displays available workout routines and high-level progression metrics.
- **WorkoutDayTracker**: The core functional view where users track active workouts in real-time. It includes a robust `loadWorkflowState` mechanism to recover active, unfinished workout sessions if the app is closed or refreshed mid-workout.
- **WorkoutHistory**: A grid/list layout visualizing completed sessions, integrated with batch deletion and modal confirmation.

---

## 4. User Flow: The "Happy Path"

Here is standard, frictionless flow a user takes from onboarding to completing a workout and signing out.

### Step 1: Authentication (Login)
1. The user navigates to the application.
2. The `AuthContext` detects no active session and renders the `Auth` component.
3. The user signs in via Google or inputs their email and password.
4. Firebase Auth validates the credentials. 
5. The `AuthContext` globally updates the `user` state, re-rendering the app to show the `Dashboard`.

### Step 2: Selecting a Workout
1. On the `Dashboard`, the app fetches available `Workout` templates from Firestore. If it's a new user, default templates are seeded automatically.
2. The user sees a list of their routines (e.g., "Push Day", "Pull Day").
3. The user clicks on "Push Day".
4. The router mounts the `WorkoutDayTracker` component. The `loadWorkflowState` routine checks for any interrupted sessions. If none exist, `firebaseData.startSession` creates a new `Session` document in Firestore marking the start of a new workout.

### Step 3: Executing and Logging Sets (Creating a Record)
1. The `WorkoutDayTracker` displays exercises sequentially (e.g., "Bench Press", "Overhead Press").
2. The UI hydrates the inputs with the *last used weight in kg* by checking the database cache.
3. The user performs their first set, achieving 10 reps at 60kg with 2 RIR.
4. The user taps "Log Set".
5. `SetLogger` validates the input payload.
6. A new `WorkoutSet` document is written to the `sets` collection in Firestore under the active `Session` ID.
7. The locally cached active sets are updated, and the `ProgressionEngine` evaluates the input. It displays an in-line UI suggestion if a progression target is hit.

### Step 4: Finishing the Workout
1. The user seamlessly logs sets for the remaining exercises.
2. Once the final set is complete, the user clicks "Finish Workout" at the bottom of the screen.
3. The `Session` document in Firestore is updated with `completed: true` and a `completedAt` timestamp.
4. The app routes the user back out to the `Dashboard`.

### Step 5: Reviewing the Record
1. The user navigates to the **Training History** tab.
2. The `WorkoutHistory` component queries Firestore for all completed sessions.
3. Their just-completed "Push Day" appears at the top of the timeline. They can expand it to see exact sets, weight, reps, and RIR achieved. They can also selectively delete sessions here.

### Step 6: Logout
1. The user clicks "Sign Out" in the sidebar/navigation.
2. `firebase.auth().signOut()` is called.
3. The `AuthContext` clears the active user state.
4. The user is cleanly routed back to the initial Login screen.