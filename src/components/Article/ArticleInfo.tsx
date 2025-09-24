import React from 'react';

interface Article {
  id: string;
  title: string;
  subheader?: string;
  slug: string;
  content: string;
  mediaLinks: string[];
  coverImageUrl: string;
  authorName: string;
  authorPhotoURL?: string;
  status?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  likes?: number;
  dislikes?: number;
  userVote?: 'like' | 'dislike' | null;
}

interface ArticleInfoProps {
  article: Article;
}

const ArticleInfo: React.FC<ArticleInfoProps> = ({ article }) => {
  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">О статье</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Автор</dt>
            <dd className="mt-1 text-gray-900">{article.authorName || 'Не указан'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Дата публикации</dt>
            <dd className="mt-1 text-gray-900">
              {new Date(article.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
          {article.updated_at !== article.created_at && (
            <div>
              <dt className="font-medium text-gray-500">Обновлено</dt>
              <dd className="mt-1 text-gray-900">
                {new Date(article.updated_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
          )}
          {article.status && (
            <div>
              <dt className="font-medium text-gray-500">Статус</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  article.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.status === 'published' ? 'Опубликовано' : 'Черновик'}
                </span>
              </dd>
            </div>
          )}
          {article.tags && (
            <div className="sm:col-span-2 lg:col-span-1">
              <dt className="font-medium text-gray-500">Теги</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {article.tags}
                </span>
              </dd>
            </div>
          )}
          {article.mediaLinks && article.mediaLinks.length > 0 && (
            <div>
              <dt className="font-medium text-gray-500">Дополнительные материалы</dt>
              <dd className="mt-1 text-gray-900">
                {article.mediaLinks.length} видео
              </dd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ArticleInfo);
