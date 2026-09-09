export interface CatalogExercise {
  id: string;
  name: string;
  category: 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core' | 'Cardio' | 'Full Body';
  muscles: string[];
  equipment: string;
  type: 'strength' | 'timed';
  defaultSets: number;
  defaultRepMin: number;
  defaultRepMax: number;
  instructions?: string[];
  images?: string[];
  motionCues?: {
    setup: string;
    peak: string;
  };
}

export const WGER_EXERCISE_CATALOG: CatalogExercise[] = [
  // CHEST
  {
    id: 'wger_bench_press_barbell',
    name: 'Bench Press (Barbell)',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps brachii', 'Anterior deltoid', 'Chest'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_bench_press_dumbbell',
    name: 'Dumbbell Bench Press',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps brachii', 'Anterior deltoid', 'Chest'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_incline_bench_press',
    name: 'Incline Bench Press (Barbell)',
    category: 'Chest',
    muscles: ['Clavicular head pectoralis', 'Anterior deltoid', 'Triceps', 'Upper Chest'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_incline_dumbbell_press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    muscles: ['Clavicular head pectoralis', 'Anterior deltoid', 'Triceps', 'Upper Chest'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_chest_fly_cable',
    name: 'Cable Chest Flyes',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Chest', 'Sternal head'],
    equipment: 'Cable',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/27NNGFr.gif'
    ]
  },
  {
    id: 'wger_dips_chest',
    name: 'Chest Dips',
    category: 'Chest',
    muscles: ['Lower Pectoralis', 'Triceps brachii', 'Anterior deltoid'],
    equipment: 'Bodyweight / Parallel Bars',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12,
    images: [
      'https://static.exercisedb.dev/media/9WTm7dq.gif'
    ]
  },
  {
    id: 'wger_pushups',
    name: 'Push-ups',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps', 'Core', 'Anterior deltoid'],
    equipment: 'Bodyweight',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 20
  },

  // BACK
  {
    id: 'wger_deadlift_barbell',
    name: 'Deadlift (Conventional)',
    category: 'Back',
    muscles: ['Erector spinae', 'Gluteus maximus', 'Hamstrings', 'Latissimus dorsi', 'Trapezius', 'Lower Back'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 5,
    defaultRepMax: 8
  },
  {
    id: 'wger_pullups',
    name: 'Pull-ups',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Biceps brachii', 'Rhomboids', 'Upper Back', 'Lats'],
    equipment: 'Bodyweight / Pull-up Bar',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_chinups',
    name: 'Chin-ups',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Biceps brachii', 'Teres major', 'Lats'],
    equipment: 'Bodyweight / Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_lat_pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Biceps brachii', 'Middle Trapezius', 'Lats'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_barbell_row',
    name: 'Bent-Over Barbell Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Trapezius', 'Rear Deltoids', 'Back'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 8,
    defaultRepMax: 10,
    images: [
      'https://static.exercisedb.dev/media/5lE7XRz.gif'
    ]
  },
  {
    id: 'wger_seated_cable_row',
    name: 'Seated Cable Row',
    category: 'Back',
    muscles: ['Rhomboids', 'Latissimus dorsi', 'Trapezius', 'Biceps'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_dumbbell_row_single',
    name: 'One-Arm Dumbbell Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Trapezius', 'Biceps'],
    equipment: 'Dumbbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12,
    images: [
      'https://static.exercisedb.dev/media/BJ0Hz5L.gif'
    ]
  },

  // SHOULDERS
  {
    id: 'wger_overhead_press_barbell',
    name: 'Overhead Press (Military Press)',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Lateral deltoid', 'Triceps', 'Upper chest', 'Shoulders'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_dumbbell_shoulder_press',
    name: 'Dumbbell Shoulder Press',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Lateral deltoid', 'Triceps', 'Shoulders'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_lateral_raise_dumbbell',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    muscles: ['Lateral deltoid', 'Side Deltoid', 'Shoulders'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 20
  },
  {
    id: 'wger_cable_lateral_raise',
    name: 'Cable Lateral Raise',
    category: 'Shoulders',
    muscles: ['Lateral deltoid', 'Shoulders'],
    equipment: 'Cable',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_face_pulls',
    name: 'Face Pulls',
    category: 'Shoulders',
    muscles: ['Posterior deltoid', 'Infraspinatus', 'Trapezius', 'Rear Delts'],
    equipment: 'Cable Machine (Rope)',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/A3P4O0R.gif'
    ]
  },
  {
    id: 'wger_rear_delt_fly',
    name: 'Rear Delt Flyes',
    category: 'Shoulders',
    muscles: ['Posterior deltoid', 'Rhomboids', 'Trapezius', 'Rear Delts'],
    equipment: 'Dumbbells / Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 20,
    images: [
      'https://static.exercisedb.dev/media/8DiFDVA.gif'
    ]
  },

  // LEGS
  {
    id: 'wger_barbell_back_squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Hamstrings', 'Adductors', 'Calves', 'Legs', 'Quads'],
    equipment: 'Barbell / Squat Rack',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_front_squat',
    name: 'Front Squat',
    category: 'Legs',
    muscles: ['Quadriceps', 'Core', 'Gluteus maximus', 'Quads'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_goblet_squat',
    name: 'Goblet Squat',
    category: 'Legs',
    muscles: ['Quadriceps', 'Glutes', 'Core'],
    equipment: 'Dumbbell / Kettlebell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_romanian_deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    muscles: ['Hamstrings', 'Gluteus maximus', 'Erector spinae', 'Posterior Chain'],
    equipment: 'Barbell / Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus medius', 'Gluteus maximus', 'Hamstrings'],
    equipment: 'Dumbbells / Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_leg_press',
    name: 'Leg Press',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Quads'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/10Z2DXU.gif'
    ]
  },
  {
    id: 'wger_seated_leg_press',
    name: 'Seated Leg Press',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Hamstrings', 'Quads'],
    equipment: 'Machine / Cable',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/2Qh2J1e.gif'
    ],
    instructions: [
      'Sit comfortably on the machine with your back and head supported firmly against the padded seat.',
      'Place your feet shoulder-width apart flat on the footplate in the middle or slightly high for glute/quad emphasis.',
      'Disengage the safety levers and unlock your knees slightly without letting them bow inward.',
      'Lower the weight platform under complete control by bending your knees to approximately 90 degrees.',
      'Drive powerfully through your heels and mid-foot to press the platform back to starting position without locking out knees abruptly.'
    ]
  },
  {
    id: 'wger_leg_curl',
    name: 'Lying Leg Curl',
    category: 'Legs',
    muscles: ['Hamstrings', 'Biceps femoris'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_leg_extension',
    name: 'Leg Extension',
    category: 'Legs',
    muscles: ['Quadriceps', 'Rectus femoris'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_standing_calf_raise',
    name: 'Standing Calf Raises',
    category: 'Legs',
    muscles: ['Gastrocnemius', 'Soleus', 'Calves'],
    equipment: 'Machine / Dumbbell',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 20
  },
  {
    id: 'wger_walking_lunges',
    name: 'Walking Lunges',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Hamstrings'],
    equipment: 'Dumbbells / Bodyweight',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },

  // ARMS
  {
    id: 'wger_barbell_biceps_curl',
    name: 'Barbell Biceps Curl',
    category: 'Arms',
    muscles: ['Biceps brachii', 'Brachialis', 'Forearms', 'Biceps'],
    equipment: 'Barbell / EZ Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_hammer_curls',
    name: 'Hammer Curls',
    category: 'Arms',
    muscles: ['Brachioradialis', 'Biceps brachii', 'Forearms', 'Arms'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_incline_dumbbell_curl',
    name: 'Incline Dumbbell Curl',
    category: 'Arms',
    muscles: ['Biceps brachii (Long Head)', 'Biceps'],
    equipment: 'Dumbbells / Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    images: [
      'https://static.exercisedb.dev/media/ae9UoXQ.gif'
    ]
  },
  {
    id: 'wger_preacher_curl',
    name: 'Preacher Curl',
    category: 'Arms',
    muscles: ['Biceps brachii (Short Head)', 'Brachialis'],
    equipment: 'EZ Bar / Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12,
    images: [
      'https://static.exercisedb.dev/media/4dF3maG.gif'
    ]
  },
  {
    id: 'wger_triceps_pushdown_cable',
    name: 'Triceps Pushdown (Cable)',
    category: 'Arms',
    muscles: ['Triceps brachii (Lateral & Medial Head)', 'Triceps', 'Arms'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_overhead_triceps_extension',
    name: 'Overhead Triceps Extension',
    category: 'Arms',
    muscles: ['Triceps brachii (Long Head)', 'Triceps'],
    equipment: 'Cable / Dumbbell / EZ Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/2IxROQ1.gif'
    ]
  },
  {
    id: 'wger_skull_crushers',
    name: 'Skull Crushers (Lying Triceps Extension)',
    category: 'Arms',
    muscles: ['Triceps brachii', 'Triceps'],
    equipment: 'EZ Bar / Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12,
    images: [
      'https://static.exercisedb.dev/media/1TVoin7.gif'
    ]
  },

  // CORE / ABS
  {
    id: 'wger_plank',
    name: 'Plank',
    category: 'Core',
    muscles: ['Rectus abdominis', 'Transverse abdominis', 'Obliques', 'Core', 'Abs'],
    equipment: 'Bodyweight / Mat',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 45,
    defaultRepMax: 60
  },
  {
    id: 'wger_ab_wheel_rollout',
    name: 'Ab-Wheel Rollout',
    category: 'Core',
    muscles: ['Rectus abdominis', 'Transverse abdominis', 'Lats', 'Core', 'Abs'],
    equipment: 'Ab Wheel',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/NAgVB3t.gif'
    ]
  },
  {
    id: 'wger_hanging_leg_raises',
    name: 'Hanging Knee Raises',
    category: 'Core',
    muscles: ['Iliopsoas', 'Rectus abdominis (Lower Abs)', 'Obliques', 'Abs'],
    equipment: 'Pull-up Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_cable_woodchopper',
    name: 'Cable Woodchoppers',
    category: 'Core',
    muscles: ['Obliques', 'Transverse abdominis', 'Core'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15,
    images: [
      'https://static.exercisedb.dev/media/CosupLu.gif'
    ]
  },

  // CARDIO & CONDITIONING
  {
    id: 'wger_conditioning_block',
    name: 'HIIT Conditioning Block',
    category: 'Cardio',
    muscles: ['Full Body', 'Cardiovascular System', 'Heart'],
    equipment: 'Interval Timer / Bodyweight / Sled',
    type: 'timed',
    defaultSets: 10,
    defaultRepMin: 30,
    defaultRepMax: 30
  },
  {
    id: 'wger_jump_rope',
    name: 'Jump Rope',
    category: 'Cardio',
    muscles: ['Calves', 'Shoulders', 'Cardiovascular System'],
    equipment: 'Jump Rope',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 60,
    defaultRepMax: 120,
    images: [
      'https://static.exercisedb.dev/media/e1e76I2.gif'
    ]
  },
  {
    id: 'wger_rowing_machine',
    name: 'Rowing Machine (Ergometer)',
    category: 'Cardio',
    muscles: ['Legs', 'Back', 'Cardiovascular System', 'Full Body'],
    equipment: 'Rower',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 300,
    defaultRepMax: 600,
    images: [
      'https://static.exercisedb.dev/media/vpQaQkH.gif'
    ]
  }
];

/**
 * Core Verified Master Catalog:
 * Contains the 44 high-fidelity compound and isolation foundation movements
 * pre-cached locally for instant offline rendering and zero-latency startup.
 * The remaining 900+ exercises are loaded dynamically from Supabase PostgreSQL (public.exercises)
 * to keep the client application lightweight.
 */
export const MASTER_EXERCISE_CATALOG: CatalogExercise[] = WGER_EXERCISE_CATALOG;

