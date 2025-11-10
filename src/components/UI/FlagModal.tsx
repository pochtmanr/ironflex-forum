import React, { useState, useEffect } from 'react';

interface FlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  postAuthor?: string;
}

export const FlagModal: React.FC<FlagModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  postAuthor
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Пожалуйста, укажите причину жалобы');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Причина должна содержать минимум 10 символов');
      return;
    }

    onSubmit(reason.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Пожаловаться на комментарий</h2>
          {postAuthor && (
            <p className="text-sm text-gray-600 mt-1">
              Комментарий от: <strong>{postAuthor}</strong>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Причина жалобы *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Опишите, почему этот комментарий нарушает правила..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                {reason.length}/500 символов
              </div>
              {error && (
                <div className="text-xs text-red-600">{error}</div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-yellow-800">
                Жалоба будет отправлена администратору для рассмотрения. Пожалуйста, указывайте только обоснованные причины.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Отправить жалобу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

