import React, { useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Напишите ваше сообщение...',
  rows = 8,
  className = ''
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + textToInsert.length);
      }
      textarea.focus();
    }, 0);
  };

  const formatText = (type: string) => {
    switch (type) {
      case 'bold':
        insertText('**', '**', 'жирный текст');
        break;
      case 'italic':
        insertText('*', '*', 'курсив');
        break;
      case 'h1':
        insertText('\n# ', '', 'Заголовок 1');
        break;
      case 'h2':
        insertText('\n## ', '', 'Заголовок 2');
        break;
      case 'h3':
        insertText('\n### ', '', 'Заголовок 3');
        break;
      case 'quote':
        insertText('\n> ', '', 'цитата');
        break;
      case 'code':
        insertText('`', '`', 'код');
        break;
      case 'codeblock':
        insertText('\n```\n', '\n```\n', 'блок кода');
        break;
      case 'ul':
        insertText('\n- ', '', 'элемент списка');
        break;
      case 'ol':
        insertText('\n1. ', '', 'элемент списка');
        break;
      case 'link':
        insertText('[', '](https://)', 'текст ссылки');
        break;
      case 'hr':
        insertText('\n---\n', '', '');
        break;
    }
  };

  const renderPreview = (text: string) => {
    // Simple markdown-like rendering for preview
    let html = text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-800 mt-4 mb-3">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto my-2"><code>$1</code></pre>')
      // Quotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-2 bg-gray-50 italic">$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="border-t border-gray-300 my-4" />')
      // Line breaks
      .replace(/\n/g, '<br />');

    // Wrap lists
    html = html.replace(/((<li class="ml-4">.*?<\/li>)+)/g, '<ul class="my-2">$1</ul>');
    html = html.replace(/((<li class="ml-4 list-decimal">.*?<\/li>)+)/g, '<ol class="my-2 ml-4">$1</ol>');

    return html;
  };

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
            title="Жирный (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 2h6c2.2 0 4 1.8 4 4 0 1.2-.6 2.3-1.5 3 .9.7 1.5 1.8 1.5 3 0 2.2-1.8 4-4 4H4V2zm2 5h4c1.1 0 2-.9 2-2s-.9-2-2-2H6v4zm0 2v4h5c1.1 0 2-.9 2-2s-.9-2-2-2H6z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-gray-200 rounded text-sm italic"
            title="Курсив (Ctrl+I)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 2h8v2h-2.5l-3 12H13v2H5v-2h2.5l3-12H8V2z"/>
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('h1')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Заголовок 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => formatText('h2')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Заголовок 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => formatText('h3')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-sm font-bold"
            title="Заголовок 3"
          >
            H3
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('ul')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Маркированный список"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 100 2 1 1 0 000-2zM6 4h11a1 1 0 110 2H6a1 1 0 110-2zM3 9a1 1 0 100 2 1 1 0 000-2zM6 9h11a1 1 0 110 2H6a1 1 0 110-2zM3 14a1 1 0 100 2 1 1 0 000-2zM6 14h11a1 1 0 110 2H6a1 1 0 110-2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => formatText('ol')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Нумерованный список"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 4a1 1 0 01.5-.87l1-.5a1 1 0 011 0l1 .5A1 1 0 016 4v1H5V4.5l-.5-.25L4 4.5V5H3V4zM3 8h1v1H3v1h2V9a1 1 0 00-1-1H3a1 1 0 000 2zM2 13h2v.5a.5.5 0 01-1 0H2v1h1a1.5 1.5 0 000-3H2v1.5zM8 4h9a1 1 0 110 2H8a1 1 0 110-2zM8 9h9a1 1 0 110 2H8a1 1 0 110-2zM8 14h9a1 1 0 110 2H8a1 1 0 110-2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => formatText('quote')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Цитата"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5-1.3 3.5-3 3.5c-.5 0-1-.1-1.4-.4L6 16v-4c-.6-.8-1-1.8-1-2zm7 0c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5-1.3 3.5-3 3.5c-.5 0-1-.1-1.4-.4L13 16v-4c-.6-.8-1-1.8-1-2z"/>
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => formatText('code')}
            className="p-2 hover:bg-gray-200 rounded text-sm font-mono"
            title="Inline код"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 4.5L4 7l2.5 2.5L5 11 1.5 7.5a1 1 0 010-1.4L5 2.5 6.5 4.5zM13.5 4.5L15 2.5l3.5 3.5a1 1 0 010 1.4L15 11l-1.5-1.5L16 7l-2.5-2.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => formatText('codeblock')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-xs font-mono"
            title="Блок кода"
          >
            { }
          </button>
          <button
            type="button"
            onClick={() => formatText('link')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Ссылка"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => formatText('hr')}
            className="px-2 py-1 hover:bg-gray-200 rounded text-xs"
            title="Разделитель"
          >
            ―
          </button>
        </div>

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            isPreview 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isPreview ? 'Редактировать' : 'Предпросмотр'}
        </button>
      </div>

      {/* Editor/Preview */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="p-3 min-h-[200px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full p-3 border-0 resize-none focus:outline-none focus:ring-0"
            placeholder={placeholder}
            onKeyDown={(e) => {
              // Handle Ctrl+B and Ctrl+I shortcuts
              if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                  e.preventDefault();
                  formatText('bold');
                } else if (e.key === 'i') {
                  e.preventDefault();
                  formatText('italic');
                }
              }
            }}
          />
        )}
      </div>

      {/* Help text */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4">
          <span>**жирный**</span>
          <span>*курсив*</span>
          <span># заголовок</span>
          <span>- список</span>
          <span>`код`</span>
          <span>Цитата</span>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
