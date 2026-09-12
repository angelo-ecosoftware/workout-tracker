export function getWorkoutOrderFromSessionRow(row: {
  workouts?: { order?: unknown } | Array<{ order?: unknown }> | null;
  workout_order?: unknown;
}): number {
  const relatedWorkout = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
  const order = relatedWorkout?.order ?? row.workout_order;
  return typeof order === 'number' ? order : 0;
}
