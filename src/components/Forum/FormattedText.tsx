import React from 'react';

interface FormattedTextProps {
  content: string;
  className?: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  const formatText = (text: string) => {
    // Simple markdown-like rendering
    let html = text
      // Escape HTML first to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      
      // Headers (must be at start of line)
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2 leading-tight">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mt-5 mb-3 leading-tight">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-800 mt-6 mb-4 leading-tight">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      
      // Code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border">$1</code>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 border shadow-sm"><code>$1</code></pre>')
      
      // Multi-line quotes (improved)
      .replace(/^> (.*(?:\n^> .*)*)/gm, (match, content) => {
        const quoteContent = content.replace(/^> /gm, '').trim();
        return `<blockquote class="border-l-4 border-blue-400 pl-6 pr-4 py-4 my-6 bg-gradient-to-r from-blue-50 to-transparent text-gray-800 italic text-lg leading-relaxed rounded-r-lg shadow-sm">
          <div class="relative">
            <svg class="absolute -top-2 -left-4 w-6 h-6 text-blue-400 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            <div class="pl-8">${quoteContent}</div>
          </div>
        </blockquote>`;
      })
      
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="border-t-2 border-gray-200 my-8" />')
      
      // Unordered lists (improved)
      .replace(/^- (.*$)/gm, '<li class="flex items-start py-1"><span class="text-blue-500 mr-3 mt-2 flex-shrink-0"><svg class="w-2 h-2" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg></span><span class="text-gray-700 leading-relaxed">$1</span></li>')
      
      // Ordered lists (improved)
      .replace(/^(\d+)\. (.*$)/gm, '<li class="flex items-start py-1" data-number="$1"><span class="text-blue-600 mr-3 mt-0.5 flex-shrink-0 font-semibold min-w-[1.5rem]">$1.</span><span class="text-gray-700 leading-relaxed">$2</span></li>')
      
      // Links (basic support)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Line breaks (preserve double line breaks as paragraphs)
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br />');

    // Wrap in paragraph if it doesn't start with a block element
    if (!html.match(/^<(h[1-6]|blockquote|pre|hr|ul|ol)/)) {
      html = '<p class="mb-3">' + html + '</p>';
    }

    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/((<li class="flex items-start py-1"><span class="text-blue-500 mr-3 mt-2 flex-shrink-0">.*?<\/svg><\/span><span class="text-gray-700 leading-relaxed">.*?<\/span><\/li>)+)/g, '<ul class="my-6 space-y-2 bg-gray-50 rounded-lg p-4 border-l-4 border-blue-200">$1</ul>');
    html = html.replace(/((<li class="flex items-start py-1" data-number="\d+"><span class="text-blue-600 mr-3 mt-0\.5 flex-shrink-0 font-semibold min-w-\[1\.5rem\]">\d+\.<\/span><span class="text-gray-700 leading-relaxed">.*?<\/span><\/li>)+)/g, '<ol class="my-6 space-y-2 bg-gray-50 rounded-lg p-4 border-l-4 border-blue-200">$1</ol>');

    return html;
  };

  return (
    <div 
      className={`prose prose-sm max-w-none text-gray-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
  );
};

export default FormattedText;
