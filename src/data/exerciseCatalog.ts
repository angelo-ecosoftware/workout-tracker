export * from '../constants/exerciseCatalog.ts';

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
    defaultRepMax: 15
  },
  {
    id: 'wger_dips_chest',
    name: 'Dips (Chest / Triceps)',
    category: 'Chest',
    muscles: ['Lower Pectoralis', 'Triceps brachii', 'Anterior deltoid'],
    equipment: 'Bodyweight / Parallel Bars',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 8,
    defaultRepMax: 12
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
    defaultRepMax: 10
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
    defaultRepMax: 12
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
    defaultRepMax: 15
  },
  {
    id: 'wger_rear_delt_fly',
    name: 'Rear Delt Flyes (Machine or Dumbbell)',
    category: 'Shoulders',
    muscles: ['Posterior deltoid', 'Rhomboids', 'Trapezius', 'Rear Delts'],
    equipment: 'Dumbbells / Machine',
    type: 'strength',
    defaultSets: 3,
    defaultRepMin: 12,
    defaultRepMax: 20
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
    defaultRepMax: 12
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
    defaultRepMax: 12
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
    defaultRepMax: 15
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
    defaultRepMax: 12
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
    defaultRepMax: 15
  },
  {
    id: 'wger_hanging_leg_raises',
    name: 'Hanging Leg / Knee Raises',
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
    defaultRepMax: 15
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
    defaultRepMax: 120
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
    defaultRepMax: 600
  }
];
