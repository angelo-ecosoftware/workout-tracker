import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('triggers onOpenAddModal callback when Log Food button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoggedFoodList {...defaultProps} />);

    const logFoodBtn = screen.getByRole('button', { name: /log food/i });
    await user.click(logFoodBtn);

    expect(defaultProps.onOpenAddModal).toHaveBeenCalledTimes(1);
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

  it('calls onUpdateEntryGrams when the portion size input changes with realistic typing', async () => {
    const user = userEvent.setup();
    const onUpdateEntryGrams = vi.fn();
    let entriesState: LoggedDietaryEntry[] = [
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
      },
    ];

    // Controlled wrapper to simulate parent state management
    const ControlledHarness = () => {
      const [entries, setEntries] = React.useState(entriesState);
      return (
        <LoggedFoodList
          {...defaultProps}
          entries={entries}
          onUpdateEntryGrams={(id, grams) => {
            onUpdateEntryGrams(id, grams);
            setEntries((prev) =>
              prev.map((e) => (e.id === id ? { ...e, amountGrams: grams } : e))
            );
          }}
        />
      );
    };

    render(<ControlledHarness />);

    const gramsInput = screen.getByRole('spinbutton');
    expect(gramsInput).toHaveValue(150);

    // Realistic user interaction: focus, clear existing value, and type new grams
    await user.clear(gramsInput);
    await user.type(gramsInput, '200');

    expect(gramsInput).toHaveValue(200);
    expect(onUpdateEntryGrams).toHaveBeenLastCalledWith('entry-1', 200);
  });

  it('updates portion value correctly when user clicks and types into a 0-filled input without clearing first', async () => {
    const user = userEvent.setup();
    const onUpdateEntryGrams = vi.fn();
    const mockZeroEntry: LoggedDietaryEntry[] = [
      {
        id: 'entry-zero',
        foodItemId: 'item-zero',
        name: 'Protein Shake',
        amountGrams: 0,
        kcalPer100g: 100,
        proteinPer100g: 20,
        carbsPer100g: 2,
        sugarPer100g: 1,
        fatPer100g: 1,
        fiberPer100g: 0,
        calculatedKcal: 0,
        calculatedProtein: 0,
        calculatedCarbs: 0,
        calculatedSugar: 0,
        calculatedFat: 0,
        calculatedFiber: 0,
      },
    ];

    const StatefulZeroHarness = () => {
      const [entries, setEntries] = React.useState(mockZeroEntry);
      return (
        <LoggedFoodList
          {...defaultProps}
          entries={entries}
          onUpdateEntryGrams={(id, grams) => {
            onUpdateEntryGrams(id, grams);
            setEntries((prev) =>
              prev.map((e) => (e.id === id ? { ...e, amountGrams: grams } : e))
            );
          }}
        />
      );
    };

    render(<StatefulZeroHarness />);

    const gramsInput = screen.getByRole('spinbutton');
    // When amountGrams is 0, input renders placeholder "0" with empty string to avoid leading zeros
    expect(gramsInput).toHaveValue(null);

    // User directly clicks and types '150' without manually pressing backspace or clear
    await user.type(gramsInput, '150');

    // Number('0150') is parsed by Number(e.target.value) || 0 resulting in numeric 150
    expect(onUpdateEntryGrams).toHaveBeenLastCalledWith('entry-zero', 150);
    expect(gramsInput).toHaveValue(150);
  });

  it('handles clearing portion input and falls back to 0 without NaN', async () => {
    const user = userEvent.setup();
    const onUpdateEntryGrams = vi.fn();
    const mockEntries: LoggedDietaryEntry[] = [
      {
        id: 'entry-fallback',
        foodItemId: 'item-fallback',
        name: 'Oatmeal',
        amountGrams: 50,
        kcalPer100g: 389,
        proteinPer100g: 16.9,
        carbsPer100g: 66.3,
        sugarPer100g: 0,
        fatPer100g: 6.9,
        fiberPer100g: 10.6,
        calculatedKcal: 194.5,
        calculatedProtein: 8.5,
        calculatedCarbs: 33.2,
        calculatedSugar: 0,
        calculatedFat: 3.5,
        calculatedFiber: 5.3,
      },
    ];

    render(<LoggedFoodList {...defaultProps} entries={mockEntries} onUpdateEntryGrams={onUpdateEntryGrams} />);

    const gramsInput = screen.getByRole('spinbutton');
    await user.clear(gramsInput);

    expect(onUpdateEntryGrams).toHaveBeenCalledWith('entry-fallback', 0);
  });

  it('calls onDeleteEntry when the delete trash button is clicked', async () => {
    const user = userEvent.setup();
    const onDeleteEntry = vi.fn();
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

      },
    ];

    render(<LoggedFoodList {...defaultProps} entries={mockEntries} onDeleteEntry={onDeleteEntry} />);

    const deleteBtn = screen.getByTitle(/remove product/i);
    await user.click(deleteBtn);

    expect(onDeleteEntry).toHaveBeenCalledWith('entry-del-1');
  });
});
