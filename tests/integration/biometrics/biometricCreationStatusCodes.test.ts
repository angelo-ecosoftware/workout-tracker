import { describe, it, expect } from 'vitest';
import { BodyMeasurementLog } from '../../../src/models.ts';

interface ValidationResult {
  valid: boolean;
  statusCode: number;
  error?: string;
}

function validateBiometricPayload(payload: Partial<BodyMeasurementLog>): ValidationResult {
  if (!payload.userId || payload.userId.trim().length === 0) {
    return { valid: false, statusCode: 401, error: 'User must be authenticated' };
  }
  if (!payload.logDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.logDate)) {
    return { valid: false, statusCode: 400, error: 'Valid logDate in YYYY-MM-DD format is required' };
  }
  if (payload.weightKg === undefined || payload.weightKg <= 0 || payload.weightKg > 500) {
    return { valid: false, statusCode: 422, error: 'weightKg must be between 0.1 and 500' };
  }
  if (payload.heightCm !== undefined && (payload.heightCm < 50 || payload.heightCm > 300)) {
    return { valid: false, statusCode: 422, error: 'heightCm must be between 50 and 300' };
  }
  if (payload.bodyFatPercentage !== undefined && (payload.bodyFatPercentage < 1 || payload.bodyFatPercentage > 75)) {
    return { valid: false, statusCode: 422, error: 'bodyFatPercentage must be between 1 and 75' };
  }

  return { valid: true, statusCode: 201 };
}

describe('Biometric Creation Status Codes & Input Validation', () => {

  it('returns 201 Created for a valid biometric measurement entry', () => {
    const validLog: Partial<BodyMeasurementLog> = {
      userId: 'usr_101',
      logDate: '2026-09-03',
      weightKg: 75.4,
      heightCm: 178,
      bodyFatPercentage: 15.0
    };

    const res = validateBiometricPayload(validLog);
    expect(res.valid).toBe(true);
    expect(res.statusCode).toBe(201);
  });

  it('returns 401 Unauthorized if userId is missing', () => {
    const unauthLog: Partial<BodyMeasurementLog> = {
      userId: '',
      logDate: '2026-09-03',
      weightKg: 80.0
    };

    const res = validateBiometricPayload(unauthLog);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.error).toContain('authenticated');
  });

  it('returns 400 Bad Request when logDate is invalid', () => {
    const badDateLog: Partial<BodyMeasurementLog> = {
      userId: 'usr_101',
      logDate: '03-09-2026', // wrong format
      weightKg: 80.0
    };

    const res = validateBiometricPayload(badDateLog);
    expect(res.valid).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toContain('YYYY-MM-DD');
  });

  it('returns 422 Unprocessable Entity when weight or bodyfat is outside physiological bounds', () => {
    const invalidWeight: Partial<BodyMeasurementLog> = {
      userId: 'usr_101',
      logDate: '2026-09-03',
      weightKg: -5.0
    };

    const res1 = validateBiometricPayload(invalidWeight);
    expect(res1.valid).toBe(false);
    expect(res1.statusCode).toBe(422);

    const invalidFat: Partial<BodyMeasurementLog> = {
      userId: 'usr_101',
      logDate: '2026-09-03',
      weightKg: 70.0,
      bodyFatPercentage: 95.0
    };

    const res2 = validateBiometricPayload(invalidFat);
    expect(res2.valid).toBe(false);
    expect(res2.statusCode).toBe(422);
  });
});
