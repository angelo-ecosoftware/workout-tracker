import React from 'react';
import { Calendar, Clock, Edit2, Save, X, Share2, Check, CheckCheck } from 'lucide-react';
import { Session, BodyMeasurementLog } from '../../../models.ts';
import { PopulatedSet, SessionSetTable } from './SessionSetTable.tsx';
import { SessionNotesSection } from './SessionNotesSection.tsx';
import { SessionCoachNotesSection } from './SessionCoachNotesSection.tsx';
import { SessionBodyweightSection } from './SessionBodyweightSection.tsx';
import { SessionPhotosSection } from './SessionPhotosSection.tsx';

export interface PopulatedSession extends Session {
  workoutName: string;
  order: number;
  sets: PopulatedSet[];
}

interface SessionDetailCardProps {
  session: PopulatedSession;
  // Date and recovery metrics editing
  isEditingDate: boolean;
  editingDateValue: string;
  onChangeDateValue: (val: string) => void;
  editingSleepValue?: number;
  onChangeSleepValue?: (val: number) => void;
  editingEnergyValue?: number;
  onChangeEnergyValue?: (val: number) => void;
  onStartDateEdit: (session: PopulatedSession) => void;
  onSaveDateEdit: (session: PopulatedSession) => void;
  onCancelDateEdit: () => void;
  // Share
  copiedSessionId: string | null;
  onShareSession: (session: PopulatedSession) => void;
  // Athlete Notes
  isEditingNotes: boolean;
  editingNotesValue: string;
  isSavingNotes: boolean;
  onStartNotesEdit: (session: PopulatedSession) => void;
  onSaveNotesEdit: (sessionId: string) => void;
  onCancelNotesEdit: () => void;
  onChangeNotesValue: (val: string) => void;
  // Coach Notes
  isEditingCoachNotes?: boolean;
  editingCoachNotesValue?: string;
  isSavingCoachNotes?: boolean;
  onStartCoachNotesEdit?: (session: PopulatedSession) => void;
  onSaveCoachNotesEdit?: (sessionId: string) => void;
  onCancelCoachNotesEdit?: () => void;
  onChangeCoachNotesValue?: (val: string) => void;
  // Bodyweight
  sessionDateStr: string;
  sessionBodyLog: BodyMeasurementLog | undefined;
  isEditingWeight: boolean;
  editingWeightValue: string;
  isSavingWeight: boolean;
  onStartWeightEdit: (session: PopulatedSession) => void;
  onSaveWeightEdit: (session: PopulatedSession) => void;
  onCancelWeightEdit: () => void;
  onChangeWeightValue: (val: string) => void;
  // Photos
  uploadingPhotoSessionId: string | null;
  onTriggerAddPhoto: (sessionId: string, source: 'camera' | 'files') => void;
  onDeletePhoto: (sessionId: string, photoIndex: number) => void;
  // Coach Context
  athleteId?: string;
  coachId?: string;
  coachName?: string;
  isCoach?: boolean;
}

export const SessionDetailCard: React.FC<SessionDetailCardProps> = ({
  session,
  isEditingDate,
  editingDateValue,
  onChangeDateValue,
  editingSleepValue = 8,
  onChangeSleepValue,
  editingEnergyValue = 7,
  onChangeEnergyValue,
  onStartDateEdit,
  onSaveDateEdit,
  onCancelDateEdit,
  copiedSessionId,
  onShareSession,
  isEditingNotes,
  editingNotesValue,
  isSavingNotes,
  onStartNotesEdit,
  onSaveNotesEdit,
  onCancelNotesEdit,
  onChangeNotesValue,
  isEditingCoachNotes = false,
  editingCoachNotesValue = '',
  isSavingCoachNotes = false,
  onStartCoachNotesEdit,
  onSaveCoachNotesEdit,
  onCancelCoachNotesEdit,
  onChangeCoachNotesValue,
  sessionDateStr,
  sessionBodyLog,
  isEditingWeight,
  editingWeightValue,
  isSavingWeight,
  onStartWeightEdit,
  onSaveWeightEdit,
  onCancelWeightEdit,
  onChangeWeightValue,
  uploadingPhotoSessionId,
  onTriggerAddPhoto,
  onDeletePhoto,
  athleteId,
  coachId,
  coachName,
  isCoach,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#222] gap-3">
        <div>
          <h3 className="font-display font-black text-xl text-[#C0FF00] uppercase tracking-tight">
            {session.workoutName}
          </h3>
          {isEditingDate ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 bg-[#1a1a1a] p-2 rounded-xl border border-[#333]">
              <input
                type="datetime-local"
                value={editingDateValue}
                onChange={(e) => onChangeDateValue(e.target.value)}
                className="bg-[#111] text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] rounded-lg px-2.5 py-1 text-xs font-mono border border-[#2e2e2e]"
              />

              {/* Minimal Sleep Form Field */}
              <div className="flex items-center gap-1 bg-[#111] border border-[#2e2e2e] rounded-lg px-2 py-1">
                <span className="text-xs">💤</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={editingSleepValue}
                  onChange={(e) => onChangeSleepValue?.(parseFloat(e.target.value) || 0)}
                  className="w-12 bg-transparent text-[#C0FF00] font-mono text-xs font-bold text-center outline-none"
                  title="Sleep Hours"
                />
                <span className="text-[10px] font-mono text-gray-500">h</span>
              </div>

              {/* Minimal Energy Form Field */}
              <div className="flex items-center gap-1 bg-[#111] border border-[#2e2e2e] rounded-lg px-2 py-1">
                <span className="text-xs">⚡</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={editingEnergyValue}
                  onChange={(e) => onChangeEnergyValue?.(parseInt(e.target.value, 10) || 1)}
                  className="w-10 bg-transparent text-amber-400 font-mono text-xs font-bold text-center outline-none"
                  title="Energy (1-10)"
                />
                <span className="text-[10px] font-mono text-gray-500">/10</span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onSaveDateEdit(session); }}
                  className="p-1.5 text-[#C0FF00] hover:bg-[#C0FF00]/20 rounded-lg bg-[#222] transition-colors cursor-pointer"
                  title="Save Changes"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelDateEdit(); }}
                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg bg-[#222] transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-500 mt-2">
              <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                {session.completedAt ? session.completedAt.toLocaleDateString() : 'N/A'}
              </span>
              <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                {session.completedAt ? session.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </span>
              {session.sleepHours != null && (
                <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg text-gray-300 border border-[#262626]">
                  <span className="text-[#C0FF00] font-bold">💤 {session.sleepHours}h</span>
                  <span className="text-[10px] text-gray-500">sleep</span>
                </span>
              )}
              {session.energyScore != null && (
                <span className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-lg text-gray-300 border border-[#262626]">
                  <span className="text-amber-400 font-bold">⚡ {session.energyScore}/10</span>
                  <span className="text-[10px] text-gray-500">energy</span>
                </span>
              )}
              {session.reviewedAt && (
                <span className="flex items-center gap-1.5 bg-sky-950/40 border border-sky-800/50 px-2.5 py-1 rounded-lg text-[10px] font-mono text-sky-300">
                  <CheckCheck className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
                  <span>Seen by {session.reviewedByCoachName || 'Coach'}</span>
                </span>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onStartDateEdit(session); }}
                className="p-1 hover:text-[#C0FF00] transition-colors rounded-lg hover:bg-[#1a1a1a]"
                title="Edit Date"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Public Share Workout Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onShareSession(session)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              copiedSessionId === session.id
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/30'
                : 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white border border-[#333] hover:border-[#C0FF00]'
            }`}
            title="Share public read-only link with non-users"
          >
            {copiedSessionId === session.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Share Workout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Session Notes (Athlete) */}
      <SessionNotesSection
        sessionId={session.id}
        notes={session.notes ?? null}
        isEditing={isEditingNotes}
        editingValue={editingNotesValue}
        isSaving={isSavingNotes}
        onStartEdit={() => onStartNotesEdit(session)}
        onCancelEdit={onCancelNotesEdit}
        onChangeValue={onChangeNotesValue}
        onSaveEdit={onSaveNotesEdit}
      />

      {/* Dedicated Session Coach Notes & Feedback Section */}
      <SessionCoachNotesSection
        sessionId={session.id}
        coachNotes={session.coachNotes ?? null}
        coachName={session.coachName ?? coachName}
        isCoach={Boolean(isCoach)}
        isEditing={isEditingCoachNotes}
        editingValue={editingCoachNotesValue}
        isSaving={isSavingCoachNotes}
        onStartEdit={() => onStartCoachNotesEdit?.(session)}
        onCancelEdit={() => onCancelCoachNotesEdit?.()}
        onChangeValue={(val) => onChangeCoachNotesValue?.(val)}
        onSaveEdit={(id) => onSaveCoachNotesEdit?.(id)}
      />

      {/* Editable Daily Bodyweight (kg) */}
      <SessionBodyweightSection
        sessionDateStr={sessionDateStr}
        sessionBodyLog={sessionBodyLog}
        isEditingWeight={isEditingWeight}
        editingWeightValue={editingWeightValue}
        isSavingWeight={isSavingWeight}
        onStartEdit={() => onStartWeightEdit(session)}
        onCancelEdit={onCancelWeightEdit}
        onChangeWeightValue={onChangeWeightValue}
        onSaveWeight={() => onSaveWeightEdit(session)}
      />

      {/* Progress Photos */}
      <SessionPhotosSection
        sessionId={session.id}
        photos={session.photos}
        uploadingSessionId={uploadingPhotoSessionId}
        onTriggerAddPhoto={onTriggerAddPhoto}
        onDeletePhoto={onDeletePhoto}
      />

      {/* Sets Table / Groups */}
      <SessionSetTable
        sets={session.sets}
        sessionId={session.id}
        athleteId={athleteId}
        coachId={coachId}
        coachName={coachName}
        isCoach={isCoach}
      />
    </div>
  );
};
