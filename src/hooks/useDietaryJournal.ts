import { useState, useEffect, useMemo, useCallback } from 'react';
import { FoodItemNutrition, DailyDietaryLog, LoggedDietaryEntry } from '../models.ts';
import { searchFoodItems } from '../lib/foodSearch.ts';
import {
  getSavedFoodCatalog,
  saveFoodCatalog,
  getDailyDietaryLog,
  saveDailyDietaryLog,
  fetchDailyDietaryLog,
  persistDailyDietaryLog,
  calculatePortionNutrients,
  computeDailyTotals,
  fetchHiveMindFoodCatalog,
  saveHiveMindFoodItem,
  saveHiveMindFoodItems,
} from '../lib/dietaryData.ts';
import { ScrapedProductDTO, SingleProductLinkResponse, GroceryListBatchResponse } from '../types/api.ts';

export function useDietaryJournal(userId: string) {
  // Selected date state (default today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [catalog, setCatalog] = useState<FoodItemNutrition[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [dailyLog, setDailyLog] = useState<DailyDietaryLog>({
    date: selectedDate,
    entries: [],
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalSugar: 0,
    totalFat: 0,
    totalFiber: 0,
  });

  // Modal Flow States
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'search' | 'link' | 'list' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Food for logging
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItemNutrition | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Single Product Link Input State
  const [singleLinkInput, setSingleLinkInput] = useState('');
  const [singleLinkLoading, setSingleLinkLoading] = useState(false);
  const [singleLinkError, setSingleLinkError] = useState<string | null>(null);

  // Shared Grocery List Input State
  const [listLinkInput, setListLinkInput] = useState('');
  const [listLinkLoading, setListLinkLoading] = useState(false);
  const [listLinkError, setListLinkError] = useState<string | null>(null);
  const [listExtractedProducts, setListExtractedProducts] = useState<ScrapedProductDTO[]>([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // New Custom Food Form State
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodKcal, setNewFoodKcal] = useState<number | ''>('');
  const [newFoodProtein, setNewFoodProtein] = useState<number | ''>('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number | ''>('');
  const [newFoodSugar, setNewFoodSugar] = useState<number | ''>('');
  const [newFoodFat, setNewFoodFat] = useState<number | ''>('');
  const [newFoodFiber, setNewFoodFiber] = useState<number | ''>('');

  // Initial Load: local catalog cache + fetch fresh Hive-Mind SQL database & daily log from Supabase
  useEffect(() => {
    const local = getSavedFoodCatalog(userId);
    setCatalog(local);

    const loadedLog = getDailyDietaryLog(userId, selectedDate);
    setDailyLog(loadedLog);

    setIsLoadingCatalog(true);
    Promise.all([
      fetchHiveMindFoodCatalog(undefined, userId),
      fetchDailyDietaryLog(userId, selectedDate),
    ])
      .then(([remoteFoods, remoteDailyLog]) => {
        if (remoteFoods !== undefined) {
          setCatalog(remoteFoods);
          saveFoodCatalog(userId, remoteFoods);
        }
        if (remoteDailyLog !== null) {
          setDailyLog(remoteDailyLog);
          saveDailyDietaryLog(userId, remoteDailyLog);
        }
      })
      .catch((err) => console.warn('Supabase dietary data sync notice:', err))
      .finally(() => setIsLoadingCatalog(false));
  }, [userId, selectedDate]);

  // Date Navigation Handlers
  const handlePrevDay = useCallback(() => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  }, [selectedDate]);

  // Add Log Entry Handler
  const handleLogFoodPortion = useCallback((food: FoodItemNutrition, grams: number) => {
    const nutrients = calculatePortionNutrients(food, grams);

    const newEntryId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `d_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newEntry: LoggedDietaryEntry = {
      id: newEntryId,
      foodItemId: food.id,
      name: food.name,
      brand: food.brand,
      amountGrams: grams,
      kcalPer100g: food.kcalPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      sugarPer100g: food.sugarPer100g,
      fatPer100g: food.fatPer100g,
      fiberPer100g: food.fiberPer100g,
      calculatedKcal: nutrients.calculatedKcal,
      calculatedProtein: nutrients.calculatedProtein,
      calculatedCarbs: nutrients.calculatedCarbs,
      calculatedSugar: nutrients.calculatedSugar,
      calculatedFat: nutrients.calculatedFat,
      calculatedFiber: nutrients.calculatedFiber,
      loggedAt: new Date().toISOString(),
    };

    setDailyLog((prev) => {
      const updatedEntries = [newEntry, ...prev.entries];
      const totals = computeDailyTotals(updatedEntries);
      const updatedLog: DailyDietaryLog = {
        ...prev,
        entries: updatedEntries,
        ...totals,
      };

      saveDailyDietaryLog(userId, updatedLog);
      persistDailyDietaryLog(userId, updatedLog).catch((err) =>
        console.warn('Error syncing daily log to Supabase:', err)
      );

      return updatedLog;
    });

    setSelectedFoodItem(null);
    setShowAddModal(false);
    setSearchQuery('');
  }, [userId, selectedDate]);

  // Delete Log Entry Handler
  const handleDeleteEntry = useCallback((entryId: string) => {
    setDailyLog((prev) => {
      const updatedEntries = prev.entries.filter((e) => e.id !== entryId);
      const totals = computeDailyTotals(updatedEntries);
      const updatedLog: DailyDietaryLog = {
        ...prev,
        entries: updatedEntries,
        ...totals,
      };

      saveDailyDietaryLog(userId, updatedLog);
      persistDailyDietaryLog(userId, updatedLog).catch((err) =>
        console.warn('Error deleting daily log entry on Supabase:', err)
      );

      return updatedLog;
    });
  }, [userId, selectedDate]);

  // Create Custom Food Item Form Submission
  const handleCreateCustomFood = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim() || newFoodKcal === '') return;

    const customId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newItem: FoodItemNutrition = {
      id: customId,
      name: newFoodName.trim(),
      brand: newFoodBrand.trim() || undefined,
      servingUnit: 'gram',
      kcalPer100g: Number(newFoodKcal),
      proteinPer100g: Number(newFoodProtein) || 0,
      carbsPer100g: Number(newFoodCarbs) || 0,
      sugarPer100g: Number(newFoodSugar) || 0,
      fatPer100g: Number(newFoodFat) || 0,
      fiberPer100g: Number(newFoodFiber) || 0,
      isCustom: true,
      userId: userId,
    };

    setCatalog((prev) => {
      const updatedCatalog = [newItem, ...prev];
      saveFoodCatalog(userId, updatedCatalog);
      return updatedCatalog;
    });

    saveHiveMindFoodItem(newItem, userId).catch((err) =>
      console.warn('Notice saving custom food to Supabase:', err)
    );

    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodKcal('');
    setNewFoodProtein('');
    setNewFoodCarbs('');
    setNewFoodSugar('');
    setNewFoodFat('');
    setNewFoodFiber('');

    setSelectedFoodItem(newItem);
    setActiveModalTab('search');
  }, [newFoodName, newFoodBrand, newFoodKcal, newFoodProtein, newFoodCarbs, newFoodSugar, newFoodFat, newFoodFiber, userId]);

  // Single Product Link Scraper Flow
  const handleFetchSingleLink = useCallback(async () => {
    if (!singleLinkInput.trim()) return;
    setSingleLinkLoading(true);
    setSingleLinkError(null);

    try {
      const response = await fetch('/api/product-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleLinkInput.trim() }),
      });

      const data: SingleProductLinkResponse = await response.json().catch(() => ({ success: false }));

      if (!response.ok || !data.product) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      const scrapedProduct: FoodItemNutrition = {
        ...data.product,
        userId: userId,
      };

      setCatalog((prev) => {
        const exists = prev.some((c) => c.id === scrapedProduct.id);
        if (!exists) {
          const updated = [scrapedProduct, ...prev];
          saveFoodCatalog(userId, updated);
          saveHiveMindFoodItem(scrapedProduct, userId).catch((err) =>
            console.warn('Notice saving scraped product to Supabase:', err)
          );
          return updated;
        }
        return prev;
      });

      if (scrapedProduct.packageWeightGrams) {
        setPortionGrams(scrapedProduct.packageWeightGrams);
      } else {
        setPortionGrams(100);
      }

      setSelectedFoodItem(scrapedProduct);
      setActiveModalTab('search');
      setSingleLinkInput('');
    } catch (err: any) {
      console.error('Error fetching single product link:', err);
      setSingleLinkError(err.message || 'Failed to extract product facts.');
    } finally {
      setSingleLinkLoading(false);
    }
  }, [singleLinkInput, userId]);

  // Shared Grocery List Extraction Flow
  const handleFetchSharedList = useCallback(async () => {
    if (!listLinkInput.trim()) return;
    setListLinkLoading(true);
    setListLinkError(null);
    setListExtractedProducts([]);

    try {
      const response = await fetch('/api/grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listUrl: listLinkInput.trim() }),
      });

      const data: GroceryListBatchResponse = await response.json().catch(() => ({ success: false }));

      if (!response.ok || !data.products || data.products.length === 0) {
        throw new Error(data.error || 'No items found in this grocery list.');
      }

      setListExtractedProducts(data.products);
    } catch (err: any) {
      console.error('Error fetching shared grocery list:', err);
      setListLinkError(err.message || 'Failed to extract grocery list.');
    } finally {
      setListLinkLoading(false);
    }
  }, [listLinkInput]);

  // Bulk Ingest Extracted List Products to Catalog
  const handleBulkImportList = useCallback(async () => {
    if (listExtractedProducts.length === 0) return;
    setIsBulkImporting(true);

    try {
      const newItems: FoodItemNutrition[] = [];

      setCatalog((prev) => {
        const updated = [...prev];
        for (const p of listExtractedProducts) {
          const itemWithUser: FoodItemNutrition = {
            ...p,
            userId: userId,
          };
          const exists = updated.some((c) => c.id === p.id);
          if (!exists) {
            updated.unshift(itemWithUser);
            newItems.push(itemWithUser);
          }
        }
        saveFoodCatalog(userId, updated);
        return updated;
      });

      if (newItems.length > 0) {
        await saveHiveMindFoodItems(newItems, userId).catch((err) =>
          console.warn('Notice saving batch products to Supabase:', err)
        );
      }

      setListExtractedProducts([]);
      setListLinkInput('');
      setActiveModalTab('search');
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setListLinkError('Failed to import list items.');
    } finally {
      setIsBulkImporting(false);
    }
  }, [listExtractedProducts, userId]);

  // Intelligent Ranked Food Search Filtering
  const filteredCatalog = useMemo(() => {
    return searchFoodItems(catalog, searchQuery);
  }, [catalog, searchQuery]);

  return {
    selectedDate,
    setSelectedDate,
    catalog,
    isLoadingCatalog,
    dailyLog,
    showAddModal,
    setShowAddModal,
    activeModalTab,
    setActiveModalTab,
    searchQuery,
    setSearchQuery,
    selectedFoodItem,
    setSelectedFoodItem,
    portionGrams,
    setPortionGrams,
    singleLinkInput,
    setSingleLinkInput,
    singleLinkLoading,
    singleLinkError,
    listLinkInput,
    setListLinkInput,
    listLinkLoading,
    listLinkError,
    listExtractedProducts,
    isBulkImporting,
    newFoodName,
    setNewFoodName,
    newFoodBrand,
    setNewFoodBrand,
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
    filteredCatalog,
    handlePrevDay,
    handleNextDay,
    handleLogFoodPortion,
    handleDeleteEntry,
    handleCreateCustomFood,
    handleFetchSingleLink,
    handleFetchSharedList,
    handleBulkImportList,
  };
}
