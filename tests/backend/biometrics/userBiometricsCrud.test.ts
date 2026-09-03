import { describe, it, expect, beforeEach } from 'vitest';
import { BodyMeasurementLog } from '../../../src/models.ts';

class UserBiometricsManager {
  private logs: BodyMeasurementLog[] = [];

  public logMeasurement(userId: string, data: Omit<BodyMeasurementLog, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): BodyMeasurementLog {
    const existingIndex = this.logs.findIndex(l => l.userId === userId && l.logDate === data.logDate);
    const now = new Date();

    if (existingIndex >= 0) {
      const updated: BodyMeasurementLog = {
        ...this.logs[existingIndex],
        ...data,
        updatedAt: now
      };
      this.logs[existingIndex] = updated;
      return updated;
    }

    const newLog: BodyMeasurementLog = {
      ...data,
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      createdAt: now,
      updatedAt: now
    };
    this.logs.push(newLog);
    return newLog;
  }

  public getHistoryForUser(userId: string): BodyMeasurementLog[] {
    return this.logs
      .filter(l => l.userId === userId)
      .sort((a, b) => a.logDate.localeCompare(b.logDate));
  }

  public getLatestMeasurement(userId: string): BodyMeasurementLog | undefined {
    const userLogs = this.getHistoryForUser(userId);
    return userLogs.length > 0 ? userLogs[userLogs.length - 1] : undefined;
  }
}

describe('User Biometrics CRUD Workflows & Upsert Isolation', () => {
  let manager: UserBiometricsManager;

  beforeEach(() => {
    manager = new UserBiometricsManager();
  });

  it('creates and retrieves chronological biometric progression isolated per user', () => {
    const user1 = 'usr_alice';
    const user2 = 'usr_bob';

    manager.logMeasurement(user1, {
      logDate: '2026-09-01',
      weightKg: 65.0,
      calculatedBmi: 22.5
    });

    manager.logMeasurement(user1, {
      logDate: '2026-09-02',
      weightKg: 64.7,
      calculatedBmi: 22.4
    });

    manager.logMeasurement(user2, {
      logDate: '2026-09-01',
      weightKg: 90.0
    });

    const aliceLogs = manager.getHistoryForUser(user1);
    const bobLogs = manager.getHistoryForUser(user2);

    expect(aliceLogs).toHaveLength(2);
    expect(bobLogs).toHaveLength(1);
    expect(aliceLogs[1].weightKg).toBe(64.7);
  });

  it('upserts on same date to ensure one entry per day per user', () => {
    const user = 'usr_claire';

    manager.logMeasurement(user, {
      logDate: '2026-09-03',
      weightKg: 70.0,
      notes: 'Morning measurement'
    });

    manager.logMeasurement(user, {
      logDate: '2026-09-03',
      weightKg: 69.8,
      notes: 'Post-workout adjustment'
    });

    const logs = manager.getHistoryForUser(user);
    expect(logs).toHaveLength(1);
    expect(logs[0].weightKg).toBe(69.8);
    expect(logs[0].notes).toBe('Post-workout adjustment');
  });
});
