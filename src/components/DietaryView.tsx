import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Apple,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Wheat,
  Candy,
  Droplet,
  Sparkles,
  Search,
  ShoppingCart,
  Link as LinkIcon,
  Loader2,
  X,
  Check,
  Database,
  Globe,
  ArrowRight,
} from 'lucide-react';
import {
  FoodItemNutrition,
  LoggedDietaryEntry,
  DailyDietaryLog,
} from '../models.ts';
import {
  getSavedFoodCatalog,
  saveFoodCatalog,
  getDailyDietaryLog,
  saveDailyDietaryLog,
  calculatePortionNutrients,
  computeDailyTotals,
  fetchHiveMindFoodCatalog,
  saveHiveMindFoodItem,
  saveHiveMindFoodItems,
} from '../lib/dietaryData.ts';

export const DietaryView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

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

  // Single AH Product Link Input State
  const [singleLinkInput, setSingleLinkInput] = useState('');
  const [singleLinkLoading, setSingleLinkLoading] = useState(false);
  const [singleLinkError, setSingleLinkError] = useState<string | null>(null);

  // AH Shared List Input State
  const [listLinkInput, setListLinkInput] = useState('');
  const [listLinkLoading, setListLinkLoading] = useState(false);
  const [listLinkError, setListLinkError] = useState<string | null>(null);
  const [listExtractedProducts, setListExtractedProducts] = useState<any[]>([]);
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

  // Initial Load: local catalog cache + fetch fresh Hive-Mind SQL database
  useEffect(() => {
    const local = getSavedFoodCatalog(userId);
    setCatalog(local);

    const loadedLog = getDailyDietaryLog(userId, selectedDate);
    setDailyLog(loadedLog);

    // Fetch from Supabase Hive-Mind
    setIsLoadingCatalog(true);
    fetchHiveMindFoodCatalog()
      .then((remoteFoods) => {
        if (remoteFoods && remoteFoods.length > 0) {
          setCatalog(remoteFoods);
          saveFoodCatalog(userId, remoteFoods);
        }
      })
      .finally(() => setIsLoadingCatalog(false));
  }, [userId, selectedDate]);

  // Search debounce against Hive-Mind SQL Database
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchHiveMindFoodCatalog(searchQuery.trim()).then((results) => {
          if (results && results.length > 0) {
            // Merge with existing catalog without duplicates
            setCatalog((prev) => {
              const map = new Map<string, FoodItemNutrition>();
              for (const it of prev) map.set(it.id, it);
              for (const it of results) map.set(it.id, it);
              return Array.from(map.values());
            });
          }
        });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Today string helper (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  // Navigate Date (cannot navigate past today)
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const nextDate = current.toISOString().split('T')[0];
    if (nextDate <= todayStr) {
      setSelectedDate(nextDate);
    }
  };

  const isToday = selectedDate === todayStr;

  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  // Add Item to Daily Log
  const handleAddEntryToLog = (item: FoodItemNutrition, grams: number) => {
    const calculated = calculatePortionNutrients(item, grams);
    const newEntry: LoggedDietaryEntry = {
      id: `diet_entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      foodItemId: item.id,
      name: item.name,
      brand: item.brand,
      amountGrams: grams,
      kcalPer100g: item.kcalPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      sugarPer100g: item.sugarPer100g,
      fatPer100g: item.fatPer100g,
      fiberPer100g: item.fiberPer100g,
      ...calculated,
      loggedAt: new Date().toISOString(),
    };

    const updatedEntries = [...dailyLog.entries, newEntry];
    const updatedLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...computeDailyTotals(updatedEntries),
    };

    setDailyLog(updatedLog);
    saveDailyDietaryLog(userId, updatedLog);
    setShowAddModal(false);
    setSelectedFoodItem(null);
  };

  // Update Amount / Grams inline
  const handleUpdateEntryGrams = (entryId: string, newGrams: number) => {
    const g = Math.max(1, newGrams);
    const updatedEntries = dailyLog.entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      const calc = calculatePortionNutrients(
        {
          kcalPer100g: entry.kcalPer100g,
          proteinPer100g: entry.proteinPer100g,
          carbsPer100g: entry.carbsPer100g,
          sugarPer100g: entry.sugarPer100g,
          fatPer100g: entry.fatPer100g,
          fiberPer100g: entry.fiberPer100g,
        },
        g
      );
      return {
        ...entry,
        amountGrams: g,
        ...calc,
      };
    });

    const updatedLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...computeDailyTotals(updatedEntries),
    };

    setDailyLog(updatedLog);
    saveDailyDietaryLog(userId, updatedLog);
  };

  // Delete Entry from Log
  const handleDeleteEntry = (entryId: string) => {
    const updatedEntries = dailyLog.entries.filter((e) => e.id !== entryId);
    const updatedLog: DailyDietaryLog = {
      date: selectedDate,
      entries: updatedEntries,
      ...computeDailyTotals(updatedEntries),
    };

    setDailyLog(updatedLog);
    saveDailyDietaryLog(userId, updatedLog);
  };

  // 1. Create & Save New Custom Food to SQL Hive-Mind
  const handleSaveNewCustomFood = async () => {
    if (!newFoodName.trim()) return;

    const newFood: FoodItemNutrition = {
      id: `custom_food_${Date.now()}`,
      name: newFoodName.trim(),
      brand: newFoodBrand.trim() || 'Custom',
      servingUnit: 'gram',
      kcalPer100g: Number(newFoodKcal) || 0,
      proteinPer100g: Number(newFoodProtein) || 0,
      carbsPer100g: Number(newFoodCarbs) || 0,
      sugarPer100g: Number(newFoodSugar) || 0,
      fatPer100g: Number(newFoodFat) || 0,
      fiberPer100g: Number(newFoodFiber) || 0,
    };

    // Save to Supabase SQL Hive Mind
    await saveHiveMindFoodItem(newFood, userId);

    const updatedCatalog = [newFood, ...catalog];
    setCatalog(updatedCatalog);
    saveFoodCatalog(userId, updatedCatalog);

    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodKcal('');
    setNewFoodProtein('');
    setNewFoodCarbs('');
    setNewFoodSugar('');
    setNewFoodFat('');
    setNewFoodFiber('');

    setSelectedFoodItem(newFood);
    setActiveModalTab('search');
  };

  // 2. Fetch Single Product Link (AH, Jumbo, Plus, etc.) and persist to Hive Mind database
  const handleFetchSingleProductLink = async () => {
    if (!singleLinkInput.trim()) return;
    setSingleLinkLoading(true);
    setSingleLinkError(null);

    try {
      const res = await fetch(`/api/product-link?url=${encodeURIComponent(singleLinkInput.trim())}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (status ${res.status})`);
      }
      const data = await res.json();
      if (!data.success || !data.product) {
        throw new Error('Could not parse nutrition for this product link');
      }

      const prod = data.product;

      // Automatically sync to Hive Mind so everyone can search and use it
      await saveHiveMindFoodItem(prod, userId);

      const updatedCatalog = [prod, ...catalog.filter((c) => c.id !== prod.id)];
      setCatalog(updatedCatalog);
      saveFoodCatalog(userId, updatedCatalog);

      setSingleLinkInput('');
      setSelectedFoodItem(prod);
      setActiveModalTab('search');
    } catch (err: any) {
      setSingleLinkError(err.message || 'Could not load product details.');
    } finally {
      setSingleLinkLoading(false);
    }
  };

  // 3. Fetch AH Shared Grocery List
  const extractListId = (url: string): string => {
    const clean = url.trim();
    const match = clean.match(/gedeelde-lijst\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    return clean;
  };

  const handleFetchSharedList = async () => {
    if (!listLinkInput.trim()) return;
    setListLinkLoading(true);
    setListLinkError(null);
    setListExtractedProducts([]);

    try {
      const listId = extractListId(listLinkInput);
      const res = await fetch(`/api/grocery-list?listId=${encodeURIComponent(listId)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch list (status ${res.status})`);
      }
      const data = await res.json();
      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Invalid list response');
      }
      setListExtractedProducts(data.products);
    } catch (err: any) {
      setListLinkError(err.message || 'Failed to extract grocery list.');
    } finally {
      setListLinkLoading(false);
    }
  };

  const convertAHProductToNutrition = (p: any): FoodItemNutrition => {
    const isDrink = p.salesUnitSize?.toLowerCase().includes('l') || p.salesUnitSize?.toLowerCase().includes('ml');
    const titleLower = p.title.toLowerCase();

    return {
      id: `ah_wi${p.id || Date.now()}`,
      name: p.title,
      brand: p.brand || 'AH',
      servingUnit: isDrink ? 'ml' : 'gram',
      kcalPer100g: titleLower.includes('rijst') ? 355 : titleLower.includes('kip') ? 110 : titleLower.includes('melk') ? 47 : titleLower.includes('kwark') ? 52 : 100,
      proteinPer100g: titleLower.includes('kip') ? 23.5 : titleLower.includes('rijst') ? 8.5 : titleLower.includes('melk') ? 3.6 : titleLower.includes('kwark') ? 8.5 : 5.0,
      carbsPer100g: titleLower.includes('rijst') ? 77.0 : titleLower.includes('melk') ? 4.8 : titleLower.includes('kwark') ? 4.0 : 0.0,
      sugarPer100g: titleLower.includes('melk') ? 4.8 : titleLower.includes('kwark') ? 4.0 : 0.0,
      fatPer100g: titleLower.includes('kip') ? 1.8 : titleLower.includes('melk') ? 1.5 : 1.0,
      fiberPer100g: titleLower.includes('rijst') ? 1.5 : 0.0,
      sourceUrl: p.webPath ? `https://www.ah.nl${p.webPath}` : undefined,
    };
  };

  const handleImportListItemToIndex = async (p: any) => {
    const newFood = convertAHProductToNutrition(p);

    // Save to SQL Hive-Mind
    await saveHiveMindFoodItem(newFood, userId);

    const updatedCatalog = [newFood, ...catalog.filter((c) => c.id !== newFood.id)];
    setCatalog(updatedCatalog);
    saveFoodCatalog(userId, updatedCatalog);

    setSelectedFoodItem(newFood);
    setActiveModalTab('search');
  };

  const handleBulkImportAllList = async () => {
    if (listExtractedProducts.length === 0) return;
    setIsBulkImporting(true);

    try {
      const convertedItems = listExtractedProducts.map(convertAHProductToNutrition);
      await saveHiveMindFoodItems(convertedItems, userId);

      const map = new Map<string, FoodItemNutrition>();
      for (const item of convertedItems) map.set(item.id, item);
      for (const item of catalog) {
        if (!map.has(item.id)) map.set(item.id, item);
      }

      const merged = Array.from(map.values());
      setCatalog(merged);
      saveFoodCatalog(userId, merged);

      if (convertedItems.length > 0) {
        setSelectedFoodItem(convertedItems[0]);
      }
      setActiveModalTab('search');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
          return;
        } catch {}
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

  // Search Filter
  const filteredCatalog = catalog.filter((item) => {
    if (!searchQuery.trim()) return true;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/);
    const target = `${item.name} ${item.brand || ''}`.toLowerCase();
    return terms.every((term) => target.includes(term));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* 1. Date Navigator Bar */}
      <div className="flex items-center justify-between bg-[#111] border border-[#222] rounded-2xl p-2 sm:p-3">
        <button
          onClick={() => handleDateShift(-1)}
          className="p-2 hover:bg-[#1f1f1f] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Date Picker Button & Input */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenDatePicker}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[#1a1a1a] border border-transparent hover:border-[#2a2a2a] transition-all cursor-pointer group"
          >
            <Calendar className="w-4 h-4 text-[#C0FF00] group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-display text-sm sm:text-base font-black uppercase tracking-tight text-white group-hover:text-[#C0FF00] transition-colors">
              {formatDateTitle(selectedDate)}
            </span>
            {isToday && (
              <span className="text-[10px] font-mono font-bold uppercase bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </button>

          <input
            ref={dateInputRef}
            type="date"
            max={todayStr}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                if (e.target.value <= todayStr) {
                  setSelectedDate(e.target.value);
                } else {
                  setSelectedDate(todayStr);
                }
              }
            }}
            className="absolute top-0 left-0 opacity-0 pointer-events-none w-0 h-0 [color-scheme:dark]"
            tabIndex={-1}
            aria-label="Select date"
          />
        </div>

        <button
          onClick={() => handleDateShift(1)}
          disabled={isToday}
          className={`p-2 rounded-xl transition-colors ${
            isToday
              ? 'text-gray-700 opacity-40 cursor-not-allowed'
              : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f] cursor-pointer'
          }`}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Daily Log Food Items */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Apple className="w-5 h-5 text-[#C0FF00]" />
              Logged Food Items ({dailyLog.entries.length})
            </h2>
            <p className="font-sans text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
              Enter portion grams — live macro scaling
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedFoodItem(null);
              setActiveModalTab('search');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(192,255,0,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Log Food
          </button>
        </div>

        {/* Empty State */}
        {dailyLog.entries.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[#222] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-gray-500 mx-auto mb-3">
              <Apple className="w-6 h-6 opacity-40" />
            </div>
            <p className="font-display text-sm font-bold uppercase tracking-wider text-gray-400">
              No Food Logged For {isToday ? 'Today' : selectedDate}
            </p>
            <p className="font-sans text-xs text-gray-600 mt-1 max-w-xs mx-auto">
              Tap "Log Food" to search the community database, paste an AH product link, or import your grocery list.
            </p>
          </div>
        ) : (
          /* List of Logged Products */
          <div className="space-y-3">
            {dailyLog.entries.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3.5 sm:p-4 bg-[#161616] border border-[#222] hover:border-[#333] rounded-2xl transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#222] flex items-center justify-center text-[10px] font-mono font-bold text-gray-400">
                        {idx + 1}
                      </span>
                      {entry.brand && (
                        <span className="text-[10px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded">
                          {entry.brand}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-500">
                        (Ref: {entry.kcalPer100g} kcal / 100g)
                      </span>
                    </div>
                    <div className="font-sans text-sm font-bold text-white mt-1">
                      {entry.name}
                    </div>
                  </div>

                  {/* Portion Grams Quick Edit */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#0d0d0d] border border-[#333] focus-within:border-[#C0FF00] rounded-xl px-2.5 py-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={entry.amountGrams}
                        onChange={(e) =>
                          handleUpdateEntryGrams(entry.id, Number(e.target.value) || 0)
                        }
                        className="w-14 bg-transparent text-right font-mono text-xs font-bold text-[#C0FF00] outline-none"
                      />
                      <span className="text-[10px] font-mono font-bold text-gray-500 ml-1">g</span>
                    </div>

                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 hover:bg-red-950/40 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Macro Pills Breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-[#202020] text-center font-mono text-xs">
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-gray-500 uppercase font-sans font-bold">Calories</div>
                    <div className="font-black text-white">{entry.calculatedKcal}</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-[#C0FF00] uppercase font-sans font-bold">Protein</div>
                    <div className="font-black text-white">{entry.calculatedProtein}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-amber-400 uppercase font-sans font-bold">Carbs</div>
                    <div className="font-black text-white">{entry.calculatedCarbs}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-orange-400 uppercase font-sans font-bold">Sugars</div>
                    <div className="font-black text-white">{entry.calculatedSugar}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-rose-400 uppercase font-sans font-bold">Fat</div>
                    <div className="font-black text-white">{entry.calculatedFat}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-emerald-400 uppercase font-sans font-bold">Fiber</div>
                    <div className="font-black text-white">{entry.calculatedFiber}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Clean Daily Macro Totals Overview */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C0FF00] rounded-full blur-[100px] opacity-[0.05] pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#C0FF00]" />
            <h3 className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Daily Macro Totals
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase">
            {selectedDate}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 relative z-10 font-mono">
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-sans font-bold uppercase">
              <span>Calories</span>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalKcal}
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Total Calories</div>
          </div>

          <div className="bg-[#161616] border border-[#C0FF00]/25 p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#C0FF00] text-xs font-sans font-bold uppercase">
              <span>Protein</span>
              <Sparkles className="w-3.5 h-3.5 text-[#C0FF00]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#C0FF00] mt-1">
              {dailyLog.totalProtein}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Protein</div>
          </div>

          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs font-sans font-bold uppercase">
              <span>Carbs</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalCarbs}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Carbohydrates</div>
          </div>

          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-orange-400 text-xs font-sans font-bold uppercase">
              <span>Sugars</span>
              <Candy className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalSugar}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Sugars</div>
          </div>

          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 text-xs font-sans font-bold uppercase">
              <span>Fat</span>
              <Droplet className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalFat}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Fats</div>
          </div>

          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-sans font-bold uppercase">
              <span>Fiber</span>
              <Wheat className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalFiber}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Dietary Fiber</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIVE-MIND FOOD SEARCH & INGESTION MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#C0FF00]" />
                <h3 className="font-display text-base font-black uppercase tracking-wider text-white">
                  Log Food
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFoodItem(null);
                }}
                className="p-1.5 hover:bg-[#222] rounded-full text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Minimal Tabs Header */}
            <div className="flex border-b border-[#222] bg-[#0d0d0d] p-1 font-sans text-xs">
              <button
                onClick={() => setActiveModalTab('search')}
                className={`flex-1 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeModalTab === 'search'
                    ? 'bg-[#222] text-[#C0FF00]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              <button
                onClick={() => setActiveModalTab('link')}
                className={`flex-1 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeModalTab === 'link'
                    ? 'bg-[#222] text-[#00ade6]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Product Link</span>
              </button>

              <button
                onClick={() => setActiveModalTab('list')}
                className={`flex-1 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeModalTab === 'list'
                    ? 'bg-[#222] text-[#00ade6]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>AH List</span>
              </button>

              <button
                onClick={() => setActiveModalTab('custom')}
                className={`flex-1 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  activeModalTab === 'custom'
                    ? 'bg-[#222] text-amber-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: SEARCH & LOG FROM HIVE MIND DATABASE */}
              {activeModalTab === 'search' && (
                <>
                  {/* Selected Food Portion Config */}
                  {selectedFoodItem ? (
                    <div className="p-4 bg-[#1b1b1b] border border-[#C0FF00]/40 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded">
                            {selectedFoodItem.brand || 'Selected'}
                          </span>
                          <h4 className="font-sans text-sm font-bold text-white mt-1">
                            {selectedFoodItem.name}
                          </h4>
                          <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                            Per 100g: {selectedFoodItem.kcalPer100g} kcal • {selectedFoodItem.proteinPer100g}g protein
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedFoodItem(null)}
                          className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      {/* Gram Input & Quick Buttons */}
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-1.5">
                          Amount Consumed (Grams / ML)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={portionGrams}
                            onChange={(e) => setPortionGrams(Number(e.target.value) || 0)}
                            className="w-24 bg-[#101010] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#C0FF00] outline-none"
                          />
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[30, 40, 50, 100, 150, 200].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setPortionGrams(g)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                                  portionGrams === g
                                    ? 'bg-[#C0FF00] text-black'
                                    : 'bg-[#252525] hover:bg-[#303030] text-gray-300'
                                }`}
                              >
                                {g}g
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Live Calculated Preview */}
                      {(() => {
                        const preview = calculatePortionNutrients(selectedFoodItem, portionGrams);
                        return (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#121212] p-2 rounded-xl text-center font-mono text-xs border border-[#2a2a2a]">
                            <div>
                              <div className="text-[9px] text-gray-500 uppercase">Calories</div>
                              <div className="font-bold text-white">{preview.calculatedKcal}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#C0FF00] uppercase">Protein</div>
                              <div className="font-bold text-[#C0FF00]">{preview.calculatedProtein}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-amber-400 uppercase">Carbs</div>
                              <div className="font-bold text-white">{preview.calculatedCarbs}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-orange-400 uppercase">Sugars</div>
                              <div className="font-bold text-white">{preview.calculatedSugar}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-rose-400 uppercase">Fat</div>
                              <div className="font-bold text-white">{preview.calculatedFat}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-emerald-400 uppercase">Fiber</div>
                              <div className="font-bold text-white">{preview.calculatedFiber}g</div>
                            </div>
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => handleAddEntryToLog(selectedFoodItem, portionGrams)}
                        className="w-full py-2.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(192,255,0,0.25)] flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        Log {portionGrams}g into {formatDateTitle(selectedDate)}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search Bar & Database Status */}
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search shared database (e.g. Kipfilet, Kwark, Melk)..."
                            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white font-sans placeholder:text-gray-600 outline-none transition-colors"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 px-1">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#C0FF00]" />
                            <span>Global Database</span>
                          </span>
                          <span>{filteredCatalog.length} items available</span>
                        </div>
                      </div>

                      {/* Food Item List */}
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {filteredCatalog.length === 0 ? (
                          <div className="text-center py-8 bg-[#181818] border border-dashed border-[#2b2b2b] rounded-2xl">
                            <p className="font-sans text-xs text-gray-400">
                              No foods found matching "{searchQuery}"
                            </p>
                            <div className="flex items-center justify-center gap-3 mt-3">
                              <button
                                onClick={() => {
                                  setActiveModalTab('link');
                                }}
                                className="text-xs font-sans text-[#00ade6] underline font-bold cursor-pointer"
                              >
                                Paste Product Link (Jumbo / AH)
                              </button>
                              <span className="text-gray-600">•</span>
                              <button
                                onClick={() => {
                                  setNewFoodName(searchQuery);
                                  setActiveModalTab('custom');
                                }}
                                className="text-xs font-sans text-[#C0FF00] underline font-bold cursor-pointer"
                              >
                                Create as Custom
                              </button>
                            </div>
                          </div>
                        ) : (
                          filteredCatalog.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedFoodItem(item);
                                setPortionGrams(100);
                              }}
                              className="p-3 bg-[#181818] border border-[#262626] hover:border-[#C0FF00]/60 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-sans text-xs font-bold text-white group-hover:text-[#C0FF00] transition-colors">
                                    {item.name}
                                  </span>
                                  {item.brand && (
                                    <span className="text-[9px] font-mono font-bold uppercase text-gray-400 bg-[#242424] px-1.5 py-0.2 rounded">
                                      {item.brand}
                                    </span>
                                  )}
                                  {item.sourceUrl && (
                                    <span className="text-[9px] font-mono text-[#00ade6] bg-[#00ade6]/10 px-1 py-0.2 rounded">
                                      AH
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-1 flex-wrap">
                                  <span className="text-white font-semibold">{item.kcalPer100g} kcal</span>
                                  <span>•</span>
                                  <span className="text-[#C0FF00]">P: {item.proteinPer100g}g</span>
                                  <span>•</span>
                                  <span className="text-amber-400">C: {item.carbsPer100g}g</span>
                                  <span>•</span>
                                  <span className="text-rose-400">F: {item.fatPer100g}g</span>
                                  <span>•</span>
                                  <span className="text-emerald-400">Fib: {item.fiberPer100g}g</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-[#C0FF00] group-hover:translate-x-0.5 uppercase font-bold shrink-0 transition-transform">
                                Select →
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* TAB 2: PASTE SINGLE JUMBO OR AH PRODUCT LINK */}
              {activeModalTab === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Jumbo / Albert Heijn Product Link
                    </label>
                    <p className="text-[11px] text-gray-500 font-sans mb-2">
                      Paste any product link from <strong>jumbo.com</strong> (e.g. <code>https://www.jumbo.com/producten/...</code>) or <strong>ah.nl</strong> (e.g. <code>https://www.ah.nl/producten/product/wi...</code>). It will be saved into the shared database for all users!
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={singleLinkInput}
                        onChange={(e) => setSingleLinkInput(e.target.value)}
                        placeholder="https://www.jumbo.com/producten/... or https://www.ah.nl/..."
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#00ade6] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                      />
                      <button
                        onClick={handleFetchSingleProductLink}
                        disabled={singleLinkLoading || !singleLinkInput.trim()}
                        className="px-4 py-2.5 bg-[#00ade6] hover:bg-[#0096c7] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {singleLinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                        Extract & Save
                      </button>
                    </div>
                  </div>

                  {singleLinkError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
                      {singleLinkError}
                    </div>
                  )}

                  <div className="p-3 bg-[#181818] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C0FF00]" />
                      How Link Extraction Works
                    </div>
                    <p className="text-[11px] text-gray-500">
                      When you extract a product link, official 100g nutritional facts are parsed and stored in the central database so everyone can search and log it.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE AH SHARED GROCERY LIST */}
              {activeModalTab === 'list' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Albert Heijn Shared Grocery List Link
                    </label>
                    <p className="text-[11px] text-gray-500 font-sans mb-2">
                      Share your cart/list from the AH app or web and paste the link below to import products:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={listLinkInput}
                        onChange={(e) => setListLinkInput(e.target.value)}
                        placeholder="https://www.ah.nl/mijnlijst/gedeelde-lijst/..."
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#00ade6] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                      />
                      <button
                        onClick={handleFetchSharedList}
                        disabled={listLinkLoading || !listLinkInput.trim()}
                        className="px-4 py-2.5 bg-[#00ade6] hover:bg-[#0096c7] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {listLinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Fetch
                      </button>
                    </div>
                  </div>

                  {listLinkError && (
                    <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
                      {listLinkError}
                    </div>
                  )}

                  {listExtractedProducts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#222]">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono text-gray-400 font-bold uppercase">
                          Products ({listExtractedProducts.length})
                        </div>
                        <button
                          onClick={handleBulkImportAllList}
                          disabled={isBulkImporting}
                          className="px-3 py-1 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isBulkImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Import All to Database
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {listExtractedProducts.map((p, i) => (
                          <div
                            key={p.id || i}
                            className="p-3 bg-[#181818] border border-[#262626] hover:border-[#00ade6]/50 rounded-xl flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="font-sans text-xs font-bold text-white truncate">
                                {p.title}
                              </div>
                              <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                                {p.brand} • {p.salesUnitSize}
                              </div>
                            </div>
                            <button
                              onClick={() => handleImportListItemToIndex(p)}
                              className="px-3 py-1.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                            >
                              + Add & Log
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CREATE CUSTOM FOOD */}
              {activeModalTab === 'custom' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-white">
                      New Custom Food (Values per 100g)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={newFoodName}
                        onChange={(e) => setNewFoodName(e.target.value)}
                        placeholder="e.g. Protein shake"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Brand / Source</label>
                      <input
                        type="text"
                        value={newFoodBrand}
                        onChange={(e) => setNewFoodBrand(e.target.value)}
                        placeholder="e.g. Homemade"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Calories / 100g</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodKcal}
                        onChange={(e) => setNewFoodKcal(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#C0FF00] mb-1">Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodProtein}
                        onChange={(e) => setNewFoodProtein(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodCarbs}
                        onChange={(e) => setNewFoodCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-orange-400 mb-1">Sugars (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodSugar}
                        onChange={(e) => setNewFoodSugar(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-rose-400 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodFat}
                        onChange={(e) => setNewFoodFat(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-400 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newFoodFiber}
                        onChange={(e) => setNewFoodFiber(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNewCustomFood}
                    disabled={!newFoodName.trim()}
                    className="w-full mt-3 py-2.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-4 h-4" />
                    Save & Add to Global Database
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
