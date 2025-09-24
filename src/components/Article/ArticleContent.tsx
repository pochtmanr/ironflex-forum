import React from 'react';
import MediaRenderer from '../Forum/MediaRenderer';
import FormattedText from '../Forum/FormattedText';

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

interface ArticleContentProps {
  article: Article;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ article }) => {
  return (
    <div className="mx-auto max-w-7xl border-t border-gray-200 pt-10">
      <div className="max-w-none">
        {/* Article Content */}
        <div className="prose prose-lg max-w-none mb-8 mx-8">
          {(article.content && article.content.includes('<')) ? (
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <FormattedText content={article.content} className="text-base sm:text-lg leading-relaxed" />
          )}
        </div>

        {/* Video Section - Display after content */}
        {article.mediaLinks && article.mediaLinks.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-lg font-medium text-gray-800">Дополнительные материалы</span>
              </div>
              <MediaRenderer mediaLinks={article.mediaLinks.join('\n')} size="large" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ArticleContent);
