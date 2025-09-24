import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

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

interface ArticleLikesProps {
  article: Article;
  onLike: (type: 'like' | 'dislike') => void;
}

const ArticleLikes: React.FC<ArticleLikesProps> = ({ article, onLike }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium">Оцените статью:</span>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onLike('like')}
            className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="font-medium text-sm">{article.likes || 0}</span>
          </button>
          <button
            onClick={() => onLike('dislike')}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="font-medium text-sm">{article.dislikes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ArticleLikes);
