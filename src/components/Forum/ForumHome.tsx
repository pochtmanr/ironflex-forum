'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import TopTopics from './TopTopics';
import { forumAPI } from '../../services/api';
import { FileIcon, MessageCircleIcon, StickyNoteIcon, UserIcon, StickyNoteIcon as EyeIcon } from 'lucide-react';
import { CreateTopicButton, LinkButton } from '@/components/UI';

// Declare adsbygoogle global variable
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface Category {
  id: number | string;
  name: string;
  description: string;
  slug: string;
  topic_count: number;
  post_count: number;
  last_activity: string | null;
}

interface ForumStats {
  total_topics: number;
  total_posts: number;
  total_users: number;
  latest_username: string | null;
}

const ForumHome: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  // Removed onlineUsers state - not tracking real-time online users
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const adInitialized = useRef(false);

  useEffect(() => {
    loadForumData();
  }, []);

  useEffect(() => {
    // Initialize AdSense ad when component mounts - only in production
    if (process.env.NODE_ENV === 'production' && !adInitialized.current && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          // Check if AdSense is loaded and the ad element exists
          const adElement = document.querySelector('.adsbygoogle');
          if (window.adsbygoogle && adElement && !adInitialized.current) {
            // Only push if the element doesn't already have an ad
            const hasAd = adElement.getAttribute('data-adsbygoogle-status');
            if (!hasAd) {
              (window.adsbygoogle as unknown[]).push({});
              adInitialized.current = true;
            }
          }
        } catch (error) {
          console.log('AdSense initialization error:', error);
        }
      }, 1500); // Wait a bit longer for the script to fully load

      return () => clearTimeout(timer);
    }
  }, []);

  const loadForumData = async () => {
    try {
      const [categoriesResponse, statsResponse] = await Promise.all([
        forumAPI.getCategories(),
        forumAPI.getStats()
      ]);

      setCategories((categoriesResponse as { categories: Category[] }).categories || []);
      setStats((statsResponse as { stats: ForumStats }).stats || null);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Memoized components to reduce re-renders
  const CategoryMobile = useMemo(() => {
    const CategoryMobileComponent = ({ category, index }: { category: Category; index: number }) => (
    <Link 
      href={`/category/${category.id}`}
      key={category.id} 
      className={`block border-b border-1 border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4 active:bg-blue-50 transition-colors`}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-blue-600 font-semibold text-base leading-tight flex-1 pr-1">
          {category.name}
        </h3>
        <div className="flex items-center space-x-3 flex-shrink-0 text-xs text-gray-500">
          <div className="text-center">
            <div className="text-xs">
              <FileIcon className="w-3 h-3 inline-block mr-1" />
              {category.topic_count}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs">
              <MessageCircleIcon className="w-3 h-3 inline-block mr-1" />
              {category.post_count * -1}
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 leading-snug">{category.description}</p>
    </Link>
    );
    CategoryMobileComponent.displayName = 'CategoryMobile';
    return CategoryMobileComponent;
  }, []);

  const CategoryDesktop = useMemo(() => {
    const CategoryDesktopComponent = ({ category, index }: { category: Category; index: number }) => (
    <tr key={category.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
      <td className="px-4 py-4">
        <Link href={`/category/${category.id}`} className="text-blue-500 text-md font-semibold hover:text-blue-700 block mb-1">
          {category.name}
        </Link>
        <span className="text-gray-600 text-sm">{category.description}</span>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="text-lg text-gray-800 mx-2">
          <StickyNoteIcon className="w-3 h-3 inline-block mr-1" />
          {category.topic_count}
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="text-lg text-gray-800 mx-2">
          <MessageCircleIcon className="w-3 h-3 inline-block mr-1" />
          {category.post_count * -1}
        </div>
      </td>
      
    </tr>
    );
    CategoryDesktopComponent.displayName = 'CategoryDesktop';
    return CategoryDesktopComponent;
  }, []);

  if (loading) {
    return (
      <div className="mx-auto px-4 py-8 min-h-screen">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-1 border-blue-600/20 mb-4"></div>
          <div className="text-gray-600 text-base">Загрузка форума...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 sm:px-2 min-h-screen max-w-7xl">

      {/* Mobile-Optimized Main Forum Categories */}
      <div className="bg-white mb-4 sm:mb-6 mt-3 sm:mt-6">
        <div className="bg-gray-600 text-white px-3 rounded-t-sm sm:px-4 py-3 sm:py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-xl font-bold mb-1">Форум</h1>
            {stats && (
              <div className="text-xs text-gray-200 flex flex-wrap gap-x-3 gap-y-1">
                <span className="flex items-center">
                  <StickyNoteIcon className="w-3 h-3 inline-block mr-1" />
                  {stats.total_topics} обсуждений
                </span>
                <span className="flex items-center">
                  <MessageCircleIcon className="w-3 h-3 inline-block mr-1" />
                  {stats.total_posts} комментариев
                </span>
                <span className="flex items-center">
                  <UserIcon className="w-3 h-3 inline-block mr-1" />
                  {stats.total_users} пользователей
                </span>
              </div>
            )}
          </div>
          {currentUser && <CreateTopicButton />}
        </div>
        
        {/* Mobile-first responsive design */}
        {/* Mobile Layout (below sm breakpoint) */}
        <div className="block sm:hidden">
          {categories.map((category, index) => (
            <CategoryMobile key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Desktop Layout (sm breakpoint and above) */}
        <div className="hidden sm:block overflow-x-auto rounded-b-sm border-b border-l border-r border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-md">
                <th className="px-4 py-3 text-left font-medium">Категория</th>
                <th className="px-4 py-3 text-center font-medium w-24">Обсуждений</th>
                <th className="px-4 py-3 text-center font-medium w-24">Комментариев</th>
                
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <CategoryDesktop key={category.id} category={category} index={index} />
              ))}
            </tbody>
          </table>
        </div>
        {!loading && categories.length === 0 && (
          <div className="text-center py-8 text-gray-500 flex flex-col gap-4 w-full">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm sm:text-base">Нет категорий.</p>
            <div className="flex justify-center w-full">
              <LinkButton 
                href="/create-topic"
                 variant="primary"
              >
                Создать первое обсуждение
              </LinkButton>
            </div>
          </div>
        
        )} 
      </div>

      {/* Mobile-Optimized Call to Action for Non-Logged In Users */}
      {!currentUser && (
        <div className="bg-gradient-to-br from-blue-50/20 to-white  sm:mx-0 p-6 mb-4 sm:mb-6 text-center rounded-sm shadow-sm border-1 border-gray-100 ">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Присоединяйтесь к обсуждению</h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              Зарегистрируйтесь или войдите, чтобы создавать темы и участвовать в жизни сообщества
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <LinkButton href="/register" variant="primary">
              Регистрация
            </LinkButton>
            <LinkButton href="/login" variant="secondary">
              Вход
            </LinkButton>
          </div>
        </div>
      )}

      {/* Top Topics Section */}
      <TopTopics limit={5} period="day" className="mb-6" />
      
    </div>
  );
};

export default React.memo(ForumHome);