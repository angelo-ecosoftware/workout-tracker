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
import { lookupBarcodeProduct } from '../../lib/barcodeService.ts';
import { formatDateTitle as formatDateTitleUtil } from '../../utils/date.ts';

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

  // Omni-Input State
  const [isResolvingOmniInput, setIsResolvingOmniInput] = useState(false);
  const [omniResolveError, setOmniResolveError] = useState<string | null>(null);

  // Link Scraper Modal States
  const [singleLinkInput, setSingleLinkInput] = useState('');
  const [singleLinkLoading, setSingleLinkLoading] = useState(false);
  const [singleLinkError, setSingleLinkError] = useState<string | null>(null);

  // List Scraper Modal States
  const [listLinkInput, setListLinkInput] = useState('');
  const [listLinkLoading, setListLinkLoading] = useState(false);
  const [listLinkError, setListLinkError] = useState<string | null>(null);
  const [listExtractedProducts, setListExtractedProducts] = useState<
    Array<{ id: string; title: string; brand?: string; salesUnitSize?: string; nutrition?: FoodItemNutrition }>
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

  const formatDateTitle = (dateStr: string) => formatDateTitleUtil(dateStr, todayStr);

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

  // 5-in-1 Omni-Input Resolver (Name, Barcode, Store Product, Shared List, Recipe)
  const handleResolveOmniInput = async (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return;
    setIsResolvingOmniInput(true);
    setOmniResolveError(null);

    // 1. EAN / UPC Barcode Detection
    const isBarcode = /^\d{8,14}$/.test(input);
    if (isBarcode) {
      try {
        const barcodeResult = await lookupBarcodeProduct(input, userId);
        if (barcodeResult.found && barcodeResult.item) {
          setSelectedFoodItem(barcodeResult.item);
          setPortionGrams(
            barcodeResult.item.packageWeightGrams || (barcodeResult.item.servingUnit === 'ml' ? 250 : 100)
          );
          setSearchQuery('');
          setIsResolvingOmniInput(false);
          return;
        } else {
          setOmniResolveError(`No product found matching barcode ${input}.`);
        }
      } catch (err) {
        setOmniResolveError(err instanceof Error ? err.message : 'Barcode resolution failed.');
      } finally {
        setIsResolvingOmniInput(false);
      }
      return;
    }

    // 2. URL Detection (Store Product, Shared List, or Recipe)
    const isUrl =
      /^https?:\/\/|www\./i.test(input) ||
      /(?:ah\.nl|jumbo\.com|dirk\.nl|plus\.nl|lidl\.nl|aldi\.nl|picnic\.app)\//i.test(input);

    if (isUrl) {
      const cleanUrl = input.startsWith('http') ? input : `https://${input}`;

      // A. Shared Grocery List or Multi-Ingredient Recipe List Check (PRIORITIZED OVER SINGLE PRODUCTS)
      const isListUrl =
        /(?:\/lijst\/|\/basket\/|\/gedeelde-lijst\/|\/mijnlijst\/|\/shared-list\/)/i.test(cleanUrl) &&
        !cleanUrl.includes('/p/') &&
        !cleanUrl.includes('/product/');

      if (isListUrl) {
        try {
          const res = await fetch(`/api/grocery-list?listId=${encodeURIComponent(cleanUrl)}`);
          if (res.ok) {
            const listData = await res.json();
            if (listData.success && Array.isArray(listData.products) && listData.products.length > 0) {
              const mapped = (
                listData.products as Array<{
                  id: string | number;
                  title: string;
                  brand?: string;
                  salesUnitSize?: string;
                  nutrition?: FoodItemNutrition;
                }>
              ).map((p) => ({
                id: String(p.id),
                title: p.title,
                brand: p.brand || 'Supermarket',
                salesUnitSize: p.salesUnitSize,
                nutrition: p.nutrition,
              }));

              setListExtractedProducts(mapped);
              setListLinkInput(cleanUrl);
              setActiveModalTab('list');
              setSearchQuery('');
              setIsResolvingOmniInput(false);
              return;
            }
          }
        } catch (listErr) {
          console.warn('Omni list parse error:', listErr);
        }
      }

      // B. Check if URL already matches an indexed product in local database (Instant 0ms Cache Hit!)
      const cached = filteredCatalog.find(
        (c) =>
          c.sourceUrl &&
          (c.sourceUrl === cleanUrl || cleanUrl.includes(c.sourceUrl) || c.sourceUrl.includes(cleanUrl))
      );
      if (cached) {
        setSelectedFoodItem(cached);
        setPortionGrams(cached.packageWeightGrams || (cached.servingUnit === 'ml' ? 250 : 100));
        setSearchQuery('');
        setIsResolvingOmniInput(false);
        return;
      }

      // C. Product or Single Recipe Scraper
      try {
        const res = await fetch(`/api/product-link?url=${encodeURIComponent(cleanUrl)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch product (Status ${res.status})`);
        }
        const data = await res.json();
        if (!data.success || !data.product) {
          throw new Error(data.error || 'Could not extract product or recipe information.');
        }

        const scrapedProduct: FoodItemNutrition = {
          ...data.product,
          id: data.product.id || `scraped_${Date.now()}`,
          sourceUrl: cleanUrl,
        };

        await saveHiveMindFoodItem(scrapedProduct, userId);
        setSelectedFoodItem(scrapedProduct);
        setPortionGrams(
          scrapedProduct.packageWeightGrams || (scrapedProduct.servingUnit === 'ml' ? 250 : 100)
        );
        setSearchQuery('');
      } catch (err) {
        setOmniResolveError(err instanceof Error ? err.message : 'Failed to extract product or recipe from link.');
      } finally {
        setIsResolvingOmniInput(false);
      }
      return;
    }

    // 3. Regular search keywords: if user pressed Enter and there is a top match, select it
    if (filteredCatalog.length > 0) {
      const topMatch = filteredCatalog[0];
      setSelectedFoodItem(topMatch);
      setPortionGrams(topMatch.packageWeightGrams || (topMatch.servingUnit === 'ml' ? 250 : 100));
      setSearchQuery('');
    }
    setIsResolvingOmniInput(false);
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
      const trimmedInput = listLinkInput.trim();
      const res = await fetch(`/api/grocery-list?listId=${encodeURIComponent(trimmedInput)}`);
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Failed to fetch list (status ${res.status})`);
      }
      const data = await res.json();
      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Invalid list response');
      }

      const mapped = (data.products as { id: string | number; title: string; brand?: string; salesUnitSize?: string; nutrition?: FoodItemNutrition }[]).map((p) => ({
        id: String(p.id),
        title: p.title,
        brand: p.brand || 'Albert Heijn',
        salesUnitSize: p.salesUnitSize,
        nutrition: p.nutrition,
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
    nutrition?: FoodItemNutrition;
  }) => {
    const directUrl = `https://www.ah.nl/producten/product/${item.id}`;

    // If already pre-scraped and enriched by server
    if (item.nutrition && item.nutrition.name) {
      const foodItem: FoodItemNutrition = {
        ...item.nutrition,
        id: item.nutrition.id || `ah_${item.id}`,
        sourceUrl: item.nutrition.sourceUrl || directUrl,
      };
      await saveHiveMindFoodItem(foodItem, userId);
      setSelectedFoodItem(foodItem);
      setPortionGrams(foodItem.packageWeightGrams || 100);
      setActiveModalTab('search');
      return;
    }

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
      if (item.nutrition && item.nutrition.name) {
        importedItems.push({
          ...item.nutrition,
          id: item.nutrition.id || `ah_${item.id}`,
          sourceUrl: item.nutrition.sourceUrl || `https://www.ah.nl/producten/product/${item.id}`,
        });
        continue;
      }

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
    isResolvingOmniInput,
    omniResolveError,
    handleResolveOmniInput,
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
