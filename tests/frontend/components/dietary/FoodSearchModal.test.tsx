import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodSearchModal } from '../../../../src/components/dietary/FoodSearchModal.tsx';
import { FoodItemNutrition } from '../../../../src/models.ts';

describe('FoodSearchModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    activeModalTab: 'search' as const,
    setActiveModalTab: vi.fn(),
    selectedDate: '2026-09-03',
    formatDateTitle: (dateStr: string) => `Thursday, Sep 3 (${dateStr})`,
    // Search Tab Props
    searchQuery: '',
    setSearchQuery: vi.fn(),
    filteredCatalog: [] as FoodItemNutrition[],
    selectedFoodItem: null,
    setSelectedFoodItem: vi.fn(),
    portionGrams: 100,
    setPortionGrams: vi.fn(),
    onAddEntryToLog: vi.fn(),
    getStoreMetadata: vi.fn(() => null),
    cleanProductTitle: (raw: string) => raw,
    isHouseBrand: vi.fn(() => false),
    // Link Scraper Tab Props
    singleLinkInput: '',
    setSingleLinkInput: vi.fn(),
    singleLinkLoading: false,
    singleLinkError: null,
    onFetchSingleProductLink: vi.fn(),
    // List Import Tab Props
    listLinkInput: '',
    setListLinkInput: vi.fn(),
    listLinkLoading: false,
    listLinkError: null,
    listExtractedProducts: [],
    isBulkImporting: false,
    onFetchSharedList: vi.fn(),
    onBulkImportAllList: vi.fn(),
    onImportListItemToIndex: vi.fn(),
    // Custom Food Form Props
    newFoodName: '',
    setNewFoodName: vi.fn(),
    newFoodBrand: '',
    setNewFoodBrand: vi.fn(),
    newFoodKcal: '',
    setNewFoodKcal: vi.fn(),
    newFoodProtein: '',
    setNewFoodProtein: vi.fn(),
    newFoodCarbs: '',
    setNewFoodCarbs: vi.fn(),
    newFoodSugar: '',
    setNewFoodSugar: vi.fn(),
    newFoodFat: '',
    setNewFoodFat: vi.fn(),
    newFoodFiber: '',
    setNewFoodFiber: vi.fn(),
    onSaveNewCustomFood: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<FoodSearchModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, date context, and close button when open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<FoodSearchModal {...defaultProps} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: /add food item/i })).toBeInTheDocument();
    expect(screen.getByText(/logging into thursday, sep 3/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: '' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders all four tab buttons and triggers setActiveModalTab on tab clicks', async () => {
    const user = userEvent.setup();
    const setActiveModalTab = vi.fn();
    render(<FoodSearchModal {...defaultProps} setActiveModalTab={setActiveModalTab} />);

    const searchTab = screen.getByRole('button', { name: /^search$/i });
    const linkTab = screen.getByRole('button', { name: /^product link$/i });
    const listTab = screen.getByRole('button', { name: /^ah list$/i });
    const customTab = screen.getByRole('button', { name: /^custom$/i });

    expect(searchTab).toBeInTheDocument();
    expect(linkTab).toBeInTheDocument();
    expect(listTab).toBeInTheDocument();
    expect(customTab).toBeInTheDocument();

    await user.click(linkTab);
    expect(setActiveModalTab).toHaveBeenCalledWith('link');

    await user.click(customTab);
    expect(setActiveModalTab).toHaveBeenCalledWith('custom');
  });

  it('allows selecting a provided search result and logging a portion', async () => {
    const user = userEvent.setup();
    const setSelectedFoodItem = vi.fn();
    const onAddEntryToLog = vi.fn();

    const mockItem: FoodItemNutrition = {
      id: 'food-greek-yogurt',
      name: 'Greek Yogurt 0%',
      brand: 'Total Fage',
      kcalPer100g: 57,
      proteinPer100g: 10.3,
      carbsPer100g: 4.0,
      sugarPer100g: 4.0,
      fatPer100g: 0,
      fiberPer100g: 0,
    };

    // 1. Initial render with pre-filtered search results
    const { rerender } = render(
      <FoodSearchModal
        {...defaultProps}
        activeModalTab="search"
        searchQuery="Greek"
        filteredCatalog={[mockItem]}
        selectedFoodItem={null}
        setSelectedFoodItem={setSelectedFoodItem}
        portionGrams={100}
        onAddEntryToLog={onAddEntryToLog}
      />
    );

    // Verify search query input reflects props and provided item card is visible
    expect(screen.getByPlaceholderText(/search shared database/i)).toHaveValue('Greek');
    const itemCard = screen.getByText(/greek yogurt 0%/i);
    expect(itemCard).toBeInTheDocument();

    // User selects the item
    await user.click(itemCard);
    expect(setSelectedFoodItem).toHaveBeenCalledWith(mockItem);

    // 2. Controlled State Harness to verify portion interaction and log dispatch
    const ControlledSelectionHarness = () => {
      const [portionGrams, setPortionGrams] = React.useState(100);
      return (
        <FoodSearchModal
          {...defaultProps}
          activeModalTab="search"
          searchQuery="Greek"
          filteredCatalog={[mockItem]}
          selectedFoodItem={mockItem}
          setSelectedFoodItem={setSelectedFoodItem}
          portionGrams={portionGrams}
          setPortionGrams={setPortionGrams}
          onAddEntryToLog={onAddEntryToLog}
        />
      );
    };

    rerender(<ControlledSelectionHarness />);

    // Verify portion input and live macro calculation appears
    const portionInput = screen.getByRole('spinbutton');
    expect(portionInput).toHaveValue(100);

    // User updates portion grams to 250
    await user.clear(portionInput);
    await user.type(portionInput, '250');
    expect(portionInput).toHaveValue(250);

    // Click "Log ... into ..." button
    const addLogBtn = screen.getByRole('button', { name: /log 250g into thursday, sep 3/i });
    await user.click(addLogBtn);

    expect(onAddEntryToLog).toHaveBeenCalledWith(mockItem, 250);
  });
});
