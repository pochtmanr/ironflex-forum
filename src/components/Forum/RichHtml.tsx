import React from 'react';
import DOMPurify from 'dompurify';


interface RichHtmlProps {
  html: string;
  className?: string;
}

const RichHtml: React.FC<RichHtmlProps> = ({ html, className = '' }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'p', 'br', 'span', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
  });
  
  return (
    <div
      className={`prose prose-sm sm:prose ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default RichHtml;
