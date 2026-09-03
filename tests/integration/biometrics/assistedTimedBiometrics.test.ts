import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Assisted Timed Biometrics & Moving Average Trend Estimator', () => {

  describe('Moving Average & Weight Fluctuation Smoothing', () => {
    it('computes 7-day exponential moving average (EMA) to smooth daily water weight noise', () => {
      const dailyWeights = [75.0, 75.8, 74.9, 75.2, 76.1, 74.8, 74.5];
      const k = 2 / (dailyWeights.length + 1);

      let ema = dailyWeights[0];
      for (let i = 1; i < dailyWeights.length; i++) {
        ema = dailyWeights[i] * k + ema * (1 - k);
      }

      const roundedEma = Number(ema.toFixed(2));
      expect(roundedEma).toBeGreaterThan(74.5);
      expect(roundedEma).toBeLessThan(76.0);
    });

    it('estimates weekly delta rate and projected goal achievement date', () => {
      const startingWeight = 80.0;
      const currentWeight = 78.0;
      const targetWeight = 75.0;
      const weeksElapsed = 4;

      const weeklyRate = (startingWeight - currentWeight) / weeksElapsed; // 0.5 kg/week
      const remainingWeightLoss = currentWeight - targetWeight; // 3.0 kg
      const projectedWeeksRemaining = remainingWeightLoss / weeklyRate; // 6 weeks

      expect(weeklyRate).toBe(0.5);
      expect(projectedWeeksRemaining).toBe(6);
    });
  });

  describe('Debounced Biometric Input & Timed Sync', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('debounces rapid body weight slider or keyboard increments', () => {
      const saveFn = vi.fn();

      const debounce = (fn: Function, delayMs: number) => {
        let timer: any;
        return (...args: any[]) => {
          clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delayMs);
        };
      };

      const debouncedSave = debounce(saveFn, 400);

      debouncedSave(75.1);
      debouncedSave(75.2);
      debouncedSave(75.3);

      expect(saveFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(450);

      expect(saveFn).toHaveBeenCalledTimes(1);
      expect(saveFn).toHaveBeenCalledWith(75.3);
    });
  });
});
