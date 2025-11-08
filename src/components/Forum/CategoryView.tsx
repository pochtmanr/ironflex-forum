'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { contentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import SkeletonLoader from '../UI/SkeletonLoader';
import { NewDiscussionButton, PaginationButton } from '@/components/UI';

interface Topic {
  id: number | string;
  title: string;
  content: string;
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
      
      const response = await contentAPI.getCategory(categoryId, page) as { 
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mx-auto px-4 py-8 min-h-screen max-w-7xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-1 border-blue-600/20 mb-4"></div>
          <div className="text-gray-600 text-base">Загрузка категории...</div>
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
                  className={`block border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4 active:bg-blue-100 transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-blue-600 font-semibold text-base leading-tight flex-1 pr-2">
                      {topic.title}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs text-green-600 font-medium">+{topic.likes}</span>
                      <span className="text-xs text-red-600 font-medium">-{topic.dislikes}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="font-medium text-blue-600">{topic.user_name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(topic.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {topic.reply_count}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {topic.views}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(topic.last_post_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto rounded-b-sm border-b border-l border-r border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-md">
                    <th className="px-4 py-3 text-left font-medium">Тема</th>
                    <th className="px-4 py-3 text-center font-medium w-32">Ответов</th>
                    <th className="px-4 py-3 text-center font-medium w-32">Просмотров</th>
                    <th className="px-4 py-3 text-center font-medium w-24">Рейтинг</th>
                    <th className="px-4 py-3 text-left font-medium w-40">Последний</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, index) => (
                    <tr key={topic.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-4">
                        <Link 
                          href={`/topic/${topic.id}`}
                          className="text-gray-900 text-base font-semibold hover:text-blue-700 block mb-1"
                        >
                          {topic.title}
                        </Link>
                        <div className="text-sm text-gray-500">
                          <Link 
                            href={`/profile/${topic.user_id}`}
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {topic.user_name}
                          </Link>{' '}
                          {new Date(topic.created_at).toLocaleDateString('ru-RU', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-base text-gray-800 font-medium">{topic.reply_count}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-gray-600">{topic.views}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-green-600 text-sm font-medium">+{topic.likes}</span>
                          <span className="text-red-600 text-sm font-medium">-{topic.dislikes}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">{formatDate(topic.last_post_at)}</div>
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
