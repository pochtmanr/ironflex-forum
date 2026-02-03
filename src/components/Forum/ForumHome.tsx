'use client'

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ConversationHub from './ConversationHub';
import { forumAPI } from '../../services/api';
import { MessageCircleIcon, StickyNoteIcon, ShieldCheckIcon, HelpCircleIcon } from 'lucide-react';
import { CreateTopicButton } from '@/components/UI';

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
  section: 'medicine' | 'sport' | null;
  topic_count: number;
  post_count: number;
  last_activity: string | null;
}

const CategoryRow: React.FC<{ category: Category; index: number }> = ({ category, index }) => (
  <Link
    href={`/category/${category.id}`}
    className={`block border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-3 hover:bg-blue-50 active:bg-blue-50 transition-colors`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 pr-3">
        <h3 className="text-blue-600 font-semibold text-sm sm:text-base leading-tight">
          {category.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <StickyNoteIcon className="w-3 h-3" />
          {category.topic_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircleIcon className="w-3 h-3" />
          {category.post_count}
        </span>
      </div>
    </div>
  </Link>
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
      <div className="bg-gray-600 text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-gray-300">{subtitle}</p>}
        </div>
        {showCreateButton && currentUser && <CreateTopicButton />}
      </div>
      <div className="border-l border-r border-b border-gray-100 rounded-b-sm">
        {categories.length > 0 ? (
          categories.map((cat, i) => <CategoryRow key={cat.id} category={cat} index={i} />)
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
          <div key={s} className={`bg-white ${s === 1 ? 'mt-3 sm:mt-6' : 'mt-4'} mb-4`}>
            <div className="bg-gray-600 h-12 rounded-t-sm animate-pulse" />
            {Array.from({ length: s === 1 ? 1 : 3 }).map((_, i) => (
              <div key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-3`}>
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}

        {/* Conversation Hub skeleton */}
        <div className="bg-white mb-4 mt-4">
          <div className="bg-gray-600 h-14 rounded-t-sm animate-pulse" />
          <div className="h-80 bg-gray-50 border-l border-r border-gray-100 flex items-center justify-center">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 sm:px-2 min-h-screen max-w-7xl">

      {/* Section 1: Medicine */}
      <div className="mt-3 sm:mt-6 mb-4">
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
