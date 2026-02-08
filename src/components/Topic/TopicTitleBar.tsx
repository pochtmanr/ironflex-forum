import React from 'react';
import Link from 'next/link';

interface TopicTitleBarProps {
  title: string;
  categoryId: string;
  categoryName: string;
  views: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
}

export const TopicTitleBar: React.FC<TopicTitleBarProps> = ({
  title,
  categoryId,
  categoryName,
  views,
  replyCount,
  isPinned,
  isLocked
}) => {
  return (
    <div className="bg-gray-100 border border-gray-300 mb-0">
      {/* Breadcrumb row */}
      <div className="px-4 py-2 border-b border-gray-300 bg-gray-50">
        <nav className="text-xs text-gray-600">
          <Link href="/" className="hover:text-blue-600">Форум</Link>
          <span className="mx-2">→</span>
          <Link href={`/category/${categoryId}`} className="hover:text-blue-600">{categoryName}</Link>
        </nav>
      </div>

      {/* Title row */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Status indicators */}
          <div className="flex flex-col gap-1 pt-1">
            {isPinned && (
              <span className="text-xs text-orange-700 font-medium">Закреплено</span>
            )}
            {isLocked && (
              <span className="text-xs text-red-700 font-medium">Закрыто</span>
            )}
          </div>

          {/* Title and stats */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
              {title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Просмотров: <strong>{views}</strong></span>
              <span>Ответов: <strong>{replyCount}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
