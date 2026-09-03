import { describe, it, expect, beforeEach } from 'vitest';
import { BodyMeasurementLog } from '../../../src/models.ts';

interface DbBiometricRow {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  height_cm: number | null;
  waist_cm: number | null;
  body_fat_percentage: number | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

class MockBackendBiometricDbDomain {
  private table: DbBiometricRow[] = [];

  public upsertMeasurement(row: Omit<DbBiometricRow, 'id' | 'created_at' | 'updated_at'>): DbBiometricRow {
    const existingIndex = this.table.findIndex(r => r.user_id === row.user_id && r.log_date === row.log_date);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: DbBiometricRow = {
        ...this.table[existingIndex],
        ...row,
        updated_at: now
      };
      this.table[existingIndex] = updated;
      return updated;
    }

    const newRow: DbBiometricRow = {
      ...row,
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now
    };
    this.table.push(newRow);
    return newRow;
  }

  public queryDateRange(userId: string, startDate: string, endDate: string): DbBiometricRow[] {
    return this.table
      .filter(r => r.user_id === userId && r.log_date >= startDate && r.log_date <= endDate)
      .sort((a, b) => a.log_date.localeCompare(b.log_date));
  }

  public queryMinMaxWeight(userId: string): { minWeight: number; maxWeight: number } | null {
    const userRows = this.table.filter(r => r.user_id === userId);
    if (userRows.length === 0) return null;

    let minWeight = userRows[0].weight_kg;
    let maxWeight = userRows[0].weight_kg;

    for (const r of userRows) {
      if (r.weight_kg < minWeight) minWeight = r.weight_kg;
      if (r.weight_kg > maxWeight) maxWeight = r.weight_kg;
    }

    return { minWeight, maxWeight };
  }
}

describe('Backend Biometric Database Domain & Aggregate SQL Queries', () => {
  let db: MockBackendBiometricDbDomain;

  beforeEach(() => {
    db = new MockBackendBiometricDbDomain();
  });

  it('upserts daily logs and queries by date range', () => {
    const userId = 'usr_db_01';

    db.upsertMeasurement({
      user_id: userId,
      log_date: '2026-09-01',
      weight_kg: 78.0,
      height_cm: 180,
      waist_cm: 82,
      body_fat_percentage: 15.0,
      source: 'workout_session',
      notes: null
    });

    db.upsertMeasurement({
      user_id: userId,
      log_date: '2026-09-02',
      weight_kg: 77.8,
      height_cm: 180,
      waist_cm: 81.8,
      body_fat_percentage: 14.9,
      source: 'manual',
      notes: null
    });

    const range = db.queryDateRange(userId, '2026-09-01', '2026-09-02');
    expect(range).toHaveLength(2);
    expect(range[0].weight_kg).toBe(78.0);
    expect(range[1].weight_kg).toBe(77.8);
  });

  it('calculates min and max weights over all recorded logs', () => {
    const userId = 'usr_db_02';

    db.upsertMeasurement({
      user_id: userId,
      log_date: '2026-08-01',
      weight_kg: 82.0,
      height_cm: null,
      waist_cm: null,
      body_fat_percentage: null,
      source: 'manual',
      notes: null
    });

    db.upsertMeasurement({
      user_id: userId,
      log_date: '2026-08-15',
      weight_kg: 79.5,
      height_cm: null,
      waist_cm: null,
      body_fat_percentage: null,
      source: 'manual',
      notes: null
    });

    db.upsertMeasurement({
      user_id: userId,
      log_date: '2026-09-01',
      weight_kg: 77.0,
      height_cm: null,
      waist_cm: null,
      body_fat_percentage: null,
      source: 'manual',
      notes: null
    });

    const minMax = db.queryMinMaxWeight(userId);
    expect(minMax?.maxWeight).toBe(82.0);
    expect(minMax?.minWeight).toBe(77.0);
  });
});
