import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DietaryDateNavigator } from './DietaryDateNavigator.tsx';
import { DietaryDailyMacroTotals } from './DietaryDailyMacroTotals.tsx';
import { LoggedFoodList } from './LoggedFoodList.tsx';
import { FoodSearchModal, StoreMetadata } from './FoodSearchModal.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';
import { useDietaryTracking } from './useDietaryTracking.ts';

interface DietaryViewProps {
  userId?: string;
}

export const DietaryView: React.FC<DietaryViewProps> = ({ userId: propUserId }) => {
  const { user } = useAuth();
  const userId = propUserId || user?.id || 'anonymous';
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  const {
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
  } = useDietaryTracking(userId);

  // Helper to identify store metadata from source URL or ID prefix
  const getStoreMetadata = (url?: string, id?: string): StoreMetadata | null => {
    const checkStr = (url || '') + (id || '');
    if (checkStr.includes('ah.nl') || checkStr.startsWith('ah_')) {
      return {
        name: 'Albert Heijn',
        badgeLabel: 'AH',
        textColor: 'text-[#00ade6]',
        bgColor: 'bg-[#00ade6]/10',
        borderColor: 'border-[#00ade6]/30',
      };
    }
    if (checkStr.includes('jumbo.com') || checkStr.startsWith('jumbo_')) {
      return {
        name: 'Jumbo',
        badgeLabel: 'JUMBO',
        textColor: 'text-[#eab308]',
        bgColor: 'bg-[#eab308]/10',
        borderColor: 'border-[#eab308]/30',
      };
    }
    if (checkStr.includes('dirk.nl') || checkStr.startsWith('dirk_')) {
      return {
        name: 'Dirk',
        badgeLabel: 'DIRK',
        textColor: 'text-[#ef4444]',
        bgColor: 'bg-[#ef4444]/10',
        borderColor: 'border-[#ef4444]/30',
      };
    }
    if (checkStr.includes('plus.nl') || checkStr.startsWith('plus_')) {
      return {
        name: 'PLUS',
        badgeLabel: 'PLUS',
        textColor: 'text-[#22c55e]',
        bgColor: 'bg-[#22c55e]/10',
        borderColor: 'border-[#22c55e]/30',
      };
    }
    return null;
  };

  // Clean raw product names from scraper noise
  const cleanProductTitle = (rawName: string) => {
    return rawName
      .replace(/bestellen\|/gi, '')
      .replace(/online bestellen\|/gi, '')
      .replace(/\| AH\.nl/gi, '')
      .replace(/\| Jumbo/gi, '')
      .replace(/\| Dirk/gi, '')
      .replace(/\| PLUS/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Clean redundant store brand duplicate badges
  const isHouseBrand = (brandName?: string, storeMeta?: StoreMetadata | null) => {
    if (!brandName || !storeMeta) return false;
    const b = brandName.toLowerCase();
    const s = storeMeta.name.toLowerCase();
    return (
      b === s ||
      (s === 'albert heijn' && (b === 'ah' || b === 'albert heijn')) ||
      (s === 'jumbo' && b === 'jumbo') ||
      (s === 'dirk' && (b === 'dirk' || b === '1 de beste')) ||
      (s === 'plus' && b === 'plus')
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. Date Navigator Bar */}
      <DietaryDateNavigator
        selectedDate={selectedDate}
        todayStr={todayStr}
        isToday={isToday}
        onDateShift={handleDateShift}
        onDateSelect={(dateStr) => setSelectedDate(dateStr)}
        formatDateTitle={formatDateTitle}
      />

      {/* 2. Daily Macronutrient Summary Cards */}
      <DietaryDailyMacroTotals summary={summary} />

      {/* 3. Logged Foods List */}
      <LoggedFoodList
        entries={entries}
        selectedDate={selectedDate}
        isToday={isToday}
        onOpenAddModal={() => {
          setSelectedFoodItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
        onUpdateEntryGrams={handleUpdateEntryGrams}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* 4. Food Search & Add Modal */}
      <FoodSearchModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedFoodItem(null);
        }}
        activeModalTab={activeModalTab}
        setActiveModalTab={setActiveModalTab}
        selectedDate={selectedDate}
        formatDateTitle={formatDateTitle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredCatalog={filteredCatalog}
        selectedFoodItem={selectedFoodItem}
        setSelectedFoodItem={setSelectedFoodItem}
        portionGrams={portionGrams}
        setPortionGrams={setPortionGrams}
        onAddEntryToLog={handleAddEntryToLog}
        getStoreMetadata={getStoreMetadata}
        cleanProductTitle={cleanProductTitle}
        isHouseBrand={isHouseBrand}
        singleLinkInput={singleLinkInput}
        setSingleLinkInput={setSingleLinkInput}
        singleLinkLoading={singleLinkLoading}
        singleLinkError={singleLinkError}
        onFetchSingleProductLink={handleFetchSingleProductLink}
        listLinkInput={listLinkInput}
        setListLinkInput={setListLinkInput}
        listLinkLoading={listLinkLoading}
        listLinkError={listLinkError}
        listExtractedProducts={listExtractedProducts}
        isBulkImporting={isBulkImporting}
        onFetchSharedList={handleFetchSharedList}
        onBulkImportAllList={handleBulkImportAllList}
        onImportListItemToIndex={handleImportListItemToIndex}
        newFoodName={newFoodName}
        setNewFoodName={setNewFoodName}
        newFoodBrand={newFoodBrand}
        setNewFoodBrand={setNewFoodBrand}
        newFoodBarcode={newFoodBarcode}
        setNewFoodBarcode={setNewFoodBarcode}
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
        onSaveNewCustomFood={handleSaveNewCustomFood}
      />

      {/* 5. Live Barcode Camera Scanner */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        currentUserId={userId}
        onProductDetected={(detectedProduct) => {
          setSelectedFoodItem(detectedProduct);
          setPortionGrams(detectedProduct.packageWeightGrams || 100);
          setIsAddModalOpen(true);
          setActiveModalTab('search');
        }}
        onManualEntryRequested={(barcode) => {
          setNewFoodBarcode(barcode);
          setIsAddModalOpen(true);
          setActiveModalTab('custom');
        }}
      />
    </div>
  );
};
export default DietaryView;
