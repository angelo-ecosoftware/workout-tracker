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
    if (error || !data || data.length === 0) return defaultPrograms;

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
    setLocalStorageItem(`saved_programs_${userId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return defaultPrograms;
  }
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
    await supabase
      .from('saved_routine_programs')
      .update({ is_active: false })
      .eq('user_id', userId);
    await supabase
      .from('saved_routine_programs')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', programId);
  } catch {
    // ignore
  }
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
