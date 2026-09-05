import { supabase } from '../supabase.ts';
import { BodyMeasurementLog } from '../../models.ts';
import { DbBodyLogRow } from '../../types/supabase.ts';

export async function logDailyBodyWeight(
  userId: string,
  payload: {
    date: string;
    weightKg: number;
    heightCm?: number;
    source?: string;
    notes?: string;
  }
): Promise<BodyMeasurementLog> {
  const row = {
    user_id: userId,
    log_date: payload.date,
    weight_kg: payload.weightKg,
    height_cm: payload.heightCm || null,
    source: payload.source || 'manual',
    notes: payload.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('body_measurement_logs')
    .upsert(row, { onConflict: 'user_id,log_date' })
    .select()
    .single();

  if (error) throw error;

  try {
    const { data: currentUser } = await supabase
      .from('users')
      .select('metrics')
      .eq('user_id', userId)
      .maybeSingle();

    const mergedMetrics = {
      ...(currentUser?.metrics || {}),
      weight: payload.weightKg,
      ...(payload.heightCm ? { height: payload.heightCm } : {}),
      updatedAt: new Date().toISOString(),
    };

    await supabase.from('users').update({
      weight_kg: payload.weightKg,
      height_cm: payload.heightCm || undefined,
      metrics: mergedMetrics,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);
  } catch {
    // ignore
  }

  return {
    id: data.id,
    userId: data.user_id,
    logDate: data.log_date,
    weightKg: Number(data.weight_kg),
    heightCm: data.height_cm ? Number(data.height_cm) : undefined,
    source: data.source,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function fetchBodyMeasurementLogs(userId: string): Promise<BodyMeasurementLog[]> {
  const { data, error } = await supabase
    .from('body_measurement_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: true });

  if (error) {
    console.warn('fetchBodyMeasurementLogs notice:', error);
    return [];
  }

  return ((data as DbBodyLogRow[]) || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    weightKg: Number(row.weight_kg),
    heightCm: row.height_cm ? Number(row.height_cm) : undefined,
    source: (row.source || 'manual') as 'profile' | 'workout_session' | 'manual',
    notes: row.notes || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  }));
}
