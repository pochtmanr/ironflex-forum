'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { forumAPI } from '@/services/api';
import { RichTextEditor } from '@/components/UI/RichTextEditor';
import { LinkButton } from '@/components/UI/Buttons';

interface Category {
  id: number | string;
  name: string;
  description: string;
  slug: string;
}

const CreateTopicContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Get category from URL params
  const categoryFromUrl = searchParams.get('category');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categoryFromUrl && categories.length > 0) {
      setSelectedCategoryId(categoryFromUrl);
    }
  }, [categoryFromUrl, categories]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await forumAPI.getCategories() as { categories: Category[] };
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handle image upload for RichTextEditor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      const fileUrl = data.url || data.file_url;
      
      if (!fileUrl) {
        throw new Error('No file URL returned from upload');
      }
      
      return fileUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(`Ошибка загрузки изображения: ${errorMessage}`);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      setError('Выберите категорию');
      return;
    }
    
    if (!title.trim()) {
      setError('Введите заголовок темы');
      return;
    }
    
    if (!content.trim()) {
      setError('Введите содержимое темы');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Images are now embedded in the markdown content
      await forumAPI.createTopic({
        categoryId: selectedCategoryId,
        title: title.trim(),
        content: content.trim()
      });

      // Redirect to the category page
      router.push(`/category/${selectedCategoryId}`);
    } catch (error: unknown) {
      console.error('Topic creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания темы';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-gray-500">Перенаправление на страницу входа...</div>
        </div>
      </div>
    );
  }

  if (loadingCategories) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-gray-500">Загрузка категорий...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-800/80">
          <li>
            <Link href="/" className="text-gray-800/80 hover:text-gray-800">Форум</Link>
          </li>
          <li className="text-gray-800/80">/</li>
          <li className="text-blue-500">Создать тему</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white">
        <div className="bg-gray-600 text-white px-6 py-4 rounded-t-md">
          <h1 className="text-xl font-bold">Создать новую тему</h1>
          <p className="text-sm text-gray-200 mt-1">
            Создайте новую тему для обсуждения в форуме
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-md">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900/70 mb-2">
              Заголовок *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Введите заголовок"
              maxLength={200}
              required
            />
            <div className="text-xs mt-1 ml-1 text-gray-900/70">
              {title.length}/200 
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-900/70 mb-2">
              Содержимое *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Опишите вашу тему подробно..."
              rows={12}
              disabled={loading}
              onImageUpload={handleEditorImageUpload}
              className="text-sm text-gray-900/70 border-2 border-gray-200/50 rounded-md"
            />
            <div className="text-sm text-gray-500/70 mt-2">
              Обратите внимание что удаление и изменение темы возможно только в течение 2 часов после ее создания.
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200/50 gap-3">
            <LinkButton href="/" variant="secondary">
              Отмена
            </LinkButton>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? 'Создание...' : 'Создать тему'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateTopicPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    </div>}>
      <CreateTopicContent />
    </Suspense>
  );
};

export default CreateTopicPage;
