import { supabase } from '../supabase.ts';
import { Exercise, SavedRoutineProgram, Workout } from '../../models.ts';
import { DbSavedRoutineProgramRow } from '../../types/supabase.ts';
import { getLocalStorageItem, setLocalStorageItem } from './rolesStorage.ts';

export async function fetchSavedRoutinePrograms(userId: string): Promise<SavedRoutineProgram[]> {
  const localProgramsRaw = getLocalStorageItem(`saved_programs_${userId}`);
  let defaultPrograms: SavedRoutineProgram[] = [];
  if (localProgramsRaw) {
    try {
      defaultPrograms = JSON.parse(localProgramsRaw);
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('saved_routine_programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      const normalizedDefaults = defaultPrograms.length === 1 && !defaultPrograms[0].isActive
        ? [{ ...defaultPrograms[0], isActive: true }]
        : defaultPrograms;
      if (normalizedDefaults.length === 1 && !defaultPrograms[0]?.isActive) {
        setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(normalizedDefaults));
      }
      return normalizedDefaults;
    }

    const resolved = ((data as DbSavedRoutineProgramRow[]) || []).map((d) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      description: d.description,
      isActive: Boolean(d.is_active),
      sourceCoachId: d.source_coach_id,
      programData: (d.program_data as { workouts: (Workout & { exercises: Exercise[] })[] }) || { workouts: [] },
      createdAt: new Date(d.created_at || Date.now()),
      updatedAt: new Date(d.updated_at || Date.now()),
    }));
    const normalized = resolved.length === 1 && !resolved[0].isActive
      ? [{ ...resolved[0], isActive: true }]
      : resolved;
    if (normalized.length === 1 && !resolved[0].isActive) {
      const { error: normalizeError } = await supabase
        .from('saved_routine_programs')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', normalized[0].id)
        .eq('user_id', userId);
      if (normalizeError) {
        console.warn('Could not normalize the sole saved routine as active:', normalizeError.message);
      }
    }
    setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(normalized));
    return normalized;
  } catch {
    return defaultPrograms;
  }
}

export async function fetchSavedRoutineProgramById(
  userId: string,
  programId: string
): Promise<SavedRoutineProgram | null> {
  const { data, error } = await supabase
    .from('saved_routine_programs')
    .select('*')
    .eq('id', programId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    const cachedPrograms = await fetchSavedRoutinePrograms(userId);
    return cachedPrograms.find((program) => program.id === programId) || null;
  }
  if (!data) {
    const cachedPrograms = await fetchSavedRoutinePrograms(userId);
    return cachedPrograms.find((program) => program.id === programId) || null;
  }
  const row = data as DbSavedRoutineProgramRow;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    isActive: Boolean(row.is_active),
    sourceCoachId: row.source_coach_id,
    sourceCoachName: row.source_coach_name,
    programData: (row.program_data as { workouts: (Workout & { exercises: Exercise[] })[] }) || { workouts: [] },
    createdAt: new Date(row.created_at || Date.now()),
    updatedAt: new Date(row.updated_at || Date.now()),
  };
}

export async function saveRoutineProgramToLibrary(
  userId: string,
  title: string,
  programData: { workouts: (Workout & { exercises: Exercise[] })[] },
  description?: string,
  sourceCoachId?: string,
  sourceCoachName?: string
): Promise<SavedRoutineProgram> {
  let dbId = '';
  try {
    const { data } = await supabase
      .from('saved_routine_programs')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        is_active: false,
        source_coach_id: sourceCoachId || null,
        source_coach_name: sourceCoachName || null,
        program_data: programData,
      })
      .select()
      .single();
    if (data?.id) dbId = data.id;
  } catch {
    // ignore
  }

  const newProgram: SavedRoutineProgram = {
    id: dbId || `prog_${Date.now()}`,
    userId,
    title,
    description: description || null,
    isActive: false,
    sourceCoachId: sourceCoachId || null,
    sourceCoachName: sourceCoachName || null,
    programData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const existing = await fetchSavedRoutinePrograms(userId);
  setLocalStorageItem(
    `saved_programs_${userId}`,
    JSON.stringify([newProgram, ...existing.filter((p) => p.id !== newProgram.id)])
  );
  return newProgram;
}

export async function setActiveRoutineProgram(userId: string, programId: string): Promise<void> {
  const existing = await fetchSavedRoutinePrograms(userId);
  setLocalStorageItem(
    `saved_programs_${userId}`,
    JSON.stringify(existing.map((p) => ({ ...p, isActive: p.id === programId })))
  );

  try {
    const { error: deactivateError } = await supabase
      .from('saved_routine_programs')
      .update({ is_active: false })
      .eq('user_id', userId);
    if (deactivateError) throw new Error(deactivateError.message);

    const { error: activateError } = await supabase
      .from('saved_routine_programs')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', programId)
      .eq('user_id', userId);
    if (activateError) throw new Error(activateError.message);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to activate routine program.');
  }
}

export async function updateSavedRoutineProgram(
  userId: string,
  programId: string,
  programData: { workouts: (Workout & { exercises: Exercise[] })[] },
): Promise<void> {
  const existing = await fetchSavedRoutinePrograms(userId);
  const updatedAt = new Date();
  const updated = existing.map((program) =>
    program.id === programId ? { ...program, programData, updatedAt } : program
  );
  setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(updated));

  const { error } = await supabase
    .from('saved_routine_programs')
    .update({ program_data: programData, updated_at: updatedAt.toISOString() })
    .eq('id', programId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to update routine: ${error.message}`);
}

export async function deleteSavedRoutineProgram(userId: string, programId: string): Promise<void> {
  const existing = await fetchSavedRoutinePrograms(userId);
  setLocalStorageItem(
    `saved_programs_${userId}`,
    JSON.stringify(existing.filter((p) => p.id !== programId))
  );
  try {
    await supabase.from('saved_routine_programs').delete().eq('id', programId);
  } catch {
    // ignore
  }
}
