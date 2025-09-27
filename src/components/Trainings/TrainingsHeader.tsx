import React from 'react';  
import TrainingsSortDropdown from './TrainingsSortDropdown';


type SortOption = 'newest' | 'week' | 'month' | 'year';

interface TrainingsHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const TrainingsHeader: React.FC<TrainingsHeaderProps> = ({ sortBy, onSortChange }) => {
  return (
    <>
      {/* Mobile-Optimized Banner Area */}
      <div className="text-center mb-4 sm:mb-6 overflow-hidden">
        <div className="flex justify-center">
          <div className="w-full max-w-[970px] h-[60px] sm:h-[90px] bg-gray-100 flex items-center justify-center text-gray-500 rounded text-xs sm:text-base">
            <span className="block sm:hidden">Рекламный блок 320x60</span>
            <span className="hidden sm:block">Рекламный блок 970x90</span>
          </div>
        </div>
      </div>

      {/* Main Articles Header */}
      <div className="bg-white shadow-md ">
        <div className="bg-gray-600 text-white px-3 sm:px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">Тренировки</h1>
            <div className="text-xs sm:text-sm text-gray-200 mt-1">
              <span className="block sm:hidden">
                Практические упражнения для
                <br />
                развития ваших навыков и знаний
              </span>
              <span className="hidden sm:block">
                Практические упражнения и тренировки для развития ваших навыков и знаний
              </span>
            </div>
          </div>
          
          {/* Sort Dropdown */}
          <div className="flex-shrink-0">
            <TrainingsSortDropdown 
              currentSort={sortBy} 
              onSortChange={onSortChange} 
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(TrainingsHeader);
