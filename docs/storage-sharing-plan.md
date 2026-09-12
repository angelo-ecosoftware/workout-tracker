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
- [ ] MUST support shareable diet plans, meals, and recipes as immutable copies.
- [ ] MUST provide dedicated food filters for meals and recipe discovery.
- [ ] MUST test account switching for drafts, timers, GIFs, routines, and body logs.
- [ ] MUST lock exercise inputs until `Start Workout` is pressed.
- [ ] MUST make the missing-input reminder configurable in Settings.
- [ ] MUST keep global exercise GIFs separate from private user exercise GIFs.
- [ ] MUST make the rest timer disappear at zero and support wait, skip, and dismiss.
- [ ] MUST restore the original exercise info route after returning from YouTube or TikTok.
- [ ] MUST remove both workout and rest timers after the workout is finished.
- [ ] MUST add Friends/Social Tracking only as a later, permission-based feature.
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

### Plan item 8 — Lock exercise inputs before starting

Change only:

- Disable weight, reps, duration, and difficulty inputs until `Start Workout`
  is pressed.
- Keep exercise guides and routine viewing available.

Automatic test:

- Inputs are disabled before start and enabled after start.

Manual test:

1. Open a workout.
2. Try changing an exercise input before starting.
3. Confirm it cannot be edited.
4. Start the workout.
5. Confirm the inputs are editable.

### Plan item 9 — Smart missing-input reminder

Change only:

- Track whether each completed set contains the required input.
- Strength exercises require weight and reps.
- Timed exercises require duration.
- Bodyweight exercises require reps; weight may be optional.
- Skipped sets do not trigger a warning.
- After two consecutive completed sets with missing input, play one ping and
  show a dismissible reminder.
- Do not repeat the reminder until valid input is entered.

Settings:

- Default reminder delay: 20 seconds.
- User options: 10 seconds, 20 seconds, 30 seconds, or Disabled.
- The delay controls inactivity reminders; it does not replace missing-input
  validation.

Automatic test:

- Two incomplete sets trigger one reminder.
- A valid input clears the reminder.
- Skipped sets do not trigger it.

Manual test:

1. Start a workout.
2. Complete two sets without entering the required values.
3. Confirm one ping and a dismissible reminder appear.
4. Enter valid values.
5. Confirm the reminder does not immediately repeat.

### Plan item 10 — Rest timer lifecycle

Change only:

- Keep the next set locked while the rest timer runs.
- Unlock it when the timer reaches zero.
- Allow the user to wait, skip, or dismiss the timer.
- Dismiss and skip unlock the next set immediately.
- Record skipped rest as `rest_status: skipped`.
- Remove the timer automatically at zero.
- Remove the rest timer and workout timer after submission.

Automatic test:

- Timer reaches zero and closes.
- Skip and dismiss unlock the next set.
- Submission clears timer state.

Manual test:

1. Complete a set.
2. Confirm the next set is locked during rest.
3. Wait for zero and confirm it unlocks and the timer disappears.
4. Repeat using Skip and Dismiss.
5. Submit the workout and confirm no timer remains.

### Plan item 11 — External exercise route continuity

Change only:

- Preserve the exercise info route and exact UI position before opening
  YouTube or TikTok.
- Restore that exercise info page when the user returns.

Automatic test:

- External navigation continuity restores the original exercise route.

Manual test:

1. Open an exercise info page.
2. Open its YouTube or TikTok link.
3. Return using browser navigation or the external app.
4. Confirm the same exercise info page and position are restored.

### Plan item 12 — Private user exercise GIFs

Change only:

- Allow GIF uploads for exercises only.
- Save them in Supabase with `source: user_upload`.
- Show them immediately to their owner.
- Keep them private and separate from global exercise GIFs.
- Do not reuse them in the global catalog yet.
- Accept GIF files only in the first version; video conversion comes later.

Recommended metadata:

```text
owner_user_id: <userId>
exercise_id: <exerciseId>
source: user_upload
visibility: private
approval_status: private
```

Future approval changes the status to `pending`; it must create a reviewed
copy rather than modifying the private original.

Automatic test:

- A user can read their own exercise GIF.
- Another user cannot read it.
- The global exercise catalog is unchanged.

Manual test:

1. Upload a GIF for an exercise.
2. Confirm it appears immediately in that user’s exercise guide.
3. Switch accounts.
4. Confirm the GIF is not visible.

### Plan item 13 — Routine sharing

Change only:

- Share immutable routine versions.
- Let another user preview or copy a routine.
- Make the copied routine private and independently editable.
- Keep profile, bodyweight, history, and private notes excluded.

Automatic test:

- A recipient can copy a shared routine but cannot edit the owner’s source.

Manual test:

1. Share a routine.
2. Open it with another account.
3. Copy it.
4. Edit the copy.
5. Confirm the original routine is unchanged.

### Plan item 14 — Friends and social tracking (later)

This is a future feature, not part of the initial sharing implementation.

Possible scope:

- Friend requests by username or invite link.
- Accept or reject requests.
- Share workout activity with explicit permission.
- Share routines with friends.
- Optional encouragement notifications.
- Future challenges or leaderboards.

Privacy requirements:

- Bodyweight, private notes, and personal metrics remain private by default.
- Social visibility is opt-in.
- Friends cannot edit another user’s routines or sessions.

Automatic test:

- A user cannot view another user’s activity without permission.

Manual test:

- Send, accept, reject, and revoke a friend connection.
- Verify shared and private activity separately.

### Plan item 15 — Shareable diet plans, meals, and recipes

Change only:

- Allow users to share a diet plan as an immutable published snapshot.
- Allow individual meals and recipes to be shared independently.
- Let recipients preview or copy shared content into their own private library.
- Make copied plans, meals, and recipes independently editable.
- Never expose the owner's private food logs, bodyweight, calorie history, or
  personal nutrition notes.

Recommended ownership model:

```text
diet_plan: private | published | copied
meal: private | published | copied
recipe: private | published | copied
owner_user_id: <userId>
source: user_created | catalog
```

Automatic test:

- A recipient can copy a shared plan, meal, or recipe without gaining access
  to the owner's private food logs.
- Editing the copied content does not change the original.

Manual test:

1. Create a private diet plan with meals and recipes.
2. Share the plan.
3. Open it with another account.
4. Copy the plan.
5. Edit the copy.
6. Confirm the original and private food logs remain unchanged.

### Plan item 16 — Dedicated food and recipe filters

Change only:

- Add dedicated filters instead of mixing all foods into one search list.
- Support filters for:
  - Food products.
  - Recipes.
  - Meals.
  - Diet plans.
  - User-created items.
  - Catalog items.
  - Dietary preferences.
  - Allergens and exclusions.
  - Calories and macronutrient ranges.
  - Preparation time.

Automatic test:

- Each filter returns only matching food, recipe, meal, or plan types.
- User-created items remain scoped to the owner.

Manual test:

1. Open the food search.
2. Filter by recipe.
3. Filter by a dietary preference or allergen exclusion.
4. Filter by calories or protein.
5. Confirm only matching results appear.
6. Switch accounts and confirm private food items are not visible.

## Required workflow for every item

```text
Inspect → change one thing → add one focused test
→ run focused test → run lint → build
→ commit one change → push → deploy if runtime changes
→ provide manual test → stop for user confirmation
```

No batching of plan items.
