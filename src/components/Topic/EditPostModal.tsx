import React, { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/UI/RichTextEditor';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  onImageUpload: (file: File) => Promise<string>;
  initialContent: string;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onImageUpload,
  initialContent
}) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setError('');
    }
  }, [isOpen, initialContent]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Содержимое не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(content);
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Редактировать комментарий</h2>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900/70 mb-2">
              Содержимое можно редактировать только в течение 2 часов после публикации.
            </label>
            <RichTextEditor
              key={initialContent}
              value={content}
              onChange={setContent}
              placeholder="Введите содержимое комментария..."
              rows={12}
              disabled={saving}
              onImageUpload={onImageUpload}
              className="text-sm text-gray-900/70 border-2 border-gray-200/50 rounded-md"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

