'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface SearchBarProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether the component is in mobile mode */
  isMobile?: boolean;
  /** Base path to redirect to on search (default: '/') */
  basePath?: string;
  /** Custom className for the form container */
  className?: string;
  /** Width class for desktop (default: 'w-72') */
  desktopWidth?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Whether to show the component in compact mode */
  compact?: boolean;
}

/**
 * Reusable search bar component with responsive design
 * Can be used across different pages with customizable behavior
 * 
 * @example
 * // Desktop usage
 * <SearchBar placeholder="Поиск..." />
 * 
 * @example
 * // Mobile usage
 * <SearchBar isMobile placeholder="Поиск..." />
 * 
 * @example
 * // Custom callback
 * <SearchBar onSearch={(query) => console.log(query)} />
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Поиск...',
  isMobile = false,
  basePath = '/',
  className = '',
  desktopWidth = 'w-72',
  style,
  onSearch,
  compact = false
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    
    // Call custom callback if provided
    if (onSearch) {
      onSearch(q);
      return;
    }
    
    // Default behavior: navigate to basePath with query param
    router.push(`${basePath}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  const handleClear = () => {
    setSearch('');
    if (onSearch) {
      onSearch('');
    } else {
      router.push(basePath);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative ${!isMobile && !compact ? 'py-2' : ''} ${className}`}
      style={style}
    >
      <input
        type="search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`
          ${isMobile 
            ? 'w-full pr-12 px-3 py-2' 
            : `${desktopWidth} pr-12 px-3 ${compact ? 'py-1' : 'py-1.5'}`
          }
          border-2 border-gray-200 
          shadow-sm shadow-gray-200/50 
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent 
          text-md rounded-full
          transition-all
        `}
      />
      
      {/* Clear button - shows when there's text */}
     
      
      {/* Search button */}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-500/30 hover:bg-gray-700/40 text-white rounded-full p-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
        aria-label="Поиск"
        tabIndex={0}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={2}/>
          <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;

