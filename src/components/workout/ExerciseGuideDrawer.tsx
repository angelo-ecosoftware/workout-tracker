import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Loader2,
  Edit3,
  Save,
  Check,
} from 'lucide-react';
import { MuscleAnatomyHeatmap } from './anatomy/MuscleAnatomyHeatmap.tsx';
import {
  getExerciseDetailsWithMedia,
  inferAccurateAnatomy,
  ExerciseApiDetails,
} from '../../lib/exerciseApiService.ts';
import { formatSingleExerciseName } from '../../lib/exerciseSearch.ts';
import { CustomExerciseCues } from '../../models.ts';
import { saveExerciseCustomCues } from '../../lib/exerciseCustomCuesService.ts';
import { SuccessModal } from '../ui/SuccessModal.tsx';

interface ExerciseGuideDrawerProps {
  isOpen: boolean;
  exerciseName: string;
  exerciseId?: string;
  userId?: string;
  initialCustomCues?: CustomExerciseCues;
  onClose: () => void;
}

export const ExerciseGuideDrawer: React.FC<ExerciseGuideDrawerProps> = ({
  isOpen,
  exerciseName,
  exerciseId,
  userId,
  initialCustomCues,
  onClose,
}) => {
  const [activePhase, setActivePhase] = useState<'setup' | 'peak'>('setup');
  const [details, setDetails] = useState<ExerciseApiDetails | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Custom Form Cues & Local GIF state
  const [isEditingCues, setIsEditingCues] = useState(false);
  const [customCues, setCustomCues] = useState<CustomExerciseCues>(initialCustomCues || {});
  const [customGifUrl, setCustomGifUrl] = useState<string>('');
  const [isSavingCues, setIsSavingCues] = useState(false);
  const [cueSaveMsg, setCueSaveMsg] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Section anchor refs for auto-scroll into view when toggling edit mode
  const motionCardRef = useRef<HTMLDivElement>(null);
  const bioCuesCardRef = useRef<HTMLDivElement>(null);

  // Load custom GIF from local storage strictly per user device
  useEffect(() => {
    if (exerciseId && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(`custom_exercise_gif_${exerciseId}`);
        if (stored) setCustomGifUrl(stored);
      } catch {}
    }
  }, [exerciseId, isOpen]);

  useEffect(() => {
    if (initialCustomCues) {
      setCustomCues(initialCustomCues);
    }
  }, [initialCustomCues]);

  // Guarantee strictly single-exercise format without compound alternatives
  const singleExerciseName = useMemo(() => {
    return formatSingleExerciseName(exerciseName);
  }, [exerciseName]);

  // Synchronous accurate anatomy fallback ensures 0ms latency on open
  const fallbackAnatomy = useMemo(() => {
    return inferAccurateAnatomy(singleExerciseName);
  }, [singleExerciseName]);

  const primaryMuscles = useMemo(() => {
    if (details?.targetMuscles && details.targetMuscles.length > 0) {
      return details.targetMuscles;
    }
    return fallbackAnatomy.primary;
  }, [details, fallbackAnatomy]);

  const defaultSetupCue =
    'Lock scapulae in place, engage your core, and lower the load under complete control for 2–3 seconds without letting joints collapse.';
  const defaultPeakCue = `Drive forcefully through your ${primaryMuscles[0] || 'primary muscles'}, pause for 1 second at maximum muscle shortening, and avoid hyperextension.`;
  const defaultBioCues = [
    'Set the Base: Brace your core, lock the scapulae, and verify symmetric grip/stance before moving the load.',
    'Controlled Eccentric: Lower the weight in a smooth 2–3 second tempo to maximize muscle tension and joint longevity.',
    'Explosive Concentric: Drive through the primary target muscles without hyperextending or bouncing out of the hole.',
  ];

  const handleToggleEdit = (targetSection?: 'motion' | 'biocues') => {
    if (!isEditingCues) {
      // Pre-fill existing defaults into customCues if empty so athlete directly modifies what is already there
      setCustomCues(prev => ({
        setup: prev.setup ?? defaultSetupCue,
        peak: prev.peak ?? defaultPeakCue,
        cues: prev.cues && prev.cues.length > 0 ? prev.cues : defaultBioCues,
      }));
      setIsEditingCues(true);

      // Smooth scroll the targeted card into view so the user immediately sees the form spring into place
      setTimeout(() => {
        if (targetSection === 'biocues' && bioCuesCardRef.current && typeof bioCuesCardRef.current.scrollIntoView === 'function') {
          bioCuesCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (motionCardRef.current && typeof motionCardRef.current.scrollIntoView === 'function') {
          motionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    } else {
      setIsEditingCues(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !singleExerciseName) return;

    let isSubscribed = true;
    setLoadingMedia(true);
    setImageError(false);

    getExerciseDetailsWithMedia(singleExerciseName)
      .then((data) => {
        if (isSubscribed) {
          setDetails(data);
          setLoadingMedia(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load exercise details:', err);
        if (isSubscribed) {
          setLoadingMedia(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, singleExerciseName]);

  const secondaryMuscles = useMemo(() => {
    if (details?.secondaryMuscles && details.secondaryMuscles.length > 0) {
      return details.secondaryMuscles;
    }
    return fallbackAnatomy.secondary;
  }, [details, fallbackAnatomy]);

  const equipment = details?.equipments?.[0] || fallbackAnatomy.equipment;
  const category = details?.bodyParts?.[0] || fallbackAnatomy.category;

  // Clean raw exercise names (e.g. "Pull-ups / Lat Pulldown" or "Bench Press (barbell or dumbbell)")
  // to concise search terms that mobile app search handlers can reliably ingest without truncation
  const cleanSearchTerm = useMemo(() => {
    if (!singleExerciseName) return 'exercise';
    return singleExerciseName
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .split('/')[0] // Take primary movement name if slashed
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [singleExerciseName]);

  const youtubeTutorialUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    cleanSearchTerm + ' proper form tutorial biomechanics'
  )}`;

  // On mobile TikTok, opening tiktok.com/search?q= directly inside in-app webviews
  // often drops the query parameter and shows blank recent searches.
  // Using clean query terms and handling universal link fallbacks ensures direct execution.
  const tiktokWebUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(
    cleanSearchTerm + ' form tutorial'
  )}`;

  const handleOpenTikTok = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if user is on mobile
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      e.preventDefault();
      const encodedQuery = encodeURIComponent(cleanSearchTerm + ' form tutorial');
      // Native app deep-link schemes for TikTok on iOS & Android
      const appSchemeUrl = `snssdk1233://search/result?keyword=${encodedQuery}`;
      const tiktokAppUrl = `tiktok://search?keyword=${encodedQuery}`;

      const fallbackTimer = setTimeout(() => {
        window.open(tiktokWebUrl, '_blank', 'noopener,noreferrer');
      }, 700);

      try {
        // Attempt opening app directly
        window.location.href = tiktokAppUrl;
      } catch {
        clearTimeout(fallbackTimer);
        window.open(tiktokWebUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const instructionsList = useMemo(() => {
    if (details?.instructions && details.instructions.length > 0) {
      return details.instructions;
    }

    return [
      `Set up your position and align equipment with ${equipment}.`,
      `Brace your core, lock your scapulae, and verify symmetric grip and stance.`,
      `Inhale on the controlled eccentric descent (2–3 seconds), maintaining consistent joint angles.`,
      `Exhale and explosively drive through your ${primaryMuscles[0] || 'target muscles'}, squeezing firmly at peak contraction.`,
    ];
  }, [details, equipment, primaryMuscles]);

  const handleSaveCustomCues = async () => {
    setIsSavingCues(true);
    setCueSaveMsg(null);

    // 1. Save custom GIF strictly to local storage to avoid polluting remote database
    if (exerciseId && typeof localStorage !== 'undefined') {
      try {
        if (customGifUrl.trim()) {
          localStorage.setItem(`custom_exercise_gif_${exerciseId}`, customGifUrl.trim());
        } else {
          localStorage.removeItem(`custom_exercise_gif_${exerciseId}`);
        }
      } catch {}
    }

    // 2. Save motion & biomechanical cues to Supabase if exerciseId & userId available
    if (exerciseId && userId) {
      await saveExerciseCustomCues(exerciseId, userId, customCues);
    }

    setIsSavingCues(false);
    setIsEditingCues(false);
    setIsSuccessModalOpen(true);
  };

  const effectiveGifUrl = customGifUrl.trim() || details?.gifUrl || null;

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
              {singleExerciseName}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleEdit('motion')}
              title="Customize motion phases & form cues"
              aria-label="Customize motion phases & form cues"
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isEditingCues
                  ? 'bg-[#C0FF00] border-[#C0FF00] text-black font-bold'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close exercise guide"
              className="p-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pt-3 pr-1 scrollbar-none flex-1">
          {/* Animated Demonstration GIF Container & Inline GIF Override */}
          <div className="space-y-2">
            {effectiveGifUrl && !imageError && (
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#141414] shadow-lg flex items-center justify-center min-h-[160px] max-h-[220px]">
                <img
                  src={effectiveGifUrl}
                  alt={`${singleExerciseName} animated demonstration`}
                  className="w-full h-full object-contain max-h-[200px]"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-[#333] text-[9px] font-mono text-[#C0FF00] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  {customGifUrl ? 'Custom Demo' : 'Animated Demo'}
                </div>
              </div>
            )}

            {isEditingCues && (
              <div className="bg-[#141414] border border-[#282828] rounded-xl p-3 space-y-1.5">
                <label className="block text-[10px] font-mono text-[#C0FF00] font-bold uppercase tracking-wider">
                  Custom Demo GIF URL (Stored on this device only)
                </label>
                <input
                  type="url"
                  value={customGifUrl}
                  onChange={(e) => setCustomGifUrl(e.target.value)}
                  placeholder="https://example.com/demo.gif"
                  className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                />
                <span className="text-[9px] font-mono text-gray-500 block">
                  Safe local override — does not pollute remote database.
                </span>
              </div>
            )}
          </div>

          {/* Accurate Anatomical Heatmap */}
          <div>
            <MuscleAnatomyHeatmap
              primaryMuscles={primaryMuscles}
              secondaryMuscles={secondaryMuscles}
            />
          </div>

          {/* Dual-Phase Movement Execution Frame - IN-PLACE EDITABLE */}
          <div
            ref={motionCardRef}
            className={`rounded-2xl p-4 space-y-3 transition-all ${
              isEditingCues
                ? 'bg-[#151515] border-2 border-[#C0FF00]/50 shadow-[0_0_15px_rgba(192,255,0,0.08)]'
                : 'bg-[#141414] border border-[#222222]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white">
                <Sparkles className="w-4 h-4 text-[#C0FF00]" />
                <span>Motion & Form Phases</span>
                {isEditingCues && (
                  <span className="text-[9px] text-[#C0FF00] bg-[#C0FF00]/15 border border-[#C0FF00]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    EDITING
                  </span>
                )}
              </div>

              {!isEditingCues ? (
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
              ) : null}
            </div>

            {isEditingCues ? (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider">
                      Phase 1: Starting Position & Eccentric Phase
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={customCues.setup ?? ''}
                    onChange={(e) => setCustomCues(prev => ({ ...prev, setup: e.target.value }))}
                    placeholder="Describe foot placement, grip, and eccentric control..."
                    className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl p-2.5 text-xs text-white outline-none resize-none font-sans"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider">
                      Phase 2: Concentric Lockout & Peak Contraction
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={customCues.peak ?? ''}
                    onChange={(e) => setCustomCues(prev => ({ ...prev, peak: e.target.value }))}
                    placeholder="Describe drive direction, pause time, and peak squeeze..."
                    className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl p-2.5 text-xs text-white outline-none resize-none font-sans"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-[#181818] border border-[#262626] rounded-xl p-3 text-xs font-sans">
                {activePhase === 'setup' ? (
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider block">
                      Starting Position & Eccentric Phase
                    </span>
                    <p className="text-gray-300">
                      {customCues.setup?.trim() || defaultSetupCue}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-[#C0FF00] uppercase tracking-wider block">
                      Concentric Lockout & Peak Contraction
                    </span>
                    <p className="text-gray-300">
                      {customCues.peak?.trim() || defaultPeakCue}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Cues & Biomechanical Technique Steps - IN-PLACE EDITABLE */}
          <div
            ref={bioCuesCardRef}
            className={`rounded-2xl p-4 space-y-3 transition-all ${
              isEditingCues
                ? 'bg-[#151515] border-2 border-[#C0FF00]/50 shadow-[0_0_15px_rgba(192,255,0,0.08)]'
                : 'bg-[#141414] border border-[#222222]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#C0FF00]">
                <ShieldCheck className="w-4 h-4" />
                <span>Biomechanical Form Cues</span>
                {isEditingCues && (
                  <span className="text-[9px] text-[#C0FF00] bg-[#C0FF00]/15 border border-[#C0FF00]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    EDITING
                  </span>
                )}
              </div>
            </div>

            {isEditingCues ? (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                  Key Technique & Safety Rules (1 per line)
                </span>
                <textarea
                  rows={4}
                  value={(customCues.cues && customCues.cues.length > 0 ? customCues.cues : defaultBioCues).join('\n')}
                  onChange={(e) =>
                    setCustomCues(prev => ({
                      ...prev,
                      cues: e.target.value.split('\n').filter(line => line.trim().length > 0),
                    }))
                  }
                  placeholder="Add bullet points here..."
                  className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl p-2.5 text-xs text-white outline-none resize-none font-sans"
                />
              </div>
            ) : (
              <ul className="space-y-2.5 text-xs font-sans text-gray-300">
                {(customCues.cues && customCues.cues.length > 0 ? customCues.cues : defaultBioCues).map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00] shrink-0 mt-0.5" />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            )}

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
                href={tiktokWebUrl}
                onClick={handleOpenTikTok}
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

        {/* Edit Mode Sticky Action Bar OR Standard Close Button */}
        <div className="pt-3 border-t border-[#202020] mt-2 shrink-0">
          {isEditingCues ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingCues(false)}
                className="w-1/3 py-3 px-3 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#333] text-gray-300 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomCues}
                disabled={isSavingCues}
                className="w-2/3 py-3 px-4 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingCues ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3] text-black" />
                )}
                <span>{isSavingCues ? 'Saving Cues...' : 'Save Changes'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#333] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
            >
              Close Guide
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Success Modal for custom cue updates */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Successfully Updated"
        message="Your custom motion phases and biomechanical form cues have been saved."
      />
    </div>
  );
};
