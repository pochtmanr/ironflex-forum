import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { forumAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import MediaRenderer from './MediaRenderer';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';
import FormattedText from './FormattedText';

interface Category {
  id: number;
  name: string;
  description: string;
}

const CreateTopic: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    categoryId: searchParams.get('category') || '',
    title: '',
    content: '',
    mediaLinks: '' // For YouTube videos, images, etc.
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadCategories();
  }, [currentUser, navigate]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await forumAPI.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Ошибка загрузки категорий');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImagesUploaded = (imageUrls: string[]) => {
    setUploadedImages(prev => [...prev, ...imageUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.categoryId || formData.categoryId === '0') {
      setError('Выберите категорию');
      return;
    }

    if (formData.title.trim().length < 3) {
      setError('Заголовок должен содержать минимум 3 символа');
      return;
    }

    if (formData.content.trim().length < 10) {
      setError('Содержимое должно содержать минимум 10 символов');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://blog.theholylabs.com/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: parseInt(formData.categoryId),
          title: formData.title.trim(),
          content: formData.content.trim(),
          mediaLinks: [...formData.mediaLinks.split('\n').filter(link => link.trim()), ...uploadedImages].join('\n').trim(),
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
          userName: currentUser?.displayName || currentUser?.email?.split('@')[0]
        })
      });

      if (response.ok) {
        const result = await response.json();
        navigate(`/topic/${result.topicId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при создании темы');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('Ошибка при создании темы');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Mobile-Optimized Breadcrumb */}
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
          <li>
            <Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700">Создать тему</li>
        </ol>
      </nav>

      <div className="bg-white shadow-md">
        <div className="bg-gray-600 text-white px-3 sm:px-6 py-3 sm:py-4 ">
          <h1 className="text-xl sm:text-2xl font-bold">Создать новую тему</h1>
          <p className="text-gray-200 mt-1 text-sm sm:text-base">Поделитесь своими мыслями с сообществом</p>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6">
          {error && (
            <div className="bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Category Selection */}
          <div className="mb-6">
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Категория *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              disabled={categoriesLoading}
              className="block w-full px-3 py-3 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {categoriesLoading ? 'Загрузка категорий...' : 'Выберите категорию'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title - Made Bigger */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-base font-medium text-gray-700 mb-3">
              Заголовок темы *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={255}
              className="block w-full px-3 py-3 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-medium"
              placeholder="Введите заголовок темы..."
            />
            <p className="mt-2 text-sm text-gray-500">
              {formData.title.length}/255 символов
            </p>
          </div>

          {/* Content - Rich Text Editor */}
          <div className="mb-6">
            <label className="block text-base font-medium text-gray-700 mb-3">
              Содержимое *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Напишите ваше сообщение... Используйте панель инструментов для форматирования текста."
              rows={10}
              className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              Минимум 10 символов. Текущая длина: {formData.content.length}
            </p>
            <div className="mt-2 text-xs text-gray-400">
              💡 Используйте markdown-синтаксис для форматирования или кнопки на панели инструментов
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Загрузить изображения (необязательно)
            </label>
            <ImageUpload 
              onImagesUploaded={handleImagesUploaded}
              maxImages={5}
              className="mb-4"
            />
          </div>

          {/* Media Links */}
          <div className="mb-6">
            <label htmlFor="mediaLinks" className="block text-sm font-medium text-gray-700 mb-2">
              Дополнительные медиа-ссылки (необязательно)
            </label>
            <textarea
              id="mediaLinks"
              name="mediaLinks"
              value={formData.mediaLinks}
              onChange={handleChange}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Вставьте ссылки на YouTube видео или другие ресурсы (каждая ссылка с новой строки)..."
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="mb-1">Дополнительные поддерживаемые форматы:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>YouTube видео: https://youtube.com/watch?v=... или https://youtu.be/...</li>
                <li>Внешние изображения: ссылки на .jpg, .png, .gif, .webp файлы</li>
                <li>Любые другие ссылки</li>
              </ul>
            </div>
          </div>

          {/* Preview */}
          {(formData.content.trim() || formData.mediaLinks.trim() || uploadedImages.length > 0) && (
            <div className="mb-6">
              <h3 className="text-base font-medium text-gray-700 mb-3">Предварительный просмотр:</h3>
              <div className="border border-gray-200  p-4 bg-white shadow-sm">
                <FormattedText 
                  content={formData.content} 
                  className="text-sm"
                />
                <MediaRenderer 
                  mediaLinks={[...formData.mediaLinks.split('\n').filter(link => link.trim()), ...uploadedImages].join('\n')} 
                  size="medium" 
                />
              </div>
            </div>
          )}

          {/* Mobile-Optimized Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <Link
              to={formData.categoryId ? `/category/${formData.categoryId}` : '/'}
              className="px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300  hover:bg-gray-50 transition-colors text-center touch-manipulation"
            >
              Отмена
            </Link>
            
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="px-6 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              {loading ? 'Создание...' : categoriesLoading ? 'Загрузка...' : 'Создать тему'}
            </button>
          </div>

          {/* Help */}
          <div className="mt-6 p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Советы по созданию хорошей темы:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Используйте понятный и описательный заголовок</li>
              <li>• Предоставьте достаточно деталей в содержимом</li>
              <li>• Выберите подходящую категорию</li>
              <li>• Соблюдайте правила сообщества</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTopic;
