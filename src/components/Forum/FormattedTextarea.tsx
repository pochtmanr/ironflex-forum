import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';

interface FormattedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  showFormatting?: boolean;
}

interface FormattedTextareaRef {
  insertMention: (username: string) => void;
  insertFormatting: (format: 'bold' | 'italic' | 'link') => void;
}

const FormattedTextarea = forwardRef<FormattedTextareaRef, FormattedTextareaProps>(({
  value,
  onChange,
  placeholder = "Написать ответ...",
  rows = 3,
  autoFocus = false,
  disabled = false,
  className = "",
  showFormatting = false
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const insertMention = (username: string) => {
    const mention = `@${username} `;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = value.substring(0, start) + mention + value.substring(end);
      onChange(newContent);
      
      // Set cursor position after mention
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + mention.length, start + mention.length);
      }, 0);
    } else {
      onChange(value + mention);
    }
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'link') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let replacement = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'link':
        replacement = selectedText ? `[${selectedText}](url)` : `[текст](url)`;
        cursorOffset = selectedText ? replacement.length - 4 : replacement.length - 4;
        break;
    }
    
    const newContent = value.substring(0, start) + replacement + value.substring(end);
    onChange(newContent);
    
    // Focus and set cursor position
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = start + replacement.length - cursorOffset;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const renderFormattedText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>');
  };

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    insertMention,
    insertFormatting
  }));

  return (
    <div className={`relative ${className}`}>
      {/* Toggle between edit and preview */}
      {showFormatting && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 px-2">
            <button
              type="button"
              onClick={() => insertFormatting('bold')}
              disabled={disabled}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="Жирный текст"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 5a1 1 0 011-1h5.5a2.5 2.5 0 010 5H4v2h4.5a2.5 2.5 0 010 5H4a1 1 0 01-1-1V5zM8 8V6h1.5a.5.5 0 010 1H8zm0 4v-2h1.5a.5.5 0 010 1H8z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('italic')}
              disabled={disabled}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="Курсив"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5a1 1 0 000 2h.5L7 12H6a1 1 0 000 2h4a1 1 0 000-2h-.5L11 7h1a1 1 0 000-2H8z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('link')}
              disabled={disabled}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              title="Ссылка"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                !showPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showPreview ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Превью
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="relative">
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
          />
        ) : (
          <div 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[80px] bg-gray-50"
            style={{ minHeight: `${rows * 1.5}rem` }}
          >
            {value ? (
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderFormattedText(value) }}
              />
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FormattedTextarea.displayName = 'FormattedTextarea';

export default FormattedTextarea;
export type { FormattedTextareaRef };
