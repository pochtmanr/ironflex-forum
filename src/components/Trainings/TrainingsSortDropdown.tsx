import React, { useState } from 'react';

type SortOption = 'newest' | 'week' | 'month' | 'year';

interface TrainingsSortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const TrainingsSortDropdown: React.FC<TrainingsSortDropdownProps> = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'newest' as SortOption, label: 'Новые' },
    { value: 'week' as SortOption, label: 'Топ недели' },
    { value: 'month' as SortOption, label: 'Топ месяца' },
    { value: 'year' as SortOption, label: 'Топ года' }
  ];

  const currentOption = sortOptions.find(option => option.value === currentSort);

  const handleSelect = (value: SortOption) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-1.5 bg-gray-600 border-2 border-gray-400/60 hover:bg-gray-500 rounded-lg text-sm transition-colors shadow-md font-medium"
      >
        <span>{currentOption?.label}</span>
        <svg 
          className={`ml-2 h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-1 border-gray-200 z-20">
            <div className="py-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                    currentSort === option.value
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(TrainingsSortDropdown);
