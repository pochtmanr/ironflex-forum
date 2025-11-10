import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/UI/RichTextEditor';

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  onImageUpload: (file: File) => Promise<string>;
  initialTitle: string;
  initialContent: string;
}

export const EditTopicModal: React.FC<EditTopicModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onImageUpload,
  initialTitle,
  initialContent
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Update form fields when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
      setError('');
    }
  }, [isOpen, initialTitle, initialContent]);

  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      
      // Handle ESC key to close
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !saving) {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Заголовок не может быть пустым');
      return;
    }
    
    if (!content.trim()) {
      setError('Содержание не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(title.trim(), content.trim());
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать тему</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Title Input */}
          <div className="mb-4">
            <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Введите заголовок темы"
              maxLength={255}
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/255 символов
            </div>
          </div>

          {/* Content Editor */}
          <div className="mb-4">
            <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
              Содержание
            </label>
            <RichTextEditor
              key={initialContent}
              value={content}
              onChange={setContent}
              placeholder="Введите содержание темы..."
              rows={12}
              disabled={saving}
              onImageUpload={onImageUpload}
              className="text-sm text-gray-900 border border-gray-300 rounded-md"
            />
            <div className="text-xs text-gray-500 mt-1">
              Время редактирования темы 2 часа после ее создания. После этого она будет заблокирована и не будет доступна для редактирования.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

