'use client'

import React from 'react';

// Extract video embed URL from common platforms
function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      let videoId: string | null = null;
      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.pathname.includes('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1];
      } else {
        videoId = parsed.searchParams.get('v');
      }
      if (videoId) {
        // Preserve timestamp if present
        const time = parsed.searchParams.get('t');
        const start = time ? `?start=${time.replace('s', '')}` : '';
        return `https://www.youtube.com/embed/${videoId}${start}`;
      }
    }

    // VK Video: vk.com/video-OWNER_VIDEO or vk.com/video_ext.php
    if (parsed.hostname.includes('vk.com') || parsed.hostname.includes('vkvideo.ru')) {
      // vk.com/video_ext.php?oid=...&id=...
      if (parsed.pathname.includes('video_ext.php')) {
        return url; // Already an embed URL
      }
      // vk.com/video-123_456 or vk.com/clip-123_456
      const videoMatch = parsed.pathname.match(/\/(video|clip)(-?\d+_\d+)/);
      if (videoMatch) {
        const oid = videoMatch[2].split('_')[0];
        const id = videoMatch[2].split('_')[1];
        return `https://vk.com/video_ext.php?oid=${oid}&id=${id}`;
      }
    }

    // Yandex (Dzen) Video: dzen.ru/video/watch/ID
    if (parsed.hostname.includes('dzen.ru')) {
      const match = parsed.pathname.match(/\/video\/watch\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://dzen.ru/embed/${match[1]}`;
      }
    }

    // Rutube: rutube.ru/video/ID
    if (parsed.hostname.includes('rutube.ru')) {
      const match = parsed.pathname.match(/\/video\/([a-zA-Z0-9]+)/);
      if (match) {
        return `https://rutube.ru/play/embed/${match[1]}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function isVideoUrl(url: string): boolean {
  return getVideoEmbedUrl(url) !== null;
}

interface VideoEmbedProps {
  url: string;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({ url }) => {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="my-3 max-w-3xl">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-md"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};
