import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../../services/api';

interface TopTopic {
  id: number;
  title: string;
  slug: string;
  user_name: string;
  created_at: string;
  views: number;
  likes: number;
  dislikes: number;
  category_name: string;
  category_slug: string;
  reply_count: number;
  last_activity: string;
}

interface TopTopicsProps {
  limit?: number;
  period?: 'today' | 'week' | 'month' | 'all';
  className?: string;
}

const TopTopics: React.FC<TopTopicsProps> = ({ 
  limit = 5, 
  period = 'today',
  className = '' 
}) => {
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const loadTopTopics = async () => {
    try {
      setLoading(true);
      const response = await forumAPI.getTopTopics(limit, selectedPeriod);
      // Handle both possible response structures
      setTopTopics(response.topics || response.topTopics || []);
    } catch (error) {
      console.error('Error loading top topics:', error);
      setTopTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopTopics();
  }, [selectedPeriod, limit]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Сегодня';
    } else if (diffDays === 2) {
      return 'Вчера';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getPeriodLabel = (periodKey: string) => {
    switch (periodKey) {
      case 'today': return 'Сегодня';
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      case 'all': return 'Всё время';
      default: return 'Сегодня';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white shadow-md ${className}`}>
        <div className="bg-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl font-bold">Последние обсуждения на форуме</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Загрузка популярных тем...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-md ${className}`}>
      {/* Header with period selector */}
      <div className="bg-gray-600 text-white px-4 sm:px-6 py-3 sm:py-4 ">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            
            <h2 className="text-lg sm:text-xl font-bold">Последние обсуждения на форуме</h2>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="text-sm bg-white bg-opacity-20 text-white border border-white border-opacity-30  px-3 py-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              <option value="today" className="text-gray-900">Сегодня</option>
              <option value="week" className="text-gray-900">Неделя</option>
              <option value="month" className="text-gray-900">Месяц</option>
              <option value="all" className="text-gray-900">Всё время</option>
            </select>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="p-4 sm:p-6">
        {!topTopics || topTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Нет активных тем за {getPeriodLabel(selectedPeriod).toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topTopics.map((topic, index) => (
              <Link 
                key={topic.id} 
                to={`/topic/${topic.id}`}
                className="flex items-start gap-4 p-3 hover:bg-blue-50 hover:shadow-md transition-all duration-200 border border-gray-100 rounded-lg cursor-pointer group"
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1 leading-tight">
                    <span className="line-clamp-2">{topic.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {topic.category_name}
                    </span>
                    <span>от {topic.user_name}</span>
                    <span>{formatDate(topic.created_at)}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium text-blue-600">{topic.reply_count}</span>
                      <span>ответов</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{topic.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span>{topic.likes}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        
      </div>
    </div>
  );
};

export default TopTopics;
