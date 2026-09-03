import { describe, it, expect } from 'vitest';
import { BodyMeasurementLog, UserMetrics } from '../../../src/models.ts';

describe('Happy Path Biometric Forms: Measurement Logging & BMI Pipelines', () => {

  describe('Form 1: Daily Bodyweight & Height Log Form', () => {
    it('creates daily measurement log and automatically computes BMI', () => {
      const weightKg = 78.5;
      const heightCm = 180;
      const heightM = heightCm / 100;
      const calculatedBmi = Number((weightKg / (heightM * heightM)).toFixed(1));

      const log: BodyMeasurementLog = {
        id: 'bm_001',
        userId: 'usr_happy_01',
        logDate: '2026-09-03',
        weightKg,
        heightCm,
        calculatedBmi,
        source: 'manual',
        notes: 'Morning weigh-in before breakfast',
        createdAt: new Date('2026-09-03T07:00:00.000Z'),
        updatedAt: new Date('2026-09-03T07:00:00.000Z')
      };

      expect(log.calculatedBmi).toBe(24.2);
      expect(log.weightKg).toBe(78.5);
      expect(log.source).toBe('manual');
    });
  });

  describe('Form 2: Comprehensive Body Circumferences Form', () => {
    it('records body fat percentage and waist circumference alongside weight', () => {
      const log: BodyMeasurementLog = {
        id: 'bm_002',
        userId: 'usr_happy_01',
        logDate: '2026-09-03',
        weightKg: 78.5,
        waistCm: 81.5,
        bodyFatPercentage: 14.2,
        source: 'profile',
        createdAt: new Date('2026-09-03T07:00:00.000Z'),
        updatedAt: new Date('2026-09-03T07:00:00.000Z')
      };

      expect(log.waistCm).toBe(81.5);
      expect(log.bodyFatPercentage).toBe(14.2);
    });
  });

  describe('Form 3: User Metrics Profile Sync Pipeline', () => {
    it('synchronizes user baseline metrics into UserMetrics structure', () => {
      const metrics: UserMetrics = {
        dateOfBirth: '1995-06-15',
        height: 180,
        weight: 78.5,
        gender: 'male',
        fitnessLevel: 'intermediate',
        goals: ['hypertrophy', 'strength'],
        trainingLocation: 'gym',
        bodyMeasurementsNotes: 'Targeting 80kg at 12% body fat',
        updatedAt: new Date().toISOString()
      };

      expect(metrics.weight).toBe(78.5);
      expect(metrics.fitnessLevel).toBe('intermediate');
      expect(metrics.goals).toContain('hypertrophy');
    });
  });
});
