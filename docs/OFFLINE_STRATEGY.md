# Offline Strategy

* What is Cached:
  * `users` profile data, specifically the `lastSetSummaryPerExercise` read-optimized cache.
  * `workouts` and `exercises` collections (static templates that do not frequently change).
* What Syncs Local-to-Cloud:
  * `sets` atomic log events push immediately to the local cache and sync asynchronously to Firestore rules constraints.
  * `sessions` transitions (in_progress -> completed) are synchronized in background state.
* Local-Only Operation Rules:
  * The `lastSetSummaryPerExercise` write-through process operates locally at the end of the session, keeping `O(1)` history available immediately for the next local-only workout session, even if network is dropped.
