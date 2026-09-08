import { supabase } from './client.ts';

const MAPPINGS: Record<string, string> = {
  'Bench Press (barbell or dumbbell)': 'Barbell Bench Press',
  'Pull-ups / Lat Pulldown': 'Pull-ups',
  'Seated Cable Row / Dumbbell Row': 'Seated Cable Row',
  'Triceps Pushdown or Dips': 'Triceps Pushdown',
  'Back Squat or Goblet Squat': 'Barbell Back Squat',
  'Leg Curl (machine or Nordic)': 'Lying Leg Curl',
  'Chest-Supported Row or Rear-Delt Fly': 'Chest-Supported Row',
  'Deadlift or Romanian Deadlift': 'Barbell Deadlift',
  'Front Squat or Leg Press': 'Front Squat',
};

async function updateExercises() {
  console.log('--- Cleaning Compound Exercise Names in Supabase ---');
  for (const [oldName, newName] of Object.entries(MAPPINGS)) {
    const { data, error } = await supabase
      .from('exercises')
      .update({ name: newName })
      .eq('name', oldName)
      .select('id, name');

    if (error) {
      console.error(`Error updating "${oldName}":`, error.message);
    } else {
      console.log(`Updated ${data?.length || 0} rows: "${oldName}" -> "${newName}"`);
    }
  }
  console.log('--- Done Cleaning Exercises ---');
}

updateExercises();
