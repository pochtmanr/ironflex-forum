import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../../services/api';

interface TrainingListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  tags: string;
  level: string;
  duration_minutes: number | null;
  created_at: string;
}

const Trainings: React.FC = () => {
  const [items, setItems] = useState<TrainingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contentAPI.getTrainings(1, 20);
        setItems(res.trainings);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-9xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="bg-white shadow-md">
        <div className="bg-gray-600 text-white px-3 sm:px-6 py-3 sm:py-4 ">
          <h1 className="text-xl sm:text-2xl font-bold">Тренировки</h1>
        </div>
        <div className="p-3 sm:p-6 space-y-4">
          {loading ? (
            <div className="text-gray-500">Загрузка...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-500">Пока нет тренировок</div>
          ) : (
            items.map(t => (
              <Link key={t.id} to={`/trainings/${t.slug || t.id}`} className="block border border-gray-200 hover:shadow-lg rounded overflow-hidden transition-shadow">
                {t.cover_image_url && (
                  <div className="h-48 bg-gray-200">
                    <img 
                      src={t.cover_image_url} 
                      alt={t.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="font-semibold text-gray-900 text-lg leading-tight">{t.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    {t.level && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{t.level}</span>}
                    {t.duration_minutes && <span>{t.duration_minutes} мин</span>}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 line-clamp-3">{t.excerpt}</div>
                  <div className="text-xs text-gray-400 mt-3">
                    {new Date(t.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Trainings;


