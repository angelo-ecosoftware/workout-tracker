import React from 'react';
import {
  Camera,
  Link as LinkIcon,
  ListPlus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { FoodItemNutrition } from '../../models.ts';
import { FoodSearchTab } from './FoodSearchTab.tsx';
import { FoodLinkTabs } from './FoodLinkTabs.tsx';
import { CustomFoodTab } from './CustomFoodTab.tsx';

export interface StoreMetadata {
  name: string;
  badgeLabel: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModalTab: 'search' | 'link' | 'list' | 'custom';
  setActiveModalTab: (tab: 'search' | 'link' | 'list' | 'custom') => void;
  selectedDate: string;
  formatDateTitle: (dateStr: string) => string;
  // Search Tab Props
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredCatalog: FoodItemNutrition[];
  selectedFoodItem: FoodItemNutrition | null;
  setSelectedFoodItem: (item: FoodItemNutrition | null) => void;
  portionGrams: number;
  setPortionGrams: (g: number) => void;
  onAddEntryToLog: (food: FoodItemNutrition, grams: number) => void;
  getStoreMetadata: (url?: string, id?: string) => StoreMetadata | null;
  cleanProductTitle: (rawName: string) => string;
  isHouseBrand: (brandName?: string, storeMeta?: StoreMetadata | null) => boolean;
  // Link Scraper Tab Props
  singleLinkInput: string;
  setSingleLinkInput: (url: string) => void;
  singleLinkLoading: boolean;
  singleLinkError: string | null;
  onFetchSingleProductLink: () => void;
  // List Import Tab Props
  listLinkInput: string;
  setListLinkInput: (url: string) => void;
  listLinkLoading: boolean;
  listLinkError: string | null;
  listExtractedProducts: Array<{ id: string; title: string; brand?: string; salesUnitSize?: string }>;
  isBulkImporting: boolean;
  onFetchSharedList: () => void;
  onBulkImportAllList: () => void;
  onImportListItemToIndex: (item: { id: string; title: string; brand?: string; salesUnitSize?: string }) => void;
  // Custom Food Form Props
  newFoodName: string;
  setNewFoodName: (val: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (val: string) => void;
  newFoodBarcode?: string;
  setNewFoodBarcode?: (val: string) => void;
  newFoodServingUnit?: 'gram' | 'ml';
  setNewFoodServingUnit?: (unit: 'gram' | 'ml') => void;
  newFoodKcal: number | '';
  setNewFoodKcal: (val: number | '') => void;
  newFoodProtein: number | '';
  setNewFoodProtein: (val: number | '') => void;
  newFoodCarbs: number | '';
  setNewFoodCarbs: (val: number | '') => void;
  newFoodSugar: number | '';
  setNewFoodSugar: (val: number | '') => void;
  newFoodFat: number | '';
  setNewFoodFat: (val: number | '') => void;
  newFoodFiber: number | '';
  setNewFoodFiber: (val: number | '') => void;
  onSaveNewCustomFood: () => void;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  isOpen,
  onClose,
  activeModalTab,
  setActiveModalTab,
  selectedDate,
  formatDateTitle,
  searchQuery,
  setSearchQuery,
  filteredCatalog,
  selectedFoodItem,
  setSelectedFoodItem,
  portionGrams,
  setPortionGrams,
  onAddEntryToLog,
  getStoreMetadata,
  cleanProductTitle,
  isHouseBrand,
  singleLinkInput,
  setSingleLinkInput,
  singleLinkLoading,
  singleLinkError,
  onFetchSingleProductLink,
  listLinkInput,
  setListLinkInput,
  listLinkLoading,
  listLinkError,
  listExtractedProducts,
  isBulkImporting,
  onFetchSharedList,
  onBulkImportAllList,
  onImportListItemToIndex,
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
  onSaveNewCustomFood,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#141414] border border-[#2c2c2c] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222] flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[#C0FF00]" />
              Add Food Item
            </h3>
            <p className="font-sans text-[11px] text-gray-400 mt-0.5">
              Logging into {formatDateTitle(selectedDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#202020] text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#222] bg-[#101010] p-1.5 gap-1 text-xs font-mono font-bold">
          <button
            onClick={() => {
              setActiveModalTab('search');
              setSelectedFoodItem(null);
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'search'
                ? 'bg-[#202020] text-[#C0FF00] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            onClick={() => setActiveModalTab('link')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'link'
                ? 'bg-[#202020] text-[#00ade6] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Product Link</span>
          </button>

          <button
            onClick={() => setActiveModalTab('list')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'list'
                ? 'bg-[#202020] text-[#00ade6] shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>AH List</span>
          </button>

          <button
            onClick={() => setActiveModalTab('custom')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeModalTab === 'custom'
                ? 'bg-[#202020] text-[#C0FF00] shadow-sm'
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
            <FoodSearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog}
              selectedFoodItem={selectedFoodItem}
              setSelectedFoodItem={setSelectedFoodItem}
              portionGrams={portionGrams}
              setPortionGrams={setPortionGrams}
              selectedDate={selectedDate}
              formatDateTitle={formatDateTitle}
              onAddEntryToLog={onAddEntryToLog}
              onSelectTab={setActiveModalTab}
              setNewFoodName={setNewFoodName}
              getStoreMetadata={getStoreMetadata}
              cleanProductTitle={cleanProductTitle}
              isHouseBrand={isHouseBrand}
            />
          )}

          {/* TAB 2 & 3: PASTE SINGLE SUPERMARKET PRODUCT LINK / AH LIST */}
          {(activeModalTab === 'link' || activeModalTab === 'list') && (
            <FoodLinkTabs
              activeModalTab={activeModalTab}
              singleLinkInput={singleLinkInput}
              setSingleLinkInput={setSingleLinkInput}
              singleLinkLoading={singleLinkLoading}
              singleLinkError={singleLinkError}
              onFetchSingleProductLink={onFetchSingleProductLink}
              listLinkInput={listLinkInput}
              setListLinkInput={setListLinkInput}
              listLinkLoading={listLinkLoading}
              listLinkError={listLinkError}
              listExtractedProducts={listExtractedProducts}
              isBulkImporting={isBulkImporting}
              onFetchSharedList={onFetchSharedList}
              onBulkImportAllList={onBulkImportAllList}
              onImportListItemToIndex={onImportListItemToIndex}
            />
          )}

          {/* TAB 4: CREATE CUSTOM FOOD */}
          {activeModalTab === 'custom' && (
            <CustomFoodTab
              newFoodName={newFoodName}
              setNewFoodName={setNewFoodName}
              newFoodBrand={newFoodBrand}
              setNewFoodBrand={setNewFoodBrand}
              newFoodBarcode={newFoodBarcode}
              setNewFoodBarcode={setNewFoodBarcode}
              newFoodServingUnit={newFoodServingUnit}
              setNewFoodServingUnit={setNewFoodServingUnit}
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
              onSaveNewCustomFood={onSaveNewCustomFood}
            />
          )}
        </div>
      </div>
    </div>
  );
};
