import { createClient } from '@supabase/supabase-js';
import { calculateInsights, calculateExerciseProgression } from '../../src/lib/insightsEngine.ts';
import { Session, WorkoutSet, Exercise } from '../../src/models.ts';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runRealDataVerification() {
  console.log('=== VERIFYING REAL DATA FROM SUPABASE ===\n');

  // Fetch users
  const { data: users } = await supabase.from('users').select('*');
  console.log(`Found ${users?.length || 0} registered user profiles.`);

  for (const user of users || []) {
    console.log(`\n--------------------------------------------------`);
    console.log(`User: ${user.user_id} (${user.email || user.name})`);

    // Fetch sessions
    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.user_id);

    // Fetch sets
    const { data: setRows } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.user_id);

    // Fetch workouts
    const { data: workoutRows } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.user_id);

    // Fetch exercises
    const { data: exRows } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user.user_id);

    const sessions: Session[] = (sessionRows || []).map(s => ({
      id: s.id,
      userId: s.user_id,
      workoutId: s.workout_id,
      status: s.status,
      startedAt: new Date(s.started_at),
      completedAt: s.completed_at ? new Date(s.completed_at) : null,
      notes: s.notes,
      photos: s.photos,
    }));

    const sets: WorkoutSet[] = (setRows || []).map(st => ({
      id: st.id,
      sessionId: st.session_id,
      userId: st.user_id,
      exerciseId: st.exercise_id,
      setNumber: st.set_number,
      weight: st.weight != null ? Number(st.weight) : null,
      reps: st.reps != null ? Number(st.reps) : null,
      durationSeconds: st.duration_seconds != null ? Number(st.duration_seconds) : null,
      restSeconds: st.rest_seconds != null ? Number(st.rest_seconds) : null,
      startedAt: st.started_at ? new Date(st.started_at) : null,
      completedAt: st.completed_at ? new Date(st.completed_at) : null,
      loggedAt: new Date(st.logged_at),
    }));

    const exercises: Exercise[] = (exRows || []).map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      targetSets: e.target_sets,
      targetRepMin: e.target_rep_min,
      targetRepMax: e.target_rep_max,
    }));

    const workoutMap = new Map((workoutRows || []).map(w => [w.id, w.name]));

    console.log(`Sessions logged: ${sessions.length}`);
    console.log(`Sets logged: ${sets.length}`);
    console.log(`Exercises registered: ${exercises.length}`);

    // Run calculateInsights on real DB data
    const insights = calculateInsights(sessions, sets, exercises, workoutMap);
    console.log('\n[Real Database Insights Output]:');
    console.log(`- 90-Day Volume: ${insights.totalVolume90DaysKg.toLocaleString()} kg`);
    console.log(`- Total Reps: ${insights.totalReps.toLocaleString()}`);
    console.log(`- Timed Holds: ${insights.totalTimedHoldSeconds}s`);
    console.log(`- Pure Work Seconds: ${insights.totalWorkSeconds}s`);
    console.log(`- Rest Intervals Recorded: ${insights.restDiscipline.recordedRestIntervalsCount}`);
    console.log(`- Rest Adherence: ${insights.restDiscipline.adherencePercentage}%`);
    console.log(`- Average Rest Duration: ${insights.restDiscipline.averageRestSeconds}s`);
    console.log(`- Work-to-Rest Ratio: 1 : ${insights.restDiscipline.workToRestRatio > 0 ? (1 / insights.restDiscipline.workToRestRatio).toFixed(1) : '0'}`);

    // Run calculateExerciseProgression for each exercise that has sets
    console.log('\n[Real Database Per-Exercise Progression Curves]:');
    const loggedExIds = new Set(sets.map(s => s.exerciseId));
    for (const ex of exercises.filter(e => loggedExIds.has(e.id))) {
      const rep = calculateExerciseProgression(ex.id, sessions, sets, exercises);
      if (rep) {
        console.log(`  * ${rep.exerciseName}:`);
        console.log(`    - Data Points (Workouts): ${rep.dataPoints.length}`);
        console.log(`    - All-Time PR Weight: ${rep.allTimePrWeightKg} kg`);
        console.log(`    - Estimated 1RM PR: ${rep.allTimePr1RMKg} kg`);
        console.log(`    - Max Single-Session Volume: ${rep.allTimePrVolumeKg.toLocaleString()} kg`);
        console.log(`    - Progression Growth: ${rep.weightDeltaPercentage >= 0 ? '+' : ''}${rep.weightDeltaPercentage}%`);
      }
    }
  }

  console.log('\n=== REAL DATABASE VERIFICATION COMPLETE ===');
}

runRealDataVerification();
