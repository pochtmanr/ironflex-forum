import React from 'react';
import ArticleCard from './ArticleCard';
import SkeletonLoader from '../UI/SkeletonLoader';

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  subheader: string;
  coverImageUrl: string;
  tags: string;
  created_at: string;
  likes?: number;
  views?: number;
  commentCount?: number;
}

interface ArticlesListProps {
  articles: ArticleListItem[];
  loading: boolean;
}

const ArticlesList: React.FC<ArticlesListProps> = ({ articles, loading }) => {
  if (loading) {
    return (
      <div className="p-4 min-h-screen max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 text-base">Загрузка статей...</div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-4 min-h-screen max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-gray-600 text-lg font-medium mb-2">Пока нет статей</div>
          <p className="text-gray-500 text-sm">Скоро здесь появятся интересные материалы</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 min-h-screen max-w-7xl mx-auto">
      <div className="space-y-3 sm:space-y-4">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(ArticlesList);
