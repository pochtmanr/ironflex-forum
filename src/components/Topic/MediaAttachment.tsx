import React from 'react';
import Image from 'next/image';

interface MediaAttachmentProps {
  link: string;
  index: number;
}

export const MediaAttachment: React.FC<MediaAttachmentProps> = ({ link, index }) => {
  const filename = link.split('/').pop() || '';
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
  const isVideo = /\.(mp4|webm|ogg|avi|mov)$/i.test(filename);

  console.log('Media link:', { link, filename, isImage, isVideo });

  return (
    <div key={index} className="bg-gray-50 p-3 rounded-lg">
      {isImage ? (
        <div className="space-y-2">
          <Image
            src={link}
            alt={filename}
            width={800}
            height={600}
            className="max-w-full h-auto rounded border"
            style={{ objectFit: 'contain', maxHeight: '400px', width: 'auto' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {filename}
            </a>
          </div>
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
            {link.includes('bucket.theholylabs.com') ? 'Файл' : 'Ссылка'}
          </span>
        </div>
      )}
    </div>
  );
};



