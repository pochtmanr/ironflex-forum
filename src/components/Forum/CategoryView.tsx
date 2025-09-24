import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forumAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { apiCache } from '../../utils/cache';
import SkeletonLoader from '../UI/SkeletonLoader';

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
  const { categoryId } = useParams<{ categoryId: string }>();
  const { currentUser } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCategoryData = useCallback(async () => {
    if (!categoryId) return;

    try {
      // Check cache first
      const cacheKey = `category-${categoryId}-page-${page}`;
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        console.log('DEBUG: CategoryView - using cached data for', cacheKey);
        setCategory(cachedData.category);
        setTopics(cachedData.topics);
        setTotalPages(cachedData.totalPages);
        setLoading(false);
        return;
      }

      const response = await forumAPI.getCategory(categoryId, page);
      
      // Cache the response for 2 minutes
      const dataToCache = {
        category: response.category,
        topics: response.topics,
        totalPages: response.pagination.pages
      };
      apiCache.set(cacheKey, dataToCache, 2);
      
      setCategory(response.category);
      setTopics(response.topics);
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
  }, [categoryId, page]); // Dependencies for useCallback

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]); // Only depend on the memoized loadCategoryData

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

  // const getTopicIcon = (topic: Topic) => {
  //   if (topic.is_pinned) {
  //     return <img src="/images/f_pinned.svg" alt="Закреплено" className="w-6 h-6" />;
  //   }
  //   if (topic.is_locked) {
  //     return <img src="/images/f_closed.svg" alt="Заблокировано" className="w-6 h-6" />;
  //   }
  //   return <img src="/images/f_norm_no.svg" alt="Обычная тема" className="w-6 h-6" />;
  // };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка категории...</div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Категория не найдена</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-9xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="bg-white shadow-md mb-6">
        <div className="bg-gray-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{category.name}</h1>
            <p className="text-sm text-gray-200 mt-1">{category.description}</p>
          </div>
          {currentUser && (
            <Link
              to={`/create-topic?category=${categoryId}`}
              className="px-4 py-2 text-sm bg-blue-600 text-white  hover:bg-blue-700 transition-colors font-medium"
            >
             + Создать тему
            </Link>
          )}
        </div>

        {/* Topics Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs sm:text-sm">
                
                <th className="px-6 py-3 text-left font-medium">Тема</th>
                <th className="px-6 py-3 text-center font-medium w-24">Ответов</th>
                <th className="px-6 py-3 text-center font-medium w-24">Просмотров</th>
                <th className="px-6 py-3 text-center font-medium w-24">Рейтинг</th>
                <th className="px-6 py-3 text-left font-medium w-24">Последнее сообщение</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonLoader type="topic" count={5} />
              ) : topics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    В этой категории пока нет тем.
                    {currentUser && (
                      <>
                        {' '}
                        <Link to={`/create-topic?category=${categoryId}`} className="text-blue-600 hover:text-blue-700">
                          Создайте первую тему!
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                topics.map((topic, index) => (
                  <tr key={topic.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    
                    <td className="px-6 py-4 ">
                      <div>
                        <Link 
                          to={`/topic/${topic.id}`}
                          className="text-blue-600 text-sm font-semibold hover:text-blue-700 block mb-1"
                        >
                          {topic.title}
                        </Link>
                        <div className="text-gray-500">
                          от <Link 
                            to={`/profile/${topic.user_id}`}
                            className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {topic.user_name}
                          </Link> • {formatDate(topic.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-lg text-gray-800">{topic.reply_count}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-gray-600">{topic.views}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-green-600 text-xs sm:text-sm">+{topic.likes}</span>
                        <span className="text-red-600 text-xs sm:text-sm">-{topic.dislikes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs sm:text-sm">
                        <div className="text-gray-600">{formatDate(topic.last_post_at)}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Страница {page} из {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300  hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CategoryView);
