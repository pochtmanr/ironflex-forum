import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI, tokenManager } from '../../services/api';
import RichTextEditor from '../Forum/RichTextEditor';
import MediaRenderer from '../Forum/MediaRenderer';

type Tab = 'articles' | 'trainings';

const AdminContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('articles');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [message, setMessage] = useState<string>('');
  const [coverImage, setCoverImage] = useState('');
  const [mediaLinks, setMediaLinks] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
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
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const formData = new FormData();
          formData.append('image', file);

          const response = await fetch('https://blog.theholylabs.com/api/upload/image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            setUploadedImages(prev => [...prev, data.imageUrl]);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleImageUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setMessage('');
    const allMediaLinks = [...mediaLinks.split('\n').filter(link => link.trim()), ...uploadedImages].join('\n').trim();
    const payload: any = { 
      title: title.trim(), 
      content: content.trim(), 
      status,
      mediaLinks: allMediaLinks,
      coverImageUrl: coverImage.trim()
    };
    if (!payload.title || !payload.content) return setMessage('Заполните заголовок и контент');
    try {
      // Always refresh Firebase token to ensure we have latest claims
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true); // force refresh
        tokenManager.setTokens(idToken, '');
        console.log('Using fresh Firebase token for admin request');
      }
      
      if (tab === 'articles') {
        await contentAPI.createArticle(payload);
      } else {
        payload.level = level;
        payload.durationMinutes = duration === '' ? null : Number(duration);
        await contentAPI.createTraining(payload);
      }
      setTitle('');
      setContent('');
      setLevel('');
      setDuration('');
      setCoverImage('');
      setMediaLinks('');
      setUploadedImages([]);
      setMessage('✅ Сохранено успешно!');
    } catch (e: any) {
      console.error('Admin API error:', e);
      if (e?.message?.includes('Unauthorized') || e?.message?.includes('Forbidden')) {
        setMessage('❌ Нет прав администратора. Выйдите и войдите заново.');
      } else {
        setMessage(`❌ Ошибка: ${e?.message || 'Неизвестная ошибка'}`);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white shadow">
        <div className="bg-gray-700 text-white px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">Админ: Контент</h1>
          <div className="space-x-2">
            <button onClick={() => setTab('articles')} className={`px-3 py-1 text-sm rounded ${tab==='articles'?'bg-white text-gray-900':'bg-gray-600'}`}>Статьи</button>
            <button onClick={() => setTab('trainings')} className={`px-3 py-1 text-sm rounded ${tab==='trainings'?'bg-white text-gray-900':'bg-gray-600'}`}>Тренировки</button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {message && <div className="text-sm text-green-700">{message}</div>}
          <div>
            <label className="block text-sm mb-1">Заголовок</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Контент</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Напишите контент..."
              rows={12}
              className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Статус</label>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border px-3 py-2">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Обложка (URL изображения)</label>
            <input value={coverImage} onChange={(e)=>setCoverImage(e.target.value)} className="w-full border px-3 py-2" placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label className="block text-sm mb-1">Загрузить изображения</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                {isUploading ? 'Загрузка...' : 'Выбрать файлы'}
              </button>
              {uploadedImages.length > 0 && (
                <span className="text-sm text-gray-600">{uploadedImages.length} изображений загружено</span>
              )}
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {uploadedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Дополнительные медиа (ссылки)</label>
            <textarea 
              value={mediaLinks} 
              onChange={(e)=>setMediaLinks(e.target.value)} 
              rows={3} 
              className="w-full border px-3 py-2" 
              placeholder="YouTube видео, внешние изображения (каждая ссылка с новой строки)"
            />
          </div>

          {tab === 'trainings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Уровень</label>
                <input value={level} onChange={(e)=>setLevel(e.target.value)} className="w-full border px-3 py-2" placeholder="Начинающий, Средний, Продвинутый" />
              </div>
              <div>
                <label className="block text-sm mb-1">Длительность (мин)</label>
                <input value={duration} onChange={(e)=>setDuration(e.target.value === '' ? '' : Number(e.target.value))} type="number" className="w-full border px-3 py-2" />
              </div>
            </div>
          )}

          {/* Preview Section */}
          {(content.trim() || uploadedImages.length > 0 || mediaLinks.trim()) && (
            <div>
              <label className="block text-sm mb-2 font-medium">Предпросмотр контента:</label>
              <div className="border border-gray-200 rounded p-4 bg-gray-50">
                {content && (
                  <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: content }} />
                )}
                {(uploadedImages.length > 0 || mediaLinks.trim()) && (
                  <MediaRenderer 
                    mediaLinks={[...mediaLinks.split('\n').filter(link => link.trim()), ...uploadedImages].join('\n')} 
                    size="medium" 
                  />
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={submit} 
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Загрузка...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;


