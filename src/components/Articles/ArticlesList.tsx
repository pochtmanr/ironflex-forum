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
      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          <SkeletonLoader type="article" count={6} />
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Пока нет статей</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
};

export default React.memo(ArticlesList);
