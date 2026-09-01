import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://khvnlmzhymocnvdnptci.supabase.co";
const supabaseAnonKey = "sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USER_ID = "b5311a63-3884-494b-83cc-187b1e8fdc4f";

async function seedTestUser() {
  console.log(`Seeding test data for user: ${TEST_USER_ID}`);

  // 1. Ensure user profile exists
  const { data: userData, error: userErr } = await supabase.from('users').upsert({
    user_id: TEST_USER_ID,
    email: 'testuser@spartan.app',
    name: 'Quick Tester',
    last_completed_workout_order: 0,
    max_workout_order: 2,
    last_set_summary_per_exercise: {},
    onboarding_completed: true,
    training_days_per_week: 2,
  }, { onConflict: 'user_id' });

  if (userErr) console.warn("User upsert warning:", userErr);
  else console.log("User record seeded.");

  // 2. Create 4 simple exercises (Push-ups, Bodyweight Squats, Dumbbell Bicep Curls, Plank)
  const exercises = [
    {
      id: `test_ex_pushups_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Push-ups',
      type: 'strength',
      target_sets: 2,
      target_rep_min: 8,
      target_rep_max: 12,
    },
    {
      id: `test_ex_squats_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Bodyweight Squats',
      type: 'strength',
      target_sets: 2,
      target_rep_min: 10,
      target_rep_max: 15,
    },
    {
      id: `test_ex_curls_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Dumbbell Biceps Curl',
      type: 'strength',
      target_sets: 2,
      target_rep_min: 8,
      target_rep_max: 12,
    },
    {
      id: `test_ex_plank_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Plank',
      type: 'timed',
      target_sets: 2,
      target_rep_min: 30,
      target_rep_max: 45,
    },
  ];

  const { error: exErr } = await supabase.from('exercises').upsert(exercises);
  if (exErr) console.warn("Exercises upsert warning:", exErr);
  else console.log("Exercises seeded:", exercises.map(e => e.name));

  // 3. Workouts (Day 1 - Quick Upper, Day 2 - Quick Lower & Core)
  const workouts = [
    {
      id: `test_w1_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Day 1 - Quick Upper (Test)',
      order: 1,
      exercise_ids: [exercises[0].id, exercises[2].id],
    },
    {
      id: `test_w2_${TEST_USER_ID.slice(0, 6)}`,
      user_id: TEST_USER_ID,
      name: 'Day 2 - Quick Lower & Core (Test)',
      order: 2,
      exercise_ids: [exercises[1].id, exercises[3].id],
    },
  ];

  const { error: wErr } = await supabase.from('workouts').upsert(workouts);
  if (wErr) console.warn("Workouts upsert warning:", wErr);
  else console.log("Workouts seeded:", workouts.map(w => w.name));

  // 4. Workout Exercises Junction Table
  const junction = [
    { workout_id: workouts[0].id, exercise_id: exercises[0].id, position: 0, user_id: TEST_USER_ID },
    { workout_id: workouts[0].id, exercise_id: exercises[2].id, position: 1, user_id: TEST_USER_ID },
    { workout_id: workouts[1].id, exercise_id: exercises[1].id, position: 0, user_id: TEST_USER_ID },
    { workout_id: workouts[1].id, exercise_id: exercises[3].id, position: 1, user_id: TEST_USER_ID },
  ];

  // Clear existing junction rows for this user then insert fresh
  await supabase.from('workout_exercises').delete().eq('user_id', TEST_USER_ID);
  const { error: jErr } = await supabase.from('workout_exercises').insert(junction);
  if (jErr) console.warn("Junction insert warning:", jErr);
  else console.log("Junction relations seeded.");

  console.log("Seeding completed successfully!");
}

seedTestUser().catch(console.error);
