import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DietaryDailyMacroTotals } from '../../../../src/components/dietary/DietaryDailyMacroTotals.tsx';
import { DailyDietaryLog } from '../../../../src/models.ts';

describe('DietaryDailyMacroTotals Component', () => {
  const mockSummary: DailyDietaryLog = {
    id: 'log-123',
    userId: 'user-1',
    logDate: '2026-09-03',
    totalKcal: 2450,
    totalProtein: 185.5,
    totalCarbs: 260.0,
    totalSugar: 45.2,
    totalFat: 68.4,
    totalFiber: 32.1,
    entries: [
      {
        id: 'entry-1',
        foodItemId: 'food-1',
        name: 'Chicken Breast',
        amountGrams: 200,
        kcalPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        sugarPer100g: 0,
        fatPer100g: 3.6,
        fiberPer100g: 0,
        calculatedKcal: 330,
        calculatedProtein: 62,
        calculatedCarbs: 0,
        calculatedSugar: 0,
        calculatedFat: 7.2,
        calculatedFiber: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'entry-2',
        foodItemId: 'food-2',
        name: 'Oatmeal',
        amountGrams: 100,
        kcalPer100g: 389,
        proteinPer100g: 16.9,
        carbsPer100g: 66.3,
        sugarPer100g: 0,
        fatPer100g: 6.9,
        fiberPer100g: 10.6,
        calculatedKcal: 389,
        calculatedProtein: 16.9,
        calculatedCarbs: 66.3,
        calculatedSugar: 0,
        calculatedFat: 6.9,
        calculatedFiber: 10.6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders macronutrient headers and logged items counter', () => {
    render(<DietaryDailyMacroTotals summary={mockSummary} />);

    expect(screen.getByText(/macronutrient summary/i)).toBeInTheDocument();
    expect(screen.getByText(/2 logged items/i)).toBeInTheDocument();
  });

  it('renders primary hero calories and protein values correctly', () => {
    render(<DietaryDailyMacroTotals summary={mockSummary} />);

    expect(screen.getByText(/total calories/i)).toBeInTheDocument();
    expect(screen.getByText('2450')).toBeInTheDocument();

    expect(screen.getByText(/total protein/i)).toBeInTheDocument();
    expect(screen.getByText('185.5')).toBeInTheDocument();
  });

  it('renders secondary macro totals (carbs, sugar, fat, fiber)', () => {
    render(<DietaryDailyMacroTotals summary={mockSummary} />);

    expect(screen.getByText(/carbohydrates/i)).toBeInTheDocument();
    expect(screen.getByText('260')).toBeInTheDocument();

    expect(screen.getByText(/sugars/i)).toBeInTheDocument();
    expect(screen.getByText('45.2')).toBeInTheDocument();

    expect(screen.getByText(/fats/i)).toBeInTheDocument();
    expect(screen.getByText('68.4')).toBeInTheDocument();

    expect(screen.getByText(/fiber/i)).toBeInTheDocument();
    expect(screen.getByText('32.1')).toBeInTheDocument();
  });

  it('handles empty entries gracefully with zero counts', () => {
    const emptySummary: DailyDietaryLog = {
      id: 'log-empty',
      userId: 'user-1',
      logDate: '2026-09-03',
      totalKcal: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalSugar: 0,
      totalFat: 0,
      totalFiber: 0,
      entries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<DietaryDailyMacroTotals summary={emptySummary} />);

    expect(screen.getByText(/0 logged items/i)).toBeInTheDocument();
  });
});
