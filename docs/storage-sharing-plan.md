# Storage, Custom Content, and Routine Sharing Plan

## Goal

Separate Kinisia data into clear ownership categories so that:

- Supabase remains the source of truth.
- Local storage improves speed and offline recovery.
- User-created content never leaks between accounts.
- Completed sessions remain historically accurate.
- Users can later share routines safely and cleanly.

## Mandatory TODO checklist

These are required product and engineering changes. They are not optional
recommendations.

- [ ] MUST scope active workout storage by `userId`.
- [ ] MUST scope custom GIF storage by `userId`.
- [ ] MUST keep standard catalog data separate from user-custom data.
- [ ] MUST move large catalogs, GIFs, and photo blobs to IndexedDB.
- [ ] MUST keep Supabase as the source of truth for account-owned data.
- [ ] MUST preserve completed workout sessions as immutable snapshots.
- [ ] MUST add routine versioning before routine sharing.
- [ ] MUST make shared routines immutable published copies.
- [ ] MUST prevent shared routines from exposing profile, bodyweight, history, or private notes.
- [ ] MUST require explicit permission before sharing custom media.
- [ ] MUST test account switching for drafts, timers, GIFs, routines, and body logs.
- [ ] MUST complete each item using one change, one test, and one commit.

An item may be checked only after its automatic test and manual test both pass.

## Core model

### 1. Catalog data

Catalog data is shared reference data supplied by Kinisia:

- Standard exercises.
- Standard exercise GIFs.
- Food catalog items.
- Default routine templates.

Storage rule:

- Supabase is authoritative.
- IndexedDB may cache large catalogs and media.
- Local storage should contain only small metadata or cache timestamps.

### 2. User-custom data

User-custom data belongs to one account:

- Custom exercise GIFs.
- Custom exercises.
- Custom routine programs.
- User-edited routine names, days, and exercise order.
- User-created notes and preferences.

Storage rule:

- Persist the canonical version in Supabase.
- Cache locally with a user-scoped key or IndexedDB account namespace.
- Never use an unscoped key for user-created content.

Example:

```text
custom_exercise_gif_<userId>_<exerciseId>
routine_program_<userId>_<programId>
```

### 3. Session snapshots

A completed workout session is a historical snapshot. It must not change when
the user later edits their routine.

A session should preserve:

- Routine/program ID and version.
- Workout day name at the time of completion.
- Exercise name and exercise ID.
- Sets, reps, weight, and duration.
- Bodyweight snapshot.
- Custom exercise media reference used at that time.

Storage rule:

- Completed sessions belong in Supabase.
- Local storage is only a draft/offline recovery cache.
- Editing a routine must never rewrite old session history.

### 4. Shareable routines

Sharing a routine should create a safe published snapshot, not expose the
owner's live editable routine directly.

Recommended flow:

1. User creates or edits a private routine.
2. User clicks Share.
3. Kinisia creates a published routine version.
4. The share link points to that immutable version.
5. Another user can preview or copy it.
6. Copying creates a new private routine owned by the recipient.

The shared version should include:

- Routine name.
- Day structure.
- Exercise references.
- Targets for sets and reps.
- Equipment and limitations.
- Optional custom media with explicit sharing permission.

It must not include:

- User profile details.
- Bodyweight.
- Workout history.
- Private notes.
- Account identifiers beyond the public share owner label.

## Storage decision rules

### Use localStorage for

- Small preferences.
- Selected workout continuity.
- Active session timestamp.
- Small drafts.
- User-scoped cache metadata.

### Use sessionStorage for

- Temporary route continuity.
- Temporary tab-only state.
- Short-lived UI state that should disappear when the tab closes.

### Use IndexedDB for

- Exercise and food catalogs.
- GIFs and image blobs.
- Workout draft photos.
- Larger offline draft payloads.

### Use Supabase for

- Users and profiles.
- Routines and routine versions.
- Exercises and custom exercises.
- Completed sessions and sets.
- Bodyweight logs.
- Share links and published snapshots.

## Key safety rules

1. Every user-owned local key contains the user ID.
2. Every shared object has an owner and visibility state.
3. Every completed session stores enough data to remain historically stable.
4. Local cache data is disposable and can always be rebuilt from Supabase.
5. Account switching clears or re-scopes active local state.
6. Custom GIFs are private by default.
7. Sharing custom media requires an explicit user action.
8. Shared routines are immutable versions; edits create new versions.

## Implementation sequence

### Plan item 1 — Storage key correction

Change only:

- Scope active session keys by user ID.
- Scope custom GIF keys by user ID.
- Correct the storage inventory names.

Automatic test:

- User A cannot read User B's active session or custom GIF.

Manual test:

1. Sign in as User A.
2. Start a workout and save a custom GIF.
3. Sign out.
4. Sign in as User B.
5. Confirm User A's active workout and GIF are not visible.

Commit separately, then stop for confirmation.

### Plan item 2 — Custom exercise model

Change only:

- Define the database shape for custom exercises and custom GIF metadata.
- Keep standard catalog exercises separate.

Automatic test:

- Custom exercises are user-scoped and standard exercises remain reusable.

Manual test:

- Create a custom exercise, refresh, edit it, and delete it.

### Plan item 3 — IndexedDB media cache

Change only:

- Move custom GIF blobs and large catalog media out of localStorage.

Automatic test:

- Media survives reload and missing cache entries fall back to the network.

Manual test:

- Load a GIF once, go offline, and confirm the cached GIF still displays.

### Plan item 4 — Routine versioning

Change only:

- Add immutable routine versions.
- Make completed sessions reference the version used.

Automatic test:

- Editing a routine does not change an old session snapshot.

Manual test:

- Complete a workout, edit the routine, and verify the old log is unchanged.

### Plan item 5 — Routine sharing

Change only:

- Add private, published, and copied routine states.
- Generate a shareable immutable snapshot.

Automatic test:

- A recipient can copy a published routine but cannot edit the owner's source.

Manual test:

- Share a routine, open it in another account, copy it, and edit the copy.

### Plan item 6 — Share permissions

Change only:

- Keep custom GIFs and private notes excluded unless explicitly shared.

Automatic test:

- A shared routine response contains no private profile, bodyweight, or history data.

Manual test:

- Share a routine with and without custom media permission.

### Plan item 7 — Account switching and cleanup

Change only:

- Clear or re-scope local active state when accounts change.

Automatic test:

- Switching users cannot restore the previous user's draft, timer, GIF, or routine.

Manual test:

- Switch between two accounts repeatedly and verify each sees only its own data.

## Required workflow for every item

```text
Inspect → change one thing → add one focused test
→ run focused test → run lint → build
→ commit one change → push → deploy if runtime changes
→ provide manual test → stop for user confirmation
```

No batching of plan items.
