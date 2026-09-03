import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useDietaryJournal } from '../hooks/useDietaryJournal.ts';
import { DietaryHeader } from './dietary/DietaryHeader.tsx';
import { DietaryDailySummaryCards } from './dietary/DietaryDailySummaryCards.tsx';
import { DietaryEntriesList } from './dietary/DietaryEntriesList.tsx';
import { DietaryAddFoodModal } from './dietary/DietaryAddFoodModal';

export const DietaryView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  const {
    selectedDate,
    setSelectedDate,
    catalog,
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
  } = useDietaryJournal(userId);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Navigation */}
      <DietaryHeader
        selectedDate={selectedDate}
        catalogCount={catalog.length}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onDateChange={setSelectedDate}
        onOpenAddModal={() => {
          setShowAddModal(true);
          setSelectedFoodItem(null);
          setSearchQuery('');
        }}
      />

      {/* 2. Daily Macronutrient Summary Cards */}
      <DietaryDailySummaryCards dailyLog={dailyLog} />

      {/* 3. Logged Meals & Entries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black uppercase italic tracking-tight text-white text-lg flex items-center gap-2">
            Logged Meals
            <span className="text-xs font-mono font-normal text-gray-500">
              ({dailyLog.entries.length} items)
            </span>
          </h3>
        </div>

        <DietaryEntriesList
          entries={dailyLog.entries}
          onDeleteEntry={handleDeleteEntry}
          onOpenAddModal={() => {
            setShowAddModal(true);
            setSelectedFoodItem(null);
          }}
        />
      </div>

      {/* 4. Add Food & Nutrient Modal */}
      <DietaryAddFoodModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedFoodItem(null);
        }}
        activeTab={activeModalTab}
        setActiveTab={setActiveModalTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredCatalog={filteredCatalog}
        selectedFoodItem={selectedFoodItem}
        setSelectedFoodItem={setSelectedFoodItem}
        portionGrams={portionGrams}
        setPortionGrams={setPortionGrams}
        onLogPortion={handleLogFoodPortion}
        singleLinkInput={singleLinkInput}
        setSingleLinkInput={setSingleLinkInput}
        singleLinkLoading={singleLinkLoading}
        singleLinkError={singleLinkError}
        onFetchSingleLink={handleFetchSingleLink}
        listLinkInput={listLinkInput}
        setListLinkInput={setListLinkInput}
        listLinkLoading={listLinkLoading}
        listLinkError={listLinkError}
        listExtractedProducts={listExtractedProducts}
        isBulkImporting={isBulkImporting}
        onFetchSharedList={handleFetchSharedList}
        onBulkImportList={handleBulkImportList}
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
        onCreateCustomFood={handleCreateCustomFood}
      />
    </div>
  );
};
