import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../../services/api';

interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  tags: string;
  created_at: string;
}

const Articles: React.FC = () => {
  const [items, setItems] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contentAPI.getArticles(1, 20);
        setItems(res.articles);
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
          <h1 className="text-xl sm:text-2xl font-bold">Статьи</h1>
        </div>
        <div className="p-3 sm:p-6 space-y-4">
          {loading ? (
            <div className="text-gray-500">Загрузка...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-500">Пока нет статей</div>
          ) : (
            items.map(a => (
              <Link key={a.id} to={`/articles/${a.slug || a.id}`} className="block border border-gray-200 hover:shadow-lg rounded overflow-hidden transition-shadow">
                {a.cover_image_url && (
                  <div className="h-48 bg-gray-200">
                    <img 
                      src={a.cover_image_url} 
                      alt={a.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="font-semibold text-gray-900 text-lg leading-tight">{a.title}</div>
                  <div className="text-sm text-gray-600 mt-2 line-clamp-3">{a.excerpt}</div>
                  <div className="text-xs text-gray-400 mt-3">
                    {new Date(a.created_at).toLocaleDateString('ru-RU')}
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

export default Articles;


