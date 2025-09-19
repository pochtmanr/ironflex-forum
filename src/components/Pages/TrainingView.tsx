import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentAPI } from '../../services/api';
import MediaRenderer from '../Forum/MediaRenderer';
import FormattedText from '../Forum/FormattedText';

interface Training {
  id: number;
  title: string;
  slug: string;
  content: string;
  media_links: string;
  cover_image_url: string;
  author_user_name: string;
  created_at: string;
  updated_at: string;
  level: string;
  duration_minutes: number | null;
}

const TrainingView: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      try {
        const res = await contentAPI.getTraining(slugOrId);
        setTraining(res.training);
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
    <div className="max-w-9xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
          <li><Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link></li>
          <li className="text-gray-500">/</li>
          <li><Link to="/trainings" className="text-blue-600 hover:text-blue-700">Тренировки</Link></li>
        </ol>
      </nav>

      <div className="bg-white shadow-md overflow-hidden">
        {/* Cover Image */}
        {training.cover_image_url && (
          <div className="h-64 sm:h-80 bg-gray-200">
            <img 
              src={training.cover_image_url} 
              alt={training.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="bg-gray-600 text-white px-3 sm:px-6 py-3 sm:py-4">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight">{training.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-200 flex-wrap">
            {training.level && <span className="bg-blue-500 px-2 py-1 rounded text-xs">{training.level}</span>}
            {training.duration_minutes && <span>{training.duration_minutes} минут</span>}
            {training.author_user_name && <span>Автор: {training.author_user_name}</span>}
            <span>Опубликовано: {new Date(training.created_at).toLocaleDateString('ru-RU')}</span>
            {training.updated_at !== training.created_at && (
              <span>Обновлено: {new Date(training.updated_at).toLocaleDateString('ru-RU')}</span>
            )}
          </div>
        </div>
        
        <div className="p-3 sm:p-6">
          {(training.content && training.content.includes('<')) ? (
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: training.content }} />
          ) : (
            <FormattedText content={training.content} className="text-base sm:text-lg leading-relaxed" />
          )}
          
          {training.media_links && (
            <div className="mt-6">
              <MediaRenderer mediaLinks={training.media_links} size="large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingView;


