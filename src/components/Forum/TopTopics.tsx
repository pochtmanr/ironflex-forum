'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { forumAPI } from '../../services/api';
import { EyeIcon } from 'lucide-react';
import { MessageCircleIcon } from 'lucide-react';

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

  // Mobile component for topics
  const TopicMobile = ({ topic, index }: { topic: TopTopic; index: number }) => (
    <Link 
      href={`/topic/${topic.id}`}
      key={topic.id}
      prefetch={false}
      className={`block border-b border-1 border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4 active:bg-blue-50 transition-colors`}
    >
      <div className="flex items-start gap-3 mb-2">
        {topic.user_photo_url ? (
          <Image 
            src={topic.user_photo_url} 
            alt={topic.user_name || 'Anonymous User'}
            width={40}
            height={40}
            className="size-10 flex-none rounded-full bg-gray-50 object-cover"
          />
        ) : (
          <div className="size-10 flex-none rounded-full bg-gray-400/80 flex items-center justify-center text-white font-bold text-sm">
            {topic.user_name ? topic.user_name.charAt(0).toUpperCase() : 'A'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-blue-600 font-semibold text-base leading-tight mb-1">
            {topic.title.length > 50 ? topic.title.slice(0, 50) + '...' : topic.title}
          </h3>
          
        </div>
        <div className="flex flex-col items-end text-sm  flex-shrink-0 gap-2">
          <div className="flex text-gray-500 items-center gap-2">
            <EyeIcon className="w-3 h-3" />
            <span>{topic.views}</span>

          </div>
          <div className="flex text-gray-500 items-center gap-2">
            <MessageCircleIcon className="w-3 h-3" />
              <span>{topic.reply_count}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
            <span className="text-blue-500 font-medium">{topic.user_name} </span>
         
         в категории <span className="text-blue-500 font-medium">@{topic.category_name}</span>
      </p>
    </Link>
  );

  // Desktop component for topics
  const TopicDesktop = ({ topic, index }: { topic: TopTopic; index: number }) => (
    <tr key={topic.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {topic.user_photo_url ? (
            <Image 
              src={topic.user_photo_url} 
              alt={topic.user_name || 'Anonymous User'}
              width={40}
              height={40}
              className="size-10 flex-none rounded-full bg-gray-50 object-cover"
            />
          ) : (
            <div className="size-10 flex-none rounded-full bg-gray-400/80 flex items-center justify-center text-white font-bold text-sm">
              {topic.user_name ? topic.user_name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
          <div className="min-w-0">
            <Link href={`/topic/${topic.id}`} prefetch={false} className="text-blue-500 text-md font-semibold hover:text-blue-700 block mb-1">
              {topic.title}
            </Link>
            <span className="text-gray-600 text-xs">
              от <Link href={`/profile/${topic.user_id}`} className="text-blue-500 hover:text-blue-700 font-medium">@{topic.user_name}</Link>
              {' • '}
              в <Link href={`/category/${topic.category_id}`} className="text-blue-500 hover:text-blue-700 font-medium">@{topic.category_name}</Link>
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="text-lg text-gray-800">
          {topic.views}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="text-lg text-gray-800">
          {topic.reply_count}
        </div>
      </td>
    </tr>
  );

  return (
    <div className={`bg-white mb-4 sm:mb-6 ${className}`}>
      <div className="bg-gray-600 text-white px-3 rounded-t-sm sm:px-4 py-3 sm:py-2 flex items-center justify-between">
        <h3 className="text-xl font-bold">Популярные</h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-1.5 bg-gray-600 border-2 border-gray-400/60 hover:bg-gray-500 rounded-lg text-sm transition-colors shadow-md font-medium"
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
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-1 border-gray-200 z-10">
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 border-b border-l border-r border-1 border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600/20 mb-4"></div>
          <div className="text-gray-500 text-base">Загрузка популярных тем...</div>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-gray-500 border-b border-l border-r border-1 border-gray-100">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {error}
        </div>
      )}

      {!loading && !error && topics.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-b border-l border-r border-1 border-gray-100">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm sm:text-base">Нет популярных обсуждений за выбранный период.</p>
        </div>
      )}

      {!loading && !error && topics.length > 0 && (
        <>
          {/* Mobile Layout (below sm breakpoint) */}
          <div className="block sm:hidden">
            {topics.map((topic, index) => (
              <TopicMobile key={topic.id} topic={topic} index={index} />
            ))}
          </div>

          {/* Desktop Layout (sm breakpoint and above) */}
          <div className="hidden sm:block overflow-x-auto rounded-b-sm border-b border-l border-r border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-md">
                  <th className="px-4 py-3 text-left font-medium">Обсуждение</th>
                  <th className="px-4 py-3 text-center font-medium w-32">Просмотров</th>
                  <th className="px-4 py-3 text-center font-medium w-32">Ответов</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <TopicDesktop key={topic.id} topic={topic} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TopTopics;
