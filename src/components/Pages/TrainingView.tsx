import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MediaRenderer from '../Forum/MediaRenderer';
import FormattedText from '../Forum/FormattedText';
import { contentAPI } from '../../services/firebaseIntegration';
import { apiCache } from '../../utils/cache';

interface Training {
  id: string;
  title: string;
  subheader?: string;
  slug: string;
  content: string;
  mediaLinks: string[];
  coverImageUrl: string;
  authorName: string;
  status?: string;
  level: string;
  durationMinutes: number | null;
  created_at: string;
  updated_at: string;
}

const TrainingView: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      try {
        // Check cache first
        const cacheKey = `training-${slugOrId}`;
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
          console.log('DEBUG: TrainingView - using cached data for', slugOrId);
          setTraining(cachedData);
          setLoading(false);
          return;
        }

        const response = await contentAPI.getTraining(slugOrId);
        if (response && response.training) {
          // Ensure all required fields are present
          const trainingData = response.training;
          const formattedTraining = {
            id: trainingData.id || '',
            title: trainingData.title || '',
            subheader: trainingData.subheader || '',
            slug: trainingData.slug || '',
            content: trainingData.content || '',
            mediaLinks: trainingData.mediaLinks || [],
            coverImageUrl: trainingData.coverImageUrl || '',
            authorName: trainingData.authorName || '',
            status: trainingData.status || '',
            level: trainingData.level || '',
            durationMinutes: trainingData.durationMinutes || null,
            created_at: trainingData.created_at || new Date().toISOString(),
            updated_at: trainingData.updated_at || new Date().toISOString()
          };

          // Cache for 5 minutes
          apiCache.set(cacheKey, formattedTraining, 5);
          
          setTraining(formattedTraining);
        } else {
          setTraining(null);
        }
      } catch (error) {
        console.error('Error loading training:', error);
        setTraining(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8"><div className="text-gray-500">Загрузка...</div></div>
    );
  }
  if (!training) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8"><div className="text-gray-500">Тренировка не найдена</div></div>
    );
  }

  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link></li>
            <li className="text-gray-500">/</li>
            <li><Link to="/trainings" className="text-blue-600 hover:text-blue-700">Тренировки</Link></li>
          </ol>
        </nav>

        {/* Big Header Section with 200x200 Image on Left */}
        <div className="mx-auto max-w-4xl lg:mx-0">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Header Image - 200x200 max */}
            {training.coverImageUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={training.coverImageUrl} 
                  alt={training.title}
                  className="w-32 h-32 sm:w-48 sm:h-48 lg:w-[200px] lg:h-[200px] object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Header Text */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-4xl lg:text-5xl">
                {training.title}
              </h1>
              {training.subheader && (
                <p className="mt-4 text-lg sm:text-xl leading-8 text-gray-600">
                  {training.subheader}
                </p>
              )}
              
              {/* Training specific badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {training.level && (
                  <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-700/10">
                    {training.level}
                  </span>
                )}
                {training.durationMinutes && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                    ⏱️ {training.durationMinutes} минут
                  </span>
                )}
              </div>

              {/* Author and Date Info */}
              <div className="mt-6 flex items-center gap-x-4">
                <div className="flex items-center gap-x-3">
                  <div className="w-10 h-10 bg-gray-400 flex items-center justify-center text-white font-bold text-sm shadow-sm rounded-full">
                    {training.authorName ? training.authorName.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900">
                      {training.authorName || 'Тренер'}
                    </p>
                    <p className="text-gray-600">
                      {new Date(training.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {training.status && (
                        <span className="ml-2 text-xs text-gray-500">
                          • {training.status === 'published' ? 'Опубликовано' : 'Черновик'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Information Panel */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">О тренировке</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Тренер</dt>
                <dd className="mt-1 text-gray-900">{training.authorName || 'Не указан'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Уровень сложности</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    training.level === 'Начинающий' ? 'bg-green-100 text-green-800' :
                    training.level === 'Средний' ? 'bg-yellow-100 text-yellow-800' :
                    training.level === 'Продвинутый' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {training.level || 'Не указан'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Продолжительность</dt>
                <dd className="mt-1 text-gray-900">
                  {training.durationMinutes ? `${training.durationMinutes} минут` : 'Не указано'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Дата создания</dt>
                <dd className="mt-1 text-gray-900">
                  {new Date(training.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              {training.updated_at !== training.created_at && (
                <div>
                  <dt className="font-medium text-gray-500">Обновлено</dt>
                  <dd className="mt-1 text-gray-900">
                    {new Date(training.updated_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
              )}
              {training.status && (
                <div>
                  <dt className="font-medium text-gray-500">Статус</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      training.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {training.status === 'published' ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-auto max-w-4xl border-t border-gray-200 pt-10">
          <div className="max-w-none">
            {/* Training Content */}
            <div className="prose prose-lg max-w-none mb-8">
              {(training.content && training.content.includes('<')) ? (
                <div dangerouslySetInnerHTML={{ __html: training.content }} />
              ) : (
                <FormattedText content={training.content} className="text-base sm:text-lg leading-relaxed" />
              )}
            </div>

            {/* Video Section - Display after content */}
            {training.mediaLinks && training.mediaLinks.length > 0 && (
              <div className="mt-8 mb-8">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span className="text-lg font-medium text-gray-800">Видео материалы</span>
                  </div>
                  <MediaRenderer mediaLinks={training.mediaLinks.join('\n')} size="large" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingView;


