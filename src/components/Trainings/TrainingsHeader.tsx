import React from 'react';  
import TrainingsSortDropdown from './TrainingsSortDropdown';


type SortOption = 'newest' | 'week' | 'month' | 'year';

interface TrainingsHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const TrainingsHeader: React.FC<TrainingsHeaderProps> = ({ sortBy, onSortChange }) => {
  return (
    <div className="bg-white max-w-7xl mx-auto px-2 sm:px-2">
      <div className="bg-gray-600 text-white px-3 rounded-t-sm sm:px-4 py-3 sm:py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Тренировки</h1>
        
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
