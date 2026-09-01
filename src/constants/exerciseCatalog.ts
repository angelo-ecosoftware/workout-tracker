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
    equipment: 'Dumbbells / Incline Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_chest_fly_dumbbell',
    name: 'Dumbbell Chest Fly',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Anterior deltoid', 'Chest'],
    equipment: 'Dumbbells / Flat Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_cable_crossover',
    name: 'Cable Crossover / Chest Fly',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Chest'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_push_ups',
    name: 'Push-ups',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps', 'Anterior deltoid', 'Core'],
    equipment: 'Bodyweight',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 20
  },
  {
    id: 'wger_dips_chest',
    name: 'Chest Dips',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps brachii', 'Anterior deltoid'],
    equipment: 'Parallel Bars / Dip Station',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_machine_chest_press',
    name: 'Machine Chest Press',
    category: 'Chest',
    muscles: ['Pectoralis major', 'Triceps brachii', 'Chest'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },

  // BACK
  {
    id: 'wger_deadlift_barbell',
    name: 'Deadlift (Conventional Barbell)',
    category: 'Back',
    muscles: ['Erector spinae', 'Gluteus maximus', 'Hamstrings', 'Latissimus dorsi', 'Trapezius'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 5,
    defaultRepMax: 8
  },
  {
    id: 'wger_lat_pulldown',
    name: 'Lat Pulldown (Cable)',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Biceps brachii', 'Rhomboids', 'Rear Deltoid'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_bent_over_row_barbell',
    name: 'Bent-Over Barbell Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Trapezius', 'Biceps brachii', 'Middle Back'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_seated_cable_row',
    name: 'Seated Cable Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Trapezius', 'Middle Back'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_pull_ups',
    name: 'Pull-ups',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Biceps brachii', 'Teres major', 'Upper Back'],
    equipment: 'Pull-up Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_chin_ups',
    name: 'Chin-ups (Underhand Grip)',
    category: 'Back',
    muscles: ['Biceps brachii', 'Latissimus dorsi', 'Brachialis'],
    equipment: 'Pull-up Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_single_arm_dumbbell_row',
    name: 'Single Arm Dumbbell Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Biceps brachii'],
    equipment: 'Dumbbell / Flat Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_face_pulls',
    name: 'Face Pulls (Cable)',
    category: 'Back',
    muscles: ['Rear deltoid', 'Rhomboids', 'Infraspinatus', 'Rotator cuff'],
    equipment: 'Cable Machine / Rope Attachment',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_tbar_row',
    name: 'T-Bar Row',
    category: 'Back',
    muscles: ['Latissimus dorsi', 'Rhomboids', 'Trapezius', 'Back Thickness'],
    equipment: 'T-Bar Station / Landmine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },

  // SHOULDERS
  {
    id: 'wger_overhead_press_barbell',
    name: 'Overhead Press (OHP / Military Press)',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Lateral deltoid', 'Triceps brachii', 'Trapezius', 'Upper Chest'],
    equipment: 'Barbell',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_dumbbell_shoulder_press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Lateral deltoid', 'Triceps brachii'],
    equipment: 'Dumbbells / Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_lateral_raise_dumbbell',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    muscles: ['Lateral deltoid', 'Side Shoulders'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_lateral_raise_cable',
    name: 'Cable Lateral Raise',
    category: 'Shoulders',
    muscles: ['Lateral deltoid', 'Side Shoulders'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_front_raise_dumbbell',
    name: 'Dumbbell Front Raise',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Front Shoulders'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_reverse_pec_deck',
    name: 'Reverse Pec Deck / Rear Delt Machine',
    category: 'Shoulders',
    muscles: ['Posterior deltoid', 'Rhomboids', 'Rear Shoulders'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_arnold_press',
    name: 'Arnold Press (Dumbbell)',
    category: 'Shoulders',
    muscles: ['Anterior deltoid', 'Lateral deltoid', 'Triceps'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_shrugs_barbell',
    name: 'Barbell Shrugs',
    category: 'Shoulders',
    muscles: ['Trapezius', 'Upper Traps'],
    equipment: 'Barbell / Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },

  // LEGS
  {
    id: 'wger_squat_barbell',
    name: 'Back Squat (Barbell)',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Hamstrings', 'Adductors', 'Calves'],
    equipment: 'Barbell / Squat Rack',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_front_squat_barbell',
    name: 'Front Squat (Barbell)',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Core', 'Upper Back'],
    equipment: 'Barbell / Squat Rack',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 6,
    defaultRepMax: 10
  },
  {
    id: 'wger_goblet_squat',
    name: 'Goblet Squat (Dumbbell / Kettlebell)',
    category: 'Legs',
    muscles: ['Quadriceps', 'Gluteus maximus', 'Core'],
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
    defaultRepMax: 15
  },
  {
    id: 'wger_leg_curl',
    name: 'Leg Curl (Lying or Seated)',
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
    muscles: ['Quadriceps'],
    equipment: 'Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_standing_calf_raise',
    name: 'Standing Calf Raise',
    category: 'Legs',
    muscles: ['Gastrocnemius', 'Soleus', 'Calves'],
    equipment: 'Machine / Dumbbell / Bodyweight',
    type: 'strength',
    defaultSets: 4,
    defaultRepMin: 12,
    defaultRepMax: 20
  },
  {
    id: 'wger_hip_thrust_barbell',
    name: 'Hip Thrust (Barbell)',
    category: 'Legs',
    muscles: ['Gluteus maximus', 'Hamstrings'],
    equipment: 'Barbell / Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_walking_lunges',
    name: 'Walking Lunges (Dumbbell)',
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
    id: 'wger_bicep_curl_barbell',
    name: 'Barbell Biceps Curl',
    category: 'Arms',
    muscles: ['Biceps brachii', 'Brachialis'],
    equipment: 'Barbell / EZ Bar',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_dumbbell_bicep_curl',
    name: 'Dumbbell Biceps Curl (Standing/Seated)',
    category: 'Arms',
    muscles: ['Biceps brachii', 'Brachioradialis'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_hammer_curl',
    name: 'Hammer Curl (Dumbbell)',
    category: 'Arms',
    muscles: ['Brachioradialis', 'Brachialis', 'Biceps brachii', 'Forearms'],
    equipment: 'Dumbbells',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_incline_dumbbell_curl',
    name: 'Incline Dumbbell Biceps Curl',
    category: 'Arms',
    muscles: ['Biceps brachii (long head)'],
    equipment: 'Dumbbells / Incline Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_preacher_curl',
    name: 'Preacher Curl (EZ Bar / Machine)',
    category: 'Arms',
    muscles: ['Biceps brachii (short head)', 'Brachialis'],
    equipment: 'EZ Bar / Preacher Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_tricep_pushdown_cable',
    name: 'Triceps Rope Pushdown',
    category: 'Arms',
    muscles: ['Triceps brachii (lateral head)'],
    equipment: 'Cable Machine / Rope Attachment',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_skull_crushers',
    name: 'Skull Crushers / Lying Triceps Extension',
    category: 'Arms',
    muscles: ['Triceps brachii (long head)'],
    equipment: 'EZ Bar / Dumbbells / Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_overhead_tricep_extension',
    name: 'Overhead Triceps Extension (Cable/Dumbbell)',
    category: 'Arms',
    muscles: ['Triceps brachii (long head)'],
    equipment: 'Cable Machine / Dumbbell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 12
  },
  {
    id: 'wger_close_grip_bench_press',
    name: 'Close-Grip Bench Press',
    category: 'Arms',
    muscles: ['Triceps brachii', 'Anterior deltoid', 'Chest'],
    equipment: 'Barbell / Flat Bench',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 10
  },

  // CORE
  {
    id: 'wger_plank',
    name: 'Plank',
    category: 'Core',
    muscles: ['Rectus abdominis', 'Transverse abdominis', 'Obliques', 'Core'],
    equipment: 'Bodyweight / Mat',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 30,
    defaultRepMax: 60
  },
  {
    id: 'wger_hanging_leg_raise',
    name: 'Hanging Leg Raise / Knee Raise',
    category: 'Core',
    muscles: ['Rectus abdominis', 'Iliopsoas', 'Lower Abs'],
    equipment: 'Pull-up Bar / Captains Chair',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 10,
    defaultRepMax: 15
  },
  {
    id: 'wger_cable_woodchopper',
    name: 'Cable Woodchopper',
    category: 'Core',
    muscles: ['Obliques', 'Transverse abdominis', 'Rotational Core'],
    equipment: 'Cable Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 15
  },
  {
    id: 'wger_ab_wheel_rollout',
    name: 'Ab Wheel Rollout',
    category: 'Core',
    muscles: ['Rectus abdominis', 'Transverse abdominis', 'Latissimus dorsi'],
    equipment: 'Ab Wheel',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
  },
  {
    id: 'wger_russian_twist',
    name: 'Russian Twists',
    category: 'Core',
    muscles: ['Obliques', 'Rectus abdominis'],
    equipment: 'Bodyweight / Weight Plate',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 15,
    defaultRepMax: 20
  },

  // CARDIO / FULL BODY
  {
    id: 'wger_kettlebell_swing',
    name: 'Kettlebell Swing',
    category: 'Full Body',
    muscles: ['Gluteus maximus', 'Hamstrings', 'Core', 'Cardiovascular System'],
    equipment: 'Kettlebell',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 15,
    defaultRepMax: 20
  },
  {
    id: 'wger_burpees',
    name: 'Burpees',
    category: 'Full Body',
    muscles: ['Cardiovascular System', 'Chest', 'Quadriceps', 'Core'],
    equipment: 'Bodyweight',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 30,
    defaultRepMax: 60
  },
  {
    id: 'wger_rowing_machine',
    name: 'Rowing Machine (Ergometer)',
    category: 'Cardio',
    muscles: ['Cardiovascular System', 'Latissimus dorsi', 'Legs', 'Core'],
    equipment: 'Rowing Machine',
    type: 'timed',
    defaultSets: 1,
    defaultRepMin: 300,
    defaultRepMax: 900
  },
  {
    id: 'wger_jump_rope',
    name: 'Jump Rope',
    category: 'Cardio',
    muscles: ['Cardiovascular System', 'Calves', 'Shoulders'],
    equipment: 'Jump Rope',
    type: 'timed',
    defaultSets: 3,
    defaultRepMin: 60,
    defaultRepMax: 180
  }
];
