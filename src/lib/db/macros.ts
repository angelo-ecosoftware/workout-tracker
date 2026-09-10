import { supabase } from '../supabase.ts';
import { CoachMacroPrescription } from '../../models.ts';
import { getLocalStorageItem, setLocalStorageItem } from './rolesStorage.ts';

export async function fetchActiveMacroPrescription(
  athleteId: string
): Promise<CoachMacroPrescription | null> {
  const localPrescriptionRaw = getLocalStorageItem(`macro_prescription_${athleteId}`);
  let fallback: CoachMacroPrescription | null = null;
  if (localPrescriptionRaw) {
    try {
      fallback = JSON.parse(localPrescriptionRaw);
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('coach_macro_prescriptions')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error || !data) return fallback;

    const resolved: CoachMacroPrescription = {
      id: data.id,
      coachId: data.coach_id,
      athleteId: data.athlete_id,
      targetKcal: data.target_kcal,
      targetProteinG: Number(data.target_protein_g),
      targetCarbsG: Number(data.target_carbs_g),
      targetFatG: Number(data.target_fat_g),
      targetFiberG: data.target_fiber_g ? Number(data.target_fiber_g) : null,
      notes: data.notes,
      isActive: Boolean(data.is_active),
      coachName: data.coach_name || 'Nutrition Coach',
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
    };
    setLocalStorageItem(`macro_prescription_${athleteId}`, JSON.stringify(resolved));
    return resolved;
  } catch {
    return fallback;
  }
}

export async function saveMacroPrescription(
  coachId: string,
  athleteId: string,
  targetKcal: number,
  targetProteinG: number,
  targetCarbsG: number,
  targetFatG: number,
  targetFiberG?: number,
  notes?: string,
  coachName?: string
): Promise<CoachMacroPrescription> {
  let dbId = '';
  try {
    await supabase
      .from('coach_macro_prescriptions')
      .update({ is_active: false })
      .eq('athlete_id', athleteId);

    const { data } = await supabase
      .from('coach_macro_prescriptions')
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        target_kcal: targetKcal,
        target_protein_g: targetProteinG,
        target_carbs_g: targetCarbsG,
        target_fat_g: targetFatG,
        target_fiber_g: targetFiberG || null,
        notes: notes || null,
        is_active: true,
        coach_name: coachName || 'Nutrition Coach',
      })
      .select()
      .single();
    if (data?.id) dbId = data.id;
  } catch {
    // ignore
  }

  const newPrescription: CoachMacroPrescription = {
    id: dbId || `macro_presc_${Date.now()}`,
    coachId,
    athleteId,
    targetKcal,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetFiberG: targetFiberG || null,
    notes: notes || null,
    isActive: true,
    coachName: coachName || 'Nutrition Coach',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  setLocalStorageItem(`macro_prescription_${athleteId}`, JSON.stringify(newPrescription));
  return newPrescription;
}
