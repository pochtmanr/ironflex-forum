import React from 'react';
import { RichTextEditor } from '@/components/UI/RichTextEditor';
import { QuoteChip } from '@/components/UI/QuoteChip';
import type { QuotedMessage } from '@/components/UI/QuoteChip';

interface ReplyFormProps {
  replyContent: string;
  setReplyContent: (content: string) => void;
  submittingReply: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload: (file: File) => Promise<string>;
  quotedPost?: QuotedMessage | null;
  onDismissQuote?: () => void;
}

export const ReplyForm: React.FC<ReplyFormProps> = React.memo(({
  replyContent,
  setReplyContent,
  submittingReply,
  onSubmit,
  onImageUpload,
  quotedPost,
  onDismissQuote
}) => {
  return (
    <div className="bg-white max-w-4xl mx-auto">
      <h3 className="text-sm font-medium text-gray-900/70 mb-2">Напишите ваш ответ:</h3>

      <form onSubmit={onSubmit} className="p-4">
        {/* Quote chip preview */}
        {quotedPost && onDismissQuote && (
          <QuoteChip quote={quotedPost} onDismiss={onDismissQuote} />
        )}

        {/* Rich Text Editor with built-in image upload */}
        <RichTextEditor
          value={replyContent}
          onChange={setReplyContent}
          placeholder="Введите ваш ответ... (используйте кнопку с изображением для загрузки картинок)"
          rows={6}
          disabled={submittingReply}
          onImageUpload={onImageUpload}
          className="text-sm text-gray-900/70 border-2 border-gray-200/50 rounded-md"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end mt-4 gap-3">
          <button
            type="submit"
            disabled={submittingReply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submittingReply ? 'Отправка...' : 'Отправить ответ'}
          </button>
        </div>
      </form>
    </div>
  );
});
