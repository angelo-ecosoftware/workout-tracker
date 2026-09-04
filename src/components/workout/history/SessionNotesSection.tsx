import React from 'react';
import { FileText, Edit2, Save, Loader2 } from 'lucide-react';

interface SessionNotesSectionProps {
  sessionId: string;
  notes?: string | null;
  isEditing: boolean;
  editingValue: string;
  isSaving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeValue: (val: string) => void;
  onSaveEdit: (sessionId: string) => void;
}

export const SessionNotesSection: React.FC<SessionNotesSectionProps> = ({
  sessionId,
  notes,
  isEditing,
  editingValue,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onChangeValue,
  onSaveEdit,
}) => {
  return (
    <div className="mb-5 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs text-gray-300">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#C0FF00] shrink-0" />
          <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00]">
            Workout Notes
          </span>
        </div>
        {!isEditing ? (
          <button
            onClick={onStartEdit}
            className="p-1 text-gray-400 hover:text-[#C0FF00] transition-colors rounded hover:bg-[#222]"
            title="Edit Notes"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2">
          <textarea
            value={editingValue}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder="Add or update session notes..."
            rows={3}
            className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors resize-y font-sans"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="px-2.5 py-1 text-[11px] font-sans font-bold text-gray-400 hover:text-white rounded bg-[#222] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(sessionId)}
              disabled={isSaving}
              className="px-3 py-1 text-[11px] font-sans font-bold bg-[#C0FF00] hover:bg-[#b0f000] text-black rounded transition-colors flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-gray-300 font-sans mt-1">
          {notes || <span className="text-gray-500 italic">No notes added for this workout.</span>}
        </p>
      )}
    </div>
  );
};
