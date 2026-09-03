import React from 'react';
import { X, Search, ShoppingCart, Link as LinkIcon, Database } from 'lucide-react';
import { FoodItemNutrition } from '../../models.ts';
import { ScrapedProductDTO } from '../../types/api.ts';
import { FoodSearchTab } from './FoodSearchTab.tsx';
import { SingleLinkScraperTab } from './SingleLinkScraperTab.tsx';
import { GroceryListScraperTab } from './GroceryListScraperTab.tsx';
import { CustomFoodTab } from './CustomFoodTab.tsx';

interface DietaryAddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'search' | 'link' | 'list' | 'custom';
  setActiveTab: (tab: 'search' | 'link' | 'list' | 'custom') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredCatalog: FoodItemNutrition[];
  selectedFoodItem: FoodItemNutrition | null;
  setSelectedFoodItem: (item: FoodItemNutrition | null) => void;
  portionGrams: number;
  setPortionGrams: (g: number) => void;
  onLogPortion: (item: FoodItemNutrition, grams: number) => void;
  // Single Link state & actions
  singleLinkInput: string;
  setSingleLinkInput: (v: string) => void;
  singleLinkLoading: boolean;
  singleLinkError: string | null;
  onFetchSingleLink: () => void;
  // Shared List state & actions
  listLinkInput: string;
  setListLinkInput: (v: string) => void;
  listLinkLoading: boolean;
  listLinkError: string | null;
  listExtractedProducts: ScrapedProductDTO[];
  isBulkImporting: boolean;
  onFetchSharedList: () => void;
  onBulkImportList: () => void;
  // Custom Food Form state & actions
  newFoodName: string;
  setNewFoodName: (v: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (v: string) => void;
  newFoodKcal: number | '';
  setNewFoodKcal: (v: number | '') => void;
  newFoodProtein: number | '';
  setNewFoodProtein: (v: number | '') => void;
  newFoodCarbs: number | '';
  setNewFoodCarbs: (v: number | '') => void;
  newFoodSugar: number | '';
  setNewFoodSugar: (v: number | '') => void;
  newFoodFat: number | '';
  setNewFoodFat: (v: number | '') => void;
  newFoodFiber: number | '';
  setNewFoodFiber: (v: number | '') => void;
  onCreateCustomFood: (e: React.FormEvent) => void;
}

export const DietaryAddFoodModal: React.FC<DietaryAddFoodModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredCatalog,
  selectedFoodItem,
  setSelectedFoodItem,
  portionGrams,
  setPortionGrams,
  onLogPortion,
  singleLinkInput,
  setSingleLinkInput,
  singleLinkLoading,
  singleLinkError,
  onFetchSingleLink,
  listLinkInput,
  setListLinkInput,
  listLinkLoading,
  listLinkError,
  listExtractedProducts,
  isBulkImporting,
  onFetchSharedList,
  onBulkImportList,
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
  onCreateCustomFood,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111111] border border-[#222222] rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div>
            <h3 className="font-display font-black italic uppercase tracking-tight text-white text-lg sm:text-xl">
              Add Food / Meal
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Select verified database items, paste links, or create custom items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#1A1A1A] text-gray-400 hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161616] border border-[#222222] rounded-xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'link'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>1-Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Lijstje</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        {activeTab === 'search' && (
          <FoodSearchTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCatalog={filteredCatalog}
            selectedFoodItem={selectedFoodItem}
            setSelectedFoodItem={setSelectedFoodItem}
            portionGrams={portionGrams}
            setPortionGrams={setPortionGrams}
            onLogPortion={onLogPortion}
          />
        )}

        {activeTab === 'link' && (
          <SingleLinkScraperTab
            singleLinkInput={singleLinkInput}
            setSingleLinkInput={setSingleLinkInput}
            singleLinkLoading={singleLinkLoading}
            singleLinkError={singleLinkError}
            onFetchSingleLink={onFetchSingleLink}
          />
        )}

        {activeTab === 'list' && (
          <GroceryListScraperTab
            listLinkInput={listLinkInput}
            setListLinkInput={setListLinkInput}
            listLinkLoading={listLinkLoading}
            listLinkError={listLinkError}
            listExtractedProducts={listExtractedProducts}
            isBulkImporting={isBulkImporting}
            onFetchSharedList={onFetchSharedList}
            onBulkImportList={onBulkImportList}
          />
        )}

        {activeTab === 'custom' && (
          <CustomFoodTab
            newFoodName={newFoodName}
            setNewFoodName={setNewFoodName}
            newFoodBrand={newFoodBrand}
            setNewFoodBrand={setNewFoodBrand}
            newFoodKcal={newFoodKcal}
            setNewFoodKcal={setNewFoodKcal}
            newFoodProtein={newFoodProtein}
            setNewFoodProtein={setNewFoodProtein}
            newFoodCarbs={newFoodCarbs}
            setNewFoodCarbs={setNewFoodCarbs}
            newFoodSugar={newFoodSugar}
            setNewFoodSugar={setNewFoodSugar}
            newFoodFat={newFoodFat}
            setNewFoodFat={setNewFoodFat}
            newFoodFiber={newFoodFiber}
            setNewFoodFiber={setNewFoodFiber}
            onCreateCustomFood={onCreateCustomFood}
          />
        )}
      </div>
    </div>
  );
};
