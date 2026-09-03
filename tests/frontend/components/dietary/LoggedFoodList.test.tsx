import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoggedFoodList } from '../../../../src/components/dietary/LoggedFoodList.tsx';
import { LoggedDietaryEntry } from '../../../../src/models.ts';

describe('LoggedFoodList Component', () => {
  const defaultProps = {
    entries: [] as LoggedDietaryEntry[],
    selectedDate: '2026-09-03',
    isToday: true,
    onOpenAddModal: vi.fn(),
    onUpdateEntryGrams: vi.fn(),
    onDeleteEntry: vi.fn(),
  };

  it('renders empty state when there are no logged entries', () => {
    render(<LoggedFoodList {...defaultProps} entries={[]} isToday={true} />);

    expect(screen.getByText(/no food logged for today/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log food/i })).toBeInTheDocument();
  });

  it('renders empty state for a past date when not today', () => {
    render(<LoggedFoodList {...defaultProps} entries={[]} isToday={false} selectedDate="2026-09-01" />);

    expect(screen.getByText(/no food logged for 2026-09-01/i)).toBeInTheDocument();
  });

  it('triggers onOpenAddModal callback when Log Food button is clicked', () => {
    render(<LoggedFoodList {...defaultProps} />);

    const logFoodBtn = screen.getByRole('button', { name: /log food/i });
    fireEvent.click(logFoodBtn);

    expect(defaultProps.onOpenAddModal).toHaveBeenCalled();
  });

  it('renders logged entries with names, brands, portion input, and macro breakdown', () => {
    const mockEntries: LoggedDietaryEntry[] = [
      {
        id: 'entry-1',
        foodItemId: 'item-1',
        name: 'Whey Protein Isolate',
        brand: 'MyProtein',
        amountGrams: 30,
        kcalPer100g: 375,
        proteinPer100g: 90,
        carbsPer100g: 2.5,
        sugarPer100g: 1.0,
        fatPer100g: 1.5,
        fiberPer100g: 0,
        calculatedKcal: 112.5,
        calculatedProtein: 27,
        calculatedCarbs: 0.8,
        calculatedSugar: 0.3,
        calculatedFat: 0.5,
        calculatedFiber: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(<LoggedFoodList {...defaultProps} entries={mockEntries} />);

    expect(screen.getByText(/logged food items \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/whey protein isolate/i)).toBeInTheDocument();
    expect(screen.getByText(/myprotein/i)).toBeInTheDocument();
    expect(screen.getByText(/ref: 375 kcal \/ 100g/i)).toBeInTheDocument();

    const gramsInput = screen.getByDisplayValue('30');
    expect(gramsInput).toBeInTheDocument();

    expect(screen.getByText('112.5')).toBeInTheDocument();
    expect(screen.getByText('27g')).toBeInTheDocument();
  });

  it('calls onUpdateEntryGrams when the portion size input changes', () => {
    const mockEntries: LoggedDietaryEntry[] = [
      {
        id: 'entry-1',
        foodItemId: 'item-1',
        name: 'Chicken Breast',
        amountGrams: 150,
        kcalPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        sugarPer100g: 0,
        fatPer100g: 3.6,
        fiberPer100g: 0,
        calculatedKcal: 247.5,
        calculatedProtein: 46.5,
        calculatedCarbs: 0,
        calculatedSugar: 0,
        calculatedFat: 5.4,
        calculatedFiber: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(<LoggedFoodList {...defaultProps} entries={mockEntries} />);

    const gramsInput = screen.getByDisplayValue('150');
    fireEvent.change(gramsInput, { target: { value: '200' } });

    expect(defaultProps.onUpdateEntryGrams).toHaveBeenCalledWith('entry-1', 200);
  });

  it('calls onDeleteEntry when the delete trash button is clicked', () => {
    const mockEntries: LoggedDietaryEntry[] = [
      {
        id: 'entry-del-1',
        foodItemId: 'item-1',
        name: 'Chicken Breast',
        amountGrams: 150,
        kcalPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        sugarPer100g: 0,
        fatPer100g: 3.6,
        fiberPer100g: 0,
        calculatedKcal: 247.5,
        calculatedProtein: 46.5,
        calculatedCarbs: 0,
        calculatedSugar: 0,
        calculatedFat: 5.4,
        calculatedFiber: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(<LoggedFoodList {...defaultProps} entries={mockEntries} />);

    const deleteBtn = screen.getByTitle(/remove product/i);
    fireEvent.click(deleteBtn);

    expect(defaultProps.onDeleteEntry).toHaveBeenCalledWith('entry-del-1');
  });
});
