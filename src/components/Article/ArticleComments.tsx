import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI } from '../../services/firebaseIntegration';
import MediaRenderer from '../Forum/MediaRenderer';
import FormattedText from '../Forum/FormattedText';

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  mediaLinks: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
}

interface ArticleCommentsProps {
  articleId: string;
}

const ArticleComments: React.FC<ArticleCommentsProps> = ({ articleId }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const loadComments = useCallback(async () => {
    if (!articleId) return;
    try {
      setLoading(true);
      const result = await contentAPI.getArticleComments(articleId);
      const transformedComments = (result.comments || []).map((comment: any) => ({
        id: comment.id || '',
        articleId: comment.articleId || '',
        userId: comment.userId || '',
        userName: comment.userName || 'Anonymous',
        userEmail: comment.userEmail || '',
        content: comment.content || '',
        mediaLinks: comment.mediaLinks || [],
        createdAt: comment.createdAt || new Date().toISOString(),
        updatedAt: comment.updatedAt || new Date().toISOString(),
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0
      }));
      setComments(transformedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCommentLike = async (commentId: string, type: 'like' | 'dislike') => {
    if (!currentUser) return;

    try {
      await contentAPI.likeArticleComment(commentId, type);
      // Reload comments to show updated counts
      await loadComments();
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      alert('Пожалуйста, войдите в систему, чтобы оставить комментарий');
      return;
    }

    if (!showCommentForm) {
      setShowCommentForm(true);
      return;
    }

    if (!commentContent.trim()) {
      alert('Пожалуйста, введите текст комментария');
      return;
    }

    try {
      await contentAPI.createArticleComment({
        articleId,
        content: commentContent.trim()
      });

      // Reload comments
      await loadComments();
      
      // Reset form
      setCommentContent('');
      setShowCommentForm(false);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Ошибка при создании комментария. Попробуйте еще раз.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto mt-10 max-w-4xl border-t border-gray-200 pt-10">
        <div className="bg-gray-50 rounded-lg px-6 py-4 mb-6">
          <h2 className="font-medium text-gray-800 flex items-center gap-2 text-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
            </svg>
            Загрузка комментариев...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-4xl border-t border-gray-200 pt-10">
      <div className="bg-gray-50 rounded-lg px-6 py-4 mb-6">
        <h2 className="font-medium text-gray-800 flex items-center gap-2 text-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
          </svg>
          Комментарии ({comments.length})
        </h2>
      </div>
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Пока нет комментариев.</p>
        ) : (
          comments.map((comment, index) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-400 flex items-center justify-center text-white font-bold text-sm shadow-sm rounded-full">
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* User Info Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <h4 className="font-semibold text-gray-900">
                      <Link 
                        to={`/profile/${comment.userId}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {comment.userName}
                      </Link>
                    </h4>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      #{index + 1}
                    </span>
                  </div>
                  
                  {/* Comment Content */}
                  <div className="mb-4">
                    {comment.content && (
                      <FormattedText 
                        content={comment.content} 
                        className="text-gray-700 leading-relaxed"
                      />
                    )}
                    {comment.mediaLinks.length > 0 && (
                      <div className="mt-3">
                        <MediaRenderer mediaLinks={comment.mediaLinks.join('\n')} size="medium" />
                      </div>
                    )}
                  </div>
                  
                  {/* Action Bar */}
                  {currentUser && (
                    <div className="flex items-center space-x-4 text-sm">
                      <button 
                        onClick={() => handleCommentLike(comment.id, 'like')}
                        className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{comment.likes}</span>
                      </button>
                      <button 
                        onClick={() => handleCommentLike(comment.id, 'dislike')}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{comment.dislikes}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Section */}
      {currentUser ? (
        <div className="mt-8 mb-8">
          {!showCommentForm ? (
            <button
              onClick={handleSubmitComment}
              className="w-full flex items-center justify-center space-x-2  text-blue-600 hover:text-blue-700 transition-colors py-4 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">Написать комментарий</span>
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Добавить комментарий</h3>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Введите ваш комментарий..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Отправить
                </button>
                <button
                  onClick={() => {
                    setShowCommentForm(false);
                    setCommentContent('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-3">Войдите, чтобы оставить комментарий</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Войти
          </Link>
        </div>
      )}
    </div>
  );
};

export default React.memo(ArticleComments);
