'use client'

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ConversationHub from './ConversationHub';
import { forumAPI } from '../../services/api';
import { ShieldCheckIcon, HelpCircleIcon } from 'lucide-react';
import { CreateTopicButton } from '@/components/UI';

// Declare adsbygoogle global variable
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface LastTopic {
  id: number | string;
  title: string;
  author: string | null;
  date: string | null;
  content: string | null;
}

interface Category {
  id: number | string;
  name: string;
  description: string;
  slug: string;
  section: 'medicine' | 'sport' | null;
  topic_count: number;
  post_count: number;
  last_activity: string | null;
  last_topic: LastTopic | null;
}

// Format date with relative time for recent dates
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour ago
  if (diffMins < 60) {
    if (diffMins < 1) return 'Только что';
    if (diffMins === 1) return '1 минуту назад';
    if (diffMins < 5) return `${diffMins} минуты назад`;
    return `${diffMins} минут назад`;
  }

  // Less than 24 hours ago
  if (diffHours < 24) {
    if (diffHours === 1) return '1 час назад';
    if (diffHours < 5) return `${diffHours} часа назад`;
    return `${diffHours} часов назад`;
  }

  // Yesterday
  if (diffDays === 1) return 'Вчера';

  // 2-7 days ago
  if (diffDays < 7) {
    if (diffDays < 5) return `${diffDays} дня назад`;
    return `${diffDays} дней назад`;
  }

  // Older than a week - show date
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const CategoryRow: React.FC<{ category: Category; index: number }> = ({ category, index }) => (
  <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
    {/* Category name and description */}
    <td className="px-4 py-3 border-b border-gray-100">
      <Link href={`/category/${category.id}`} className="block">
        <h3 className="text-blue-600 font-semibold text-sm sm:text-base leading-tight hover:underline">
          {category.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
      </Link>
    </td>

    {/* Latest topic */}
    <td className="px-3 py-3 border-b border-gray-100 bg-gray-50/70 hidden md:table-cell max-w-[200px]">
      {category.last_topic ? (
        <Link href={`/topic/${category.last_topic.id}`} className="block">
          <div className="text-sm text-gray-800 font-medium truncate hover:text-blue-600 hover:underline">
            {category.last_topic.title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            Автор: {category.last_topic.author || 'Неизвестен'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatDate(category.last_topic.date)}
          </div>
        </Link>
      ) : (
        <span className="text-xs text-gray-400 italic">Нет тем</span>
      )}
    </td>

    {/* Topics count */}
    <td className="px-3 py-3 border-b border-gray-100 text-center hidden sm:table-cell">
      <div className="text-sm font-medium text-gray-700">{category.topic_count}</div>
      <div className="text-xs text-gray-400">Тем</div>
    </td>

    {/* Replies count */}
    <td className="px-3 py-3 border-b border-gray-100 text-center hidden sm:table-cell">
      <div className="text-sm font-medium text-gray-700">{category.post_count}</div>
      <div className="text-xs text-gray-400">Ответов</div>
    </td>
  </tr>
);

interface ForumSectionProps {
  title: string;
  subtitle?: string;
  categories: Category[];
  showCreateButton?: boolean;
}

const ForumSection: React.FC<ForumSectionProps> = ({
  title,
  subtitle,
  categories,
  showCreateButton,
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white rounded-sm overflow-hidden">
      {/* Section header */}
      <div className="bg-gray-600 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-300">{subtitle}</p>}
        </div>
        {showCreateButton && currentUser && <CreateTopicButton />}
      </div>

      {/* Table */}
      <div className="border-l border-r border-b border-gray-100 rounded-b-sm overflow-x-auto">
        {categories.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                <th className="px-4 py-2 text-left font-medium">Раздел</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell w-48">Последняя тема</th>
                <th className="px-3 py-2 text-center font-medium hidden sm:table-cell w-20">Темы</th>
                <th className="px-3 py-2 text-center font-medium hidden sm:table-cell w-20">Ответы</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <CategoryRow key={cat.id} category={cat} index={i} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Нет категорий
          </div>
        )}
      </div>
    </div>
  );
};

const ForumHome: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const adInitialized = useRef(false);

  useEffect(() => {
    loadForumData();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && !adInitialized.current && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        try {
          const adElement = document.querySelector('.adsbygoogle');
          if (window.adsbygoogle && adElement && !adInitialized.current) {
            const hasAd = adElement.getAttribute('data-adsbygoogle-status');
            if (!hasAd) {
              (window.adsbygoogle as unknown[]).push({});
              adInitialized.current = true;
            }
          }
        } catch (error) {
          console.log('AdSense initialization error:', error);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const loadForumData = async () => {
    try {
      const categoriesResponse = await forumAPI.getCategories();
      setCategories((categoriesResponse as { categories: Category[] }).categories || []);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const medicineCategories = categories.filter((c) => c.section === 'medicine');
  const sportCategories = categories.filter((c) => c.section === 'sport');

  if (loading) {
    return (
      <div className="mx-auto px-2 sm:px-2 min-h-screen max-w-7xl">
        {/* Section skeletons */}
        {[1, 2].map((s) => (
          <div key={s} className={`bg-white ${s === 1 ? 'mt-3 sm:mt-6' : 'mt-4'} mb-4 rounded-sm overflow-hidden`}>
            <div className="bg-gray-600 h-14 rounded-t-sm animate-pulse" />
            <div className="border-l border-r border-b border-gray-100">
              {/* Table header skeleton */}
              <div className="bg-gray-100 h-8 animate-pulse" />
              {/* Table rows skeleton */}
              {Array.from({ length: s === 1 ? 1 : 3 }).map((_, i) => (
                <div key={i} className={`flex items-center border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-3`}>
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="hidden md:block w-40 bg-gray-50/70 px-3 py-2 mr-4">
                    <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-2 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                    <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="hidden sm:flex gap-6 px-4">
                    <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" />
                    <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Conversation Hub skeleton */}
        <div className="bg-white mb-4 mt-4 rounded-sm overflow-hidden">
          <div className="bg-gray-600 h-14 rounded-t-sm animate-pulse" />
          <div className="h-80 bg-gray-50 border-l border-r border-b border-gray-100 flex items-center justify-center">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 sm:px-2 min-h-screen max-w-7xl mt-3 sm:mt-6">



      {/* Section 1: Medicine */}
      <div className="mb-4">
        <ForumSection
          title="Медицина"
          subtitle="Здоровье и спортивная медицина"
          categories={medicineCategories}
        />
      </div>

      {/* Section 2: Sport (3 sub-categories) */}
      <div className="mb-4">
        <ForumSection
          title="Спорт"
          subtitle="Питание, тренировки, фармакология"
          categories={sportCategories}
        />
      </div>

      {/* Section 3: Conversation Hub */}
      <ConversationHub className="mb-4" />

      {/* Info links */}
      <div className="mb-6 flex items-center justify-center gap-4 text-sm text-gray-500">
        <Link href="/administration" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          Администрация
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/faq" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <HelpCircleIcon className="w-3.5 h-3.5" />
          FAQ
        </Link>
      </div>
    </div>
  );
};

export default React.memo(ForumHome);
