'use client';

import React from 'react';

// Heart icon component
const HeartIcon = ({ filled = false, className = "" }: { filled?: boolean; className?: string }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// Broken heart icon (for dislike)
const DislikeIcon = ({ filled = false, className = "" }: { filled?: boolean; className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Broken heart */}
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    {/* Break line through the heart */}
    <line x1="12" y1="5" x2="12" y2="13" strokeWidth="2.5" stroke="currentColor"/>  
    <line x1="10" y1="9" x2="14" y2="9" strokeWidth="2.5" stroke="currentColor"/>
  </svg>
);

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
    lg: 'px-4 py-2 text-base'
  };
  
  // Color classes based on type
  const colorClasses = isLike
    ? 'bg-green-50/10 text-green-700 hover:bg-green-50/20'
    : 'bg-red-50/10 text-red-700 hover:bg-red-50/20';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 ${sizeClasses[size]} ${colorClasses} rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${className}`}
      title={disabled ? "Войдите для голосования" : ""}
    >
      <span>
        {isLike ? (
          <HeartIcon filled={isActive} className="w-4 h-4" />
        ) : (
          <DislikeIcon filled={isActive} className="w-4 h-4" />
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

