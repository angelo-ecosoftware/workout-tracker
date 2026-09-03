import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  fetchWorkoutHistory,
  fetchSetsForSession,
  deleteSessions,
  updateSessionDate,
  updateSessionNotes,
  updateSessionPhotos,
  fetchWorkoutsData,
  fetchBodyMeasurementLogs,
  logDailyBodyWeight,
  initializeUser,
} from '../lib/supabaseData.ts';
import { uploadWorkoutPhoto, deleteWorkoutPhoto } from '../lib/storage.ts';
import { Session, WorkoutSet, Exercise, BodyMeasurementLog, UserProfile } from '../models.ts';

export interface PopulatedSession extends Session {
  workoutName: string;
  order: number;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
}

export function useWorkoutHistory() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PopulatedSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingDateSessionId, setEditingDateSessionId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');

  // Notes editing state
  const [editingNotesSessionId, setEditingNotesSessionId] = useState<string | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Daily Bodyweight (kg) state
  const [bodyLogs, setBodyLogs] = useState<BodyMeasurementLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingWeightSessionId, setEditingWeightSessionId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValue] = useState<string>('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  // Share session state
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  // Photo uploading / deleting state
  const [uploadingPhotoSessionId, setUploadingPhotoSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoUploadSessionId, setActivePhotoUploadSessionId] = useState<string | null>(null);

  const getSessionDateString = useCallback((session: PopulatedSession): string => {
    if (!session.completedAt) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const d = session.completedAt;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getSessionBodyLog = useCallback(
    (session: PopulatedSession): BodyMeasurementLog | undefined => {
      const dateStr = getSessionDateString(session);
      return bodyLogs.find((log) => log.logDate === dateStr);
    },
    [bodyLogs, getSessionDateString]
  );

  const handleShareSession = useCallback(async (session: PopulatedSession) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 3000);
    } catch (err) {
      console.warn('Clipboard copy failed, using prompt fallback', err);
      window.prompt('Copy this public workout link:', shareUrl);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const [historySessions, workoutsData, bodyWeightLogs, profile] = await Promise.all([
        fetchWorkoutHistory(user.uid),
        fetchWorkoutsData(user.uid),
        fetchBodyMeasurementLogs(user.uid),
        initializeUser(user.uid, user.email, user.displayName),
      ]);

      setBodyLogs(bodyWeightLogs || []);
      setUserProfile(profile || null);

      const workoutMap = new Map(workoutsData.combinedWorkouts.map((w) => [w.id, w]));
      const exerciseMap = new Map(workoutsData.exercisesList.map((e) => [e.id, e]));

      const populated: PopulatedSession[] = await Promise.all(
        historySessions.map(async (s) => {
          const rawSets = await fetchSetsForSession(s.id);
          const parentWorkout = workoutMap.get(s.workoutId);

          const sets = rawSets.map((set) => {
            const ex = exerciseMap.get(set.exerciseId);
            return {
              ...set,
              exerciseName: ex ? ex.name : 'Unknown Exercise',
              type: ex ? ex.type : 'strength',
            };
          });

          return {
            ...s,
            workoutName: parentWorkout ? parentWorkout.name : 'Custom Workout',
            order: parentWorkout ? parentWorkout.order : 1,
            sets,
          };
        })
      );

      setSessions(populated);
    } catch (err: any) {
      console.error('Failed to load workout history:', err);
      setErrorMsg(err.message || 'Failed to fetch history logs.');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const saveNotesEdit = useCallback(async (sessionId: string) => {
    try {
      setIsSavingNotes(true);
      const cleanNotes = editingNotesValue.trim() || null;
      await updateSessionNotes(sessionId, cleanNotes);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, notes: cleanNotes } : s))
      );
      setEditingNotesSessionId(null);
    } catch (err) {
      console.error('Failed to update notes:', err);
      alert('Failed to update notes.');
    } finally {
      setIsSavingNotes(false);
    }
  }, [editingNotesValue]);

  const saveWeightEdit = useCallback(async (session: PopulatedSession) => {
    if (!user) return;
    const parsedWeight = parseFloat(editingWeightValue);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert('Please enter a valid positive bodyweight in kg.');
      return;
    }

    try {
      setIsSavingWeight(true);
      const sessionDateStr = getSessionDateString(session);
      const userHeight = userProfile?.heightCm || userProfile?.metrics?.height;

      const updatedLog = await logDailyBodyWeight(user.uid, {
        date: sessionDateStr,
        weightKg: parsedWeight,
        heightCm: userHeight,
        source: 'workout_session',
        notes: session.notes || undefined,
      });

      setBodyLogs((prev) => {
        const idx = prev.findIndex((l) => l.logDate === sessionDateStr);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedLog;
          return updated;
        }
        return [...prev, updatedLog].sort((a, b) => a.logDate.localeCompare(b.logDate));
      });

      setEditingWeightSessionId(null);
    } catch (err: any) {
      console.error('Failed to save body weight:', err);
      alert(err.message || 'Failed to save body weight.');
    } finally {
      setIsSavingWeight(false);
    }
  }, [user, editingWeightValue, getSessionDateString, userProfile]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !activePhotoUploadSessionId || !user) return;

    const targetSession = sessions.find((s) => s.id === activePhotoUploadSessionId);
    const existingPhotos = targetSession?.photos || [];

    if (existingPhotos.length >= 5) {
      alert('Maximum of 5 photos per session reached.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const availableSlots = 5 - existingPhotos.length;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    try {
      setUploadingPhotoSessionId(activePhotoUploadSessionId);
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const url = await uploadWorkoutPhoto(user.uid, file);
        uploadedUrls.push(url);
      }

      const updatedPhotos = [...existingPhotos, ...uploadedUrls];
      await updateSessionPhotos(activePhotoUploadSessionId, updatedPhotos);

      setSessions((prev) =>
        prev.map((s) => (s.id === activePhotoUploadSessionId ? { ...s, photos: updatedPhotos } : s))
      );
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhotoSessionId(null);
      setActivePhotoUploadSessionId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [activePhotoUploadSessionId, user, sessions]);

  const handleDeletePhoto = useCallback(async (sessionId: string, photoIndexToRemove: number) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession || !targetSession.photos) return;

    if (!confirm('Are you sure you want to remove this photo?')) return;

    const photoUrlToDelete = targetSession.photos[photoIndexToRemove];
    try {
      if (photoUrlToDelete) {
        await deleteWorkoutPhoto(photoUrlToDelete);
      }
      const updatedPhotos = targetSession.photos.filter((_, idx) => idx !== photoIndexToRemove);
      await updateSessionPhotos(sessionId, updatedPhotos);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, photos: updatedPhotos.length ? updatedPhotos : null } : s
        )
      );
    } catch (err) {
      console.error('Failed to remove photo:', err);
      alert('Failed to delete photo.');
    }
  }, [sessions]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  }, [selectedIds.size, sessions]);

  const confirmDelete = useCallback(async () => {
    if (selectedIds.size === 0 || !user) return;
    try {
      setLoading(true);
      await deleteSessions(Array.from(selectedIds));
      setSessions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      setIsConfirmOpen(false);
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || 'Failed to delete selected sessions.');
    } finally {
      setLoading(false);
    }
  }, [selectedIds, user]);

  const saveDateEdit = useCallback(async (session: PopulatedSession) => {
    if (!editingDateValue) return;
    try {
      const [year, month, day] = editingDateValue.split('-').map(Number);
      const originalDate = session.completedAt ? new Date(session.completedAt) : new Date();
      const updatedDate = new Date(
        year,
        month - 1,
        day,
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds()
      );

      await updateSessionDate(session.id, updatedDate);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, completedAt: updatedDate } : s))
      );
      setEditingDateSessionId(null);
    } catch (err) {
      console.error('Failed to update date:', err);
      alert('Failed to update date.');
    }
  }, [editingDateValue]);

  return {
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
    bodyLogs,
    userProfile,
    editingWeightSessionId,
    setEditingWeightSessionId,
    editingWeightValue,
    setEditingWeightValue,
    isSavingWeight,
    copiedSessionId,
    uploadingPhotoSessionId,
    fileInputRef,
    cameraInputRef,
    getSessionDateString,
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
  };
}
