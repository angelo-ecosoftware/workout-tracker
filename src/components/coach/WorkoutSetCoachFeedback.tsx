import React, { useState } from 'react';
import { MessageSquare, Video, Check, Plus, UserCheck, Play } from 'lucide-react';
import { WorkoutSetCoachFeedback as FeedbackModel } from '../../models.ts';
import { addWorkoutSetFeedback } from '../../lib/supabaseData.ts';

interface WorkoutSetCoachFeedbackProps {
  setId: string;
  sessionId: string;
  athleteId: string;
  coachId?: string;
  coachName?: string;
  isCoach?: boolean;
  feedbackList?: FeedbackModel[];
  onFeedbackAdded?: (newFeedback: FeedbackModel) => void;
}

export const WorkoutSetCoachFeedback: React.FC<WorkoutSetCoachFeedbackProps> = ({
  setId,
  sessionId,
  athleteId,
  coachId,
  coachName,
  isCoach = false,
  feedbackList = [],
  onFeedbackAdded,
}) => {
  const [isAddingCue, setIsAddingCue] = useState(false);
  const [cueText, setCueText] = useState('');
  const [timestamp, setTimestamp] = useState('0:08');
  const [loading, setLoading] = useState(false);

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cueText.trim() || !coachId) return;

    try {
      setLoading(true);
      const saved = await addWorkoutSetFeedback(
        setId,
        sessionId,
        coachId,
        athleteId,
        cueText.trim(),
        timestamp.trim() || undefined,
        undefined,
        coachName
      );

      setCueText('');
      setIsAddingCue(false);
      if (onFeedbackAdded) onFeedbackAdded(saved);
    } catch (err: unknown) {
      console.error('Failed to add coaching cue:', err);
    } finally {
      setLoading(false);
    }
  };

  if (feedbackList.length === 0 && !isCoach) {
    return null;
  }

  return (
    <div className="mt-2 pt-2 border-t border-[#252525] space-y-2">
      {/* Existing Feedback list */}
      {feedbackList.map((fb) => (
        <div
          key={fb.id}
          className="p-2.5 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-start gap-2.5 text-xs"
        >
          <div className="p-1 rounded-lg bg-[#3b82f6]/20 text-[#60a5fa] shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[#93c5fd] font-mono text-[11px]">
                {fb.coachName || 'Coach'}:
              </span>
              {fb.timestampMarker && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800/40">
                  <Play className="w-2.5 h-2.5" /> {fb.timestampMarker}
                </span>
              )}
            </div>
            <p className="text-gray-200 font-sans leading-relaxed">{fb.cueText}</p>
          </div>
        </div>
      ))}

      {/* Add Cue Button for Coaches */}
      {isCoach && !isAddingCue && (
        <button
          type="button"
          onClick={() => setIsAddingCue(true)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#C0FF00] hover:underline cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Coach Technique Cue
        </button>
      )}

      {/* Form for Coach Cue */}
      {isCoach && isAddingCue && (
        <form onSubmit={handleAddFeedback} className="p-3 rounded-xl bg-[#161616] border border-[#333] space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-mono text-[#C0FF00] font-bold uppercase">
              Add Technique Cue
            </span>
            <button
              type="button"
              onClick={() => setIsAddingCue(false)}
              className="text-gray-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-3">
              <input
                type="text"
                placeholder="e.g. Drive knees outward on ascent"
                value={cueText}
                onChange={(e) => setCueText(e.target.value)}
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="0:08"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none text-center"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 rounded-lg bg-[#C0FF00] text-black font-display font-black text-xs uppercase tracking-wider"
            >
              Save Feedback
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
