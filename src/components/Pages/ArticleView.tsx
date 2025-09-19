import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentAPI } from '../../services/api';
import MediaRenderer from '../Forum/MediaRenderer';
import FormattedText from '../Forum/FormattedText';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  media_links: string;
  cover_image_url: string;
  author_user_name: string;
  created_at: string;
  updated_at: string;
}

const ArticleView: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      try {
        const res = await contentAPI.getArticle(slugOrId);
        setArticle(res.article);
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
  if (!article) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8"><div className="text-gray-500">Статья не найдена</div></div>
    );
  }

  return (
    <div className="max-w-9xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
          <li><Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link></li>
          <li className="text-gray-500">/</li>
          <li><Link to="/articles" className="text-blue-600 hover:text-blue-700">Статьи</Link></li>
        </ol>
      </nav>

      <div className="bg-white shadow-md overflow-hidden">
        {/* Cover Image */}
        {article.cover_image_url && (
          <div className="h-64 sm:h-80 bg-gray-200">
            <img 
              src={article.cover_image_url} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="bg-gray-600 text-white px-3 sm:px-6 py-3 sm:py-4">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-200">
            {article.author_user_name && <span>Автор: {article.author_user_name}</span>}
            <span>Опубликовано: {new Date(article.created_at).toLocaleDateString('ru-RU')}</span>
            {article.updated_at !== article.created_at && (
              <span>Обновлено: {new Date(article.updated_at).toLocaleDateString('ru-RU')}</span>
            )}
          </div>
        </div>
        
        <div className="p-3 sm:p-6">
          {(article.content && article.content.includes('<')) ? (
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <FormattedText content={article.content} className="text-base sm:text-lg leading-relaxed" />
          )}
          
          {article.media_links && (
            <div className="mt-6">
              <MediaRenderer mediaLinks={article.media_links} size="large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleView;


