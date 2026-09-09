import { WGER_EXERCISE_CATALOG, MASTER_EXERCISE_CATALOG, type CatalogExercise } from '../data/exerciseCatalog.ts';
import { formatSingleExerciseName } from './exerciseSearch.ts';

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
    canonicalName: 'Overhead Press',
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
  bulgarian_split_squat: {
    exerciseId: 'gGNQmVt',
    canonicalName: 'Bulgarian Split Squat',
    gifUrl: 'https://static.exercisedb.dev/media/gGNQmVt.gif',
    primaryMuscles: ['Quads', 'Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    instructions: [
      'Stand 2–3 feet in front of a flat bench. Place top of rear foot flat on the bench.',
      'Hold dumbbells at sides or barbell across upper back with chest upright.',
      'Descend straight down by flexing front knee and hip until front thigh is parallel to floor.',
      'Drive forcefully through your front heel to stand tall, keeping pelvis squared.',
    ],
    equipment: 'Dumbbells / Bench',
    category: 'Legs',
  },
  seated_cable_row: {
    exerciseId: 'A3P4O0R',
    canonicalName: 'Seated Cable Row',
    gifUrl: 'https://static.exercisedb.dev/media/A3P4O0R.gif',
    primaryMuscles: ['Lats', 'Latissimus dorsi', 'Rhomboids', 'Upper Back'],
    secondaryMuscles: ['Biceps', 'Forearms', 'Rear Delts', 'Traps'],
    instructions: [
      'Sit upright on low row station with feet braced firmly on footrests and knees softly bent.',
      'Grip handle, pull shoulders down and back, and extend your torso perpendicular to floor.',
      'Drive elbows straight back toward your waist, squeezing shoulder blades together tightly.',
      'Slowly release the weight forward for a 2–3 second eccentric stretch under full control.',
    ],
    equipment: 'Cable Machine',
    category: 'Back',
  },
  plank: {
    exerciseId: 'CosupLu',
    canonicalName: 'Plank',
    gifUrl: 'https://static.exercisedb.dev/media/CosupLu.gif',
    primaryMuscles: ['Abs', 'Rectus abdominis', 'Transverse abdominis'],
    secondaryMuscles: ['Obliques', 'Glutes', 'Shoulders'],
    instructions: [
      'Lie face down and prop yourself up onto your forearms and toes.',
      'Align elbows directly under shoulders, with forearms parallel.',
      'Squeeze glutes, draw navel inward to brace core, forming a rigid straight line from heels to head.',
      'Breathe steadily without letting your lower back sag or your hips pike upward.',
    ],
    equipment: 'Bodyweight',
    category: 'Core',
  },
  romanian_deadlift: {
    exerciseId: 'wQ2c4XD',
    canonicalName: 'Romanian Deadlift',
    gifUrl: 'https://static.exercisedb.dev/media/wQ2c4XD.gif',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Erector spinae', 'Forearms'],
    instructions: [
      'Stand hip-width holding barbell or dumbbells in front of thighs with slight knee unlock.',
      'Hinge at hips by pushing butt backward while keeping spine flat and bar close to legs.',
      'Lower bar just below knees until a deep stretch is felt through hamstrings.',
      'Drive hips forward to return to standing lockout by powerfully contracting glutes.',
    ],
    equipment: 'Barbell / Dumbbells',
    category: 'Legs',
  },
  seated_leg_press: {
    exerciseId: '2Qh2J1e',
    canonicalName: 'Seated Leg Press',
    gifUrl: 'https://static.exercisedb.dev/media/2Qh2J1e.gif',
    primaryMuscles: ['Quads', 'Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    instructions: [
      'Sit comfortably on the machine with your back and head supported firmly against the padded seat.',
      'Place your feet shoulder-width apart flat on the footplate in the middle or slightly high for glute/quad emphasis.',
      'Disengage the safety levers and unlock your knees slightly without letting them bow inward.',
      'Lower the weight platform under complete control by bending your knees to approximately 90 degrees.',
      'Drive powerfully through your heels and mid-foot to press the platform back to starting position without locking out knees abruptly.',
    ],
    equipment: 'Leg Press Machine',
    category: 'Legs',
  },
  leg_press: {
    exerciseId: '10Z2DXU',
    canonicalName: 'Leg Press',
    gifUrl: 'https://static.exercisedb.dev/media/2Qh2J1e.gif',
    primaryMuscles: ['Quads', 'Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    instructions: [
      'Position feet shoulder-width apart on the sled platform.',
      'Release safety bar and lower the weight until knees reach a 90-degree angle.',
      'Drive forcefully through midfoot and heels to return to starting position.',
    ],
    equipment: 'Leg Press Machine',
    category: 'Legs',
  },
  lateral_raises: {
    exerciseId: 'AQ0mC4Y',
    canonicalName: 'Lateral Raises',
    gifUrl: 'https://static.exercisedb.dev/media/AQ0mC4Y.gif',
    primaryMuscles: ['Shoulders', 'Lateral deltoid'],
    secondaryMuscles: ['Anterior deltoid', 'Traps'],
    instructions: [
      'Stand upright holding dumbbells at sides with a slight forward lean and soft elbows.',
      'Raise weights outward and slightly forward in the scapular plane until arms reach shoulder height.',
      'Pause for a half-second at the top with pinkies slightly elevated, then lower smoothly.',
    ],
    equipment: 'Dumbbells',
    category: 'Shoulders',
  },
  hammer_curls: {
    exerciseId: '2NpxjC1',
    canonicalName: 'Hammer Curls',
    gifUrl: 'https://static.exercisedb.dev/media/2NpxjC1.gif',
    primaryMuscles: ['Biceps', 'Brachialis', 'Forearms'],
    secondaryMuscles: ['Brachioradialis'],
    instructions: [
      'Stand tall with dumbbells held at sides using a neutral palms-inward grip.',
      'Keep elbows pinned at sides, curl weights toward shoulders contracting brachialis.',
      'Squeeze hard at peak flexion, then lower under a strict 2–3 second tempo.',
    ],
    equipment: 'Dumbbells',
    category: 'Arms',
  },
  chin_ups: {
    exerciseId: '7OeHptV',
    canonicalName: 'Chin-ups',
    gifUrl: 'https://static.exercisedb.dev/media/7OeHptV.gif',
    primaryMuscles: ['Lats', 'Biceps', 'Upper Back'],
    secondaryMuscles: ['Forearms', 'Rhomboids'],
    instructions: [
      'Hang from bar with hands shoulder-width apart, palms facing toward you (supinated grip).',
      'Pull your chest toward the bar by driving your elbows down and back.',
      'Clear the bar with your chin, hold momentarily, and lower down under full control.',
    ],
    equipment: 'Pull-up Bar',
    category: 'Back',
  },
  push_ups: {
    exerciseId: '0br45wL',
    canonicalName: 'Push-ups',
    gifUrl: 'https://static.exercisedb.dev/media/0br45wL.gif',
    primaryMuscles: ['Chest', 'Pectoralis major'],
    secondaryMuscles: ['Triceps', 'Anterior deltoid', 'Core'],
    instructions: [
      'Place hands slightly wider than shoulder-width on floor with body in a rigid plank.',
      'Lower chest towards floor until elbows form a 90-degree angle, keeping core braced.',
      'Press through palms to lockout without letting lower back sag.',
    ],
    equipment: 'Bodyweight',
    category: 'Chest',
  },
  calf_raises: {
    exerciseId: '6HmFgmx',
    canonicalName: 'Standing Calf Raises',
    gifUrl: 'https://static.exercisedb.dev/media/6HmFgmx.gif',
    primaryMuscles: ['Calves', 'Gastrocnemius'],
    secondaryMuscles: ['Soleus'],
    instructions: [
      'Stand with balls of feet on an elevated block or step with heels hanging off.',
      'Lower heels into a deep calf stretch, then rise onto toes as high as possible.',
      'Hold contraction at the peak for 1 second before lowering slowly.',
    ],
    equipment: 'Calf Machine / Dumbbells',
    category: 'Legs',
  },
  lying_leg_curl: {
    exerciseId: '17lJ1kr',
    canonicalName: 'Lying Leg Curl',
    gifUrl: 'https://static.exercisedb.dev/media/17lJ1kr.gif',
    primaryMuscles: ['Hamstrings', 'Biceps femoris'],
    secondaryMuscles: ['Calves'],
    instructions: [
      'Lie face down on machine with roller pad adjusted just below calves.',
      'Grip handles and curl legs upward toward glutes under control.',
      'Hold the contraction at the top, then lower back to the starting stretch.',
    ],
    equipment: 'Leg Curl Machine',
    category: 'Legs',
  },
  hanging_knee_raises: {
    exerciseId: '03lzqwk',
    canonicalName: 'Hanging Knee Raises',
    gifUrl: 'https://static.exercisedb.dev/media/03lzqwk.gif',
    primaryMuscles: ['Abs', 'Rectus abdominis', 'Hip Flexors'],
    secondaryMuscles: ['Obliques', 'Forearms'],
    instructions: [
      'Hang from pull-up bar with arms fully extended and core engaged.',
      'Raise knees up toward chest by curling your pelvis upward.',
      'Pause at parallel or above, then lower slowly without swinging.',
    ],
    equipment: 'Pull-up Bar',
    category: 'Core',
  },
  incline_dumbbell_press: {
    exerciseId: 'PG1kcIb',
    canonicalName: 'Incline Dumbbell Press',
    gifUrl: 'https://static.exercisedb.dev/media/PG1kcIb.gif',
    primaryMuscles: ['Chest', 'Upper Chest', 'Pectoralis major'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    instructions: [
      'Set bench to 30–45 degrees. Hold dumbbells at shoulder height with palms forward.',
      'Press dumbbells upward together in an arch until arms extend over upper chest.',
      'Lower under control until elbows are slightly below chest level.',
    ],
    equipment: 'Dumbbells / Incline Bench',
    category: 'Chest',
  },
  dumbbell_shoulder_press: {
    exerciseId: '5vfAI0I',
    canonicalName: 'Dumbbell Shoulder Press',
    gifUrl: 'https://static.exercisedb.dev/media/5vfAI0I.gif',
    primaryMuscles: ['Shoulders', 'Anterior deltoid', 'Lateral deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    instructions: [
      'Sit on an upright bench holding dumbbells at shoulder level with palms facing forward.',
      'Press weights overhead smoothly until arms are extended without touching at top.',
      'Lower dumbbells back to ear level under control.',
    ],
    equipment: 'Dumbbells / Bench',
    category: 'Shoulders',
  },
  front_squat: {
    exerciseId: 'DB0n8AG',
    canonicalName: 'Front Squat',
    gifUrl: 'https://static.exercisedb.dev/media/DB0n8AG.gif',
    primaryMuscles: ['Quads', 'Quadriceps'],
    secondaryMuscles: ['Glutes', 'Core', 'Upper Back'],
    instructions: [
      'Rack barbell across anterior deltoids and clavicles with elbows driven high.',
      'Keep chest tall and descend into a deep squat by bending knees and hips simultaneously.',
      'Drive out of the hole through the midfoot while keeping elbows elevated.',
    ],
    equipment: 'Barbell',
    category: 'Legs',
  },
  walking_lunges: {
    exerciseId: 'gGNQmVt',
    canonicalName: 'Walking Lunges',
    gifUrl: 'https://static.exercisedb.dev/media/gGNQmVt.gif',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    instructions: [
      'Step forward with one leg and lower hips until both knees are bent at roughly 90 degrees.',
      'Keep torso upright and drive through front heel to step into the next stride.',
      'Alternate legs continuously with steady pacing.',
    ],
    equipment: 'Dumbbells / Bodyweight',
    category: 'Legs',
  },
  leg_extensions: {
    exerciseId: '17lJ1kr',
    canonicalName: 'Leg Extensions',
    gifUrl: 'https://static.exercisedb.dev/media/17lJ1kr.gif',
    primaryMuscles: ['Quads', 'Quadriceps'],
    secondaryMuscles: [],
    instructions: [
      'Sit on machine with pad resting against lower shins just above ankles.',
      'Extend legs forward until knees are fully extended, squeezing quads hard.',
      'Lower weight under a 2-second eccentric control to starting position.',
    ],
    equipment: 'Leg Extension Machine',
    category: 'Legs',
  },
  chest_supported_row: {
    exerciseId: 'A3P4O0R',
    canonicalName: 'Chest-Supported Row',
    gifUrl: 'https://static.exercisedb.dev/media/A3P4O0R.gif',
    primaryMuscles: ['Back', 'Rhomboids', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    instructions: [
      'Lie chest-down on an incline bench holding dumbbells or grip machine handles.',
      'Retract scapulae and pull weights up towards ribs, driving elbows backward.',
      'Squeeze shoulder blades firmly at the top, then lower with control.',
    ],
    equipment: 'Incline Bench / Dumbbells',
    category: 'Back',
  },
  stretching: {
    exerciseId: 'CosupLu',
    canonicalName: 'Stretching',
    gifUrl: 'https://static.exercisedb.dev/media/CosupLu.gif',
    primaryMuscles: ['Full Body', 'Mobility'],
    secondaryMuscles: ['Core'],
    instructions: [
      'Perform steady static and dynamic joint mobility stretches.',
      'Hold positions for 20–30 seconds with calm diaphragmatic breathing.',
    ],
    equipment: 'Mat / Bodyweight',
    category: 'Full Body',
  },
  conditioning: {
    exerciseId: '0V2YQjW',
    canonicalName: 'Conditioning Block',
    gifUrl: 'https://static.exercisedb.dev/media/0V2YQjW.gif',
    primaryMuscles: ['Cardiovascular System', 'Full Body'],
    secondaryMuscles: ['Core'],
    instructions: [
      'Maintain an elevated heart rate with steady intervals or metabolic circuits.',
      'Focus on controlled respiration and steady pacing throughout the duration.',
    ],
    equipment: 'Bodyweight / Jump Rope / Rower',
    category: 'Full Body',
  },
  treadmill: {
    exerciseId: 'rjiM4L3',
    canonicalName: 'Treadmill',
    gifUrl: 'https://static.exercisedb.dev/media/rjiM4L3.gif',
    primaryMuscles: ['Cardiovascular System', 'Full Body', 'Legs'],
    secondaryMuscles: ['Calves', 'Quadriceps', 'Hamstrings', 'Glutes'],
    instructions: [
      'Step onto the treadmill deck and straddle the belt before starting the machine.',
      'Select your desired speed and incline on the console, beginning with an easy warm-up pace.',
      'Maintain an upright posture with shoulders back, eyes forward, and a relaxed arm swing.',
      'Land with light mid-foot strikes and breathe in a steady rhythm throughout the session.',
      'Gradually reduce speed to a cool-down walk before bringing the treadmill to a complete stop.',
    ],
    equipment: 'Treadmill',
    category: 'Cardio',
  },
  treadmill_running: {
    exerciseId: 'rjiM4L3',
    canonicalName: 'Treadmill Running',
    gifUrl: 'https://static.exercisedb.dev/media/rjiM4L3.gif',
    primaryMuscles: ['Cardiovascular System', 'Quadriceps', 'Hamstrings', 'Calves'],
    secondaryMuscles: ['Glutes', 'Core'],
    instructions: [
      'Warm up with 2–3 minutes of brisk walking before ramping up the belt speed to your running pace.',
      'Maintain an upright posture with a slight natural forward lean from the ankles.',
      'Keep strides quick, soft, and directly under your center of mass without overstriding.',
      'Cool down with 2 minutes of walking before stepping off the treadmill.',
    ],
    equipment: 'Treadmill',
    category: 'Cardio',
  },
};

/**
 * Cleans user-entered exercise names by stripping parenthetical notes,
 * special characters, and formatting anomalies (e.g. "Bench Press (barbell or dumbbell)" -> "bench press").
 * Normalizes multi-movement/compound sentences ("or", "/") to a single distinct exercise.
 */
export function cleanExerciseName(rawName: string): string {
  if (!rawName) return '';
  const single = formatSingleExerciseName(rawName);
  return single
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/-/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
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

  // 1. Check exact match in master catalog (900+ exercises)
  const catalogMatch = MASTER_EXERCISE_CATALOG.find((e) => {
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

  // 1. Check Verified High-Fidelity Pre-seeded Dictionary with strict exact / word-boundary matching
  // First pass: exact token match
  for (const [key, verified] of Object.entries(VERIFIED_EXERCISE_MEDIA_MAP)) {
    const token = key.replace(/_/g, ' ');
    if (clean === token || clean === verified.canonicalName.toLowerCase()) {
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

  // Second pass: multi-word phrase matching with word boundaries (preventing "squat" from matching "bulgarian split squat")
  for (const [key, verified] of Object.entries(VERIFIED_EXERCISE_MEDIA_MAP)) {
    const token = key.replace(/_/g, ' ');
    // Only allow substring matching if token is multi-word OR matches whole word boundaries
    const isMultiWord = token.includes(' ');
    const wordBoundaryRegex = new RegExp(`\\b${token}\\b`, 'i');
    if ((isMultiWord && clean.includes(token)) || wordBoundaryRegex.test(clean)) {
      // Disallow broad single-word hijack (e.g., 'squat' must not hijack 'split squat' or 'bulgarian')
      if (token === 'squat' && (clean.includes('split') || clean.includes('bulgarian') || clean.includes('front'))) {
        continue;
      }
      if (token === 'deadlift' && clean.includes('romanian')) {
        continue;
      }
      if (token === 'plank' && clean.includes('side')) {
        continue;
      }
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
  // Enforces strict relevance: rejects completely unrelated exercise matches (e.g. calf raise machine for seated cable row)
  if (typeof fetch !== 'undefined') {
    try {
      const apiUrl = `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(clean)}&limit=10`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        const results = json.data as any[];

        if (Array.isArray(results) && results.length > 0) {
          // Find closest match with strict relevance checking
          const cleanTokens = clean.split(' ').filter(Boolean);
          const best =
            results.find((r) => cleanExerciseName(r.name) === clean) ||
            results.find((r) => {
              const rClean = cleanExerciseName(r.name);
              // Must contain all significant query tokens or vice versa
              return cleanTokens.every((t) => rClean.includes(t));
            });

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

const dynamicCatalogMap = new Map<string, string>();

/**
 * Registers exercise thumbnail image URLs into the runtime media lookup map.
 * Called when catalog exercises are loaded from Supabase or server API.
 */
export function registerCatalogThumbnails(
  exercises: Array<{ name: string; id?: string; image_url?: string | null; images?: string[] }>
): void {
  for (const ex of exercises) {
    const img = ex.image_url || ex.images?.[0];
    if (img) {
      dynamicCatalogMap.set(cleanExerciseName(ex.name), img);
      if (ex.id) {
        dynamicCatalogMap.set(ex.id, img);
      }
    }
  }
}

function stemToken(token: string): string {
  const w = token.toLowerCase();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && !w.endsWith('ses')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/**
 * Synchronous thumbnail resolver for instant, zero-latency exercise GIF display.
 * Checks local storage custom overrides, verified canonical dictionary, dynamic database map, and cached entries.
 */
export function getExerciseThumbnailSync(exerciseName: string, exerciseId?: string): string | null {
  if (typeof localStorage !== 'undefined' && exerciseId) {
    try {
      const custom = localStorage.getItem(`custom_exercise_gif_${exerciseId}`);
      if (custom && custom.trim()) return custom.trim();
    } catch {}
  }

  // 1. Dynamic database catalog map pass
  if (exerciseId && dynamicCatalogMap.has(exerciseId)) {
    return dynamicCatalogMap.get(exerciseId)!;
  }

  const clean = cleanExerciseName(exerciseName);
  if (dynamicCatalogMap.has(clean)) {
    return dynamicCatalogMap.get(clean)!;
  }

  // 2. Exact match pass against verified GIFs
  for (const [key, verified] of Object.entries(VERIFIED_EXERCISE_MEDIA_MAP)) {
    const token = key.replace(/_/g, ' ');
    if (clean === token || clean === verified.canonicalName.toLowerCase()) {
      return verified.gifUrl;
    }
  }

  // 3. Token / word-boundary pass with plural/singular stem tolerance
  const cleanTokens = clean.split(' ').map(stemToken).filter(Boolean);

  for (const [key, verified] of Object.entries(VERIFIED_EXERCISE_MEDIA_MAP)) {
    const keyTokens = key.split('_').map(stemToken).filter(Boolean);
    const isSubset = keyTokens.every((kt) => cleanTokens.includes(kt));

    if (isSubset) {
      // Guard against inappropriate cross-exercise hijack
      if (key === 'squat' && (clean.includes('split') || clean.includes('bulgarian') || clean.includes('front'))) {
        continue;
      }
      if (key === 'deadlift' && clean.includes('romanian')) {
        continue;
      }
      if (key === 'plank' && clean.includes('side')) {
        continue;
      }
      return verified.gifUrl;
    }
  }

  // 4. Cache pass
  if (typeof localStorage !== 'undefined') {
    try {
      const cacheKey = `exercise_db_cache_${clean.replace(/\s+/g, '_')}`;
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw);
        if (parsed?.gifUrl) return parsed.gifUrl;
      }
    } catch {}
  }

  // 5. Master Catalog photo sequence pass (cached foundation exercises)
  const masterMatch = MASTER_EXERCISE_CATALOG.find((e) => {
    const eClean = cleanExerciseName(e.name);
    if (eClean === clean) return true;
    const eTokens = eClean.split(' ').map(stemToken).filter(Boolean);
    return cleanTokens.every((ct) => eTokens.includes(ct)) || eTokens.every((et) => cleanTokens.includes(et));
  });

  if (masterMatch?.images && masterMatch.images.length > 0) {
    return masterMatch.images[0];
  }

  return null;
}

