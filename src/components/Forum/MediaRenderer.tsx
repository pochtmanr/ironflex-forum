import React from 'react';

// Helper functions for media parsing
const parseYouTubeUrl = (url: string): string | null => {
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(ytRegex);
  return match ? match[1] : null;
};

const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || url.includes('/api/uploads/images/');
};

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

interface MediaRendererProps {
  mediaLinks: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const MediaRenderer: React.FC<MediaRendererProps> = ({ 
  mediaLinks, 
  className = '', 
  size = 'medium' 
}) => {
  if (!mediaLinks?.trim()) return null;

  const sizeClasses = {
    small: { video: 'w-full max-w-64 sm:w-64 h-36', image: 'max-w-[200px] max-h-[200px]' },
    medium: { video: 'w-full max-w-80 sm:w-80 h-45', image: 'max-w-[250px] max-h-[250px]' },
    large: { video: 'w-full max-w-full sm:w-96 h-54', image: 'max-w-[300px] max-h-[300px]' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Медиа-контент
        </h4>
        <div className="space-y-4">
          {mediaLinks.split('\n').filter(link => link.trim()).map((link, index) => {
            const trimmedLink = link.trim();
            if (!isValidUrl(trimmedLink)) return null;
            
            const youtubeId = parseYouTubeUrl(trimmedLink);
            
            if (youtubeId) {
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <iframe
                      width="320"
                      height="180"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={`rounded border shadow-sm ${currentSize.video}`}
                    ></iframe>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">YouTube Video</span>
                      </div>
                      <a 
                        href={trimmedLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 underline break-all"
                      >
                        {trimmedLink}
                      </a>
                    </div>
                  </div>
                </div>
              );
            } else if (isImageUrl(trimmedLink)) {
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Изображение</span>
                  </div>
                  <div className="mb-2">
                    <img 
                      src={trimmedLink} 
                      alt="Attached image" 
                      className={`rounded border shadow-sm cursor-pointer hover:opacity-90 transition-opacity object-cover ${currentSize.image}`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      onClick={() => window.open(trimmedLink, '_blank')}
                    />
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Внешняя ссылка</span>
                  </div>
                  <a 
                    href={trimmedLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline break-all font-medium"
                  >
                    {trimmedLink}
                  </a>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default MediaRenderer;
