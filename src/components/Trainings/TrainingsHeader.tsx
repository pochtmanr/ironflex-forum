import React from 'react';  
import TrainingsSortDropdown from './TrainingsSortDropdown';


type SortOption = 'newest' | 'week' | 'month' | 'year';

interface TrainingsHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const TrainingsHeader: React.FC<TrainingsHeaderProps> = ({ sortBy, onSortChange }) => {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-3 sm:px-4 py-3 sm:py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-xl font-bold mb-1">Тренировки</h1>
          <p className="text-sm text-gray-200">
            Практические упражнения для развития ваших навыков
          </p>
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
  );
};

export default React.memo(TrainingsHeader);
