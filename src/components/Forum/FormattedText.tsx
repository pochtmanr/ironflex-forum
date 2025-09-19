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
      
      // Quotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-300 pl-4 py-2 my-3 bg-blue-50 text-gray-700 italic rounded-r">$1</blockquote>')
      
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="border-t-2 border-gray-200 my-6" />')
      
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li class="flex items-start"><span class="text-blue-500 mr-2 mt-1.5 text-xs">●</span><span>$1</span></li>')
      
      // Ordered lists  
      .replace(/^\d+\. (.*$)/gm, '<li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5 text-sm font-medium min-w-[1.5rem]">$1</span></li>')
      
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
    html = html.replace(/((<li class="flex items-start"><span class="text-blue-500 mr-2 mt-1.5 text-xs">●<\/span><span>.*?<\/span><\/li>)+)/g, '<ul class="my-3 space-y-1">$1</ul>');
    html = html.replace(/((<li class="flex items-start"><span class="text-blue-500 mr-2 mt-0.5 text-sm font-medium min-w-\\[1.5rem\\]">.*?<\/span><\/li>)+)/g, '<ol class="my-3 space-y-1 counter-reset list-decimal ml-4">$1</ol>');

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
