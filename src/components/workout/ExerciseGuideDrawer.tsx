import React, { useState, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Dumbbell,
  ShieldCheck,
  Video,
  Info,
  Sparkles,
  CheckCircle2,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { MuscleAnatomyHeatmap } from './anatomy/MuscleAnatomyHeatmap.tsx';
import { WGER_EXERCISE_CATALOG } from '../../data/exerciseCatalog.ts';

interface ExerciseGuideDrawerProps {
  isOpen: boolean;
  exerciseName: string;
  onClose: () => void;
}

export const ExerciseGuideDrawer: React.FC<ExerciseGuideDrawerProps> = ({
  isOpen,
  exerciseName,
  onClose,
}) => {
  const [activePhase, setActivePhase] = useState<'setup' | 'peak'>('setup');

  const matchedCatalog = useMemo(() => {
    if (!exerciseName) return null;
    const clean = exerciseName.toLowerCase().trim();
    return (
      WGER_EXERCISE_CATALOG.find((e) => e.name.toLowerCase() === clean) ||
      WGER_EXERCISE_CATALOG.find((e) => clean.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(clean)) ||
      null
    );
  }, [exerciseName]);

  const primaryMuscles = matchedCatalog?.muscles || [exerciseName];
  const equipment = matchedCatalog?.equipment || 'Free Weights / Machines';
  const category = matchedCatalog?.category || 'Strength';

  const youtubeTutorialUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exerciseName + ' proper form tutorial biomechanics'
  )}`;

  const tiktokTutorialUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(
    exerciseName + ' form cues tutorial fitness'
  )}`;

  const instructionsList = useMemo(() => {
    if (matchedCatalog?.instructions && matchedCatalog.instructions.length > 0) {
      return matchedCatalog.instructions;
    }

    return [
      `Position equipment and adjust starting height to align with ${equipment}.`,
      `Brace your core, set shoulders back and down, and maintain full foot or bench contact.`,
      `Inhale on the controlled eccentric descent (2–3 seconds), maintaining consistent joint angles.`,
      `Exhale and explosively drive through your ${primaryMuscles[0] || 'target muscles'}, squeezing firmly at peak contraction.`,
    ];
  }, [matchedCatalog, equipment, primaryMuscles]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-guide-title"
    >
      <div className="bg-[#0f0f0f] border border-[#262626] rounded-t-[28px] sm:rounded-[32px] w-full max-w-lg p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[88vh] text-left">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C0FF00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#202020] relative">
          <div className="pr-4 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                {category}
              </span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                • {equipment}
              </span>
            </div>
            <h3
              id="exercise-guide-title"
              className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-tight truncate"
            >
              {exerciseName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise guide"
            className="p-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pt-3 pr-1 scrollbar-none">
          {/* P2.2: Interactive Anatomical Heatmap */}
          <div>
            <MuscleAnatomyHeatmap
              primaryMuscles={primaryMuscles}
              secondaryMuscles={['Core', 'Forearms']}
            />
          </div>

          {/* Dual-Phase Movement Execution Frame */}
          <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white">
                <Sparkles className="w-4 h-4 text-[#C0FF00]" />
                <span>Motion & Form Phases</span>
              </div>
              <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-xl border border-[#262626]">
                <button
                  type="button"
                  onClick={() => setActivePhase('setup')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePhase === 'setup'
                      ? 'bg-[#C0FF00] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  1. Setup
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhase('peak')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePhase === 'peak'
                      ? 'bg-[#C0FF00] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  2. Peak Squeeze
                </button>
              </div>
            </div>

            <div className="bg-[#181818] border border-[#262626] rounded-xl p-3 text-xs font-sans">
              {activePhase === 'setup' ? (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider block">
                    Starting Position & Eccentric Phase
                  </span>
                  <p className="text-gray-300">
                    Lock scapulae in place, engage your core, and lower the load under complete control for 2–3 seconds without letting joints collapse.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider block">
                    Concentric Lockout & Peak Contraction
                  </span>
                  <p className="text-gray-300">
                    Drive forcefully through your {primaryMuscles[0] || 'primary muscles'}, pause for 1 second at maximum muscle shortening, and avoid hyperextension.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Cues & Biomechanical Technique Steps */}
          <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#C0FF00]">
              <ShieldCheck className="w-4 h-4" />
              <span>Biomechanical Form Cues</span>
            </div>
            <ul className="space-y-2.5 text-xs font-sans text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Set the Base:</strong> Brace your core, lock the scapulae, and verify symmetric grip/stance before moving the load.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Controlled Eccentric:</strong> Lower the weight in a smooth 2–3 second tempo to maximize muscle tension and joint longevity.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Explosive Concentric:</strong> Drive through the primary target muscles without hyperextending or bouncing out of the hole.
                </span>
              </li>
            </ul>

            {/* Numbered Setup Instructions */}
            <div className="pt-2 border-t border-[#202020] space-y-1.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 block">
                Step-by-Step Instructions
              </span>
              <ol className="space-y-1.5 text-xs font-sans text-gray-300 list-decimal list-inside pl-1">
                {instructionsList.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-gray-200">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Video & Social Tutorial Links (YouTube 1080p + TikTok Form Cues) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* YouTube Tutorial Link */}
            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-3.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-display font-bold text-xs uppercase text-white block truncate">
                    Video Form Tutorial (1080p)
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block truncate">
                    YouTube Breakdown
                  </span>
                </div>
              </div>

              <a
                href={youtubeTutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-red-500/50 text-white font-mono text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <span>Watch</span>
                <ExternalLink className="w-3 h-3 text-red-400" />
              </a>
            </div>

            {/* TikTok Quick Form Cues Link */}
            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-3.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Flame className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                </div>
                <div className="min-w-0">
                  <span className="font-display font-bold text-xs uppercase text-white block truncate">
                    TikTok Form Cues
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block truncate">
                    Quick Gym Clips
                  </span>
                </div>
              </div>

              <a
                href={tiktokTutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] hover:border-cyan-400/50 text-white font-mono text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <span>Cues</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Done / Close Drawer Button */}
        <div className="pt-3 border-t border-[#202020] mt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#333] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
