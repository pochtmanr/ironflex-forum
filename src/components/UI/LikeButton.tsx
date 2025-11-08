'use client';

import React from 'react';
import { HeartIcon, ThumbsDownIcon } from 'lucide-react';



interface LikeButtonProps {
  type: 'like' | 'dislike';
  count: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  type,
  count,
  isActive,
  onClick,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const isLike = type === 'like';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };
  
  // Color classes based on type and active state
  const getColorClasses = () => {
    if (isLike) {
      return isActive 
        ? 'text-green-700/80 hover:bg-green-600/10 border-2 border-green-700/40' 
        : 'bg-white text-gray-700/80 hover:bg-green-700/10 border-2 border-gray-200 hover:border-green-500/30 text-green-700';
    } else {
      return isActive 
        ? 'text-red-700/80 hover:bg-red-600/10 border-2 border-red-700/40' 
        : 'bg-white text-gray-700/80 hover:bg-red-700/10 border-2 border-gray-200 hover:border-red-500/30 text-red-700';
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 ${sizeClasses[size]} ${getColorClasses()} rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm ${className}`}
      title={disabled ? "Войдите для голосования" : ""}
    >
      <span>
        {isLike ? (
          <HeartIcon fill={isActive ? 'currentColor' : 'none'} className="w-4 h-4" />
        ) : (
          <ThumbsDownIcon fill={isActive ? 'currentColor' : 'none'} className="w-4 h-4" />
          )}
      </span>
      <span>{count}</span>
    </button>
  );
};

interface LikeButtonGroupProps {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
  onLike: (type: 'like' | 'dislike') => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LikeButtonGroup: React.FC<LikeButtonGroupProps> = ({
  likes,
  dislikes,
  userVote,
  onLike,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 ${className}`}>
      <LikeButton
        type="like"
        count={likes}
        isActive={userVote === 'like'}
        onClick={() => onLike('like')}
        disabled={disabled}
        size={size}
      />
      <LikeButton
        type="dislike"
        count={dislikes}
        isActive={userVote === 'dislike'}
        onClick={() => onLike('dislike')}
        disabled={disabled}
        size={size}
      />
    </div>
  );
};

export default LikeButton;

