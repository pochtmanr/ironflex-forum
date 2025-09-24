import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { forumAPI } from '../../services/api';
import { contentAPI } from '../../services/firebaseIntegration';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy, limit, where, deleteDoc, doc } from 'firebase/firestore';
import { apiCache } from '../../utils/cache';

interface DashboardStats {
  totalTopics: number;
  totalPosts: number;
  totalUsers: number;
  totalCategories: number;
  totalArticles: number;
  totalTrainings: number;
  recentTopics: any[];
  recentPosts: any[];
  recentArticles: any[];
  recentTrainings: any[];
  topUsers: any[];
}

interface RecentActivity {
  id: string;
  type: 'topic' | 'post' | 'article' | 'training';
  title: string;
  content: string;
  userName: string;
  userEmail: string;
  userId: string; // Add userId to RecentActivity interface
  createdAt: string;
  categoryName?: string;
  topicTitle?: string;
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTopics: 0,
    totalPosts: 0,
    totalUsers: 0,
    totalCategories: 0,
    totalArticles: 0,
    totalTrainings: 0,
    recentTopics: [],
    recentPosts: [],
    recentArticles: [],
    recentTrainings: [],
    topUsers: []
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'topics' | 'posts' | 'articles' | 'trainings' | 'users'>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState<{type: string, id: string, title: string} | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cachedData = apiCache.get('admin-dashboard-data');
      if (cachedData) {
        console.log('DEBUG: Admin dashboard - using cached data');
        setStats(cachedData.stats);
        setRecentActivity(cachedData.recentActivity);
        setLoading(false);
        return;
      }
      
      // Get basic stats from the existing API
      const statsResponse = await forumAPI.getStats();
      
      // Get additional Firebase data - try both with and without filters
      const [categoriesSnap, topicsSnap, postsSnap] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(query(collection(db, 'topics'), orderBy('createdAt', 'desc'), limit(10))),
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(10)))
      ]);

      // Get articles and trainings using the working API
      const [articlesResponse, trainingsResponse] = await Promise.all([
        contentAPI.getArticles(1, 10).catch((err) => {
          console.error('Error loading articles:', err);
          return { articles: [] };
        }),
        contentAPI.getTrainings(1, 10).catch((err) => {
          console.error('Error loading trainings:', err);
          return { trainings: [] };
        })
      ]);

      console.log('DEBUG: Articles response:', articlesResponse);
      console.log('DEBUG: Trainings response:', trainingsResponse);

      const recentTopics = topicsSnap.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          title: data.title || 'Без названия',
          content: data.content || '',
          userName: data.userName || 'Аноним',
          userEmail: data.userEmail || '',
          userId: data.userId || '', // Include userId from topic data
          categoryName: data.categoryName || 'Общее',
          replyCount: data.replyCount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          ...data
        };
      });

      const recentPosts = postsSnap.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          content: data.content || '',
          userName: data.userName || 'Аноним',
          userEmail: data.userEmail || '',
          userId: data.userId || '', // Include userId from post data
          topicTitle: data.topicTitle || 'Unknown Topic',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          ...data
        };
      });

      const recentArticles = articlesResponse.articles.map((article: any) => ({
        id: article.id,
        title: article.title || 'Без названия',
        content: article.content || '',
        userName: article.authorName || 'Аноним',
        userEmail: article.authorEmail || '',
        userId: article.authorId || '',
        views: article.views || 0,
        createdAt: article.created_at || new Date().toISOString(),
        slug: article.slug || article.id
      }));

      const recentTrainings = trainingsResponse.trainings?.map((training: any) => ({
        id: training.id,
        title: training.title || 'Без названия',
        content: training.content || '',
        userName: training.authorName || 'Аноним',
        userEmail: training.authorEmail || '',
        userId: training.authorId || '',
        level: training.level || '',
        durationMinutes: training.durationMinutes || 0,
        views: training.views || 0,
        createdAt: training.created_at || new Date().toISOString(),
        slug: training.slug || training.id
      })) || [];

      // Combine recent activity - use the properly typed topics, posts, articles, and trainings
      const activity: RecentActivity[] = [
        ...recentTopics.map(topic => ({
          id: topic.id,
          type: 'topic' as const,
          title: topic.title,
          content: topic.content,
          userName: topic.userName,
          userEmail: topic.userEmail,
          userId: topic.userId, // Pass userId
          createdAt: topic.createdAt,
          categoryName: topic.categoryName
        })),
        ...recentPosts.map(post => ({
          id: post.id,
          type: 'post' as const,
          title: `Ответ в теме`,
          content: post.content,
          userName: post.userName,
          userEmail: post.userEmail,
          userId: post.userId, // Pass userId
          createdAt: post.createdAt,
          topicTitle: post.topicTitle
        })),
        ...recentArticles.map(article => ({
          id: article.id,
          type: 'article' as const,
          title: article.title,
          content: article.content,
          userName: article.userName,
          userEmail: article.userEmail,
          userId: article.userId,
          createdAt: article.createdAt
        })),
        ...recentTrainings.map(training => ({
          id: training.id,
          type: 'training' as const,
          title: training.title,
          content: training.content,
          userName: training.userName,
          userEmail: training.userEmail,
          userId: training.userId,
          createdAt: training.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

      const statsData = {
        totalTopics: statsResponse.stats.total_topics,
        totalPosts: statsResponse.stats.total_posts,
        totalUsers: statsResponse.stats.total_users,
        totalCategories: categoriesSnap.size,
        totalArticles: articlesResponse.articles.length,
        totalTrainings: trainingsResponse.trainings?.length || 0,
        recentTopics,
        recentPosts,
        recentArticles,
        recentTrainings,
        topUsers: [] // TODO: Implement user statistics
      };

      // Cache the dashboard data for 2 minutes
      const dashboardData = {
        stats: statsData,
        recentActivity: activity
      };
      apiCache.set('admin-dashboard-data', dashboardData, 2);

      setStats(statsData);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    try {
      if (type === 'topic') {
        // Delete topic and mark as inactive
        await deleteDoc(doc(db, 'topics', id));
        
        // Also delete all posts in this topic
        const postsQuery = query(collection(db, 'posts'), where('topicId', '==', id));
        const postsSnap = await getDocs(postsQuery);
        for (const postDoc of postsSnap.docs) {
          await deleteDoc(doc(db, 'posts', postDoc.id));
        }
      } else if (type === 'post') {
        await deleteDoc(doc(db, 'posts', id));
      } else if (type === 'article') {
        await contentAPI.deleteArticle(id);
      } else if (type === 'training') {
        await deleteDoc(doc(db, 'trainings', id));
      }
      
      setDeleteConfirm(null);
      loadDashboardData(); // Refresh data
      
      const typeNames = {
        topic: 'Тема',
        post: 'Пост', 
        article: 'Статья',
        training: 'Тренировка'
      };
      alert(`${typeNames[type as keyof typeof typeNames]} успешно удален(а)`);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Ошибка при удалении');
    }
  };

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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Войдите, чтобы получить доступ к админ-панели</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка админ-панели...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Админ-панель</h1>
        <p className="text-gray-600">Управление форумом и контентом</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <Link
          to="/admin/content"
          className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
        >
          <div className="text-2xl font-bold mb-1">📝</div>
          <div className="font-medium">Создать контент</div>
          <div className="text-sm opacity-90">Статьи и тренировки</div>
        </Link>
        
        <div className="bg-green-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalTopics}</div>
          <div className="font-medium">Тем</div>
          <div className="text-sm opacity-90">Всего в форуме</div>
        </div>
        
        <div className="bg-gray-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalPosts}</div>
          <div className="font-medium">Постов</div>
          <div className="text-sm opacity-90">Всего сообщений</div>
        </div>
        
        <div className="bg-orange-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalUsers}</div>
          <div className="font-medium">Пользователей</div>
          <div className="text-sm opacity-90">Зарегистрировано</div>
        </div>
        
        <div className="bg-indigo-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalArticles}</div>
          <div className="font-medium">Статей</div>
          <div className="text-sm opacity-90">Опубликовано</div>
        </div>
        
        <div className="bg-pink-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-1">{stats.totalTrainings}</div>
          <div className="font-medium">Тренировок</div>
          <div className="text-sm opacity-90">Доступно</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Обзор', icon: '📊' },
            { id: 'topics', label: 'Темы', icon: '💬' },
            { id: 'posts', label: 'Посты', icon: '📝' },
            { id: 'articles', label: 'Статьи', icon: '📰' },
            { id: 'trainings', label: 'Тренировки', icon: '💪' },
            { id: 'users', label: 'Пользователи', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Последняя активность</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.slice(0, 10).map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'topic' ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">T</span>
                        </div>
                      ) : activity.type === 'post' ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm font-medium">P</span>
                        </div>
                      ) : activity.type === 'article' ? (
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 text-sm font-medium">A</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                          <span className="text-pink-600 text-sm font-medium">T</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type === 'topic' ? activity.title : 
                           activity.type === 'post' ? `Ответ в теме: ${activity.topicTitle}` :
                           activity.type === 'article' ? `Статья: ${activity.title}` :
                           `Тренировка: ${activity.title}`}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                          <button
                            onClick={() => setDeleteConfirm({
                              type: activity.type,
                              id: activity.id,
                              title: activity.title
                            })}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        от <Link 
                          to={`/profile/${activity.userId}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {activity.userName}
                        </Link> • {truncateText(activity.content.replace(/<[^>]*>/g, ''), 100)}
                      </p>
                      {activity.categoryName && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {activity.categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика контента</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Категории:</span>
                  <span className="font-medium">{stats.totalCategories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Активные темы:</span>
                  <span className="font-medium">{stats.totalTopics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Всего постов:</span>
                  <span className="font-medium">{stats.totalPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Среднее постов на тему:</span>
                  <span className="font-medium">
                    {stats.totalTopics > 0 ? Math.round(stats.totalPosts / stats.totalTopics) : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Система</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">База данных:</span>
                  <span className="font-medium text-green-600">Firebase ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Хранилище:</span>
                  <span className="font-medium text-green-600">Firebase Storage ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Авторизация:</span>
                  <span className="font-medium text-green-600">Firebase Auth ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Режим:</span>
                  <span className="font-medium text-blue-600">Serverless</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'topics' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Управление темами</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentTopics.map((topic) => (
              <div key={topic.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{topic.title || 'Без названия'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      от {topic.userName || 'Аноним'} • {formatDate(topic.createdAt)} • {topic.replyCount || 0} ответов
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {truncateText((topic.content || '').replace(/<[^>]*>/g, ''), 150)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/topic/${topic.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Просмотр
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm({
                        type: 'topic',
                        id: topic.id,
                        title: topic.title || 'Без названия'
                      })}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'posts' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Управление постами</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      от {post.userName || 'Аноним'} • {formatDate(post.createdAt)}
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {truncateText((post.content || '').replace(/<[^>]*>/g, ''), 200)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm({
                      type: 'post',
                      id: post.id,
                      title: 'пост'
                    })}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'articles' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Управление статьями</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentArticles.map((article) => (
              <div key={article.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{article.title || 'Без названия'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      от {article.userName || 'Аноним'} • {formatDate(article.createdAt)} • {article.views || 0} просмотров
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {truncateText((article.content || '').replace(/<[^>]*>/g, ''), 150)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/articles/${article.slug || article.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Просмотр
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm({
                        type: 'article',
                        id: article.id,
                        title: article.title || 'Без названия'
                      })}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'trainings' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Управление тренировками</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentTrainings.map((training) => (
              <div key={training.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{training.title || 'Без названия'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      от {training.userName || 'Аноним'} • {formatDate(training.createdAt)} • 
                      {training.level && ` ${training.level} уровень`} • 
                      {training.durationMinutes && ` ${training.durationMinutes} мин`} • 
                      {training.views || 0} просмотров
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {truncateText((training.content || '').replace(/<[^>]*>/g, ''), 150)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/trainings/${training.slug || training.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Просмотр
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm({
                        type: 'training',
                        id: training.id,
                        title: training.title || 'Без названия'
                      })}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Пользователи</h2>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 mb-4">Управление пользователями (удаление/блокировка) требует реализации серверной части с использованием Firebase Admin SDK для обеспечения безопасности. На данный момент вы можете просматривать их профили.</p>
            <Link to="/admin/users-list" className="text-blue-600 hover:text-blue-700 font-medium">Просмотреть всех пользователей (будет в след. версии)</Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Подтвердите удаление</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Вы уверены, что хотите удалить {deleteConfirm.type === 'topic' ? 'тему' : 'пост'} "{deleteConfirm.title}"?
                </p>
                {deleteConfirm.type === 'topic' && (
                  <p className="text-sm text-red-600 mt-2">
                    Внимание: это также удалит все ответы в этой теме!
                  </p>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 mr-2"
                >
                  Да, удалить
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
