'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { forumAPI } from '../../services/api';

interface TopTopic {
  id: string;
  title: string;
  views: number;
  reply_count: number;
  user_name: string;
  user_id: string;
  category_name: string;
  category_id: string;
  user_photo_url?: string; // Added for avatar
}

interface TopTopicsProps {
  limit?: number;
  period?: 'day' | 'week' | 'all';
  className?: string;
}

const TopTopics: React.FC<TopTopicsProps> = ({ 
  limit = 5,
  className = '' 
}) => {
  const [topics, setTopics] = useState<TopTopic[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<'day' | 'week' | 'all'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadTopTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await forumAPI.getTopTopics(limit, currentPeriod) as { topics: TopTopic[] };
      setTopics(result.topics);
    } catch (err) {
      console.error('Error loading top topics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить популярные темы.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, currentPeriod]);

  useEffect(() => {
    loadTopTopics();
  }, [loadTopTopics]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePeriodChange = (period: 'day' | 'week' | 'all') => {
    setCurrentPeriod(period);
    setIsDropdownOpen(false);
  };

  const getPeriodLabel = (period: 'day' | 'week' | 'all') => {
    switch (period) {
      case 'day': return 'День';
      case 'week': return 'Неделя';
      case 'all': return 'Все время';
    }
  };

  return (
    <div className={`bg-white shadow-md mb-6 ${className}`}>
      <div className="bg-gray-600 text-white px-6 py-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Популярные темы</h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-500 rounded text-sm transition-colors"
          >
            {getPeriodLabel(currentPeriod)}
            <svg 
              className={`ml-2 h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {(['day', 'week', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                      currentPeriod === period 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {getPeriodLabel(period)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {loading && (
          <div className="text-center py-4 text-gray-500">Загрузка популярных тем...</div>
        )}
        {error && (
          <div className="text-center py-4 text-red-500">{error}</div>
        )}
        {!loading && !error && topics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Нет популярных тем за выбранный период.</p>
          </div>
        )}
        {!loading && !error && topics.length > 0 && (
          <ul role="list" className="divide-y divide-gray-100">
            {topics.map(topic => (
              <li key={topic.id} className="flex justify-between gap-x-6 py-5">
                <div className="flex min-w-0 gap-x-4">
                  {topic.user_photo_url ? (
                    <Image 
                      src={topic.user_photo_url} 
                      alt={topic.user_name || 'Anonymous User'}
                      width={48}
                      height={48}
                      className="size-12 flex-none rounded-full bg-gray-50 object-cover"
                    />
                  ) : (
                    <div className="size-12 flex-none rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                      {topic.user_name ? topic.user_name.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
             
                  <div className="min-w-0 flex-auto">
                    <Link href={`/topic/${topic.id}`} className="text-sm/6 font-semibold text-gray-900 hover:text-blue-700">
                      {topic.title}
                    </Link>
                    <p className="mt-1 truncate text-xs/5 text-gray-500">
                      от <Link href={`/profile/${topic.user_id}`} className="text-green-600 hover:text-green-800">@{topic.user_name}</Link>
                    </p>
                  </div>
                </div>
                <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm/6 text-gray-900">В категории <Link href={`/category/${topic.category_id}`} className="text-gray-600 hover:text-gray-800">@{topic.category_name}</Link></p>
                  <p className="mt-1 text-xs/5 text-gray-500">
                    <span className="font-medium">{topic.views}</span> просмотров • <span className="font-medium">{topic.reply_count}</span> ответов
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopTopics;
