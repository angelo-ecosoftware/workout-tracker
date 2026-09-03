import React from 'react';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory.ts';
import { HistoryHeaderActions } from './history/HistoryHeaderActions.tsx';
import { HistorySessionCard } from './history/HistorySessionCard.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';
import { Activity, Loader2 } from 'lucide-react';

export const WorkoutHistory: React.FC = () => {
  const {
    loading,
    errorMsg,
    sessions,
    expandedSessionId,
    setExpandedSessionId,
    isDeleteMode,
    setIsDeleteMode,
    selectedIds,
    isConfirmOpen,
    setIsConfirmOpen,
    editingDateSessionId,
    setEditingDateSessionId,
    editingDateValue,
    setEditingDateValue,
    editingNotesSessionId,
    setEditingNotesSessionId,
    editingNotesValue,
    setEditingNotesValue,
    isSavingNotes,
    editingWeightSessionId,
    setEditingWeightSessionId,
    editingWeightValue,
    setEditingWeightValue,
    isSavingWeight,
    copiedSessionId,
    uploadingPhotoSessionId,
    fileInputRef,
    cameraInputRef,
    getSessionBodyLog,
    handleShareSession,
    saveNotesEdit,
    saveWeightEdit,
    saveDateEdit,
    handlePhotoUpload,
    handleDeletePhoto,
    toggleSelect,
    selectAll,
    confirmDelete,
    setActivePhotoUploadSessionId,
  } = useWorkoutHistory();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Loading history logs...
        </span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
        <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
            No Workout Logs
          </h3>
          <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mt-1">
            Complete your scheduled workout sessions to build your progressive overload timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Batch Actions */}
      <HistoryHeaderActions
        sessionCount={sessions.length}
        isDeleteMode={isDeleteMode}
        selectedCount={selectedIds.size}
        onToggleDeleteMode={() => {
          setIsDeleteMode(!isDeleteMode);
          if (isDeleteMode) setExpandedSessionId(null);
        }}
        onSelectAll={selectAll}
        onOpenConfirmDelete={() => setIsConfirmOpen(true)}
      />

      {/* 2. Hidden Upload Inputs for Photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* 3. Session Cards List */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <HistorySessionCard
            key={session.id}
            session={session}
            isExpanded={expandedSessionId === session.id}
            isDeleteMode={isDeleteMode}
            isSelected={selectedIds.has(session.id)}
            onToggleExpand={() =>
              setExpandedSessionId(expandedSessionId === session.id ? null : session.id)
            }
            onToggleSelect={() => toggleSelect(session.id)}
            onShare={() => handleShareSession(session)}
            isCopied={copiedSessionId === session.id}
            isEditingDate={editingDateSessionId === session.id}
            editingDateValue={editingDateValue}
            onStartDateEdit={() => {
              setEditingDateSessionId(session.id);
              const d = session.completedAt ? new Date(session.completedAt) : new Date();
              setEditingDateValue(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                  d.getDate()
                ).padStart(2, '0')}`
              );
            }}
            onDateValueChange={setEditingDateValue}
            onSaveDateEdit={() => saveDateEdit(session)}
            onCancelDateEdit={() => setEditingDateSessionId(null)}
            isEditingNotes={editingNotesSessionId === session.id}
            editingNotesValue={editingNotesValue}
            isSavingNotes={isSavingNotes}
            onStartNotesEdit={() => {
              setEditingNotesSessionId(session.id);
              setEditingNotesValue(session.notes || '');
            }}
            onNotesValueChange={setEditingNotesValue}
            onSaveNotesEdit={() => saveNotesEdit(session.id)}
            onCancelNotesEdit={() => setEditingNotesSessionId(null)}
            bodyLog={getSessionBodyLog(session)}
            isEditingWeight={editingWeightSessionId === session.id}
            editingWeightValue={editingWeightValue}
            isSavingWeight={isSavingWeight}
            onStartWeightEdit={() => {
              const existingLog = getSessionBodyLog(session);
              setEditingWeightSessionId(session.id);
              setEditingWeightValue(existingLog?.weightKg != null ? String(existingLog.weightKg) : '');
            }}
            onWeightValueChange={setEditingWeightValue}
            onSaveWeightEdit={() => saveWeightEdit(session)}
            onCancelWeightEdit={() => setEditingWeightSessionId(null)}
            uploadingPhotoSessionId={uploadingPhotoSessionId}
            onTriggerPhotoUpload={(sId, src) => {
              setActivePhotoUploadSessionId(sId);
              if (src === 'camera') cameraInputRef.current?.click();
              else fileInputRef.current?.click();
            }}
            onDeletePhoto={handleDeletePhoto}
          />
        ))}
      </div>

      {/* 4. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Workout Sessions"
        description={`Are you sure you want to delete ${selectedIds.size} workout session${
          selectedIds.size === 1 ? '' : 's'
        }? This will permanently remove all associated sets and stats.`}
        confirmText="Delete Sessions"
        confirmVariant="danger"
      />
    </div>
  );
};
