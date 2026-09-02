import React, { useState, useEffect } from 'react';
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
  Edit2,
  Check,
  Search,
  ShoppingCart,
  Loader2,
  X,
  ExternalLink,
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
} from '../lib/dietaryData.ts';

export const DietaryView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  // Selected date state (default today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [catalog, setCatalog] = useState<FoodItemNutrition[]>([]);
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

  // Modal / Add Food Flow States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAHImportModal, setShowAHImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Food to Log
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItemNutrition | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // New Custom Food Form State
  const [isCreatingNewFood, setIsCreatingNewFood] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodBrand, setNewFoodBrand] = useState('');
  const [newFoodKcal, setNewFoodKcal] = useState<number | ''>('');
  const [newFoodProtein, setNewFoodProtein] = useState<number | ''>('');
  const [newFoodCarbs, setNewFoodCarbs] = useState<number | ''>('');
  const [newFoodSugar, setNewFoodSugar] = useState<number | ''>('');
  const [newFoodFat, setNewFoodFat] = useState<number | ''>('');
  const [newFoodFiber, setNewFoodFiber] = useState<number | ''>('');

  // Albert Heijn shared list URL state
  const [ahListUrl, setAhListUrl] = useState('https://www.ah.nl/mijnlijst/gedeelde-lijst/2241f734-e626-45d6-804b-254efb8bf1a8');
  const [ahLoading, setAhLoading] = useState(false);
  const [ahError, setAhError] = useState<string | null>(null);
  const [ahExtractedProducts, setAhExtractedProducts] = useState<any[]>([]);

  // Load Catalog & Daily Log when user or selected date changes
  useEffect(() => {
    const loadedCatalog = getSavedFoodCatalog(userId);
    setCatalog(loadedCatalog);

    const loadedLog = getDailyDietaryLog(userId, selectedDate);
    setDailyLog(loadedLog);
  }, [userId, selectedDate]);

  // Navigate Date
  const handleDateShift = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Helper for formatted date display
  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', {
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

  // Update Amount / Grams of an existing entry inline
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

  // Create & Save New Custom Food to Catalog
  const handleSaveNewCustomFood = () => {
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

    const updatedCatalog = [newFood, ...catalog];
    setCatalog(updatedCatalog);
    saveFoodCatalog(userId, updatedCatalog);

    // Reset create form
    setIsCreatingNewFood(false);
    setNewFoodName('');
    setNewFoodBrand('');
    setNewFoodKcal('');
    setNewFoodProtein('');
    setNewFoodCarbs('');
    setNewFoodSugar('');
    setNewFoodFat('');
    setNewFoodFiber('');

    // Immediately select this new food for logging
    setSelectedFoodItem(newFood);
  };

  // AH List Extractor
  const extractListId = (url: string): string => {
    const clean = url.trim();
    const match = clean.match(/gedeelde-lijst\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    return clean;
  };

  const handleFetchAHList = async () => {
    setAhLoading(true);
    setAhError(null);
    setAhExtractedProducts([]);

    try {
      const listId = extractListId(ahListUrl);
      if (!listId) throw new Error('Please enter a valid Albert Heijn shared list link or ID');

      const res = await fetch(`/api/ah-shared-list?listId=${encodeURIComponent(listId)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch (status ${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Invalid list response');
      }

      setAhExtractedProducts(data.products);
    } catch (err: any) {
      setAhError(err.message || 'Failed to extract AH list.');
    } finally {
      setAhLoading(false);
    }
  };

  // Add AH Product to User's Catalog
  const handleImportAHProductToCatalog = (prod: any) => {
    // Check if already in catalog
    const existing = catalog.find((c) => c.name.toLowerCase() === prod.title.toLowerCase());
    if (existing) {
      setSelectedFoodItem(existing);
      setShowAHImportModal(false);
      setShowAddModal(true);
      return;
    }

    // Default intelligent baseline for the product (can be fine-tuned)
    const newFood: FoodItemNutrition = {
      id: `ah_${prod.id || Date.now()}`,
      name: prod.title,
      brand: prod.brand || 'AH',
      servingUnit: prod.salesUnitSize?.includes('l') || prod.salesUnitSize?.includes('ml') ? 'ml' : 'gram',
      kcalPer100g: prod.title.toLowerCase().includes('rijst') ? 355 : prod.title.toLowerCase().includes('kip') ? 110 : prod.title.toLowerCase().includes('melk') ? 47 : 100,
      proteinPer100g: prod.title.toLowerCase().includes('kip') ? 23.5 : prod.title.toLowerCase().includes('rijst') ? 8.5 : prod.title.toLowerCase().includes('melk') ? 3.6 : 5.0,
      carbsPer100g: prod.title.toLowerCase().includes('rijst') ? 77.0 : prod.title.toLowerCase().includes('melk') ? 4.8 : 0.0,
      sugarPer100g: prod.title.toLowerCase().includes('melk') ? 4.8 : 0.0,
      fatPer100g: prod.title.toLowerCase().includes('kip') ? 1.8 : prod.title.toLowerCase().includes('melk') ? 1.5 : 1.0,
      fiberPer100g: prod.title.toLowerCase().includes('rijst') ? 1.5 : 0.0,
    };

    const updatedCatalog = [newFood, ...catalog];
    setCatalog(updatedCatalog);
    saveFoodCatalog(userId, updatedCatalog);

    setSelectedFoodItem(newFood);
    setShowAHImportModal(false);
    setShowAddModal(true);
  };

  const filteredCatalog = catalog.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-[#C0FF00]" />
          <span className="font-display text-sm sm:text-base font-black uppercase tracking-tight text-white">
            {formatDateTitle(selectedDate)}
          </span>
          {isToday && (
            <span className="text-[10px] font-mono font-bold uppercase bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        <button
          onClick={() => handleDateShift(1)}
          className="p-2 hover:bg-[#1f1f1f] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Daily Log Product List Section */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div>
            <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Apple className="w-5 h-5 text-[#C0FF00]" />
              Logged Food Items ({dailyLog.entries.length})
            </h2>
            <p className="font-sans text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
              Enter portion grams — recalculates live
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAHImportModal(true)}
              className="px-3 py-2 bg-[#00ade6]/10 hover:bg-[#00ade6]/20 border border-[#00ade6]/30 text-[#00ade6] font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AH List</span>
            </button>

            <button
              onClick={() => {
                setSelectedFoodItem(null);
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(192,255,0,0.2)] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Food
            </button>
          </div>
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
              Tap "Add Food" or import from Albert Heijn list to start logging your meals and track your macros.
            </p>
          </div>
        ) : (
          /* List of Logged Products for the Day */
          <div className="space-y-3">
            {dailyLog.entries.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3.5 sm:p-4 bg-[#161616] border border-[#222] hover:border-[#333] rounded-2xl transition-all"
              >
                {/* Product Name & Gram Input Row */}
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

                {/* Per-Product Macro Pill Breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-[#202020] text-center font-mono text-xs">
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-gray-500 uppercase font-sans font-bold">Kcal</div>
                    <div className="font-black text-white">{entry.calculatedKcal}</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-[#C0FF00] uppercase font-sans font-bold">Eiwit</div>
                    <div className="font-black text-white">{entry.calculatedProtein}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-amber-400 uppercase font-sans font-bold">KH</div>
                    <div className="font-black text-white">{entry.calculatedCarbs}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-orange-400 uppercase font-sans font-bold">Suikers</div>
                    <div className="font-black text-white">{entry.calculatedSugar}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-rose-400 uppercase font-sans font-bold">Vet</div>
                    <div className="font-black text-white">{entry.calculatedFat}g</div>
                  </div>
                  <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                    <div className="text-[9px] text-emerald-400 uppercase font-sans font-bold">Vezels</div>
                    <div className="font-black text-white">{entry.calculatedFiber}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Small Clean Macro Overview Card (Directly Under the Product List) */}
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
          {/* Kcal */}
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-sans font-bold uppercase">
              <span>Kcal</span>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalKcal}
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Total Calories</div>
          </div>

          {/* Eiwit */}
          <div className="bg-[#161616] border border-[#C0FF00]/25 p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#C0FF00] text-xs font-sans font-bold uppercase">
              <span>Eiwit</span>
              <Zap className="w-3.5 h-3.5 text-[#C0FF00]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#C0FF00] mt-1">
              {dailyLog.totalProtein}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Protein</div>
          </div>

          {/* Koolhydraten */}
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs font-sans font-bold uppercase">
              <span>KH</span>
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalCarbs}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Carbohydrates</div>
          </div>

          {/* Suikers */}
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-orange-400 text-xs font-sans font-bold uppercase">
              <span>Suikers</span>
              <Candy className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalSugar}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Sugars</div>
          </div>

          {/* Vet */}
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 text-xs font-sans font-bold uppercase">
              <span>Vet</span>
              <Droplet className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalFat}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Fats</div>
          </div>

          {/* Vezels */}
          <div className="bg-[#161616] border border-[#262626] p-3 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-sans font-bold uppercase">
              <span>Vezels</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {dailyLog.totalFiber}<span className="text-xs ml-0.5 font-normal">g</span>
            </div>
            <div className="text-[9px] text-gray-500 font-sans mt-0.5">Dietary Fiber</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FOOD TO DAILY LOG (Search Catalog or Create Custom) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-[#C0FF00]" />
                <h3 className="font-display text-base font-black uppercase tracking-wider text-white">
                  Add Food Item
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsCreatingNewFood(false);
                  setSelectedFoodItem(null);
                }}
                className="p-1.5 hover:bg-[#222] rounded-full text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {!isCreatingNewFood ? (
                <>
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search food (e.g. Kipfilet, Basmatirijst)..."
                      className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white font-sans placeholder:text-gray-600 outline-none transition-colors"
                    />
                  </div>

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
                            Per 100g: {selectedFoodItem.kcalPer100g} kcal | {selectedFoodItem.proteinPer100g}g protein
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
                            className="w-28 bg-[#101010] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#C0FF00] outline-none"
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

                      {/* Live Recalculated Preview */}
                      {(() => {
                        const preview = calculatePortionNutrients(selectedFoodItem, portionGrams);
                        return (
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#121212] p-2 rounded-xl text-center font-mono text-xs border border-[#2a2a2a]">
                            <div>
                              <div className="text-[9px] text-gray-500 uppercase">Kcal</div>
                              <div className="font-bold text-white">{preview.calculatedKcal}</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-[#C0FF00] uppercase">Eiwit</div>
                              <div className="font-bold text-[#C0FF00]">{preview.calculatedProtein}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-amber-400 uppercase">KH</div>
                              <div className="font-bold text-white">{preview.calculatedCarbs}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-orange-400 uppercase">Suikers</div>
                              <div className="font-bold text-white">{preview.calculatedSugar}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-rose-400 uppercase">Vet</div>
                              <div className="font-bold text-white">{preview.calculatedFat}g</div>
                            </div>
                            <div>
                              <div className="text-[9px] text-emerald-400 uppercase">Vezels</div>
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
                    /* Food Item Selection List */
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {filteredCatalog.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedFoodItem(item);
                            setPortionGrams(100);
                          }}
                          className="p-3 bg-[#181818] border border-[#262626] hover:border-[#C0FF00]/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                        >
                          <div>
                            <div className="font-sans text-xs font-bold text-white group-hover:text-[#C0FF00] transition-colors">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                              {item.kcalPer100g} kcal / 100g • {item.proteinPer100g}g protein • {item.carbsPer100g}g carbs
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 group-hover:text-white uppercase font-bold">
                            Select →
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#222] flex items-center justify-between">
                    <button
                      onClick={() => setIsCreatingNewFood(true)}
                      className="text-xs font-sans text-[#C0FF00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create New Custom Food (per 100g)
                    </button>
                  </div>
                </>
              ) : (
                /* Custom Food Item Creator Form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-white">
                      New Food (Values per 100g)
                    </span>
                    <button
                      onClick={() => setIsCreatingNewFood(false)}
                      className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                    >
                      Back to list
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={newFoodName}
                        onChange={(e) => setNewFoodName(e.target.value)}
                        placeholder="e.g. Kwark, Tonijn"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Brand / Merk</label>
                      <input
                        type="text"
                        value={newFoodBrand}
                        onChange={(e) => setNewFoodBrand(e.target.value)}
                        placeholder="e.g. AH, Melkunie"
                        className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Kcal / 100g</label>
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
                      <label className="block text-[10px] font-mono uppercase text-[#C0FF00] mb-1">Eiwit (g)</label>
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
                      <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">KH (g)</label>
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
                      <label className="block text-[10px] font-mono uppercase text-orange-400 mb-1">Suikers (g)</label>
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
                      <label className="block text-[10px] font-mono uppercase text-rose-400 mb-1">Vet (g)</label>
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
                      <label className="block text-[10px] font-mono uppercase text-emerald-400 mb-1">Vezels (g)</label>
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
                    className="w-full mt-3 py-2.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 transition-all"
                  >
                    Save to My Food Shelf
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ALBERT HEIJN SHARED LIST IMPORTER */}
      {/* ========================================================================= */}
      {showAHImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00ade6]" />
                <h3 className="font-display text-base font-black uppercase tracking-wider text-white">
                  Albert Heijn List Importer
                </h3>
              </div>
              <button
                onClick={() => setShowAHImportModal(false)}
                className="p-1.5 hover:bg-[#222] rounded-full text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">
                Albert Heijn Shared List Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ahListUrl}
                  onChange={(e) => setAhListUrl(e.target.value)}
                  placeholder="https://www.ah.nl/mijnlijst/gedeelde-lijst/..."
                  className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#00ade6] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
                />
                <button
                  onClick={handleFetchAHList}
                  disabled={ahLoading || !ahListUrl.trim()}
                  className="px-4 py-2.5 bg-[#00ade6] hover:bg-[#0096c7] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {ahLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Fetch
                </button>
              </div>

              {ahError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
                  {ahError}
                </div>
              )}

              {ahExtractedProducts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#222]">
                  <div className="text-xs font-mono text-gray-400 font-bold uppercase">
                    Extracted Products ({ahExtractedProducts.length}) — Tap to log:
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {ahExtractedProducts.map((p, i) => (
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
                          onClick={() => handleImportAHProductToCatalog(p)}
                          className="px-3 py-1.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                        >
                          + Log
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
