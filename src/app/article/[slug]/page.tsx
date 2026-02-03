'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { contentAPI } from '@/services/api';
import { RichTextEditor } from '@/components/UI/RichTextEditor';
import { VideoEmbed, isVideoUrl } from '@/components/UI/VideoEmbed';

interface Article {
  id: string;
  title: string;
  slug: string;
  subheader: string;
  content: string;
  coverImageUrl: string;
  tags: string;
  likes: number;
  views: number;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  user_photo?: string;
  created_at: string;
  likes: number;
  is_author: boolean;
}

const ArticleViewPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const slug = params?.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (slug) {
      loadArticleData();
    }
  }, [slug]);

  const loadArticleData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await contentAPI.getArticleBySlug(slug);
      console.log('Article data received:', response);
      
      setArticle(response.article);
      setComments(response.comments || []);
    } catch (error: unknown) {
      console.error('Error loading article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки статьи';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!commentContent.trim()) {
      setError('Введите текст комментария');
      return;
    }

    setSubmittingComment(true);
    setError('');

    try {
      await contentAPI.createArticleComment(article!.slug, commentContent.trim());
      setCommentContent('');
      loadArticleData(); // Reload to show new comment
    } catch (error: unknown) {
      console.error('Comment creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания комментария';
      setError(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.url || data.file_url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестная дата';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неверная дата';
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
        <div className="animate-pulse mt-20">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Статья не найдена'}
        </div>
        <Link href="/articles" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Вернуться к статьям
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/articles" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Все статьи
        </Link>
      </div>

      {/* Article Header - matching forum design */}
      <article className="bg-white border-2 border-gray-200/50 mb-4 rounded-sm">
        {/* Header section */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {article.title}
          </h1>
          
          {article.subheader && (
            <p className="text-base text-gray-600 mb-3">
              {article.subheader}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(article.created_at)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{article.views}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comments.length}</span>
            </div>
            <span>•</span>
            <span>👍 {article.likes}</span>
          </div>
        </div>

        {/* Content section */}
        <div className="p-4">
          {article.coverImageUrl && (
            <img 
              src={article.coverImageUrl} 
              alt={article.title}
              className="w-full max-h-[400px] object-cover rounded mb-4"
            />
          )}

          {/* Article Content */}
          <div className="prose max-w-none text-gray-900 text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({node, children, ...props}) => {
                  const hasBlockChild = Array.isArray(children)
                    ? children.some(child => typeof child === 'object' && child !== null && 'type' in child && (child as React.ReactElement).type === 'div')
                    : typeof children === 'object' && children !== null && 'type' in children && (children as React.ReactElement).type === 'div';
                  if (hasBlockChild) return <div {...props}>{children}</div>;
                  return <p {...props}>{children}</p>;
                },
                img: ({node, ...props}) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.src as string}
                    alt={props.alt || ''}
                    className="max-w-full h-auto rounded"
                    style={{ objectFit: 'contain', maxHeight: '400px' }}
                  />
                ),
                a: ({node, href, children, ...props}) => {
                  if (href && isVideoUrl(href)) {
                    return <VideoEmbed url={href} />;
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {article.tags && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {article.tags.split(',').map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white border-2 border-gray-200/50 rounded-sm p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Комментарии ({comments.length})
        </h2>

        {/* Comment Form */}
        {currentUser ? (
          <form onSubmit={handleSubmitComment} className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900/70 mb-2">Оставить комментарий</h3>
            <div className="bg-white border border-gray-300 rounded">
              <RichTextEditor
                value={commentContent}
                onChange={setCommentContent}
                placeholder="Напишите ваш комментарий здесь..."
                disabled={submittingComment}
                onImageUpload={handleEditorImageUpload}
                className="min-h-[120px]"
              />
            </div>
            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingComment ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 pb-6 border-b border-gray-200 p-3 bg-gray-50 rounded text-center">
            <p className="text-gray-600 text-sm mb-2">
              Войдите, чтобы оставить комментарий
            </p>
            <Link 
              href="/login"
              className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 py-6 text-sm">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white border-2 border-gray-200/50 mb-4 rounded-sm last:mb-0">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${comment.user_id}`} className="flex-shrink-0">
                      {comment.user_photo ? (
                        <Image
                          src={comment.user_photo}
                          alt={comment.user_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white hover:opacity-80 transition-opacity">
                          {comment.user_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          href={`/profile/${comment.user_id}`}
                          className="text-blue-500 hover:text-blue-700 font-semibold text-base"
                        >
                          {comment.user_name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="prose max-w-none text-gray-900 text-base">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, children, ...props}) => {
                          const hasBlockChild = Array.isArray(children)
                            ? children.some(child => typeof child === 'object' && child !== null && 'type' in child && (child as React.ReactElement).type === 'div')
                            : typeof children === 'object' && children !== null && 'type' in children && (children as React.ReactElement).type === 'div';
                          if (hasBlockChild) return <div {...props}>{children}</div>;
                          return <p {...props}>{children}</p>;
                        },
                        img: ({node, ...props}) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={props.src as string}
                            alt={props.alt || ''}
                            className="max-w-full h-auto rounded"
                            style={{ objectFit: 'contain', maxHeight: '400px' }}
                          />
                        ),
                        a: ({node, href, children, ...props}) => {
                          if (href && isVideoUrl(href)) {
                            return <VideoEmbed url={href} />;
                          }
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" {...props}>
                              {children}
                            </a>
                          );
                        },
                      }}
                    >
                      {comment.content}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      👍 {comment.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleViewPage;

