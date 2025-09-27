'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  postCount: number;
  topicCount: number;
}

interface Topic {
  id: string;
  title: string;
  category: {
    name: string;
    slug: string;
  };
  created_at: string;
  replies_count: number;
}

const UserProfile: React.FC = () => {
  const params = useParams();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // In a real app, you would have an API endpoint like /api/users/[userId]
      // For now, we'll show a placeholder
      setLoading(false);
      setError('Профиль пользователя временно недоступен');
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Ошибка загрузки профиля');
      setLoading(false);
    }
  };

  const getUserInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка профиля...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white shadow-md rounded-lg p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                {user ? getUserInitials(user) : 'U'}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.displayName || user?.username || 'Пользователь'}
            </h1>
            {user?.displayName && (
              <p className="text-lg text-gray-600 mb-2">@{user.username}</p>
            )}
            {user?.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">Регистрация:</span>{' '}
                {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('ru-RU') : 'Неизвестно'}
              </div>
              <div>
                <span className="font-medium">Тем:</span> {user?.topicCount || 0}
              </div>
              <div>
                <span className="font-medium">Сообщений:</span> {user?.postCount || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Topics */}
      <div className="bg-white shadow-md rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Темы пользователя</h2>
        </div>
        
        {userTopics.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {userTopics.map((topic) => (
              <div key={topic.id} className="px-6 py-4 hover:bg-gray-50">
                <Link
                  href={`/topic/${topic.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-lg block mb-2"
                >
                  {topic.title}
                </Link>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>в категории {topic.category.name}</span>
                  <span>{topic.replies_count} ответов</span>
                  <span>{new Date(topic.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            У этого пользователя пока нет созданных тем
          </div>
        )}
      </div>

      {/* Back to Forum */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Вернуться на форум
        </Link>
      </div>
    </div>
  );
};

export default UserProfile;
