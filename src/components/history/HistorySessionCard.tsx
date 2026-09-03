import React from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  Edit2,
  Save,
  X,
  FileText,
  Scale,
  Sparkles,
  Share2,
  Check,
  Camera,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { PopulatedSession } from '../../hooks/useWorkoutHistory.ts';
import { BodyMeasurementLog } from '../../models.ts';

interface HistorySessionCardProps {
  session: PopulatedSession;
  isExpanded: boolean;
  isDeleteMode: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onShare: () => void;
  isCopied: boolean;
  // Date edit props
  isEditingDate: boolean;
  editingDateValue: string;
  onStartDateEdit: () => void;
  onDateValueChange: (val: string) => void;
  onSaveDateEdit: () => void;
  onCancelDateEdit: () => void;
  // Notes edit props
  isEditingNotes: boolean;
  editingNotesValue: string;
  isSavingNotes: boolean;
  onStartNotesEdit: () => void;
  onNotesValueChange: (val: string) => void;
  onSaveNotesEdit: () => void;
  onCancelNotesEdit: () => void;
  // Bodyweight props
  bodyLog?: BodyMeasurementLog;
  isEditingWeight: boolean;
  editingWeightValue: string;
  isSavingWeight: boolean;
  onStartWeightEdit: () => void;
  onWeightValueChange: (val: string) => void;
  onSaveWeightEdit: () => void;
  onCancelWeightEdit: () => void;
  // Photo upload props
  uploadingPhotoSessionId: string | null;
  onTriggerPhotoUpload: (sessionId: string, source: 'camera' | 'files') => void;
  onDeletePhoto: (sessionId: string, photoIdx: number) => void;
}

export const HistorySessionCard: React.FC<HistorySessionCardProps> = ({
  session,
  isExpanded,
  isDeleteMode,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onShare,
  isCopied,
  isEditingDate,
  editingDateValue,
  onStartDateEdit,
  onDateValueChange,
  onSaveDateEdit,
  onCancelDateEdit,
  isEditingNotes,
  editingNotesValue,
  isSavingNotes,
  onStartNotesEdit,
  onNotesValueChange,
  onSaveNotesEdit,
  onCancelNotesEdit,
  bodyLog,
  isEditingWeight,
  editingWeightValue,
  isSavingWeight,
  onStartWeightEdit,
  onWeightValueChange,
  onSaveWeightEdit,
  onCancelWeightEdit,
  uploadingPhotoSessionId,
  onTriggerPhotoUpload,
  onDeletePhoto,
}) => {
  const formatTime = (d?: Date | null) => {
    if (!d) return '--:--';
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (d?: Date | null) => {
    if (!d) return 'Unknown Date';
    return new Date(d).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalVolume = session.sets.reduce((acc, s) => {
    return s.type === 'strength' && s.weight && s.reps ? acc + s.weight * s.reps : acc;
  }, 0);

  return (
    <div
      className={`bg-[#141414] border transition-all rounded-2xl overflow-hidden ${
        isSelected ? 'border-[#C0FF00]/50 bg-[#161c12]' : 'border-[#242424] hover:border-[#333]'
      }`}
    >
      {/* Session Top Summary Bar */}
      <div
        onClick={() => {
          if (isDeleteMode) onToggleSelect();
          else onToggleExpand();
        }}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          {isDeleteMode && (
            <div className="text-gray-400">
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 text-[#C0FF00]" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600" />
              )}
            </div>
          )}

          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-[#C0FF00] font-black font-display text-sm">
            D{session.order}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white text-sm sm:text-base font-bold uppercase tracking-tight">
                {session.workoutName}
              </h4>
              {session.status === 'completed' && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/20 font-bold uppercase">
                  Finished
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                {formatDate(session.completedAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                {formatTime(session.completedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono font-bold text-white">
              {totalVolume.toLocaleString()} kg
            </div>
            <div className="text-[10px] font-mono text-gray-500">
              {session.sets.length} total sets
            </div>
          </div>
          <ChevronLeft
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isExpanded ? '-rotate-90' : 'rotate-180'
            }`}
          />
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && !isDeleteMode && (
        <div className="p-4 sm:p-5 pt-0 border-t border-[#1f1f1f] space-y-4">
          {/* Action Row: Date Adjustment, Share Link, Weight */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              {isEditingDate ? (
                <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-xl border border-[#333]">
                  <input
                    type="date"
                    value={editingDateValue}
                    onChange={(e) => onDateValueChange(e.target.value)}
                    className="bg-transparent text-white text-xs font-mono px-2 py-1 outline-none"
                  />
                  <button
                    onClick={onSaveDateEdit}
                    className="p-1 text-[#C0FF00] hover:bg-[#282828] rounded cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onCancelDateEdit}
                    className="p-1 text-gray-400 hover:text-white hover:bg-[#282828] rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onStartDateEdit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#2c2c2c] text-gray-300 hover:text-white text-[11px] font-mono cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-gray-400" />
                  <span>Adjust Date</span>
                </button>
              )}

              {/* Share Public Link */}
              <button
                onClick={onShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#2c2c2c] text-gray-300 hover:text-[#C0FF00] text-[11px] font-mono cursor-pointer transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-[#C0FF00]" />
                    <span className="text-[#C0FF00]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3 text-gray-400" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Daily Bodyweight */}
            <div>
              {isEditingWeight ? (
                <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-xl border border-[#333]">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    value={editingWeightValue}
                    onChange={(e) => onWeightValueChange(e.target.value)}
                    className="w-16 bg-transparent text-white text-xs font-mono px-2 py-1 outline-none text-center"
                  />
                  <button
                    onClick={onSaveWeightEdit}
                    disabled={isSavingWeight}
                    className="p-1 text-[#C0FF00] hover:bg-[#282828] rounded cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onCancelWeightEdit}
                    className="p-1 text-gray-400 hover:text-white hover:bg-[#282828] rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onStartWeightEdit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-[#2c2c2c] text-gray-300 hover:text-white text-[11px] font-mono cursor-pointer"
                >
                  <Scale className="w-3 h-3 text-[#C0FF00]" />
                  <span>
                    {bodyLog?.weightKg ? `${bodyLog.weightKg} kg bodyweight` : 'Log bodyweight'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Session Notes */}
          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-400" />
                Session Notes & Reflections
              </span>
              {!isEditingNotes && (
                <button
                  onClick={onStartNotesEdit}
                  className="text-[10px] font-mono text-gray-400 hover:text-white cursor-pointer"
                >
                  Edit Note
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={editingNotesValue}
                  onChange={(e) => onNotesValueChange(e.target.value)}
                  rows={2}
                  className="w-full bg-[#111] border border-[#333] rounded-lg p-2 text-xs text-white font-sans focus:outline-none focus:border-[#C0FF00]"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={onCancelNotesEdit}
                    className="px-2.5 py-1 text-xs text-gray-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSaveNotesEdit}
                    disabled={isSavingNotes}
                    className="px-2.5 py-1 text-xs bg-[#C0FF00] text-black font-bold rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-300 font-sans italic">
                {session.notes || 'No notes logged for this workout.'}
              </p>
            )}
          </div>

          {/* Physique Photos Gallery */}
          <div className="bg-[#181818] border border-[#262626] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-400 uppercase flex items-center gap-1">
                <Camera className="w-3 h-3 text-[#C0FF00]" />
                Physique Photos ({session.photos?.length || 0}/5)
              </span>
              {(session.photos?.length || 0) < 5 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onTriggerPhotoUpload(session.id, 'camera')}
                    className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-2.5 h-2.5 text-[#C0FF00]" /> Camera
                  </button>
                  <span className="text-gray-600">•</span>
                  <button
                    type="button"
                    onClick={() => onTriggerPhotoUpload(session.id, 'files')}
                    className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-2.5 h-2.5 text-blue-400" /> Files
                  </button>
                </div>
              )}
            </div>

            {session.photos && session.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {session.photos.map((src, pIdx) => (
                  <div
                    key={pIdx}
                    className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[#333]"
                  >
                    <img src={src} alt="Check-in" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(session.id, pIdx)}
                      className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 font-sans italic">
                No check-in photos uploaded for this session.
              </p>
            )}
          </div>

          {/* Sets Breakdown Table */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Sets Completed</span>
            <div className="space-y-1">
              {session.sets.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="flex items-center justify-between text-xs font-mono bg-[#111] p-2 rounded-lg border border-[#202020]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#1c1c1c] text-gray-400 flex items-center justify-center text-[10px] font-bold">
                      {s.setNumber}
                    </span>
                    <span className="text-white font-medium">{s.exerciseName}</span>
                  </div>
                  <div className="text-gray-300">
                    {s.type === 'timed'
                      ? `${s.durationSeconds || 0}s`
                      : `${s.weight || 0}kg × ${s.reps || 0} reps`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
