
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TopTopics from './TopTopics';

interface Category {
  id: number;
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
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadForumData();
  }, []);

  const loadForumData = async () => {
    try {
      const [categoriesResponse, statsResponse] = await Promise.all([
        forumAPI.getCategories(),
        forumAPI.getStats()
      ]);

      setCategories(categoriesResponse.categories);
      setStats(statsResponse.stats);
      setOnlineUsers(statsResponse.onlineUsers);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Нет сообщений';
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
      <div className="mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="bg-gray-100 p-4 sm:p-6 rounded-lg">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-600">Загрузка форума...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-3 sm:py-6 px-2 sm:px-4">
      {/* Mobile-Optimized Banner Area */}
      <div className="text-center mb-4 sm:mb-6 overflow-hidden">
        <div className="flex justify-center">
          <div className="w-full max-w-[970px] h-[60px] sm:h-[90px] bg-gray-100 flex items-center justify-center text-gray-500 rounded text-xs sm:text-base">
            <span className="block sm:hidden">Рекламный блок 320x60</span>
            <span className="hidden sm:block">Рекламный блок 970x90</span>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Main Forum Categories */}
      <div className="bg-white shadow-md mb-4 sm:mb-6">
        <div className="bg-gray-600 text-white px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">Форум</h1>
            {stats && (
              <div className="text-xs sm:text-sm text-gray-200 mt-1">
                <span className="block sm:hidden">
                  Тем: {stats.total_topics} • Сообщений: {stats.total_posts}
                  <br />
                  Пользователей: {stats.total_users}
                  {onlineUsers > 0 && ` • Онлайн: ${onlineUsers}`}
                </span>
                <span className="hidden sm:block">
                  Тем: {stats.total_topics} • Сообщений: {stats.total_posts} • Пользователей: {stats.total_users}
                  {onlineUsers > 0 && ` • Онлайн: ${onlineUsers}`}
                </span>
              </div>
            )}
          </div>
          {currentUser && (
            <Link
              to="/create-topic"
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white  hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base flex-shrink-0 touch-manipulation"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="block sm:hidden">Создать</span>
              <span className="hidden sm:block">Создать тему</span>
            </Link>
          )}
        </div>
        
        {/* Mobile-first responsive design */}
        {/* Mobile Layout (below sm breakpoint) */}
        <div className="block sm:hidden">
          {categories.map((category, index) => (
            <div key={category.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} p-4 hover:bg-blue-50 transition-colors`}>
              <div className="w-full">
                <Link to={`/category/${category.id}`} className="text-blue-600 font-semibold hover:text-blue-700 block mb-1 text-sm leading-tight">
                  {category.name}
                </Link>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Тем: <strong className="text-gray-700">{category.topic_count}</strong></span>
                    <span>Ответов: <strong className="text-gray-700">{category.post_count}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <img 
                      src="/images/lastpost.svg" 
                      alt="Последнее сообщение" 
                      className="w-3 h-3"
                    />
                    <span className="truncate max-w-[80px]">{formatDate(category.last_activity)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Layout (sm breakpoint and above) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="px-4 py-3 text-left font-medium">Категория</th>
                <th className="px-4 py-3 text-center font-medium w-24">Тем</th>
                <th className="px-4 py-3 text-center font-medium w-24">Ответов</th>
                <th className="px-4 py-3 text-left font-medium w-64">Последнее сообщение</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-4 py-4">
                    <Link to={`/category/${category.id}`} className="text-blue-600 text-sm font-semibold hover:text-blue-700 block mb-1">
                      {category.name}
                    </Link>
                    <span className="text-gray-600">{category.description}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-lg text-gray-800">{category.topic_count}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-lg text-gray-800">{category.post_count}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-start gap-2">
                      <img 
                        src="/images/lastpost.svg" 
                        alt="Последнее сообщение" 
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="text-sm">
                        <div className="text-gray-600">{formatDate(category.last_activity)}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile-Optimized Call to Action for Non-Logged In Users */}
      {!currentUser && (
        <div className="bg-white p-4 sm:p-6 mb-4 sm:mb-6 text-center">
          <h2 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Присоединяйтесь к обсуждению</h2>
          <p className="text-gray-700 mb-8 text-sm sm:text-base">
            Зарегистрируйтесь или войдите в аккаунт, чтобы создавать темы, отвечать на сообщения и участвовать в жизни сообщества.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base touch-manipulation"
            >
              Регистрация
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-blue-600 text-blue-600  hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base touch-manipulation"
            >
              Вход
            </Link>
          </div>
        </div>
      )}

      {/* Top Topics Section */}
      <TopTopics limit={5} period="today" className="mb-6" />

      {/* Mobile-Optimized Quick Actions for Logged In Users */}
      {currentUser && (
        <div className="bg-white p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-green-800 truncate">
                Добро пожаловать, {currentUser.displayName || currentUser.email}!
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                Готовы поделиться своими знаниями или задать вопрос?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
              <Link
                to="/create-topic"
                className="px-4 py-2 sm:py-3 bg-green-800 text-white  hover:bg-green-700 transition-colors font-medium text-sm text-center touch-manipulation"
              >
                Создать тему
              </Link>
              <Link
                to="/profile"
                className="px-4 py-2 sm:py-3 border border-green-800 text-green-800  hover:bg-green-50 transition-colors font-medium text-sm text-center touch-manipulation"
              >
                Мой профиль
              </Link>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ForumHome;