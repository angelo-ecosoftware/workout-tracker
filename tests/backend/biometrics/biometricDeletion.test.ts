import { describe, it, expect, beforeEach } from 'vitest';
import { BodyMeasurementLog } from '../../../src/models.ts';

class MockBiometricStore {
  private logs = new Map<string, BodyMeasurementLog>(); // id -> log

  public addLog(log: BodyMeasurementLog) {
    this.logs.set(log.id, log);
  }

  public getLog(id: string): BodyMeasurementLog | undefined {
    return this.logs.get(id);
  }

  public getLogsForUser(userId: string): BodyMeasurementLog[] {
    return Array.from(this.logs.values()).filter(l => l.userId === userId);
  }

  public deleteLog(id: string): boolean {
    return this.logs.delete(id);
  }

  public purgeAllForUser(userId: string): number {
    let count = 0;
    for (const [id, log] of this.logs.entries()) {
      if (log.userId === userId) {
        this.logs.delete(id);
        count++;
      }
    }
    return count;
  }
}

describe('Biometric Deletion Workflows & History Purging', () => {
  let store: MockBiometricStore;

  beforeEach(() => {
    store = new MockBiometricStore();
  });

  it('deletes an individual measurement log entry by ID', () => {
    const log: BodyMeasurementLog = {
      id: 'bm_del_01',
      userId: 'usr_del_10',
      logDate: '2026-09-01',
      weightKg: 82.5,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.addLog(log);
    expect(store.getLog('bm_del_01')).toBeDefined();

    const deleted = store.deleteLog('bm_del_01');
    expect(deleted).toBe(true);
    expect(store.getLog('bm_del_01')).toBeUndefined();
  });

  it('purges all historical biometric measurements upon GDPR user account reset', () => {
    const userId = 'usr_gdpr_20';

    store.addLog({
      id: 'log_1',
      userId,
      logDate: '2026-08-01',
      weightKg: 85.0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    store.addLog({
      id: 'log_2',
      userId,
      logDate: '2026-08-15',
      weightKg: 84.0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    expect(store.getLogsForUser(userId)).toHaveLength(2);

    const purgedCount = store.purgeAllForUser(userId);
    expect(purgedCount).toBe(2);
    expect(store.getLogsForUser(userId)).toHaveLength(0);
  });
});
