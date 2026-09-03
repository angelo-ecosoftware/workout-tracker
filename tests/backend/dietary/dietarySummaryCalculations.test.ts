import { describe, it, expect } from 'vitest';
import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../../../src/models.ts';

interface MacroTargetGoals {
  targetKcal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

interface MacroProgressSummary {
  remainingKcal: number;
  proteinProgressPercent: number;
  carbsProgressPercent: number;
  fatProgressPercent: number;
  macroRatioPercent: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

function calculateMacroSummary(dailyLog: DailyDietaryLog, targets: MacroTargetGoals): MacroProgressSummary {
  const remainingKcal = targets.targetKcal - dailyLog.totalKcal;
  const proteinProgressPercent = Math.min(100, Math.round((dailyLog.totalProtein / targets.targetProtein) * 100));
  const carbsProgressPercent = Math.min(100, Math.round((dailyLog.totalCarbs / targets.targetCarbs) * 100));
  const fatProgressPercent = Math.min(100, Math.round((dailyLog.totalFat / targets.targetFat) * 100));

  // Calories from macros: Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
  const proteinKcal = dailyLog.totalProtein * 4;
  const carbsKcal = dailyLog.totalCarbs * 4;
  const fatKcal = dailyLog.totalFat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const macroRatioPercent = {
    protein: Math.round((proteinKcal / totalMacroKcal) * 100),
    carbs: Math.round((carbsKcal / totalMacroKcal) * 100),
    fat: Math.round((fatKcal / totalMacroKcal) * 100)
  };

  return {
    remainingKcal,
    proteinProgressPercent,
    carbsProgressPercent,
    fatProgressPercent,
    macroRatioPercent
  };
}

describe('Dietary Summary Calculations & Macro Progress Analytics', () => {

  it('calculates remaining calories and progress percentage toward daily goals', () => {
    const dailyLog: DailyDietaryLog = {
      date: '2026-09-03',
      entries: [],
      totalKcal: 1800,
      totalProtein: 150,
      totalCarbs: 180,
      totalSugar: 25,
      totalFat: 50,
      totalFiber: 30
    };

    const targets: MacroTargetGoals = {
      targetKcal: 2400,
      targetProtein: 160,
      targetCarbs: 250,
      targetFat: 70
    };

    const summary = calculateMacroSummary(dailyLog, targets);

    expect(summary.remainingKcal).toBe(600);
    expect(summary.proteinProgressPercent).toBe(94); // (150 / 160) * 100 = 93.75 -> 94
    expect(summary.carbsProgressPercent).toBe(72);   // (180 / 250) * 100 = 72
    expect(summary.fatProgressPercent).toBe(71);     // (50 / 70) * 100 = 71.4 -> 71
  });

  it('calculates macro percentage distribution correctly (4/4/9 rule)', () => {
    // 100g protein (400 kcal) + 100g carbs (400 kcal) + 44.4g fat (400 kcal) => 33% each
    const balancedLog: DailyDietaryLog = {
      date: '2026-09-03',
      entries: [],
      totalKcal: 1200,
      totalProtein: 100,
      totalCarbs: 100,
      totalSugar: 10,
      totalFat: 44.44,
      totalFiber: 20
    };

    const targets: MacroTargetGoals = {
      targetKcal: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 60
    };

    const summary = calculateMacroSummary(balancedLog, targets);
    expect(summary.macroRatioPercent.protein).toBe(33);
    expect(summary.macroRatioPercent.carbs).toBe(33);
    expect(summary.macroRatioPercent.fat).toBe(33);
  });
});
