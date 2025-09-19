import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  joinDate: Date;
  postCount: number;
  topicCount: number;
  lastActive?: Date;
}

interface RecentActivity {
  id: string;
  type: 'topic' | 'post';
  title: string;
  content: string;
  createdAt: Date;
  categoryName?: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'topics' | 'about'>('about');

  // If no userId in URL, show current user's profile
  const profileUserId = userId || currentUser?.uid;
  const isOwnProfile = currentUser?.uid === profileUserId;

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    if (!profileUserId) return;

    try {
      // For now, we'll use Firebase Auth data and mock the rest
      // In a real app, you'd fetch from Firestore
      const mockProfile: UserProfileData = {
        uid: profileUserId,
        email: currentUser?.email || 'user@example.com',
        displayName: currentUser?.displayName || 'Пользователь',
        photoURL: currentUser?.photoURL || undefined,
        bio: 'Увлекаюсь бодибилдингом и здоровым образом жизни.',
        joinDate: new Date(currentUser?.metadata.creationTime || Date.now()),
        postCount: 42,
        topicCount: 5,
        lastActive: new Date()
      };

      setProfile(mockProfile);

      // Mock recent activity
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'topic',
          title: 'Вопрос о протеине для новичков',
          content: 'Какой протеин лучше выбрать для начинающих?',
          createdAt: new Date(Date.now() - 86400000),
          categoryName: 'Спортивное питание'
        },
        {
          id: '2',
          type: 'post',
          title: 'Re: Программа тренировок на массу',
          content: 'Отличная программа! Я добавил бы еще упражнения на трицепс...',
          createdAt: new Date(Date.now() - 172800000),
          categoryName: 'Тренировки'
        }
      ];

      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка профиля...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Пользователь не найден</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg">
          {isOwnProfile && (
            <Link
              to="/settings"
              className="absolute top-4 right-4 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Настройки
            </Link>
          )}
        </div>
        
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5">
            <div className="-mt-12 sm:-mt-16">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold">
                  {getInitials(profile.displayName)}
                </div>
              )}
            </div>
            
            <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-between sm:space-x-6 sm:pb-1">
              <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-gray-500">@{profile.email.split('@')[0]}</p>
              </div>
              
              {isOwnProfile && (
                <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <Link
                    to="/settings/profile"
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Редактировать профиль
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden sm:block md:hidden mt-6 min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {profile.displayName}
            </h1>
            <p className="text-sm text-gray-500">@{profile.email.split('@')[0]}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="border-t border-gray-200 bg-gray-50 grid grid-cols-3 divide-x divide-gray-200">
          <div className="px-6 py-3 text-center">
            <div className="text-2xl font-semibold text-gray-900">{profile.topicCount}</div>
            <div className="text-sm text-gray-500">Тем</div>
          </div>
          <div className="px-6 py-3 text-center">
            <div className="text-2xl font-semibold text-gray-900">{profile.postCount}</div>
            <div className="text-sm text-gray-500">Сообщений</div>
          </div>
          <div className="px-6 py-3 text-center">
            <div className="text-sm font-medium text-gray-900">{formatDate(profile.joinDate)}</div>
            <div className="text-sm text-gray-500">Регистрация</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'about'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              О пользователе
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'topics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Темы
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Сообщения
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">О себе</h3>
                <p className="text-gray-700">{profile.bio || 'Пользователь пока не рассказал о себе.'}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Информация</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Последняя активность</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {profile.lastActive ? formatDate(profile.lastActive) : 'Нет данных'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Последние темы</h3>
              {recentActivity
                .filter(item => item.type === 'topic')
                .map(activity => (
                  <div key={activity.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <h4 className="font-medium text-gray-900 hover:text-blue-600">
                      <Link to={`/topic/${activity.id}`}>{activity.title}</Link>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.content}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-2">
                      <span>{activity.categoryName}</span>
                      <span>•</span>
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                ))}
              {recentActivity.filter(item => item.type === 'topic').length === 0 && (
                <p className="text-gray-500">Пользователь пока не создавал темы.</p>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Последние сообщения</h3>
              {recentActivity
                .filter(item => item.type === 'post')
                .map(activity => (
                  <div key={activity.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <h4 className="font-medium text-gray-900 hover:text-blue-600">
                      <Link to={`/topic/${activity.id}`}>{activity.title}</Link>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.content}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-2">
                      <span>{activity.categoryName}</span>
                      <span>•</span>
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                ))}
              {recentActivity.filter(item => item.type === 'post').length === 0 && (
                <p className="text-gray-500">Пользователь пока не оставлял сообщения.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
