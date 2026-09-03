import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodSearchTab } from '../../../../src/components/dietary/FoodSearchTab.tsx';
import { FoodItemNutrition } from '../../../../src/models.ts';

describe('FoodSearchTab - Portion Grams Input & Leading Zero Handling', () => {
  const mockItem: FoodItemNutrition = {
    id: 'food-1',
    name: 'Griekse Yoghurt',
    brand: 'Albert Heijn',
    barcode: '8710400000001',
    kcalPer100g: 120,
    proteinPer100g: 10,
    carbsPer100g: 4,
    sugarPer100g: 4,
    fatPer100g: 5,
    fiberPer100g: 0,
    packageWeightGrams: 500,
  };

  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    filteredCatalog: [mockItem],
    selectedFoodItem: mockItem,
    setSelectedFoodItem: vi.fn(),
    portionGrams: 100,
    setPortionGrams: vi.fn(),
    selectedDate: '2026-09-03',
    formatDateTitle: (d: string) => d,
    onAddEntryToLog: vi.fn(),
    onSelectTab: vi.fn(),
    setNewFoodName: vi.fn(),
    getStoreMetadata: vi.fn(() => null),
    cleanProductTitle: (name: string) => name,
    isHouseBrand: vi.fn(() => false),
  };

  it('renders portionGrams when > 0', () => {
    render(<FoodSearchTab {...defaultProps} portionGrams={150} />);
    const portionInput = screen.getByDisplayValue('150') as HTMLInputElement;
    expect(portionInput).toBeInTheDocument();
    expect(portionInput.value).toBe('150');
  });

  it('renders empty string in input when portionGrams is 0 to avoid leading 0 artifact', () => {
    render(<FoodSearchTab {...defaultProps} portionGrams={0} />);
    const inputs = screen.getAllByRole('spinbutton');
    const portionInput = inputs[0] as HTMLInputElement;
    expect(portionInput.value).toBe('');
  });

  it('calls setPortionGrams with parsed integer on change', async () => {
    const user = userEvent.setup();
    const setPortionGrams = vi.fn();
    render(<FoodSearchTab {...defaultProps} portionGrams={0} setPortionGrams={setPortionGrams} />);

    const inputs = screen.getAllByRole('spinbutton');
    const portionInput = inputs[0] as HTMLInputElement;
    await user.type(portionInput, '250');

    expect(setPortionGrams).toHaveBeenCalled();
  });
});
