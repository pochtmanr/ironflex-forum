import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import EmojiInputEditor, { EmojiInputEditorRef } from './EmojiInputEditor';

interface SimpleReplyFormProps {
  onSubmit: (content: string, uploadedImages: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showFormatting?: boolean;
}

interface SimpleReplyFormRef {
  insertMention: (username: string) => void;
}

const SimpleReplyForm = forwardRef<SimpleReplyFormRef, SimpleReplyFormProps>(({
  onSubmit,
  onCancel,
  placeholder = "Написать ответ...",
  submitLabel = "Ответить",
  isSubmitting = false,
  autoFocus = false,
  className = "",
  size = "small",
  showFormatting = false
}, ref) => {
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const emojiEditorRef = useRef<EmojiInputEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onSubmit(content.trim(), uploadedImages);
    // Clear the editor content properly
    setContent('');
    setUploadedImages([]);
    // Focus back to editor after submission
    setTimeout(() => {
      emojiEditorRef.current?.focus();
    }, 100);
  };

  const handleImageUpload = async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
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
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleImageUpload(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const insertMention = (username: string) => {
    emojiEditorRef.current?.insertMention(username);
  };

  const clearEditor = () => {
    setContent('');
    setUploadedImages([]);
  };

  // Expose insertMention function to parent
  useImperativeHandle(ref, () => ({
    insertMention
  }));

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div 
        className={`w-full mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <EmojiInputEditor
          ref={emojiEditorRef}
          value={content || ''}
          onChange={setContent}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className=""
        />
        
        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={imageUrl} 
                    alt={`Uploaded ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border border-gray-300"
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
          </div>
        )}
        
        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-600 border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Отправка...' : (submitLabel || 'Post comment')}
          </button>
          
          <div className="flex ps-0 space-x-1 rtl:space-x-reverse sm:ps-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Bold */}
            <button
              type="button"
              onClick={() => emojiEditorRef.current?.insertFormatting('bold')}
              className="inline-flex justify-center items-center p-2 text-gray-500 rounded-sm cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
              title="Bold"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
              <span className="sr-only">Bold</span>
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => emojiEditorRef.current?.insertFormatting('italic')}
              className="inline-flex justify-center items-center p-2 text-gray-500 rounded-sm cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
              title="Italic"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
              </svg>
              <span className="sr-only">Italic</span>
            </button>

            {/* Emoji */}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => emojiEditorRef.current?.toggleEmojiPicker(emojiButtonRef.current as HTMLButtonElement)}
              className="inline-flex justify-center items-center p-2 text-gray-500 rounded-sm cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
              title="Emoji"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="sr-only">Emoji</span>
            </button>
            
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="inline-flex justify-center items-center p-2 text-gray-500 rounded-sm cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
              title="Attach file"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 20">
                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M1 6v8a5 5 0 1 0 10 0V4.5a3.5 3.5 0 1 0-7 0V13a2 2 0 0 0 4 0V6"/>
              </svg>
              <span className="sr-only">Attach file</span>
            </button>
            
            {/* Upload image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="inline-flex justify-center items-center p-2 text-gray-500 rounded-sm cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
              title="Upload image"
            >
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
              </svg>
              <span className="sr-only">Upload image</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
});

SimpleReplyForm.displayName = 'SimpleReplyForm';

export default SimpleReplyForm;
export type { SimpleReplyFormRef };
