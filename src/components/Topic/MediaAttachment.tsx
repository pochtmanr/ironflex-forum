import React from 'react';
import Image from 'next/image';

export function isMediaImage(link: string): boolean {
  const filename = link.split('/').pop() || '';
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
}

interface MediaAttachmentProps {
  link: string;
  index: number;
  onImageClick?: (src: string) => void;
}

export const MediaAttachment: React.FC<MediaAttachmentProps> = ({ link, index, onImageClick }) => {
  const filename = link.split('/').pop() || '';
  const isImage = isMediaImage(link);
  const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(filename);

  return (
    <div key={index} className="bg-gray-50 p-3 rounded-lg">
      {isImage ? (
        <div
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(link)}
        >
          <Image
            src={link}
            alt={filename}
            width={800}
            height={600}
            className="w-full h-auto rounded border object-cover"
            style={{ maxHeight: '300px' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : isVideo ? (
        <div className="space-y-2">
          <video
            src={link}
            controls
            className="max-w-full h-auto rounded border"
            style={{ maxHeight: '400px' }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="text-xs text-gray-500">
            {filename}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1"
          >
            {filename}
          </a>
          <span className="text-xs text-gray-500 ml-2">
            Файл
          </span>
        </div>
      )}
    </div>
  );
};

interface MediaGalleryProps {
  links: string[];
  onImageClick?: (src: string) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ links, onImageClick }) => {
  const imageLinks = links.filter(isMediaImage);
  const otherLinks = links.filter(l => !isMediaImage(l));

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Прикрепленные файлы:</h4>

      {imageLinks.length > 0 && (
        <div className={`grid gap-2 mb-2 ${
          imageLinks.length === 1 ? 'grid-cols-1' :
          imageLinks.length === 2 ? 'grid-cols-2' :
          'grid-cols-2 sm:grid-cols-3'
        }`}>
          {imageLinks.map((link, i) => (
            <MediaAttachment key={`img-${i}`} link={link} index={i} onImageClick={onImageClick} />
          ))}
        </div>
      )}

      {otherLinks.length > 0 && (
        <div className="space-y-3">
          {otherLinks.map((link, i) => (
            <MediaAttachment key={`file-${i}`} link={link} index={i} onImageClick={onImageClick} />
          ))}
        </div>
      )}
    </div>
  );
};



