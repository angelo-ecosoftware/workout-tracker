import { collection, doc, getDoc, getDocs, setDoc, query, where, addDoc, orderBy, limit, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import { UserProfile, Workout, Session, WorkoutSet, Exercise, LastSetSummary } from '../models.ts';
import { SessionEngine, SetLogger, ProgressionEngine } from '../engine.ts';

// Get or create user profile
export async function initializeUser(userId: string, email: string) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const newUser: UserProfile = {
      userId,
      email,
      name: email.split('@')[0],
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
  
  const data = snap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  } as UserProfile;
}

// Ensure the static workouts/exercises templates exist.
export async function seedTemplatesIfMissing() {
  const metaRef = doc(db, 'system', 'seed_meta');
  const metaSnap = await getDoc(metaRef);

  // Use a version string to determine if we need to re-seed. 
  // Change this string to force a re-seed during development.
  const currentSeedVersion = 'v7_no_day_prefix'; 

  if (!metaSnap.exists() || metaSnap.data().version !== currentSeedVersion) {
    const batch = writeBatch(db);

    // Day 1
    const d1_e1Ref = doc(db, 'exercises', 'd1_e1_v7');
    batch.set(d1_e1Ref, { id: d1_e1Ref.id, name: 'Lat Pulldown', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 });
    const d1_e2Ref = doc(db, 'exercises', 'd1_e2_v7');
    batch.set(d1_e2Ref, { id: d1_e2Ref.id, name: 'Chest-Supported Row', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 });
    const d1_e3Ref = doc(db, 'exercises', 'd1_e3_v7');
    batch.set(d1_e3Ref, { id: d1_e3Ref.id, name: 'Incline Machine Press', type: 'strength', targetSets: 2, targetRepMin: 8, targetRepMax: 12 });
    const d1_e4Ref = doc(db, 'exercises', 'd1_e4_v7');
    batch.set(d1_e4Ref, { id: d1_e4Ref.id, name: 'Cable Lateral Raise', type: 'strength', targetSets: 4, targetRepMin: 12, targetRepMax: 15 });
    const d1_e5Ref = doc(db, 'exercises', 'd1_e5_v7');
    batch.set(d1_e5Ref, { id: d1_e5Ref.id, name: 'Rear Delt Pec Deck', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 15 });
    const d1_e6Ref = doc(db, 'exercises', 'd1_e6_v7');
    batch.set(d1_e6Ref, { id: d1_e6Ref.id, name: 'Rope Triceps Pushdown', type: 'strength', targetSets: 2, targetRepMin: 10, targetRepMax: 15 });

    const Day1ExerciseIds = [d1_e1Ref.id, d1_e2Ref.id, d1_e3Ref.id, d1_e4Ref.id, d1_e5Ref.id, d1_e6Ref.id];

    // Day 2
    const d2_e1Ref = doc(db, 'exercises', 'd2_e1_v7');
    batch.set(d2_e1Ref, { id: d2_e1Ref.id, name: 'Plank', type: 'timed', targetSets: 3, targetRepMin: 30, targetRepMax: 60 });
    const d2_e2Ref = doc(db, 'exercises', 'd2_e2_v7');
    batch.set(d2_e2Ref, { id: d2_e2Ref.id, name: 'Side Plank (Left)', type: 'timed', targetSets: 2, targetRepMin: 30, targetRepMax: 45 });
    const d2_e3Ref = doc(db, 'exercises', 'd2_e3_v7');
    batch.set(d2_e3Ref, { id: d2_e3Ref.id, name: 'Side Plank (Right)', type: 'timed', targetSets: 2, targetRepMin: 30, targetRepMax: 45 });
    const d2_e4Ref = doc(db, 'exercises', 'd2_e4_v7');
    batch.set(d2_e4Ref, { id: d2_e4Ref.id, name: 'Dead Bug', type: 'timed', targetSets: 3, targetRepMin: 30, targetRepMax: 60 });
    const d2_e5Ref = doc(db, 'exercises', 'd2_e5_v7');
    batch.set(d2_e5Ref, { id: d2_e5Ref.id, name: 'Romanian Deadlift', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 });
    const d2_e6Ref = doc(db, 'exercises', 'd2_e6_v7');
    batch.set(d2_e6Ref, { id: d2_e6Ref.id, name: 'Leg Curl', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 15 });
    const d2_e7Ref = doc(db, 'exercises', 'd2_e7_v7');
    batch.set(d2_e7Ref, { id: d2_e7Ref.id, name: 'Hip Thrust / Glute Bridge', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 });
    const d2_e8Ref = doc(db, 'exercises', 'd2_e8_v7');
    batch.set(d2_e8Ref, { id: d2_e8Ref.id, name: 'Calf Raise', type: 'strength', targetSets: 3, targetRepMin: 12, targetRepMax: 20 });

    const Day2ExerciseIds = [d2_e1Ref.id, d2_e2Ref.id, d2_e3Ref.id, d2_e4Ref.id, d2_e5Ref.id, d2_e6Ref.id, d2_e7Ref.id, d2_e8Ref.id];

    // Day 3
    const d3_e1Ref = doc(db, 'exercises', 'd3_e1_v7');
    batch.set(d3_e1Ref, { id: d3_e1Ref.id, name: 'Bench Press', type: 'strength', targetSets: 3, targetRepMin: 5, targetRepMax: 8 });
    const d3_e2Ref = doc(db, 'exercises', 'd3_e2_v7');
    batch.set(d3_e2Ref, { id: d3_e2Ref.id, name: 'Incline Dumbbell Press', type: 'strength', targetSets: 2, targetRepMin: 8, targetRepMax: 12 });
    const d3_e3Ref = doc(db, 'exercises', 'd3_e3_v7');
    batch.set(d3_e3Ref, { id: d3_e3Ref.id, name: 'Seated Shoulder Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 });
    const d3_e4Ref = doc(db, 'exercises', 'd3_e4_v7');
    batch.set(d3_e4Ref, { id: d3_e4Ref.id, name: 'Cable Lateral Raise', type: 'strength', targetSets: 3, targetRepMin: 12, targetRepMax: 15 });
    const d3_e5Ref = doc(db, 'exercises', 'd3_e5_v7');
    batch.set(d3_e5Ref, { id: d3_e5Ref.id, name: 'Seated Cable Row', type: 'strength', targetSets: 2, targetRepMin: 8, targetRepMax: 12 });
    const d3_e6Ref = doc(db, 'exercises', 'd3_e6_v7');
    batch.set(d3_e6Ref, { id: d3_e6Ref.id, name: 'Cable Curl', type: 'strength', targetSets: 2, targetRepMin: 10, targetRepMax: 15 });
    const d3_e7Ref = doc(db, 'exercises', 'd3_e7_v7');
    batch.set(d3_e7Ref, { id: d3_e7Ref.id, name: 'Rope Triceps Pushdown', type: 'strength', targetSets: 2, targetRepMin: 10, targetRepMax: 15 });

    const Day3ExerciseIds = [d3_e1Ref.id, d3_e2Ref.id, d3_e3Ref.id, d3_e4Ref.id, d3_e5Ref.id, d3_e6Ref.id, d3_e7Ref.id];

    // Delete old workouts (template_w_1, template_w_2, etc if they exist) to avoid duplicates if possible
    // Instead of querying and deleting, we just use deterministic IDs and rely on fetch Workouts deduplication and filtering
    // Let's use deterministic ids for workouts so they are easily replaced.
    const w1Ref = doc(db, 'workouts', 'v7_w1');
    batch.set(w1Ref, { id: w1Ref.id, name: 'Upper (V-Taper Width)', order: 1, exerciseIds: Day1ExerciseIds });
    
    const w2Ref = doc(db, 'workouts', 'v7_w2');
    batch.set(w2Ref, { id: w2Ref.id, name: 'Core + Light Lower (Tendon Safe)', order: 2, exerciseIds: Day2ExerciseIds });
    
    const w3Ref = doc(db, 'workouts', 'v7_w3');
    batch.set(w3Ref, { id: w3Ref.id, name: 'Upper (Chest + Bench)', order: 3, exerciseIds: Day3ExerciseIds });

    batch.set(metaRef, { version: currentSeedVersion });
    
    await batch.commit();

    // Clean up old workouts to be safe
    const wSnap = await getDocs(collection(db, 'workouts'));
    const oldWorkoutsBatch = writeBatch(db);
    wSnap.forEach(snap => {
      if (!snap.id.startsWith('v7_')) {
        oldWorkoutsBatch.delete(snap.ref);
      }
    });
    await oldWorkoutsBatch.commit();
  }
}

export async function fetchWorkoutsData() {
  const workoutsSnap = await getDocs(query(collection(db, 'workouts'), orderBy('order', 'asc')));
  const allWorkouts = workoutsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Workout));
  
  // Deduplicate workouts by order (in case of double seeding)
  const workoutsList = allWorkouts.filter((w, i, self) => 
    i === self.findIndex((t) => t.order === w.order)
  );
  
  const exercisesSnap = await getDocs(collection(db, 'exercises'));
  const exercisesList = exercisesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Exercise));
  
  // Create combined workouts for the UI
  const combinedWorkouts = workoutsList.map(w => {
    const wExercises = w.exerciseIds.map(eid => exercisesList.find(e => e.id === eid)).filter(Boolean) as Exercise[];
    return {
      ...w,
      exercises: wExercises,
    };
  });
  
  return { combinedWorkouts, workoutsList, exercisesList };
}

export async function getUserProgressState(userId: string) {
  const userRef = doc(db, 'users', userId);
  let snap = await getDoc(userRef);
  if (!snap.exists()) {
    await seedTemplatesIfMissing();
    await initializeUser(userId, auth.currentUser?.email || '');
    snap = await getDoc(userRef);
  }
  const user = snap.data() as UserProfile;
  return user;
}

export async function deleteSessions(sessionIds: string[]) {
  // We should do this in a batch or multiple promises
  // Because it's firestore, might just map over and delete
  for (const sessionId of sessionIds) {
    await deleteDoc(doc(db, 'sessions', sessionId));
    // optionally, delete associated sets
    const setsSnap = await getDocs(query(
      collection(db, 'sets'),
      where('sessionId', '==', sessionId)
    ));
    for (const sDoc of setsSnap.docs) {
      await deleteDoc(doc(db, 'sets', sDoc.id));
    }
  }
}

export async function fetchWorkoutHistory(userId: string) {
  const sessionsSnap = await getDocs(query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    limit(20)
  ));
  
  const sessions = sessionsSnap.docs.map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      completedAt: typeof data.completedAt?.toDate === 'function' ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : null)
    } as Session;
  });
  // Sort descending by completedAt
  sessions.sort((a, b) => {
    const tA = a.completedAt?.getTime() || 0;
    const tB = b.completedAt?.getTime() || 0;
    return tB - tA;
  });
  return sessions;
}

export async function fetchSetsForSession(sessionId: string) {
  const setsSnap = await getDocs(query(
    collection(db, 'sets'),
    where('sessionId', '==', sessionId)
  ));
  const sets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSet));
  // Sort ascending by setNumber
  sets.sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));
  return sets;
}

export async function logSessionCompletion(userId: string, workoutId: string, setsData: any[], exercisesList: Exercise[]) {
  const userProfile = await initializeUser(userId, auth.currentUser?.email || '');
  const workoutSnap = await getDoc(doc(db, 'workouts', workoutId));
  const workoutData = workoutSnap.data() as Workout;
  
  // Create session
  const sessionData = SessionEngine.createSession(userProfile, workoutData);
  const sessionRef = await addDoc(collection(db, 'sessions'), {
    ...sessionData,
    status: 'completed',
    completedAt: serverTimestamp(),
  });
  const sessionId = sessionRef.id;

  // Track cache updates
  const newCacheUpdates: Record<string, LastSetSummary> = {};

  const batch = writeBatch(db);

  // Validate and submit sets
  for (const s of setsData) {
    const ex = exercisesList.find(e => e.id === s.exerciseId);
    if (!ex) continue;

    const validatedSet = SetLogger.validateAndCreateSet({
      sessionId,
      userId,
      exerciseId: s.exerciseId,
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
      rir: s.rir,
      durationSeconds: s.durationSeconds,
      painScore: s.painScore
    }, ex.type);

    const setRef = doc(collection(db, 'sets'));
    batch.set(setRef, { ...validatedSet, loggedAt: serverTimestamp() });

    // Update read-cache map
    newCacheUpdates[s.exerciseId] = {
      lastWeight: s.weight || null,
      lastReps: s.reps || null,
      lastDurationSeconds: s.durationSeconds || null,
      lastSessionId: sessionId
    };
  }

  // Update User Profile with new cached stats & progressed order
  const userRef = doc(db, 'users', userId);
  const updatedCache = { ...userProfile.lastSetSummaryPerExercise };
  
  for (const [key, val] of Object.entries(newCacheUpdates)) {
    updatedCache[key] = val; // Write-through ONLY on session complete
  }

  batch.update(userRef, {
    lastCompletedWorkoutOrder: workoutData.order,
    lastSetSummaryPerExercise: updatedCache
  });

  await batch.commit();
}

export async function exportAllLogs(userId: string) {
  const sessionsSnap = await getDocs(query(collection(db, 'sessions'), where('userId', '==', userId)));
  const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const setsSnap = await getDocs(query(collection(db, 'sets'), where('userId', '==', userId)));
  const sets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { sessions, sets };
}

export async function deleteAllLogs(userId: string) {
  const sessionsSnap = await getDocs(query(collection(db, 'sessions'), where('userId', '==', userId)));
  const setsSnap = await getDocs(query(collection(db, 'sets'), where('userId', '==', userId)));
  
  const batch = writeBatch(db);
  
  sessionsSnap.docs.forEach(d => batch.delete(d.ref));
  setsSnap.docs.forEach(d => batch.delete(d.ref));
  
  await batch.commit();
}

export async function importAllLogs(userId: string, data: any) {
  if (!data || !Array.isArray(data.sessions) || !Array.isArray(data.sets)) {
    throw new Error('Invalid JSON structure');
  }

  const batch = writeBatch(db);

  for (const session of data.sessions) {
    const { id, ...sessionData } = session;
    if (sessionData.userId !== userId) continue;
    
    // Attempt to fix timestamps if they are serialized as objects
    if (sessionData.completedAt && sessionData.completedAt.seconds) {
      sessionData.completedAt = new Date(sessionData.completedAt.seconds * 1000);
    } else if (sessionData.completedAt && typeof sessionData.completedAt === 'string') {
      sessionData.completedAt = new Date(sessionData.completedAt);
    }
    
    if (sessionData.startedAt && sessionData.startedAt.seconds) {
      sessionData.startedAt = new Date(sessionData.startedAt.seconds * 1000);
    } else if (sessionData.startedAt && typeof sessionData.startedAt === 'string') {
      sessionData.startedAt = new Date(sessionData.startedAt);
    }

    const ref = doc(db, 'sessions', id);
    batch.set(ref, sessionData);
  }

  for (const set of data.sets) {
    const { id, ...setData } = set;
    if (setData.userId !== userId) continue;

    if (setData.loggedAt && setData.loggedAt.seconds) {
      setData.loggedAt = new Date(setData.loggedAt.seconds * 1000);
    } else if (setData.loggedAt && typeof setData.loggedAt === 'string') {
      setData.loggedAt = new Date(setData.loggedAt);
    }

    const ref = doc(db, 'sets', id);
    batch.set(ref, setData);
  }

  await batch.commit();
}
