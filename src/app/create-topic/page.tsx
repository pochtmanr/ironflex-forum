'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { forumAPI } from '@/services/api';
import FileUploadWithPreview from '@/components/FileUpload/FileUploadWithPreview';
import '@/components/FileUpload/FileUploadWithPreview.css';

interface Category {
  id: number | string;
  name: string;
  description: string;
  slug: string;
}

const CreateTopicPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaLinks, setMediaLinks] = useState<string[]>([]);
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
      const response = await forumAPI.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Не удалось загрузить категории');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleFileUpload = (fileUrl: string, filename: string) => {
    console.log('File uploaded successfully:', { fileUrl, filename });
    setMediaLinks(prev => [...prev, fileUrl]);
    console.log('Updated mediaLinks:', [...mediaLinks, fileUrl]);
  };

  const removeMediaLink = (index: number) => {
    setMediaLinks(prev => prev.filter((_, i) => i !== index));
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
      console.log('Creating topic with mediaLinks:', mediaLinks);
      await forumAPI.createTopic({
        categoryId: selectedCategoryId,
        title: title.trim(),
        content: content.trim(),
        mediaLinks: mediaLinks.length > 0 ? mediaLinks : undefined
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Перенаправление на страницу входа...</div>
        </div>
      </div>
    );
  }

  if (loadingCategories) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка категорий...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-blue-600 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900">Создать тему</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white shadow-md mb-6">
        <div className="bg-gray-600 text-white px-6 py-4">
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
              Категория *
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок темы *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Введите заголовок темы"
              maxLength={200}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/200 символов
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Содержимое темы *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Опишите вашу тему подробно..."
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Используйте разметку Markdown для форматирования текста
            </div>
          </div>

          {/* File Upload with Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Прикрепленные файлы
            </label>
            <FileUploadWithPreview
              onUploadSuccess={handleFileUpload}
              onUploadError={(error) => setError(`Ошибка загрузки файла: ${error}`)}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              maxSize={50}
              uploadType="form"
              multiple={true}
              showPreview={true}
            />
            
            {/* Display uploaded files */}
            {mediaLinks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Загруженные файлы:</h4>
                <div className="space-y-2">
                  {mediaLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-600 truncate">
                        {link.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMediaLink(index)}
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

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Создание...' : 'Создать тему'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTopicPage;
