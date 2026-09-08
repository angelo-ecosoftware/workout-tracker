import { WGER_EXERCISE_CATALOG, type CatalogExercise } from '../data/exerciseCatalog.ts';

export interface ExerciseApiDetails {
  exerciseId?: string;
  name: string;
  gifUrl: string | null;
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  bodyParts?: string[];
  equipments?: string[];
}

/**
 * Verified canonical exercise dataset with high-resolution GIF demonstration links
 * from ExerciseDB / open datasets. Provides instant offline and zero-latency resolution.
 */
export const VERIFIED_EXERCISE_MEDIA_MAP: Record<
  string,
  {
    exerciseId: string;
    canonicalName: string;
    gifUrl: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    equipment: string;
    category: string;
  }
> = {
  bench_press: {
    exerciseId: 'EIeI8Vf',
    canonicalName: 'Barbell Bench Press',
    gifUrl: 'https://static.exercisedb.dev/media/EIeI8Vf.gif',
    primaryMuscles: ['Chest', 'Pectoralis major'],
    secondaryMuscles: ['Triceps', 'Shoulders', 'Anterior deltoid'],
    instructions: [
      'Lie flat on the bench with eyes under the bar and feet firmly planted on the floor.',
      'Grip the bar slightly wider than shoulder-width, squeeze shoulder blades together, and unrack.',
      'Inhale and lower the barbell in a smooth 2–3 second arc to mid-chest.',
      'Press explosively upward without flaring elbows excessively, locking out over upper chest.',
    ],
    equipment: 'Barbell / Bench',
    category: 'Chest',
  },
  incline_bench: {
    exerciseId: '3TZduzM',
    canonicalName: 'Barbell Incline Bench Press',
    gifUrl: 'https://static.exercisedb.dev/media/3TZduzM.gif',
    primaryMuscles: ['Chest', 'Upper Chest', 'Pectoralis major'],
    secondaryMuscles: ['Shoulders', 'Anterior deltoid', 'Triceps'],
    instructions: [
      'Set bench to a 30° to 45° angle. Grip the barbell with an overhand grip.',
      'Lower the bar slowly towards your upper chest beneath the clavicle.',
      'Drive upward through the chest, keeping your glutes and upper back in contact with the bench.',
    ],
    equipment: 'Incline Bench / Barbell',
    category: 'Chest',
  },
  pull_up: {
    exerciseId: '0V2YQjW',
    canonicalName: 'Pull-up',
    gifUrl: 'https://static.exercisedb.dev/media/0V2YQjW.gif',
    primaryMuscles: ['Lats', 'Latissimus dorsi', 'Upper Back'],
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Forearms'],
    instructions: [
      'Hang from bar with hands slightly wider than shoulder-width, palms facing away.',
      'Depress scapulae, pull elbows down toward your hips until your chin clears the bar.',
      'Lower under complete control back to a dead hang without swinging.',
    ],
    equipment: 'Pull-up Bar',
    category: 'Back',
  },
  lat_pulldown: {
    exerciseId: '4IKbhHV',
    canonicalName: 'Lat Pulldown',
    gifUrl: 'https://static.exercisedb.dev/media/4IKbhHV.gif',
    primaryMuscles: ['Lats', 'Latissimus dorsi'],
    secondaryMuscles: ['Biceps', 'Rhomboids', 'Forearms', 'Rear Delts'],
    instructions: [
      'Sit facing the cable machine with thighs secured firmly under the pads.',
      'Grip the wide bar, lean back slightly (~10°), and pull smoothly to upper collarbone.',
      'Squeeze lats for 1 second, then control the weight back up to full stretch.',
    ],
    equipment: 'Cable Machine',
    category: 'Back',
  },
  overhead_press: {
    exerciseId: 'jjUPrze',
    canonicalName: 'Overhead Press / Military Press',
    gifUrl: 'https://static.exercisedb.dev/media/jjUPrze.gif',
    primaryMuscles: ['Shoulders', 'Anterior deltoid', 'Lateral deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Traps'],
    instructions: [
      'Rack bar at collarbone height. Stand tall with glutes squeezed and core tight.',
      'Press bar vertically in a straight path, moving head back slightly to clear the chin.',
      'Lock out overhead with arms aligned directly above your ears and midfoot.',
    ],
    equipment: 'Barbell',
    category: 'Shoulders',
  },
  squat: {
    exerciseId: '1gFNTZV',
    canonicalName: 'Barbell Back Squat',
    gifUrl: 'https://static.exercisedb.dev/media/1gFNTZV.gif',
    primaryMuscles: ['Quads', 'Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Lower Back'],
    instructions: [
      'Set bar across upper traps. Stance shoulder-width with toes flared out 15–30°.',
      'Break at hips and knees simultaneously, descending until hip crease passes below knee level.',
      'Drive through the midfoot, keeping chest proud and knees tracking in line with toes.',
    ],
    equipment: 'Barbell / Squat Rack',
    category: 'Legs',
  },
  deadlift: {
    exerciseId: 'ila4NZS',
    canonicalName: 'Barbell Deadlift',
    gifUrl: 'https://static.exercisedb.dev/media/ila4NZS.gif',
    primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    secondaryMuscles: ['Lats', 'Traps', 'Forearms', 'Quads'],
    instructions: [
      'Position feet hip-width with bar over midfoot. Grip the bar just outside your knees.',
      'Flatten spine, pull slack out of the barbell, and push the floor away with your legs.',
      'Lock out by driving hips forward to stand tall; reverse the movement under control.',
    ],
    equipment: 'Barbell',
    category: 'Back',
  },
  biceps_curl: {
    exerciseId: 'aee2Fcj',
    canonicalName: 'Barbell Biceps Curl',
    gifUrl: 'https://static.exercisedb.dev/media/aee2Fcj.gif',
    primaryMuscles: ['Biceps', 'Biceps brachii'],
    secondaryMuscles: ['Forearms', 'Brachialis'],
    instructions: [
      'Stand upright holding bar with underhand grip at shoulder-width.',
      'Keeping upper arms pinned to your ribs, curl the bar up toward shoulders.',
      'Squeeze biceps at the top for 1 second, then lower under a slow 3-second tempo.',
    ],
    equipment: 'Barbell / EZ Bar',
    category: 'Arms',
  },
  triceps_pushdown: {
    exerciseId: '1xHyxys',
    canonicalName: 'Triceps Pushdown',
    gifUrl: 'https://static.exercisedb.dev/media/1xHyxys.gif',
    primaryMuscles: ['Triceps', 'Triceps brachii'],
    secondaryMuscles: ['Forearms'],
    instructions: [
      'Face cable stack, elbows tucked at sides, gripping bar or rope at 90° angle.',
      'Extend arms downward by contracting triceps until elbows are fully locked.',
      'Pause for a hard contraction, then slowly return to chest height.',
    ],
    equipment: 'Cable Machine',
    category: 'Arms',
  },
};

/**
 * Cleans user-entered exercise names by stripping parenthetical notes,
 * special characters, and formatting anomalies (e.g. "Bench Press (barbell or dumbbell)" -> "bench press").
 */
export function cleanExerciseName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * In-depth heuristic biomechanical muscle target resolver.
 * Accurately determines primary and secondary target muscle groups even for custom or renamed exercises.
 */
export function inferAccurateAnatomy(exerciseName: string): {
  primary: string[];
  secondary: string[];
  category: string;
  equipment: string;
} {
  const clean = cleanExerciseName(exerciseName);

  // 1. Check exact match in catalog
  const catalogMatch = WGER_EXERCISE_CATALOG.find((e) => {
    const eClean = cleanExerciseName(e.name);
    return eClean === clean || clean.includes(eClean) || eClean.includes(clean);
  });

  if (catalogMatch) {
    const primary: string[] = [];
    const secondary: string[] = [];

    catalogMatch.muscles.forEach((m) => {
      const lower = m.toLowerCase();
      if (
        (catalogMatch.category === 'Chest' && (lower.includes('pec') || lower.includes('chest'))) ||
        (catalogMatch.category === 'Back' && (lower.includes('lat') || lower.includes('back'))) ||
        (catalogMatch.category === 'Shoulders' && (lower.includes('delt') || lower.includes('shoulder'))) ||
        (catalogMatch.category === 'Legs' && (lower.includes('quad') || lower.includes('glute') || lower.includes('squat'))) ||
        (catalogMatch.category === 'Arms' && (lower.includes('bicep') || lower.includes('tricep'))) ||
        (catalogMatch.category === 'Core' && (lower.includes('ab') || lower.includes('core') || lower.includes('rectus')))
      ) {
        primary.push(m);
      } else {
        secondary.push(m);
      }
    });

    if (primary.length === 0 && catalogMatch.muscles.length > 0) {
      primary.push(catalogMatch.muscles[0]);
    }

    // Ensure synergists are populated
    if (secondary.length === 0) {
      if (catalogMatch.category === 'Chest') secondary.push('Triceps', 'Shoulders');
      else if (catalogMatch.category === 'Back') secondary.push('Biceps', 'Forearms');
      else if (catalogMatch.category === 'Shoulders') secondary.push('Triceps', 'Upper Chest');
      else if (catalogMatch.category === 'Legs') secondary.push('Hamstrings', 'Calves');
      else if (catalogMatch.category === 'Arms') secondary.push('Forearms');
    }

    return {
      primary: primary.length > 0 ? primary : [catalogMatch.category],
      secondary,
      category: catalogMatch.category,
      equipment: catalogMatch.equipment,
    };
  }

  // 2. Comprehensive pattern heuristics
  if (
    clean.includes('bench press') ||
    clean.includes('chest press') ||
    clean.includes('push up') ||
    clean.includes('pushup') ||
    clean.includes('chest fly') ||
    clean.includes('pec fly') ||
    clean.includes('dips')
  ) {
    return {
      primary: ['Chest', 'Pectoralis major'],
      secondary: ['Triceps', 'Shoulders', 'Anterior deltoid'],
      category: 'Chest',
      equipment: clean.includes('dumbbell') ? 'Dumbbells' : clean.includes('cable') ? 'Cable' : 'Barbell',
    };
  }

  if (
    clean.includes('overhead press') ||
    clean.includes('shoulder press') ||
    clean.includes('military press') ||
    clean.includes('lateral raise') ||
    clean.includes('front raise') ||
    clean.includes('face pull') ||
    clean.includes('arnold press')
  ) {
    return {
      primary: ['Shoulders', 'Anterior deltoid', 'Lateral deltoid'],
      secondary: ['Triceps', 'Traps', 'Upper Chest'],
      category: 'Shoulders',
      equipment: clean.includes('dumbbell') ? 'Dumbbells' : clean.includes('cable') ? 'Cable' : 'Barbell',
    };
  }

  if (
    clean.includes('pulldown') ||
    clean.includes('pull up') ||
    clean.includes('pullup') ||
    clean.includes('chin up') ||
    clean.includes('row') ||
    clean.includes('lat')
  ) {
    return {
      primary: ['Lats', 'Latissimus dorsi', 'Upper Back'],
      secondary: ['Biceps', 'Rhomboids', 'Forearms', 'Rear Delts'],
      category: 'Back',
      equipment: clean.includes('dumbbell') ? 'Dumbbell' : clean.includes('cable') ? 'Cable' : 'Barbell',
    };
  }

  if (
    clean.includes('squat') ||
    clean.includes('leg press') ||
    clean.includes('lunge') ||
    clean.includes('hack squat') ||
    clean.includes('leg extension') ||
    clean.includes('step up')
  ) {
    return {
      primary: ['Quads', 'Quadriceps'],
      secondary: ['Glutes', 'Hamstrings', 'Calves'],
      category: 'Legs',
      equipment: clean.includes('dumbbell') ? 'Dumbbells' : clean.includes('machine') ? 'Machine' : 'Barbell',
    };
  }

  if (
    clean.includes('deadlift') ||
    clean.includes('rdl') ||
    clean.includes('romanian') ||
    clean.includes('leg curl') ||
    clean.includes('good morning') ||
    clean.includes('hip thrust')
  ) {
    return {
      primary: ['Hamstrings', 'Glutes', 'Posterior Chain'],
      secondary: ['Lower Back', 'Traps', 'Forearms'],
      category: 'Legs',
      equipment: clean.includes('dumbbell') ? 'Dumbbells' : 'Barbell',
    };
  }

  if (clean.includes('curl') || clean.includes('bicep')) {
    return {
      primary: ['Biceps', 'Biceps brachii'],
      secondary: ['Forearms', 'Brachialis'],
      category: 'Arms',
      equipment: clean.includes('dumbbell') ? 'Dumbbells' : clean.includes('cable') ? 'Cable' : 'Barbell',
    };
  }

  if (clean.includes('tricep') || clean.includes('pushdown') || clean.includes('skull crusher')) {
    return {
      primary: ['Triceps', 'Triceps brachii'],
      secondary: ['Forearms'],
      category: 'Arms',
      equipment: clean.includes('cable') ? 'Cable' : 'Dumbbells',
    };
  }

  if (clean.includes('plank') || clean.includes('crunch') || clean.includes('ab ') || clean.includes('abs')) {
    return {
      primary: ['Abs', 'Rectus abdominis', 'Core'],
      secondary: ['Obliques'],
      category: 'Core',
      equipment: 'Bodyweight / Mat',
    };
  }

  if (clean.includes('calf') || clean.includes('calves')) {
    return {
      primary: ['Calves', 'Gastrocnemius'],
      secondary: ['Soleus'],
      category: 'Legs',
      equipment: 'Machine / Dumbbell',
    };
  }

  // Fallback defaults
  return {
    primary: [exerciseName],
    secondary: [],
    category: 'Strength',
    equipment: 'Free Weights / Machines',
  };
}

/**
 * Resolves exercise intelligence details: Animated GIF demonstration,
 * accurate primary and synergist muscle groups, and step-by-step instructions.
 * Incorporates multi-tier caching (pre-seeded catalog -> localStorage -> ExerciseDB API).
 */
export async function getExerciseDetailsWithMedia(exerciseName: string): Promise<ExerciseApiDetails> {
  const clean = cleanExerciseName(exerciseName);
  const anatomy = inferAccurateAnatomy(exerciseName);

  // 1. Check Verified High-Fidelity Pre-seeded Dictionary
  for (const [key, verified] of Object.entries(VERIFIED_EXERCISE_MEDIA_MAP)) {
    const token = key.replace(/_/g, ' ');
    if (clean === token || clean.includes(token)) {
      return {
        exerciseId: verified.exerciseId,
        name: verified.canonicalName,
        gifUrl: verified.gifUrl,
        targetMuscles: verified.primaryMuscles,
        secondaryMuscles: verified.secondaryMuscles,
        instructions: verified.instructions,
        equipments: [verified.equipment],
        bodyParts: [verified.category],
      };
    }
  }

  // 2. Check localStorage cache
  const cacheKey = `exercise_db_cache_${clean.replace(/\s+/g, '_')}`;
  if (typeof localStorage !== 'undefined') {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed && parsed.name) {
          return parsed as ExerciseApiDetails;
        }
      }
    } catch {}
  }

  // 3. Online Fetch from ExerciseDB Open API (https://oss.exercisedb.dev)
  if (typeof fetch !== 'undefined') {
    try {
      const apiUrl = `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(clean)}&limit=10`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const results = json.data as any[];

        if (Array.isArray(results) && results.length > 0) {
          // Find closest match
          const best =
            results.find((r) => cleanExerciseName(r.name) === clean) ||
            results.find((r) => r.name?.toLowerCase().includes(clean) || clean.includes(r.name?.toLowerCase())) ||
            results[0];

          if (best) {
            const apiDetails: ExerciseApiDetails = {
              exerciseId: best.exerciseId,
              name: best.name,
              gifUrl: best.gifUrl || null,
              targetMuscles: Array.isArray(best.targetMuscles) && best.targetMuscles.length > 0 ? best.targetMuscles : anatomy.primary,
              secondaryMuscles: Array.isArray(best.secondaryMuscles) && best.secondaryMuscles.length > 0 ? best.secondaryMuscles : anatomy.secondary,
              instructions: Array.isArray(best.instructions) && best.instructions.length > 0 ? best.instructions : [],
              bodyParts: best.bodyParts || [anatomy.category],
              equipments: best.equipments || [anatomy.equipment],
            };

            // Write to localStorage cache
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem(cacheKey, JSON.stringify(apiDetails));
              } catch {}
            }

            return apiDetails;
          }
        }
      }
    } catch (e) {
      console.warn('ExerciseDB API fetch failed, falling back to local anatomy:', e);
    }
  }

  // 4. Return inferred anatomy fallback
  return {
    name: exerciseName,
    gifUrl: null,
    targetMuscles: anatomy.primary,
    secondaryMuscles: anatomy.secondary,
    instructions: [
      `Set up your position and align with ${anatomy.equipment}.`,
      `Brace your core and lock scapulae into a stable position.`,
      `Lower the weight under a controlled 2–3 second eccentric tempo.`,
      `Drive through your ${anatomy.primary[0] || 'target muscles'} to complete the repetition.`,
    ],
    equipments: [anatomy.equipment],
    bodyParts: [anatomy.category],
  };
}
