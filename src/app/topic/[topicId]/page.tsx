'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { forumAPI } from '@/services/api';
import { FileUploadWithPreview } from '@/components/FileUpload';

interface Post {
  id: number | string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  created_at: string;
  likes: number;
  dislikes: number;
  media_links: string[];
  is_author: boolean;
}

interface Topic {
  id: number | string;
  title: string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  category_id: string;
  category_name: string;
  reply_count: number;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  last_post_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  media_links: string[];
  is_author: boolean;
}

const TopicViewPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const topicId = params?.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyMediaLinks, setReplyMediaLinks] = useState<string[]>([]);

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId, page]);

  // Reload topic data when user changes (login/logout)
  useEffect(() => {
    if (topicId && topic) {
      const topicData = {
        ...topic,
        is_author: currentUser && topic.user_id === currentUser.id ? true : false
      };
      setTopic(topicData);
    }
  }, [currentUser]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await forumAPI.getTopic(topicId, page) as { 
        topic: Topic; 
        posts: Post[]; 
        pagination: { pages: number } 
      };
      console.log('Topic data received:', response.topic);
      console.log('Topic media_links:', response.topic.media_links);
      console.log('Topic media_links length:', response.topic.media_links?.length);
      console.log('Posts data received:', response.posts);
      
      // Set is_author based on current user
      const topicData = {
        ...response.topic,
        is_author: currentUser && response.topic.user_id === currentUser.id ? true : false
      };
      
      setTopic(topicData);
      setPosts(response.posts);
      setTotalPages(response.pagination.pages);
    } catch (error: unknown) {
      console.error('Topic loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки темы';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeTopic = async (likeType: 'like' | 'dislike') => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      await forumAPI.likeTopic(topicId, likeType);
      loadTopicData(); // Reload to get updated likes
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при голосовании';
      setError(errorMessage);
    }
  };

  const handleLikePost = async (postId: string, likeType: 'like' | 'dislike') => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      await forumAPI.likePost(postId, likeType);
      loadTopicData(); // Reload to get updated likes
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при голосовании';
      setError(errorMessage);
    }
  };

  const handleDeleteTopic = async () => {
    if (!currentUser || !topic?.is_author) {
      return;
    }

    const confirmed = window.confirm('Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    try {
      await forumAPI.deleteTopic(topicId);
      // Redirect to the category page after successful deletion
      router.push(`/category/${topic.category_id}`);
    } catch (error: unknown) {
      console.error('Topic deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления темы';
      setError(errorMessage);
    }
  };

  const handleReplyFileUpload = (fileUrl: string, filename: string) => {
    console.log('File uploaded successfully:', { fileUrl, filename });
    setReplyMediaLinks(prev => [...prev, fileUrl]);
    console.log('Updated mediaLinks:', [...replyMediaLinks, fileUrl]);
  };

  const removeReplyMediaLink = (index: number) => {
    setReplyMediaLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      setError('Введите текст ответа');
      return;
    }

    setSubmittingReply(true);
    setError('');

    try {
      console.log('Creating post with mediaLinks:', replyMediaLinks);
      await forumAPI.createPost(topicId, replyContent.trim(), replyMediaLinks.length > 0 ? replyMediaLinks : undefined);
      setReplyContent('');
      setReplyMediaLinks([]);
      loadTopicData(); // Reload to show new post
    } catch (error: unknown) {
      console.error('Post creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания ответа';
      setError(errorMessage);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестная дата';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка темы...</div>
        </div>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вернуться на форум
          </button>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Тема не найдена</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href={`/category/${topic.category_id}`} className="text-blue-600 hover:text-blue-700">
              {topic.category_name}
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900 truncate">{topic.title}</li>
        </ol>
      </nav>

      {/* Topic Header */}
      <div className="bg-white shadow-md mb-6">
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-2 text-gray-900">{topic.title}</h1>
              <div className="text-sm text-gray-900">
                <span>от </span>
                <Link 
                  href={`/profile/${topic.user_id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {topic.user_name || 'Unknown'}
                </Link>
                <span> • {formatDate(topic.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-900">
              <span>Ответов: {topic.reply_count}</span>
              <span>Просмотров: {topic.views}</span>
            </div>
          </div>
        </div>

        {/* Topic Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-900">{topic.content}</div>
          </div>
          
          {/* Display topic media links if any */}
          {topic.media_links && topic.media_links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Прикрепленные файлы:</h4>
              <div className="space-y-3">
                {topic.media_links.map((link, linkIndex) => {
                  const filename = link.split('/').pop() || '';
                  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
                  const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(filename);
                  
                  console.log('Topic media link:', { link, filename, isImage, isVideo });
                  
                  return (
                    <div key={linkIndex} className="bg-gray-50 p-3 rounded-lg">
                      {isImage ? (
                        <div className="space-y-2">
                          <img
                            src={link}
                            alt={filename}
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: '400px' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {filename}
                            </a>
                          </div>
                        </div>
                      ) : isVideo ? (
                        <div className="space-y-2">
                          <video
                            src={link}
                            controls
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: '400px' }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          <div className="text-xs text-gray-500">
                            {filename}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1"
                          >
                            {filename}
                          </a>
                          <span className="text-xs text-gray-500 ml-2">
                            {link.includes('bucket.theholylabs.com') ? 'Файл' : 'Ссылка'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Topic Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeTopic('like')}
                className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                disabled={!currentUser}
              >
                <span>👍</span>
                <span>{topic.likes}</span>
              </button>
              <button
                onClick={() => handleLikeTopic('dislike')}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                disabled={!currentUser}
              >
                <span>👎</span>
                <span>{topic.dislikes}</span>
              </button>
            </div>
            
            {topic.is_author && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-900">
                  Вы автор этой темы
                </div>
                <button
                  onClick={handleDeleteTopic}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Удалить тему
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4 mb-6">
        {posts.map((post, index) => (
          <div key={post.id} className="bg-white shadow-md">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/profile/${post.user_id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {post.user_name || 'Unknown'}
                  </Link>
                  <span className="text-sm text-gray-900">
                    #{index + 1} • {formatDate(post.created_at)}
                  </span>
                </div>
                
                {post.is_author && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Автор
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-900">{post.content}</div>
              </div>
              
              {/* Display media links if any */}
              {post.media_links && post.media_links.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Прикрепленные файлы:</h4>
                  <div className="space-y-3">
                    {post.media_links.map((link, linkIndex) => {
                      const filename = link.split('/').pop() || '';
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
                      const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(filename);
                      
                      console.log('Media link:', { link, filename, isImage, isVideo });
                      
                      return (
                        <div key={linkIndex} className="bg-gray-50 p-3 rounded-lg">
                          {isImage ? (
                            <div className="space-y-2">
                              <img
                                src={link}
                                alt={filename}
                                className="max-w-full h-auto rounded border"
                                style={{ maxHeight: '400px' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {filename}
                                </a>
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div className="space-y-2">
                              <video
                                src={link}
                                controls
                                className="max-w-full h-auto rounded border"
                                style={{ maxHeight: '400px' }}
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="text-xs text-gray-500">
                                {filename}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1"
                              >
                                {filename}
                              </a>
                              <span className="text-xs text-gray-500 ml-2">
                                {link.includes('bucket.theholylabs.com') ? 'Файл' : 'Ссылка'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleLikePost(post.id.toString(), 'like')}
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                  disabled={!currentUser}
                >
                  <span>👍</span>
                  <span>{post.likes}</span>
                </button>
                <button
                  onClick={() => handleLikePost(post.id.toString(), 'dislike')}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  disabled={!currentUser}
                >
                  <span>👎</span>
                  <span>{post.dislikes}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {currentUser && !topic.is_locked && (
        <div className="bg-white shadow-md mb-6">
          <div className="bg-gray-600 text-white px-6 py-4">
            <h3 className="text-lg font-bold">Ответить</h3>
          </div>
          
          <form onSubmit={handleSubmitReply} className="p-6">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Введите ваш ответ..."
              required
            />
            
            {/* File Upload for Reply */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Прикрепленные файлы
              </label>
              <FileUploadWithPreview
                onUploadSuccess={handleReplyFileUpload}
                onUploadError={(error) => setError(`Ошибка загрузки файла: ${error}`)}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                maxSize={50}
                uploadType="form"
                multiple={true}
                showPreview={true}
              />
              
              {/* Display uploaded files for reply */}
              {replyMediaLinks.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Загруженные файлы:</h4>
                  <div className="space-y-2">
                    {replyMediaLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-900 truncate">
                          {link.split('/').pop()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeReplyMediaLink(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">
                Используйте разметку Markdown для форматирования текста
              </div>
              <button
                type="submit"
                disabled={submittingReply}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submittingReply ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!currentUser && (
        <div className="bg-white shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            Войдите в аккаунт, чтобы отвечать на сообщения
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Страница {page} из {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicViewPage;
