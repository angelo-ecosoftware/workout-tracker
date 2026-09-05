import { useState, useEffect } from 'react';
import {
  LoggedDietaryEntry,
  DailyDietaryLog,
  FoodItemNutrition,
} from '../../models.ts';
import {
  fetchDailyDietaryLog,
  persistDailyDietaryLog,
  fetchHiveMindFoodCatalog,
  saveHiveMindFoodItem,
  saveHiveMindFoodItems,
  calculatePortionNutrients,
  computeDailyTotals,
} from '../../lib/dietaryData.ts';

export const useDietaryTracking = (userId: string) => {
  // Date State: YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Day's Logged Entries & Summary
  const [entries, setEntries] = useState<LoggedDietaryEntry[]>([]);
  const [summary, setSummary] = useState<DailyDietaryLog>({
    date: todayStr,
    entries: [],
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalSugar: 0,
    totalFat: 0,
    totalFiber: 0,
  });

  // Search & Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'search' | 'link' | 'list' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCatalog, setFilteredCatalog] = useState<FoodItemNutrition[]>([]);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItemNutrition | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Link Scraper Modal States
  const [singleLinkInput, setSingleLinkInput] = useState('');
  const [singleLinkLoading, setSingleLinkLoading] = useState(false);
  const [singleLinkError, setSingleLinkError] = useState<string | null>(null);

  // List Scraper Modal States
  const [listLinkInput, setListLinkInput] = useState('');
  const [listLinkLoading, setListLinkLoading] = useState(false);
  const [listLinkError, setListLinkError] = useState<string | null>(null);
  const [listExtractedProducts, setListExtractedProducts] = useState<
    Array<{ id: string; title: string; brand?: string; salesUnitSize?: string }>
  >([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Custom Food Form States
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodBarcode, setNewFoodBarcode] = useState('');
  const [newFoodServingUnit, setNewFoodServingUnit] = useState<'gram' | 'ml'>('gram');
  const [newFoodKcal, setNewFoodKcal] = useState<number | ''>('');
  const [newFoodProtein, setNewFoodProtein] = useState<number | ''>('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number | ''>('');
  const [newFoodSugar, setNewFoodSugar] = useState<number | ''>('');
  const [newFoodFat, setNewFoodFat] = useState<number | ''>('');
  const [newFoodFiber, setNewFoodFiber] = useState<number | ''>('');

  // Refresh active day's entries whenever selectedDate or userId changes
  useEffect(() => {
    let isCancelled = false;
    const loadDayLog = async () => {
      const log = await fetchDailyDietaryLog(userId, selectedDate);
      if (!isCancelled) {
        setEntries(log.entries || []);
        setSummary(log);
      }
    };
    loadDayLog();
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, userId]);

  // Handle Catalog Search Debounce / Live Update
  useEffect(() => {
    let isCancelled = false;
    const fetchCatalog = async () => {
      const results = await fetchHiveMindFoodCatalog(searchQuery, userId);
      if (!isCancelled) {
        setFilteredCatalog(results);
      }
    };
    fetchCatalog();
    return () => {
      isCancelled = true;
    };
  }, [searchQuery, isAddModalOpen, userId]);

  // Date Navigation Handlers
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const nextDateStr = current.toISOString().split('T')[0];
    if (nextDateStr <= todayStr) {
      setSelectedDate(nextDateStr);
    }
  };

  const isToday = selectedDate === todayStr;

  const formatDateTitle = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return dateStr;
  };

  // Entry Modification Handlers
  const handleUpdateEntryGrams = (entryId: string, grams: number) => {
    const updatedEntries = entries.map((entry) => {
      if (entry.id === entryId) {
        const portion = calculatePortionNutrients(entry, grams);
        return {
          ...entry,
          amountGrams: grams,
          ...portion,
        };
      }
      return entry;
    });

    const totals = computeDailyTotals(updatedEntries);
    const newLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...totals,
    };

    setEntries(updatedEntries);
    setSummary(newLog);
    persistDailyDietaryLog(userId, newLog);
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== entryId);
    const totals = computeDailyTotals(updatedEntries);
    const newLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...totals,
    };

    setEntries(updatedEntries);
    setSummary(newLog);
    persistDailyDietaryLog(userId, newLog);
  };

  const handleAddEntryToLog = (food: FoodItemNutrition, grams: number) => {
    const portion = calculatePortionNutrients(food, grams);
    const newEntry: LoggedDietaryEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      foodItemId: food.id,
      name: food.name,
      brand: food.brand,
      amountGrams: grams,
      servingUnit: food.servingUnit || 'gram',
      kcalPer100g: food.kcalPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      sugarPer100g: food.sugarPer100g,
      fatPer100g: food.fatPer100g,
      fiberPer100g: food.fiberPer100g,
      ...portion,
      loggedAt: new Date().toISOString(),
    };

    const updatedEntries = [...entries, newEntry];
    const totals = computeDailyTotals(updatedEntries);
    const newLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...totals,
    };

    setEntries(updatedEntries);
    setSummary(newLog);
    persistDailyDietaryLog(userId, newLog);

    setIsAddModalOpen(false);
    setSelectedFoodItem(null);
    setPortionGrams(100);
  };

  // Supermarket Product Link Scraper Handler
  const handleFetchSingleProductLink = async () => {
    if (!singleLinkInput.trim()) return;
    setSingleLinkLoading(true);
    setSingleLinkError(null);

    try {
      const res = await fetch(`/api/product-link?url=${encodeURIComponent(singleLinkInput.trim())}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch product data (status ${res.status})`);
      }
      const data = await res.json();
      if (!data.success || !data.product) {
        throw new Error(data.error || 'We could not extract the nutritional information for this product right now.');
      }

      const rawTitle = (data.product.name || '').trim();
      const lowerTitle = rawTitle.toLowerCase();
      const isBlockedOrInvalid =
        !rawTitle ||
        lowerTitle.includes('access denied') ||
        lowerTitle.includes('attention required') ||
        lowerTitle.includes('just a moment') ||
        lowerTitle.includes('403 forbidden') ||
        lowerTitle.includes('cloudflare') ||
        rawTitle === 'Product';

      if (isBlockedOrInvalid) {
        throw new Error('Could not resolve product from this link at the moment. Please verify the URL or search by name.');
      }

      const scrapedProduct: FoodItemNutrition = {
        id: data.product.id || `scraped_${Date.now()}`,
        name: rawTitle,
        brand: data.product.brand || '',
        servingUnit: data.product.servingUnit || 'gram',
        kcalPer100g: data.product.kcalPer100g || 0,
        proteinPer100g: data.product.proteinPer100g || 0,
        carbsPer100g: data.product.carbsPer100g || 0,
        sugarPer100g: data.product.sugarPer100g || 0,
        fatPer100g: data.product.fatPer100g || 0,
        fiberPer100g: data.product.fiberPer100g || 0,
        sourceUrl: singleLinkInput.trim(),
        packageWeightGrams: data.product.packageWeightGrams,
        pieceCount: data.product.pieceCount,
      };

      await saveHiveMindFoodItem(scrapedProduct, userId);

      setSelectedFoodItem(scrapedProduct);
      setPortionGrams(scrapedProduct.packageWeightGrams || 100);
      setActiveModalTab('search');
      setSingleLinkInput('');
    } catch (err: unknown) {
      setSingleLinkError(err instanceof Error ? err.message : 'Error extracting product data.');
    } finally {
      setSingleLinkLoading(false);
    }
  };

  // AH Shared List Importer Handler
  const handleFetchSharedList = async () => {
    if (!listLinkInput.trim()) return;
    setListLinkLoading(true);
    setListLinkError(null);
    setListExtractedProducts([]);

    try {
      const match = listLinkInput.trim().match(/gedeelde-lijst\/([a-zA-Z0-9_-]+)/);
      const listId = match ? match[1] : listLinkInput.trim();
      const res = await fetch(`/api/grocery-list?listId=${encodeURIComponent(listId)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch list (status ${res.status})`);
      }
      const data = await res.json();
      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Invalid list response');
      }

      const mapped = (data.products as { id: string | number; title: string; brand?: string; salesUnitSize?: string }[]).map((p) => ({
        id: String(p.id),
        title: p.title,
        brand: p.brand || 'Albert Heijn',
        salesUnitSize: p.salesUnitSize,
      }));
      setListExtractedProducts(mapped);
    } catch (err: unknown) {
      setListLinkError(err instanceof Error ? err.message : 'Failed to extract shared list.');
    } finally {
      setListLinkLoading(false);
    }
  };

  const handleImportListItemToIndex = async (item: {
    id: string;
    title: string;
    brand?: string;
    salesUnitSize?: string;
  }) => {
    const directUrl = `https://www.ah.nl/producten/product/${item.id}`;
    try {
      const res = await fetch(`/api/product-link?url=${encodeURIComponent(directUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          const foodItem: FoodItemNutrition = {
            id: data.product.id || `ah_${item.id}`,
            name: data.product.name || item.title,
            brand: data.product.brand || item.brand || 'Albert Heijn',
            servingUnit: data.product.servingUnit || 'gram',
            kcalPer100g: data.product.kcalPer100g || 0,
            proteinPer100g: data.product.proteinPer100g || 0,
            carbsPer100g: data.product.carbsPer100g || 0,
            sugarPer100g: data.product.sugarPer100g || 0,
            fatPer100g: data.product.fatPer100g || 0,
            fiberPer100g: data.product.fiberPer100g || 0,
            sourceUrl: directUrl,
            packageWeightGrams: data.product.packageWeightGrams,
            pieceCount: data.product.pieceCount,
          };
          await saveHiveMindFoodItem(foodItem, userId);
          setSelectedFoodItem(foodItem);
          setPortionGrams(foodItem.packageWeightGrams || 100);
          setActiveModalTab('search');
          return;
        }
      }
    } catch {}

    const fallbackItem: FoodItemNutrition = {
      id: `ah_${item.id}`,
      name: item.title,
      brand: item.brand || 'Albert Heijn',
      kcalPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      fiberPer100g: 0,
      sugarPer100g: 0,
      sourceUrl: directUrl,
    };
    await saveHiveMindFoodItem(fallbackItem, userId);
    setSelectedFoodItem(fallbackItem);
    setActiveModalTab('search');
  };

  const handleBulkImportAllList = async () => {
    if (listExtractedProducts.length === 0) return;
    setIsBulkImporting(true);

    const importedItems: FoodItemNutrition[] = [];
    for (const item of listExtractedProducts) {
      const directUrl = `https://www.ah.nl/producten/product/${item.id}`;
      try {
        const res = await fetch(`/api/product-link?url=${encodeURIComponent(directUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.product) {
            importedItems.push({
              id: data.product.id || `ah_${item.id}`,
              name: data.product.name || item.title,
              brand: data.product.brand || item.brand || 'Albert Heijn',
              servingUnit: data.product.servingUnit || 'gram',
              kcalPer100g: data.product.kcalPer100g || 0,
              proteinPer100g: data.product.proteinPer100g || 0,
              carbsPer100g: data.product.carbsPer100g || 0,
              sugarPer100g: data.product.sugarPer100g || 0,
              fatPer100g: data.product.fatPer100g || 0,
              fiberPer100g: data.product.fiberPer100g || 0,
              sourceUrl: directUrl,
              packageWeightGrams: data.product.packageWeightGrams,
              pieceCount: data.product.pieceCount,
            });
          }
        }
      } catch {}
    }

    if (importedItems.length > 0) {
      await saveHiveMindFoodItems(importedItems, userId);
    }

    setIsBulkImporting(false);
    setActiveModalTab('search');
    setSearchQuery('');
  };

  // Custom Food Form Submission Handler
  const handleSaveNewCustomFood = async () => {
    if (!newFoodName.trim()) return;

    const clampMacro = (val: number | '') => Math.max(0, Number(val) || 0);

    const newFood: FoodItemNutrition = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newFoodName.trim(),
      brand: newFoodBrand.trim() || undefined,
      barcode: newFoodBarcode.trim() || undefined,
      servingUnit: newFoodServingUnit || 'gram',
      kcalPer100g: clampMacro(newFoodKcal),
      proteinPer100g: clampMacro(newFoodProtein),
      carbsPer100g: clampMacro(newFoodCarbs),
      sugarPer100g: clampMacro(newFoodSugar),
      fatPer100g: clampMacro(newFoodFat),
      fiberPer100g: clampMacro(newFoodFiber),
      isCustom: true,
      userId,
    };

    const saved = await saveHiveMindFoodItem(newFood, userId);

    setSelectedFoodItem(saved);
    setPortionGrams(saved.servingUnit === 'ml' ? 250 : 100);
    setActiveModalTab('search');

    // Reset Form
    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodBarcode('');
    setNewFoodServingUnit('gram');
    setNewFoodKcal('');
    setNewFoodProtein('');
    setNewFoodCarbs('');
    setNewFoodSugar('');
    setNewFoodFat('');
    setNewFoodFiber('');
  };

  return {
    todayStr,
    selectedDate,
    setSelectedDate,
    isToday,
    formatDateTitle,
    handleDateShift,
    entries,
    summary,
    handleUpdateEntryGrams,
    handleDeleteEntry,
    handleAddEntryToLog,
    isAddModalOpen,
    setIsAddModalOpen,
    activeModalTab,
    setActiveModalTab,
    searchQuery,
    setSearchQuery,
    filteredCatalog,
    selectedFoodItem,
    setSelectedFoodItem,
    portionGrams,
    setPortionGrams,
    singleLinkInput,
    setSingleLinkInput,
    singleLinkLoading,
    singleLinkError,
    handleFetchSingleProductLink,
    listLinkInput,
    setListLinkInput,
    listLinkLoading,
    listLinkError,
    listExtractedProducts,
    isBulkImporting,
    handleFetchSharedList,
    handleBulkImportAllList,
    handleImportListItemToIndex,
    newFoodName,
    setNewFoodName,
    newFoodBrand,
    setNewFoodBrand,
    newFoodBarcode,
    setNewFoodBarcode,
    newFoodServingUnit,
    setNewFoodServingUnit,
    newFoodKcal,
    setNewFoodKcal,
    newFoodProtein,
    setNewFoodProtein,
    newFoodCarbs,
    setNewFoodCarbs,
    newFoodSugar,
    setNewFoodSugar,
    newFoodFat,
    setNewFoodFat,
    newFoodFiber,
    setNewFoodFiber,
    handleSaveNewCustomFood,
  };
};
