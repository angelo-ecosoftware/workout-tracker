import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders modal header, date context, and close button when open', () => {
    render(<FoodSearchModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /add food item/i })).toBeInTheDocument();
    expect(screen.getByText(/logging into thursday, sep 3/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders all four tab buttons and triggers setActiveModalTab on tab clicks', () => {
    render(<FoodSearchModal {...defaultProps} />);

    const searchTab = screen.getByRole('button', { name: /^search$/i });
    const linkTab = screen.getByRole('button', { name: /^product link$/i });
    const listTab = screen.getByRole('button', { name: /^ah list$/i });
    const customTab = screen.getByRole('button', { name: /^custom$/i });

    expect(searchTab).toBeInTheDocument();
    expect(linkTab).toBeInTheDocument();
    expect(listTab).toBeInTheDocument();
    expect(customTab).toBeInTheDocument();

    fireEvent.click(linkTab);
    expect(defaultProps.setActiveModalTab).toHaveBeenCalledWith('link');

    fireEvent.click(customTab);
    expect(defaultProps.setActiveModalTab).toHaveBeenCalledWith('custom');
  });

  it('renders search tab content when activeModalTab is search', () => {
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

    render(
      <FoodSearchModal
        {...defaultProps}
        activeModalTab="search"
        searchQuery="yogurt"
        filteredCatalog={[mockItem]}
      />
    );

    expect(screen.getByPlaceholderText(/search shared database/i)).toHaveValue('yogurt');
    expect(screen.getByText(/greek yogurt 0%/i)).toBeInTheDocument();
  });
});
