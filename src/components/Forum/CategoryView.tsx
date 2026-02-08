'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { forumAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SkeletonLoader from '../UI/SkeletonLoader';
import { NewDiscussionButton, PaginationButton } from '@/components/UI';

interface LastPost {
  id: string;
  content: string;
  author: string;
  date: string;
}

interface Topic {
  id: number | string;
  title: string;
  content: string | null;
  user_name: string;
  user_email: string;
  user_id: string;
  reply_count: number;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  last_post_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  last_post: LastPost | null;
}

interface Category {
  id: number | string;
  name: string;
  description: string;
  slug: string;
}

const CategoryView: React.FC = () => {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const { currentUser } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCategoryData = useCallback(async () => {
    if (!categoryId) return;

    try {
      setLoading(true);
      
      const response = await forumAPI.getCategory(categoryId, page) as { 
        category: unknown; 
        topics: unknown[]; 
        pagination: { pages: number } 
      };
      
      setCategory(response.category as Category);
      setTopics(response.topics as Topic[]);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Error loading category:', error);
      // If category not found, try to show a helpful message
      if (error instanceof Error && error.message.includes('not found')) {
        setCategory(null);
        setTopics([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, page]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  // Format date with relative time for recent dates
  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="mx-auto px-2 sm:px-4 min-h-screen max-w-7xl">
        {/* Breadcrumb skeleton */}
        <nav className="py-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
            <span className="text-gray-400">/</span>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </nav>

        <div className="bg-white mb-4 sm:mb-6">
          {/* Header skeleton */}
          <div className="bg-gray-600 text-white px-3 rounded-t-sm sm:px-4 py-3 sm:py-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-6 w-40 bg-gray-500 rounded animate-pulse mb-1" />
              <div className="h-3 w-64 bg-gray-500 rounded animate-pulse mt-1" />
            </div>
          </div>

          {/* Mobile skeleton rows */}
          <div className="block sm:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-20 bg-blue-100 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop skeleton rows */}
          <div className="hidden sm:block overflow-x-auto rounded-b-sm border-b border-l border-r border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2 text-left font-medium">Тема</th>
                  <th className="px-3 py-2 text-left font-medium hidden md:table-cell w-48">Последний комментарий</th>
                  <th className="px-3 py-2 text-center font-medium w-20">Ответы</th>
                  <th className="px-3 py-2 text-center font-medium w-24">Просмотры</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-3 py-3 bg-gray-50/70 hidden md:table-cell">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-2 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                      <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                      <div className="h-2 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                      <div className="h-2 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto px-4 py-8 min-h-screen max-w-7xl">
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-gray-600 text-lg font-medium">Категория не найдена</div>
          <Link href="/" className="mt-4 text-gray-600 hover:text-gray-700">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 sm:px-4 min-h-screen max-w-7xl">
      {/* Breadcrumb - Mobile Optimized */}
      <nav className="py-4">
        <ol className="flex items-center space-x-2 text-xs sm:text-sm">
          <li>
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              Форум
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-blue-500 font-medium truncate">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header - Consistent with TopTopics */}
      <div className="bg-white mb-4 sm:mb-6">
        <div className="bg-gray-600 text-white px-3 rounded-t-sm sm:px-4 py-3 sm:py-2 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{category.name}</h1>
            <p className="text-xs text-gray-200 mt-1">{category.description}</p>
          </div>
            {currentUser && (
              <NewDiscussionButton categoryId={categoryId} />
            )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 border-b border-l border-r border-1 border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600/20 mb-4"></div>
            <div className="text-gray-500 text-base">Загрузка тем...</div>
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-b border-l border-r border-1 border-gray-100">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm sm:text-base mb-4">В этой категории пока нет тем.</p>
            {currentUser && (
              <Link 
                href={`/create-topic?category=${categoryId}`} 
                className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создайте первую тему!
              </Link>
            )}
          </div>
        )}

        {!loading && topics.length > 0 && (
          <>
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              {topics.map((topic, index) => (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.id}`}
                  className={`block border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4 active:bg-blue-50 transition-colors`}
                >
                  <h3 className="text-blue-600 font-semibold text-sm leading-tight mb-1">
                    {topic.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="text-blue-600">{topic.user_name}</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(topic.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>{topic.reply_count} ответов</span>
                      <span>{topic.views} просм.</span>
                    </div>
                    <span className="text-gray-400">
                      {formatDate(topic.last_post_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto rounded-b-sm border-b border-l border-r border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-2 text-left font-medium">Тема</th>
                    <th className="px-3 py-2 text-left font-medium hidden md:table-cell w-48">Последний комментарий</th>
                    <th className="px-3 py-2 text-center font-medium w-20">Ответы</th>
                    <th className="px-3 py-2 text-center font-medium w-24">Просмотры</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, index) => (
                    <tr key={topic.id} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {/* Topic title and author */}
                      <td className="px-4 py-3">
                        <Link href={`/topic/${topic.id}`} className="block">
                          <h3 className="text-blue-600 font-semibold text-sm sm:text-base leading-tight hover:underline">
                            {topic.title}
                          </h3>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="text-blue-600">{topic.user_name}</span>
                            <span className="mx-1">•</span>
                            <span>{formatDate(topic.created_at)}</span>
                          </div>
                        </Link>
                      </td>

                      {/* Last comment - shows actual post content */}
                      <td className="px-3 py-3 bg-gray-50/70 hidden md:table-cell max-w-[200px]">
                        {topic.last_post ? (
                          <Link href={`/topic/${topic.id}`} className="block">
                            <div className="text-sm text-gray-800 font-medium line-clamp-1 hover:text-blue-600 hover:underline">
                              {topic.last_post.content.replace(/<img[^>]*>/gi, '<фото>').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/!\[[^\]]*\](\([^)]*\))?/g, '<фото>').trimStart().substring(0, 50)}...
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              Автор: {topic.last_post.author}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {formatDate(topic.last_post.date)}
                            </div>
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Нет ответов</span>
                        )}
                      </td>

                      {/* Replies count */}
                      <td className="px-3 py-3 text-center">
                        <div className="text-sm font-medium text-gray-700">{topic.reply_count}</div>
                        <div className="text-xs text-gray-400">Ответов</div>
                      </td>

                      {/* Views count */}
                      <td className="px-3 py-3 text-center">
                        <div className="text-sm font-medium text-gray-700">{topic.views}</div>
                        <div className="text-xs text-gray-400">Просм.</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600 font-medium">
                Страница {page} из {totalPages}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <PaginationButton
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  direction="prev"
                  className="flex-1 sm:flex-none"
                />
                <PaginationButton
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  direction="next"
                  className="flex-1 sm:flex-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CategoryView);
