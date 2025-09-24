import React from 'react';
import { Link } from 'react-router-dom';

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

interface ArticleHeaderProps {
  article: Article;
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({ article }) => {
  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link></li>
            <li className="text-gray-500">/</li>
            <li><Link to="/articles" className="text-blue-600 hover:text-blue-700">Статьи</Link></li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700">
              {article.title.length > 10 ? `${article.title.substring(0, 12)}..` : article.title}
            </li>
          </ol>
        </nav>

        {/* Big Header Section with 200x200 Image on Left */}
        <div className="mx-auto max-w-4xl lg:mx-0">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Header Image - 200x200 max */}
            {article.coverImageUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={article.coverImageUrl} 
                  alt={article.title}
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
                {article.title}
              </h1>
              {article.subheader && (
                <p className="mt-4 text-lg sm:text-xl leading-8 text-gray-600">
                  {article.subheader}
                </p>
              )}
              
              {/* Tags */}
              {article.tags && (
                <div className="mt-4">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    {article.tags}
                  </span>
                </div>
              )}

              {/* Author and Date Info */}
              <div className="mt-6 flex items-center gap-x-4">
                <div className="flex items-center gap-x-4">
                  {/* Author Photo */}
                  <div className="relative">
                    {article.authorPhotoURL ? (
                      <img 
                        src={article.authorPhotoURL} 
                        alt={article.authorName}
                        className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-white"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg rounded-full ring-2 ring-white ${article.authorPhotoURL ? 'hidden' : ''}`}>
                      {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'A'}
                    </div>
                  </div>
                  
                  {/* Author Info */}
                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900 text-base">
                      {article.authorName || 'Автор'}
                    </p>
                    <p className="text-gray-600 flex items-center gap-2">
                      
                      {new Date(article.created_at).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ArticleHeader);
