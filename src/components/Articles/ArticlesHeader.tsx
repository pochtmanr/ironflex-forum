import React from 'react';
import ArticlesSortDropdown from './ArticlesSortDropdown';

type SortOption = 'newest' | 'week' | 'month' | 'year';

interface ArticlesHeaderProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const ArticlesHeader: React.FC<ArticlesHeaderProps> = ({ sortBy, onSortChange }) => {
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-3 sm:px-4 py-3 sm:py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-xl font-bold mb-1">Статьи</h1>
          <p className="text-sm text-gray-200">
            Изучайте новые темы и развивайтесь вместе с нашими материалами
          </p>
        </div>
        
        {/* Sort Dropdown */}
        <div className="flex-shrink-0">
          <ArticlesSortDropdown 
            currentSort={sortBy} 
            onSortChange={onSortChange} 
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ArticlesHeader);
