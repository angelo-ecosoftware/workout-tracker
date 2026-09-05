import React from 'react';
import { UserCheck, Edit2, Save, Loader2, MessageSquare } from 'lucide-react';

interface SessionCoachNotesSectionProps {
  sessionId: string;
  coachNotes?: string | null;
  coachName?: string | null;
  isCoach: boolean;
  isEditing: boolean;
  editingValue: string;
  isSaving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeValue: (val: string) => void;
  onSaveEdit: (sessionId: string) => void;
}

export const SessionCoachNotesSection: React.FC<SessionCoachNotesSectionProps> = ({
  sessionId,
  coachNotes,
  coachName,
  isCoach,
  isEditing,
  editingValue,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onChangeValue,
  onSaveEdit,
}) => {
  // If no coach notes exist and the viewer is not a coach, don't show an empty box
  if (!coachNotes && !isCoach) {
    return null;
  }

  return (
    <div className="mb-5 p-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl text-xs text-gray-200 space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#3b82f6]/20 text-[#60a5fa]">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-[11px] uppercase font-bold text-[#93c5fd]">
            {coachName ? `Coach Note (${coachName})` : 'Coach Feedback & Notes'}
          </span>
        </div>

        {isCoach && !isEditing ? (
          <button
            onClick={onStartEdit}
            className="p-1 text-sky-400 hover:text-sky-300 transition-colors rounded hover:bg-[#1e293b] flex items-center gap-1 font-mono text-[10px]"
            title="Edit Coach Note"
          >
            <Edit2 className="w-3 h-3" />
            <span>{coachNotes ? 'Edit' : '+ Add Note'}</span>
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2">
          <textarea
            value={editingValue}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder="Write coaching feedback, technique cues, or adjustments for the next workout..."
            rows={3}
            className="w-full bg-[#0a0f1d] border border-[#334155] focus:border-[#38bdf8] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors resize-y font-sans"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="px-2.5 py-1 text-[11px] font-sans font-bold text-gray-400 hover:text-white rounded bg-[#1e293b] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(sessionId)}
              disabled={isSaving}
              className="px-3 py-1 text-[11px] font-sans font-bold bg-[#38bdf8] hover:bg-[#0ea5e9] text-black rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Coach Note
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-gray-200 font-sans leading-relaxed pt-0.5">
          {coachNotes || (
            <span className="text-gray-500 italic">No coach note added yet. Tap "+ Add Note" above to leave feedback for this workout.</span>
          )}
        </p>
      )}
    </div>
  );
};
