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
      <div className="p-3 sm:p-4 min-h-screen max-w-7xl mx-auto">
        <div className="space-y-3 sm:space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="flex">
                {/* Image placeholder */}
                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 animate-pulse" />
                {/* Content */}
                <div className="flex-1 p-3 sm:p-4 min-w-0">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1 hidden sm:block" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse mb-3 hidden sm:block" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-14 bg-blue-50 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
