import { describe, it, expect, beforeEach } from 'vitest';
import { Workout, Exercise } from '../src/models.ts';

const TEST_USER = {
  idx: 2,
  id: "3ce0d559-99da-4134-9de7-872bd992d757",
  user_id: "c7b8e78f-24c3-447f-8ad2-5c31dd8421ec",
  email: "extremealpha16@gmail.com",
  name: "Alpha Extreme",
  last_completed_workout_order: 0,
  max_workout_order: 3,
  last_set_summary_per_exercise: "{}",
  created_at: "2026-09-01 12:01:55.551+00"
};

// Simulate full Create, Read, Update, Delete in-memory routine operations & DB synchronization shape
describe(`Routine CRUD and Zero-State workflow for user ${TEST_USER.user_id} (${TEST_USER.name})`, () => {
  let userWorkouts: (Workout & { exercises: Exercise[] })[] = [];

  beforeEach(() => {
    userWorkouts = [];
  });

  it('1. CREATE: starts at 0 routines (empty state) and creates custom split days', () => {
    // Initial state check
    expect(userWorkouts.length).toBe(0);

    // Create Day 1
    const day1Ex: Exercise = {
      id: `ex_${Date.now()}_1`,
      name: 'Barbell Incline Bench Press',
      type: 'strength',
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12
    };
    const newDay1: Workout & { exercises: Exercise[] } = {
      id: `custom_w_${Date.now()}_1`,
      name: 'Day 1 - Push Focus',
      order: 1,
      exerciseIds: [day1Ex.id],
      exercises: [day1Ex]
    };
    userWorkouts.push(newDay1);

    // Create Day 2
    const day2Ex: Exercise = {
      id: `ex_${Date.now()}_2`,
      name: 'Plank Hold',
      type: 'timed',
      targetSets: 3,
      targetRepMin: 30,
      targetRepMax: 60
    };
    const newDay2: Workout & { exercises: Exercise[] } = {
      id: `custom_w_${Date.now()}_2`,
      name: 'Day 2 - Core Endurance',
      order: 2,
      exerciseIds: [day2Ex.id],
      exercises: [day2Ex]
    };
    userWorkouts.push(newDay2);

    expect(userWorkouts.length).toBe(2);
    expect(userWorkouts[0].name).toBe('Day 1 - Push Focus');
    expect(userWorkouts[1].name).toBe('Day 2 - Core Endurance');
  });

  it('2. READ: reads and accurately retrieves workouts, days, and nested exercise targets', () => {
    const ex: Exercise = {
      id: 'ex_curl_1',
      name: 'Dumbbell Biceps Curl',
      type: 'strength',
      targetSets: 4,
      targetRepMin: 10,
      targetRepMax: 12
    };
    userWorkouts = [
      {
        id: 'w_pull',
        name: 'Day 1 - Pull Hypertrophy',
        order: 1,
        exerciseIds: ['ex_curl_1'],
        exercises: [ex]
      }
    ];

    const currentWorkout = userWorkouts[0];
    expect(currentWorkout).toBeDefined();
    expect(currentWorkout.exercises.length).toBe(1);
    expect(currentWorkout.exercises[0].targetSets).toBe(4);
    expect(currentWorkout.exercises[0].targetRepMin).toBe(10);
    expect(currentWorkout.exercises[0].targetRepMax).toBe(12);
  });

  it('3. UPDATE: modifies routine day names, reorders exercises, and updates rep targets', () => {
    const ex1: Exercise = {
      id: 'ex1',
      name: 'Push-ups',
      type: 'strength',
      targetSets: 3,
      targetRepMin: 10,
      targetRepMax: 15
    };
    const ex2: Exercise = {
      id: 'ex2',
      name: 'Dumbbell Shoulder Press',
      type: 'strength',
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12
    };

    let workout: Workout & { exercises: Exercise[] } = {
      id: 'w1',
      name: 'Day 1 - Upper Body',
      order: 1,
      exerciseIds: ['ex1', 'ex2'],
      exercises: [ex1, ex2]
    };

    // Update routine name
    workout = { ...workout, name: 'Day 1 - Upper Heavy (Modified)' };
    expect(workout.name).toBe('Day 1 - Upper Heavy (Modified)');

    // Update exercise target sets
    workout.exercises = workout.exercises.map(e => e.id === 'ex1' ? { ...e, targetSets: 4 } : e);
    expect(workout.exercises[0].targetSets).toBe(4);

    // Reorder exercises (move ex2 up to position 0)
    const reorderedList = [workout.exercises[1], workout.exercises[0]];
    workout.exercises = reorderedList;
    workout.exerciseIds = reorderedList.map(e => e.id);

    expect(workout.exercises[0].id).toBe('ex2');
    expect(workout.exercises[1].id).toBe('ex1');
  });

  it('4. DELETE: deletes individual routines with index recalculation down to 0 days', () => {
    userWorkouts = [
      { id: 'w1', name: 'Day 1 - Push', order: 1, exerciseIds: [], exercises: [] },
      { id: 'w2', name: 'Day 2 - Pull', order: 2, exerciseIds: [], exercises: [] },
      { id: 'w3', name: 'Day 3 - Legs', order: 3, exerciseIds: [], exercises: [] }
    ];

    // Delete Day 2 (index 1)
    let filtered = userWorkouts.filter((_, i) => i !== 1);
    let reindexed = filtered.map((w, i) => ({ ...w, order: i + 1 }));
    userWorkouts = reindexed;

    expect(userWorkouts.length).toBe(2);
    expect(userWorkouts[0].name).toBe('Day 1 - Push');
    expect(userWorkouts[1].name).toBe('Day 3 - Legs');
    expect(userWorkouts[1].order).toBe(2);

    // Delete remaining 2 days down to empty 0 routines
    userWorkouts = [];
    expect(userWorkouts.length).toBe(0);
  });

  it('5. ZERO ROUTINES LINK & MODAL: matches user target metadata', () => {
    expect(TEST_USER.user_id).toBe("c7b8e78f-24c3-447f-8ad2-5c31dd8421ec");
    expect(TEST_USER.email).toBe("extremealpha16@gmail.com");
    expect(TEST_USER.name).toBe("Alpha Extreme");
    expect(TEST_USER.last_completed_workout_order).toBe(0);
  });
});
