import React from 'react';

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'traps'
  | 'lower_back';

interface MuscleAnatomyHeatmapProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  highlightColor?: string;
  secondaryColor?: string;
  className?: string;
}

/**
 * Normalizes any freeform or catalog muscle string (e.g. "Pectoralis major", "Latissimus dorsi", "Quads")
 * to our canonical MuscleGroup enum keys.
 */
export function normalizeMuscleToGroup(muscleName: string): MuscleGroup | null {
  const m = muscleName.toLowerCase().trim();

  if (m.includes('chest') || m.includes('pectoral') || m.includes('pec')) return 'chest';
  if (m.includes('shoulder') || m.includes('deltoid') || m.includes('delt')) return 'shoulders';
  if (m.includes('bicep') || m.includes('brachialis')) return 'biceps';
  if (m.includes('tricep')) return 'triceps';
  if (m.includes('forearm') || m.includes('brachioradialis') || m.includes('wrist')) return 'forearms';
  if (m.includes('lat') || m.includes('rhomboid') || m.includes('upper back')) return 'lats';
  if (m.includes('trap') || m.includes('neck')) return 'traps';
  if (m.includes('lower back') || m.includes('erector')) return 'lower_back';
  if (m.includes('oblique')) return 'obliques';
  if (m.includes('ab') || m.includes('core') || m.includes('rectus abdominis')) return 'abs';
  if (m.includes('glute') || m.includes('butt') || m.includes('hip')) return 'glutes';
  if (m.includes('quad') || m.includes('rectus femoris')) return 'quads';
  if (m.includes('hamstring') || m.includes('biceps femoris') || m.includes('posterior chain')) return 'hamstrings';
  if (m.includes('calf') || m.includes('calves') || m.includes('gastrocnemius') || m.includes('soleus')) return 'calves';

  return null;
}

export const MuscleAnatomyHeatmap: React.FC<MuscleAnatomyHeatmapProps> = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  highlightColor = '#C0FF00', // Neon Lime for primary
  secondaryColor = '#EF4444', // Red for secondary
  className = '',
}) => {
  // Map normalized muscle groups
  const primarySet = new Set<MuscleGroup>();
  primaryMuscles.forEach((name) => {
    const group = normalizeMuscleToGroup(name);
    if (group) primarySet.add(group);
  });

  const secondarySet = new Set<MuscleGroup>();
  secondaryMuscles.forEach((name) => {
    const group = normalizeMuscleToGroup(name);
    if (group && !primarySet.has(group)) secondarySet.add(group);
  });

  const getMuscleFill = (group: MuscleGroup): string => {
    if (primarySet.has(group)) return highlightColor;
    if (secondarySet.has(group)) return secondaryColor;
    return '#222222'; // Neutral unengaged silhouette
  };

  const getMuscleOpacity = (group: MuscleGroup): number => {
    if (primarySet.has(group)) return 1.0;
    if (secondarySet.has(group)) return 0.85;
    return 0.45;
  };

  return (
    <div
      className={`bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col items-center select-none ${className}`}
      role="figure"
      aria-label="Target Muscle Anatomy Heatmap"
    >
      <div className="flex items-center justify-between w-full mb-3 px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: highlightColor }} />
          <span>Primary Target</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
          <span>Secondary / Synergist</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs items-center justify-center">
        {/* ========================================================
            ANTERIOR (FRONT) BODY VIEW
        ======================================================== */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Anterior (Front)
          </span>
          <svg
            viewBox="0 0 100 200"
            className="w-full h-48 max-w-[130px] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            {/* Head & Neck */}
            <circle cx="50" cy="15" r="10" fill="#2a2a2a" stroke="#383838" strokeWidth="1" />
            <rect x="46" y="24" width="8" height="6" rx="2" fill="#2a2a2a" />

            {/* Traps (Anterior visible) */}
            <path
              d="M 40 26 L 50 24 L 60 26 L 68 34 L 32 34 Z"
              fill={getMuscleFill('traps')}
              opacity={getMuscleOpacity('traps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Shoulders / Deltoids (Left & Right) */}
            <path
              d="M 28 34 Q 22 40 24 50 Q 32 48 34 38 Z"
              fill={getMuscleFill('shoulders')}
              opacity={getMuscleOpacity('shoulders')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 72 34 Q 78 40 76 50 Q 68 48 66 38 Z"
              fill={getMuscleFill('shoulders')}
              opacity={getMuscleOpacity('shoulders')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Chest / Pectorals */}
            <path
              d="M 34 36 Q 49 37 49 48 Q 36 52 32 46 Z"
              fill={getMuscleFill('chest')}
              opacity={getMuscleOpacity('chest')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 66 36 Q 51 37 51 48 Q 64 52 68 46 Z"
              fill={getMuscleFill('chest')}
              opacity={getMuscleOpacity('chest')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Biceps (Left & Right Front) */}
            <path
              d="M 23 50 Q 20 62 25 72 Q 29 68 28 54 Z"
              fill={getMuscleFill('biceps')}
              opacity={getMuscleOpacity('biceps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 77 50 Q 80 62 75 72 Q 71 68 72 54 Z"
              fill={getMuscleFill('biceps')}
              opacity={getMuscleOpacity('biceps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Forearms (Left & Right) */}
            <path
              d="M 24 73 Q 18 88 19 104 Q 24 100 27 80 Z"
              fill={getMuscleFill('forearms')}
              opacity={getMuscleOpacity('forearms')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 76 73 Q 82 88 81 104 Q 76 100 73 80 Z"
              fill={getMuscleFill('forearms')}
              opacity={getMuscleOpacity('forearms')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Abs / Rectus Abdominis */}
            <path
              d="M 42 50 L 58 50 L 56 82 L 44 82 Z"
              fill={getMuscleFill('abs')}
              opacity={getMuscleOpacity('abs')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Obliques (Sides of Core) */}
            <path
              d="M 34 50 L 41 50 L 43 80 L 36 78 Z"
              fill={getMuscleFill('obliques')}
              opacity={getMuscleOpacity('obliques')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 66 50 L 59 50 L 57 80 L 64 78 Z"
              fill={getMuscleFill('obliques')}
              opacity={getMuscleOpacity('obliques')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Pelvis / Hips */}
            <path d="M 37 82 L 63 82 L 57 95 L 43 95 Z" fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="1" />

            {/* Quadriceps (Left & Right) */}
            <path
              d="M 36 94 Q 31 115 35 140 Q 46 142 47 110 Q 48 95 44 94 Z"
              fill={getMuscleFill('quads')}
              opacity={getMuscleOpacity('quads')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 64 94 Q 69 115 65 140 Q 54 142 53 110 Q 52 95 56 94 Z"
              fill={getMuscleFill('quads')}
              opacity={getMuscleOpacity('quads')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Knees */}
            <circle cx="41" cy="144" r="4" fill="#2a2a2a" />
            <circle cx="59" cy="144" r="4" fill="#2a2a2a" />

            {/* Calves (Anterior tibialis & gastrocnemius edges) */}
            <path
              d="M 36 148 Q 33 165 37 186 L 44 186 Q 46 166 43 148 Z"
              fill={getMuscleFill('calves')}
              opacity={getMuscleOpacity('calves')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 64 148 Q 67 165 63 186 L 56 186 Q 54 166 57 148 Z"
              fill={getMuscleFill('calves')}
              opacity={getMuscleOpacity('calves')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Feet */}
            <ellipse cx="40" cy="191" rx="5" ry="3" fill="#2a2a2a" />
            <ellipse cx="60" cy="191" rx="5" ry="3" fill="#2a2a2a" />
          </svg>
        </div>

        {/* ========================================================
            POSTERIOR (BACK) BODY VIEW
        ======================================================== */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 mb-1.5">
            Posterior (Back)
          </span>
          <svg
            viewBox="0 0 100 200"
            className="w-full h-48 max-w-[130px] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          >
            {/* Head & Neck (Back) */}
            <circle cx="50" cy="15" r="10" fill="#2a2a2a" stroke="#383838" strokeWidth="1" />
            <rect x="46" y="24" width="8" height="6" rx="2" fill="#2a2a2a" />

            {/* Upper Trapezius */}
            <path
              d="M 50 25 L 36 34 L 50 50 L 64 34 Z"
              fill={getMuscleFill('traps')}
              opacity={getMuscleOpacity('traps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Rear Deltoids (Left & Right) */}
            <path
              d="M 28 34 Q 22 42 24 50 Q 33 46 35 36 Z"
              fill={getMuscleFill('shoulders')}
              opacity={getMuscleOpacity('shoulders')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 72 34 Q 78 42 76 50 Q 67 46 65 36 Z"
              fill={getMuscleFill('shoulders')}
              opacity={getMuscleOpacity('shoulders')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Lats (Latissimus Dorsi / Rhomboids) */}
            <path
              d="M 36 38 L 49 50 L 47 75 L 34 65 Z"
              fill={getMuscleFill('lats')}
              opacity={getMuscleOpacity('lats')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 64 38 L 51 50 L 53 75 L 66 65 Z"
              fill={getMuscleFill('lats')}
              opacity={getMuscleOpacity('lats')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Triceps (Back of arms) */}
            <path
              d="M 23 50 Q 19 64 24 74 Q 28 68 27 52 Z"
              fill={getMuscleFill('triceps')}
              opacity={getMuscleOpacity('triceps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 77 50 Q 81 64 76 74 Q 72 68 73 52 Z"
              fill={getMuscleFill('triceps')}
              opacity={getMuscleOpacity('triceps')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Forearms (Posterior) */}
            <path
              d="M 23 74 Q 18 90 19 104 Q 24 100 26 80 Z"
              fill={getMuscleFill('forearms')}
              opacity={getMuscleOpacity('forearms')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 77 74 Q 82 90 81 104 Q 76 100 74 80 Z"
              fill={getMuscleFill('forearms')}
              opacity={getMuscleOpacity('forearms')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Lower Back (Erector Spinae) */}
            <path
              d="M 45 68 L 55 68 L 54 84 L 46 84 Z"
              fill={getMuscleFill('lower_back')}
              opacity={getMuscleOpacity('lower_back')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Glutes (Left & Right) */}
            <path
              d="M 37 84 Q 32 98 40 108 Q 49 104 48 85 Z"
              fill={getMuscleFill('glutes')}
              opacity={getMuscleOpacity('glutes')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 63 84 Q 68 98 60 108 Q 51 104 52 85 Z"
              fill={getMuscleFill('glutes')}
              opacity={getMuscleOpacity('glutes')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Hamstrings (Left & Right Back Thighs) */}
            <path
              d="M 38 108 Q 33 125 36 142 Q 47 142 47 114 Z"
              fill={getMuscleFill('hamstrings')}
              opacity={getMuscleOpacity('hamstrings')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 62 108 Q 67 125 64 142 Q 53 142 53 114 Z"
              fill={getMuscleFill('hamstrings')}
              opacity={getMuscleOpacity('hamstrings')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Knee Backs */}
            <circle cx="41" cy="144" r="3" fill="#2a2a2a" />
            <circle cx="59" cy="144" r="3" fill="#2a2a2a" />

            {/* Calves (Gastrocnemius & Soleus) */}
            <path
              d="M 36 146 Q 31 163 36 186 L 44 186 Q 47 165 44 146 Z"
              fill={getMuscleFill('calves')}
              opacity={getMuscleOpacity('calves')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <path
              d="M 64 146 Q 69 163 64 186 L 56 186 Q 53 165 56 146 Z"
              fill={getMuscleFill('calves')}
              opacity={getMuscleOpacity('calves')}
              stroke="#1a1a1a"
              strokeWidth="1"
            />

            {/* Heels */}
            <ellipse cx="40" cy="189" rx="4" ry="2.5" fill="#2a2a2a" />
            <ellipse cx="60" cy="189" rx="4" ry="2.5" fill="#2a2a2a" />
          </svg>
        </div>
      </div>
    </div>
  );
};
