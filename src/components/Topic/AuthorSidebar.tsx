import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthorSidebarProps {
  userId: string;
  userName: string;
  userPhoto?: string;
  isTopicAuthor?: boolean;
  postNumber?: number;
  createdAt: string;
  formatDate: (date: string) => string;
}

export const AuthorSidebar: React.FC<AuthorSidebarProps> = ({
  userId,
  userName,
  userPhoto,
  isTopicAuthor = false,
  postNumber,
  createdAt,
  formatDate
}) => {
  return (
    <>
      {/* Mobile: Compact horizontal header */}
      <div className="sm:hidden bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Small avatar */}
          <Link href={`/profile/${userId}`} className="flex-shrink-0">
            {userPhoto ? (
              <Image
                src={userPhoto}
                alt={userName || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded-sm hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-600 rounded-sm hover:opacity-90 transition-opacity">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </Link>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${userId}`}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                {userName || 'Unknown'}
              </Link>
              {isTopicAuthor && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">Автор</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {postNumber !== undefined && <span>#{postNumber} · </span>}
              {formatDate(createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Classic sidebar */}
      <div className="hidden sm:block w-44 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-3 text-center">
        {/* Author name */}
        <Link
          href={`/profile/${userId}`}
          className="text-blue-600 hover:text-blue-800 font-semibold text-sm block mb-2"
        >
          {userName || 'Unknown'}
        </Link>

        {/* Topic author badge */}
        {isTopicAuthor && (
          <div className="text-xs text-gray-500 mb-2">Автор темы</div>
        )}

        {/* User avatar - rectangular */}
        <Link href={`/profile/${userId}`} className="block mb-3">
          {userPhoto ? (
            <Image
              src={userPhoto}
              alt={userName || 'User'}
              width={100}
              height={100}
              className="w-28 h-28 mx-auto object-cover rounded-sm hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-28 h-28 mx-auto bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600 rounded-sm hover:opacity-90 transition-opacity">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Post date */}
        <div className="text-xs text-gray-500">
          {postNumber !== undefined && (
            <div className="mb-1">#{postNumber}</div>
          )}
          <div>Отправлено {formatDate(createdAt)}</div>
        </div>
      </div>
    </>
  );
};
