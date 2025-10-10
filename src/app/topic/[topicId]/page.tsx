'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { forumAPI } from '@/services/api';
import { RichTextEditor } from '@/components/UI/RichTextEditor';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { LoginPrompt } from '@/components/UI/LoginPrompt';

interface Post {
  id: number | string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  user_photo?: string;
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
  user_photo?: string;
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
  
  // Vote tracking
  const [topicVote, setTopicVote] = useState<'like' | 'dislike' | null>(null);
  const [postVotes, setPostVotes] = useState<Record<string, 'like' | 'dislike' | null>>({});

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
        topic: Topic & { user_vote?: 'like' | 'dislike' | null }; 
        posts: (Post & { user_vote?: 'like' | 'dislike' | null })[]; 
        pagination: { pages: number } 
      };
      console.log('Topic data received:', response.topic);
      console.log('Topic media_links:', response.topic.media_links);
      console.log('Topic media_links length:', response.topic.media_links?.length);
      console.log('Posts data received:', response.posts);
      
      // Set is_author based on current user for topic
      // Convert both to strings for comparison to ensure consistency
      const topicUserId = String(response.topic.user_id || '');
      const currentUserId = String(currentUser?.id || '');
      
      const topicData = {
        ...response.topic,
        is_author: currentUser && topicUserId === currentUserId ? true : false
      };
      
      // Set initial vote state from backend
      if (response.topic.user_vote) {
        setTopicVote(response.topic.user_vote);
      }
      
      // Set is_author and vote state based on current user for each post
      const postsData = response.posts.map(post => {
        // Convert both to strings for comparison to ensure consistency
        const postUserId = String(post.user_id || '');
        const currentUserId = String(currentUser?.id || '');
        const isAuthor = currentUser && postUserId === currentUserId;
        console.log('Post author check:', {
          postId: post.id,
          postUserId: postUserId,
          currentUserId: currentUserId,
          isAuthor,
          postUserIdType: typeof post.user_id,
          currentUserIdType: typeof currentUser?.id
        });
        
        // Set initial vote state for this post
        if (post.user_vote) {
          setPostVotes(prev => ({ ...prev, [post.id]: post.user_vote as 'like' | 'dislike' }));
        }
        
        return {
          ...post,
          is_author: isAuthor ? true : false
        };
      });
      
      console.log('Current user full:', currentUser);
      console.log('Posts with is_author:', postsData);
      
      setTopic(topicData);
      setPosts(postsData);
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
      const response = await forumAPI.likeTopic(topicId, likeType) as {
        likes: number;
        dislikes: number;
        userVote: 'like' | 'dislike' | null;
      };
      
      // Update vote state from response
      setTopicVote(response.userVote);
      
      // Update topic counts without reloading
      if (topic) {
        setTopic({
          ...topic,
          likes: response.likes,
          dislikes: response.dislikes
        });
      }
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

    console.log('Liking post:', { postId, likeType, currentUser });
    console.log('Access token in localStorage:', localStorage.getItem('accessToken'));

    try {
      const response = await forumAPI.likePost(postId, likeType) as {
        likes: number;
        dislikes: number;
        userVote: 'like' | 'dislike' | null;
      };
      console.log('Post liked successfully', response);
      
      // Update vote state from response
      setPostVotes(prev => ({ ...prev, [postId]: response.userVote }));
      
      // Update post counts without reloading
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id.toString() === postId 
            ? { ...p, likes: response.likes, dislikes: response.dislikes }
            : p
        )
      );
    } catch (error: unknown) {
      console.error('Like post error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при голосовании';
      
      // If token is invalid, ask user to re-login
      if (errorMessage.includes('token') || errorMessage.includes('Invalid') || errorMessage.includes('Unauthorized')) {
        setError('Ваша сессия истекла. Пожалуйста, войдите снова.');
        alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(errorMessage);
        alert('Ошибка при голосовании: ' + errorMessage);
      }
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

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) {
      return;
    }

    const confirmed = window.confirm('Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    try {
      await forumAPI.deletePost(postId);
      // Reload the page to show updated posts
      loadTopicData();
    } catch (error: unknown) {
      console.error('Post deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления комментария';
      setError(errorMessage);
    }
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

  // Handle image upload for RichTextEditor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    
    const data = await response.json();
    const fileUrl = data.url || data.file_url;
    
    // Don't add to media links - the image will be in the markdown content
    // This prevents duplicate display
    
    return fileUrl;
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
    <div className="mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-2 text-xs sm:text-sm">
          <li>
            <Link href="/" className="text-blue-500 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href={`/category/${topic.category_id}`} className="text-blue-500 hover:text-blue-700">
              {topic.category_name}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-700 truncate">{topic.title}</li>
        </ol>
      </nav>

      {/* Topic Header - Forum Style with User Photo */}
      <div className="bg-white mb-4 sm:mb-6">
        <div className="bg-gray-600 text-white px-2 py-1.5 sm:px-4 sm:py-2">
          <h1 className="text-lg sm:text-xl font-bold mb-3">{topic.title}</h1>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-200">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span><span className="font-medium">{posts.length}</span> {posts.length === 1 ? 'комментарий' : posts.length < 5 ? 'комментария' : 'комментариев'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span><span className="font-medium">{topic.views}</span> {topic.views === 1 ? 'просмотр' : 'просмотров'}</span>
            </div>
          </div>
        </div>

        {/* Topic Content with Author Photo */}
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-white">
          <div className="flex gap-2 sm:gap-3">
            {/* User Photo */}
            <div className="flex-shrink-0">
              <Link href={`/profile/${topic.user_id}`}>
                {topic.user_photo ? (
                  <Image
                    src={topic.user_photo}
                    alt={topic.user_name || 'User'}
                    width={64}
                    height={64}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-600 hover:opacity-80 transition-opacity">
                    {(topic.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {/* Author Name and Date */}
              <div className="mb-2">
                <Link 
                  href={`/profile/${topic.user_id}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-lg sm:text-lg"
                >
                  {topic.user_name || 'Unknown'}
                </Link>
                <span className="text-gray-500 text-sm sm:text-sm ml-2">
                  {formatDate(topic.created_at)}
                </span>
              </div>
              
              {/* Topic Content */}
              <div className="prose max-w-none text-gray-900 text-sm sm:text-base">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({node, ...props}) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={props.src as string}
                        alt={props.alt || ''}
                        className="max-w-full h-auto rounded"
                        style={{ objectFit: 'contain', maxHeight: '400px' }}
                      />
                    ),
                  }}
                >
                  {topic.content}
                </ReactMarkdown>
              </div>
              
              {/* Display topic media links if any */}
              {topic.media_links && topic.media_links.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
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
                          <Image
                            src={link}
                            alt={filename}
                            width={800}
                            height={600}
                            className="max-w-full h-auto rounded border"
                            style={{ objectFit: 'contain', maxHeight: '400px', width: 'auto' }}
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
              
              {/* Topic Actions - Forum Style */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-3">
                <LikeButtonGroup
                  likes={topic.likes}
                  dislikes={topic.dislikes}
                  userVote={topicVote}
                  onLike={handleLikeTopic}
                  disabled={!currentUser}
                  size="md"
                />
                
                {topic.is_author && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      Автор темы
                    </span>
                    <button
                      onClick={handleDeleteTopic}
                      className="px-3 py-1.5 bg-red-600/20 text-white text-xs sm:text-sm rounded hover:bg-red-600/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Удалить тему
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Posts - Forum Style with User Photos */}
      <div className="space-y-4 mb-4 sm:mb-6">
        {posts.map((post, index) => (
          <div key={post.id} className="bg-white border border-gray-200">
            <div className="bg-gray-50 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  #{index + 1}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs sm:text-sm text-gray-600">
                  {formatDate(post.created_at)}
                </span>
                {post.is_author && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                      Автор
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-2 sm:p-3">
              <div className="flex gap-3 sm:gap-4">
                {/* User Photo */}
                <div className="flex-shrink-0">
                  <Link href={`/profile/${post.user_id}`}>
                    {post.user_photo ? (
                      <Image
                        src={post.user_photo}
                        alt={post.user_name || 'User'}
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300 flex items-center justify-center text-sm sm:text-base font-bold text-gray-600 hover:opacity-80 transition-opacity">
                        {(post.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                </div>
                
                {/* Post Content Area */}
                <div className="flex-1 min-w-0">
                  {/* Author Name */}
                  <div className="mb-2">
                    <Link
                      href={`/profile/${post.user_id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800 text-lg sm:text-lg"
                    >
                      {post.user_name || 'Unknown'}
                    </Link>
                  </div>
                  
                  {/* Post Content */}
                  <div className="prose max-w-none text-gray-900 text-sm sm:text-base">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({node, ...props}) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={props.src as string}
                            alt={props.alt || ''}
                            className="max-w-full h-auto rounded"
                            style={{ objectFit: 'contain', maxHeight: '400px' }}
                          />
                        ),
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Display media links if any */}
                  {post.media_links && post.media_links.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
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
                              <Image
                                src={link}
                                alt={filename}
                                width={800}
                                height={600}
                                className="max-w-full h-auto rounded border"
                                style={{ objectFit: 'contain', maxHeight: '400px', width: 'auto' }}
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
                  
                  <div className="flex items-center justify-between gap-3 sm:gap-4 mt-4 pt-3 border-t border-gray-200">
                    <LikeButtonGroup
                      likes={post.likes}
                      dislikes={post.dislikes}
                      userVote={postVotes[post.id.toString()] || null}
                      onLike={(type) => handleLikePost(post.id.toString(), type)}
                      disabled={!currentUser}
                      size="sm"
                    />
                    
                    {currentUser && (post.is_author || topic.is_author) && (
                      <button
                        onClick={() => handleDeletePost(post.id.toString())}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        title={post.is_author ? "Удалить комментарий" : "Удалить комментарий (вы автор темы)"}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form - Forum Style */}
      {currentUser && !topic.is_locked && (
        <div className="bg-white mb-4 sm:mb-6">
          <div className="bg-gray-600 text-white px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="text-base sm:text-lg font-bold">Ответить</h3>
          </div>
          
          <form onSubmit={handleSubmitReply} className="p-4 sm:p-6">
            {/* Rich Text Editor */}
            <RichTextEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Введите ваш ответ..."
              rows={6}
              disabled={submittingReply}
              onImageUpload={handleEditorImageUpload}
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
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mt-4 gap-3">
              <button
                type="submit"
                disabled={submittingReply}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
              >
                {submittingReply ? 'Отправка...' : 'Отправить ответ'}
              </button>
            </div>
            
          </form>
        
        </div>
      )}

      {/* Login Prompt for Non-Authenticated Users - Forum Style */}
      {!currentUser && (
        <LoginPrompt 
          message="Войдите в аккаунт, чтобы отвечать на сообщения"
          buttonText="Войти"
          className="mb-4 sm:mb-6"
        />
      )}

      {/* Pagination - Forum Style */}
      {totalPages > 1 && (
        <div className="bg-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              Страница {page} из {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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

