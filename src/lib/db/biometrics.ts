import { supabase } from '../supabase.ts';
import { BodyMeasurementLog } from '../../models.ts';
import { DbBodyLogRow } from '../../types/supabase.ts';

export async function logDailyBodyWeight(
  userId: string,
  payload: {
    date: string;
    weightKg: number;
    heightCm?: number;
    waistCm?: number;
    source?: string;
    notes?: string;
  }
): Promise<BodyMeasurementLog> {
  const heightM = payload.heightCm ? payload.heightCm / 100 : undefined;
  const calculatedBmi = heightM && heightM > 0
    ? Number((payload.weightKg / (heightM * heightM)).toFixed(1))
    : undefined;
  const logEntry: BodyMeasurementLog = {
    id: `blog_${userId}_${payload.date}`,
    userId,
    logDate: payload.date,
    weightKg: payload.weightKg,
    heightCm: payload.heightCm,
    calculatedBmi,
    waistCm: payload.waistCm,
    notes: payload.notes,
    source: (payload.source || 'manual') as 'profile' | 'workout_session' | 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const localKey = `body_logs_${userId}`;
    const rawLogs = getLocalStorageItem(localKey);
    const logs: BodyMeasurementLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    const existingIndex = logs.findIndex((log) => log.logDate === payload.date);
    if (existingIndex >= 0) {
      logs[existingIndex] = { ...logs[existingIndex], ...logEntry, updatedAt: new Date() };
    } else {
      logs.push(logEntry);
    }
    logs.sort((a, b) => a.logDate.localeCompare(b.logDate));
    setLocalStorageItem(localKey, JSON.stringify(logs));

    const metricsKey = `user_metrics_${userId}`;
    const rawMetrics = getLocalStorageItem(metricsKey);
    const metrics = rawMetrics ? JSON.parse(rawMetrics) : {};
    metrics.weight = payload.weightKg;
    if (payload.heightCm) metrics.height = payload.heightCm;
    setLocalStorageItem(metricsKey, JSON.stringify(metrics));
  } catch (error) {
    console.warn('Could not save body log locally:', error);
  }

  try {
    const dbPayload = {
      id: logEntry.id,
    user_id: userId,
    log_date: payload.date,
    weight_kg: payload.weightKg,
    height_cm: payload.heightCm || null,
      calculated_bmi: calculatedBmi || null,
      waist_cm: payload.waistCm || null,
      notes: payload.notes || null,
      source: logEntry.source,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('body_logs')
      .upsert(dbPayload, { onConflict: 'user_id,log_date' });
    if (error) {
      console.warn('Could not sync body log to Supabase body_logs table:', error);
    }

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
  } catch (error) {
    console.warn('Supabase body_logs upsert error:', error);
  }

  return logEntry;
}

export async function fetchBodyMeasurementLogs(userId: string): Promise<BodyMeasurementLog[]> {
  try {
    const { data, error } = await supabase
      .from('body_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true });
    if (!error && data && data.length > 0) {
      return ((data as DbBodyLogRow[]) || []).map((row) => ({
        id: String(row.id),
        userId: row.user_id,
        logDate: row.log_date,
        weightKg: Number(row.weight_kg),
        heightCm: row.height_cm ? Number(row.height_cm) : undefined,
        calculatedBmi: row.calculated_bmi ? Number(row.calculated_bmi) : undefined,
        waistCm: row.waist_cm ? Number(row.waist_cm) : undefined,
        notes: row.notes || undefined,
        source: (row.source || 'manual') as 'profile' | 'workout_session' | 'manual',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch body_logs from Supabase:', error);
  }

  const raw = getLocalStorageItem(`body_logs_${userId}`);
  return raw ? JSON.parse(raw) : [];
}

function getLocalStorageItem(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' && localStorage?.getItem ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage?.setItem) localStorage.setItem(key, value);
  } catch {
    // Ignore environments where localStorage is blocked or unavailable.
  }
}
