import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Zap, Dumbbell, Info, Ban } from 'lucide-react';
import { Exercise, UserProfile } from '../../../models.ts';
import { WgerExerciseInfo } from '../WgerExerciseInfo.tsx';
import { ExerciseSetRow } from './ExerciseSetRow.tsx';
import { ExerciseGuideDrawer } from '../ExerciseGuideDrawer.tsx';
import { formatSingleExerciseName } from '../../../lib/exerciseSearch.ts';
import {
  getExerciseThumbnailSync,
  getExerciseDetailsWithMedia,
} from '../../../lib/exerciseApiService.ts';

interface ExerciseCardProps {
  exercise: Exercise;
  userProfile: UserProfile | null;
  inputs: Record<
    string,
    {
      weight?: string;
      reps?: string;
      durationSeconds?: string;
      difficulty?: string;
      completed?: boolean;
      completedAt?: string;
    }
  >;
  isExpanded: boolean;
  isSkipped?: boolean;
  isSequentialSetMode?: boolean;
  routeExerciseId?: string | null;
  routeExerciseMode?: 'info' | 'edit' | null;
  advice: { action: 'increase' | 'keep' | 'deload'; details: string };
  onToggleExpand: () => void;
  onToggleSkip?: (exerciseId: string) => void;
  onOpenGuide?: (exerciseId: string) => void;
  onCloseGuide?: () => void;
  onEditGuide?: (editing: boolean) => void;
  onUpdateInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    delta: number
  ) => void;
  onTextInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    value: string
  ) => void;
  onToggleCompleted?: (key: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = React.memo(({
  exercise,
  userProfile,
  inputs,
  isExpanded,
  isSkipped = false,
  isSequentialSetMode = false,
  routeExerciseId = null,
  routeExerciseMode = null,
  advice,
  onToggleExpand,
  onToggleSkip,
  onOpenGuide,
  onCloseGuide,
  onEditGuide,
  onUpdateInput,
  onTextInput,
  onToggleCompleted,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const isGuideRouteOpen = routeExerciseId === exercise.id;
  const guideIsOpen = onOpenGuide ? isGuideRouteOpen : isGuideOpen;
  const openGuide = () => {
    if (onOpenGuide) {
      onOpenGuide(exercise.id);
    } else {
      setIsGuideOpen(true);
    }
  };
  const closeGuide = () => {
    if (onCloseGuide) {
      onCloseGuide();
    } else {
      setIsGuideOpen(false);
    }
  };
  const [gifUrl, setGifUrl] = useState<string | null>(() =>
    getExerciseThumbnailSync(exercise.name, exercise.id)
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Check local synchronous cache first to prevent external network calls
    const syncThumbnail = getExerciseThumbnailSync(exercise.name, exercise.id);
    if (syncThumbnail) {
      setGifUrl(syncThumbnail);
      setImgError(false);
      return;
    }

    // Lazy load image media only if card is visible / expanded or missing thumbnail
    if (!gifUrl) {
      getExerciseDetailsWithMedia(exercise.name)
        .then((res) => {
          if (isMounted && res?.gifUrl) {
            setGifUrl(res.gifUrl);
            setImgError(false);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [exercise.name, exercise.id]);

  const cachedEx = userProfile?.lastSetSummaryPerExercise?.[exercise.id];
  const displayName = formatSingleExerciseName(exercise.name);

  return (
    <div
      className={`rounded-[24px] shadow-xl transition-all ${
        isSkipped
          ? 'bg-[#0d0d0d] border border-dashed border-[#262626] p-4 opacity-75'
          : isExpanded
          ? 'bg-[#111] border border-[#333] p-5 space-y-4'
          : 'bg-[#111] border border-[#222] hover:border-[#333] p-4'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        className={`w-full flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 cursor-pointer text-left ${
          isExpanded && !isSkipped ? 'border-b border-[#1f1f1f] pb-3' : ''
        }`}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  openGuide();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    openGuide();
                  }
                }}
                title={`Open form guide for ${displayName}`}
                aria-label={`Open form guide for ${displayName}`}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#161616] border border-[#2a2a2a] hover:border-[#C0FF00]/60 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-md group/thumb"
              >
                {gifUrl && !imgError ? (
                  <img
                    src={gifUrl}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                    onError={() => setImgError(true)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#181818] text-gray-500 group-hover/thumb:text-[#C0FF00] transition-colors">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <h4
                    className={`font-display font-black text-base tracking-tight uppercase transition-colors ${
                      isSkipped
                        ? 'text-gray-500 line-through'
                        : isExpanded
                        ? 'text-white'
                        : 'text-gray-300 hover:text-[#C0FF00]'
                    }`}
                  >
                    {displayName}
                  </h4>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openGuide();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        openGuide();
                      }
                    }}
                    title={`View guide & muscle anatomy for ${displayName}`}
                    aria-label={`View guide & muscle anatomy for ${displayName}`}
                    className="p-1 rounded-md text-gray-400 hover:text-[#C0FF00] hover:bg-[#1a1a1a] transition-colors cursor-pointer shrink-0 mt-0.5"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </div>

                <p className="font-sans text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-1">
                  {isSkipped ? (
                    <span className="text-amber-400/90 font-mono text-[10px] font-bold">
                      ⊘ Skipped for this session • No sets will be logged
                    </span>
                  ) : (
                    <>
                      Target Volume:{' '}
                      <span className="text-white font-mono font-bold">
                        {exercise.targetSets} sets × {exercise.targetRepMin}-{exercise.targetRepMax}{' '}
                        {exercise.type === 'timed' ? 'seconds' : 'reps'}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start ml-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSkip && onToggleSkip(exercise.id);
                }}
                title={isSkipped ? 'Restore exercise to current session' : "Didn't do this exercise? Skip for this session"}
                aria-label={isSkipped ? `Restore ${displayName}` : `Skip ${displayName}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  isSkipped
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-[#181818] hover:bg-neutral-800 text-gray-400 hover:text-white border border-[#2a2a2a]'
                }`}
              >
                <Ban className="w-3 h-3" />
                <span>{isSkipped ? 'Skipped (Undo)' : 'Skip'}</span>
              </button>

              {isExpanded ? (
                <div className="p-2 sm:p-1.5 text-[#C0FF00] bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors pointer-events-none">
                  <ChevronUp className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                </div>
              ) : (
                <div className="p-2 sm:p-1.5 text-gray-400 bg-[#1a1a1a] rounded-lg border border-[#333] transition-colors pointer-events-none">
                  <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>

        {!isSkipped && advice.action === 'increase' && (
          <div className="flex items-center gap-3">
            <div className="bg-[#C0FF00] text-black rounded-xl px-3 py-1 flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(192,255,0,0.15)]">
              <Zap className="w-3.5 h-3.5 fill-black text-black" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight font-sans">
                {advice.details}
              </span>
            </div>
          </div>
        )}
      </div>

      {isExpanded && isSkipped && (
        <div className="bg-[#141414] border border-[#222] rounded-xl p-3.5 text-center text-xs font-mono text-gray-400 flex items-center justify-between gap-3">
          <span>Exercise marked as skipped for this workout session.</span>
          <button
            type="button"
            onClick={() => onToggleSkip && onToggleSkip(exercise.id)}
            className="text-[#C0FF00] hover:underline font-bold text-xs cursor-pointer shrink-0"
          >
            Restore Exercise
          </button>
        </div>
      )}

      {isExpanded && !isSkipped && (
        <>
          <WgerExerciseInfo exerciseName={displayName} />

          {advice.action === 'keep' && cachedEx && (
            <div className="bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-xl px-3 py-1.5 flex items-center gap-1.5 self-start">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wide text-gray-400">
                {advice.details}
              </span>
            </div>
          )}

          {cachedEx && (
            <div className="bg-[#1a1a1a] rounded-xl border border-[#222] p-3 flex flex-col gap-2 text-[10px] font-mono text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-extrabold text-[8px] uppercase tracking-widest text-[#C0FF00] border border-[#C0FF00]/40 px-1.5 py-0.5 rounded">
                  LAST LOG
                </span>
              </div>
              <div className="flex items-center gap-4">
                {exercise.type === 'timed' ? (
                  <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                    <span className="text-white font-bold">{cachedEx.lastDurationSeconds}s</span>
                  </div>
                ) : (
                  <div className="bg-[#222] border border-[#333] px-2 py-1.5 rounded-lg">
                    <span className="text-white font-bold">{cachedEx.lastWeight}kg</span>
                    <span className="mx-1 text-gray-600">x</span>
                    <span className="text-[#C0FF00] font-bold">{cachedEx.lastReps}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider px-1.5 sm:px-2.5 pb-1 border-b border-[#222]">
              <div className="col-span-2 sm:col-span-2 flex items-center">
                <span>SET</span>
              </div>
              <div className="col-span-5 sm:col-span-5 text-center">
                {exercise.type === 'timed' ? 'DURATION (S)' : 'WEIGHT (KG)'}
              </div>
              <div className="col-span-5 sm:col-span-5 text-center">
                {exercise.type === 'timed' ? 'DIFF (1-10)' : 'REPS'}
              </div>
            </div>

            {(() => {
              let firstUncompletedIndex = -1;
              for (let i = 1; i <= exercise.targetSets; i++) {
                const k = `${exercise.id}-${i}`;
                if (!inputs[k]?.completed) {
                  firstUncompletedIndex = i;
                  break;
                }
              }

              const setsToRender: number[] = [];
              if (isSequentialSetMode) {
                if (firstUncompletedIndex !== -1) {
                  setsToRender.push(firstUncompletedIndex);
                } else {
                  setsToRender.push(exercise.targetSets);
                }
              } else {
                for (let i = 1; i <= exercise.targetSets; i++) {
                  setsToRender.push(i);
                }
              }

              return setsToRender.map((setNum) => {
                const inputKey = `${exercise.id}-${setNum}`;
                const values = inputs[inputKey] || {
                  weight: '20',
                  reps: '10',
                  durationSeconds: '30',
                  difficulty: '7',
                };
                const isCurrent = setNum === firstUncompletedIndex;

                return (
                  <ExerciseSetRow
                    key={setNum}
                    exercise={exercise}
                    setNum={setNum}
                    inputKey={inputKey}
                    values={values}
                    isCurrent={isCurrent}
                    onUpdateInput={onUpdateInput}
                    onTextInput={onTextInput}
                    onToggleCompleted={onToggleCompleted}
                  />
                );
              });
            })()}
          </div>
        </>
      )}

      <ExerciseGuideDrawer
        isOpen={guideIsOpen}
        exerciseName={displayName}
        exerciseId={exercise.id}
        userId={userProfile?.userId}
        initialCustomCues={exercise.customCues}
        editMode={isGuideRouteOpen ? routeExerciseMode === 'edit' : undefined}
        onEditModeChange={onEditGuide}
        onClose={closeGuide}
      />
    </div>
  );
});