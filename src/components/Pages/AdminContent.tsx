import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI } from '../../services/firebaseIntegration';
import { firebaseAPI } from '../../services/firebaseAPI';
import RichTextEditor from '../Forum/RichTextEditor';
import MediaRenderer from '../Forum/MediaRenderer';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

type Tab = 'articles' | 'trainings';

const AdminContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('articles');
  const [title, setTitle] = useState('');
  const [subheader, setSubheader] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [message, setMessage] = useState<string>('');
  const [mainImage, setMainImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessage('');
  }, [tab]);

  if (!currentUser) {
    return <div className="max-w-3xl mx-auto p-6">Войдите, чтобы управлять контентом</div>;
  }

  const handleImageUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const file = files[0]; // Only take the first file
      if (file && file.type.startsWith('image/')) {
        const result = await firebaseAPI.upload.uploadSingleFile(file);
        setMainImage(result.imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleImageUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = () => {
    setMainImage('');
  };

  const submit = async () => {
    setMessage('');
    const mediaLinks = videoUrl.trim() ? [videoUrl.trim()] : [];
    const payload: any = { 
      title: title.trim(), 
      subheader: subheader.trim(),
      content: content.trim(), 
      status,
      mediaLinks: mediaLinks,
      coverImageUrl: mainImage.trim()
    };
    if (!payload.title || !payload.subheader || !payload.content) return setMessage('Заполните заголовок, подзаголовок и контент');
    
    // Additional validation for trainings
    if (tab === 'trainings') {
      if (!level) return setMessage('Заполните уровень тренировки');
      if (duration === '' || !duration) return setMessage('Заполните длительность тренировки');
      payload.level = level;
      payload.durationMinutes = Number(duration);
    }
    
    try {
      console.log('Creating content with Firebase:', payload);
      
      if (tab === 'articles') {
        const result = await contentAPI.createArticle(payload);
        setMessage(`✅ Статья "${payload.title}" успешно создана!`);
        console.log('Article created:', result);
      } else {
        const result = await contentAPI.createTraining(payload);
        setMessage(`✅ Тренировка "${payload.title}" успешно создана!`);
        console.log('Training created:', result);
      }
      
      // Reset form after successful creation
      setTitle('');
      setSubheader('');
      setContent('');
      setLevel('');
      setDuration('');
      setMainImage('');
      setVideoUrl('');
      
    } catch (e: any) {
      console.error('Content creation error:', e);
      setMessage(`❌ Ошибка: ${e?.message || 'Неизвестная ошибка'}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Admin Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-4 text-sm">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Админ-панель
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">Создание контента</span>
        </nav>
      </div>

      <div className="bg-white shadow">
        <div className="bg-gray-700 text-white px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">Админ: Контент</h1>
          <div className="space-x-2">
            <button onClick={() => setTab('articles')} className={`px-3 py-1 text-sm rounded ${tab==='articles'?'bg-white text-gray-900':'bg-gray-600'}`}>Статьи</button>
            <button onClick={() => setTab('trainings')} className={`px-3 py-1 text-sm rounded ${tab==='trainings'?'bg-white text-gray-900':'bg-gray-600'}`}>Тренировки</button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {message && <div className="text-sm text-green-700 bg-green-50 p-3 rounded">{message}</div>}
          
          {/* Article Form */}
          {tab === 'articles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Создание статьи</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок *</label>
                <input 
                  value={title} 
                  onChange={(e)=>setTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Основной заголовок статьи" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Подзаголовок *</label>
                <input 
                  value={subheader} 
                  onChange={(e)=>setSubheader(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Краткое описание статьи" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Главное изображение</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Загрузка...' : 'Выбрать изображение'}
                  </button>
                  
                  {mainImage && (
                    <div className="relative inline-block">
                      <img 
                        src={mainImage} 
                        alt="Main image"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Видео URL (опционально)</label>
                <input 
                  value={videoUrl} 
                  onChange={(e)=>setVideoUrl(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Контент *</label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Напишите содержание статьи..."
                  rows={12}
                  className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Статус</label>
                <select 
                  value={status} 
                  onChange={(e)=>setStatus(e.target.value)} 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовано</option>
                </select>
              </div>
            </div>
          )}

          {/* Training Form */}
          {tab === 'trainings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Создание тренировки</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Заголовок *</label>
                <input 
                  value={title} 
                  onChange={(e)=>setTitle(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Название тренировки" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Подзаголовок *</label>
                <input 
                  value={subheader} 
                  onChange={(e)=>setSubheader(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Краткое описание тренировки" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Уровень *</label>
                  <select 
                    value={level} 
                    onChange={(e)=>setLevel(e.target.value)} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите уровень</option>
                    <option value="Начинающий">Начинающий</option>
                    <option value="Средний">Средний</option>
                    <option value="Продвинутый">Продвинутый</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Длительность (мин) *</label>
                  <input 
                    value={duration} 
                    onChange={(e)=>setDuration(e.target.value === '' ? '' : Number(e.target.value))} 
                    type="number" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Главное изображение</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Загрузка...' : 'Выбрать изображение'}
                  </button>
                  
                  {mainImage && (
                    <div className="relative inline-block">
                      <img 
                        src={mainImage} 
                        alt="Main image"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Видео URL (опционально)</label>
                <input 
                  value={videoUrl} 
                  onChange={(e)=>setVideoUrl(e.target.value)} 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="https://youtube.com/watch?v=..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Контент *</label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Напишите описание и инструкции для тренировки..."
                  rows={12}
                  className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Статус</label>
                <select 
                  value={status} 
                  onChange={(e)=>setStatus(e.target.value)} 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовано</option>
                </select>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {(content.trim() || mainImage || videoUrl.trim()) && (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium mb-3">Предпросмотр:</label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {mainImage && (
                  <div className="mb-4">
                    <img src={mainImage} alt="Preview" className="w-full max-w-md h-48 object-cover rounded" />
                  </div>
                )}
                {content && (
                  <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: content }} />
                )}
                {videoUrl.trim() && (
                  <MediaRenderer 
                    mediaLinks={videoUrl} 
                    size="medium" 
                  />
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={submit} 
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isUploading ? 'Загрузка...' : (tab === 'articles' ? 'Создать статью' : 'Создать тренировку')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;


