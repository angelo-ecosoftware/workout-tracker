import { supabase } from './supabase.ts';
import { CustomExerciseCues } from '../models.ts';

/**
 * Updates an exercise's custom cues (setup, peak squeeze, and biomechanical form cues) in Supabase.
 * Synchronizes across the user's devices without polluting global catalog data.
 */
export async function saveExerciseCustomCues(
  exerciseId: string,
  userId: string,
  customCues: CustomExerciseCues
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('exercises')
      .update({ custom_cues: customCues })
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to update exercise custom cues in Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error updating custom cues';
    console.error('Exception updating exercise custom cues:', msg);
    return { success: false, error: msg };
  }
}
