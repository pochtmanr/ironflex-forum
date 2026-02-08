import React, { useState } from 'react';

interface TopicRatingProps {
  currentRating?: number; // 0-5 average
  totalVotes?: number;
  userRating?: number | null; // User's own rating if any
  onRate?: (rating: number) => void;
  disabled?: boolean;
}

export const TopicRating: React.FC<TopicRatingProps> = ({
  currentRating = 0,
  totalVotes = 0,
  userRating = null,
  onRate,
  disabled = false
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating ?? userRating ?? currentRating;

  const handleClick = (rating: number) => {
    if (!disabled && onRate) {
      onRate(rating);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(null)}
            className={`text-lg transition-colors ${
              disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            title={disabled ? 'Войдите, чтобы оценить' : `Оценить: ${star}`}
          >
            <span
              className={
                star <= displayRating
                  ? 'text-yellow-500'
                  : 'text-gray-300'
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {totalVotes > 0 && (
        <span className="text-xs text-gray-500">
          {currentRating.toFixed(1)} ({totalVotes} {totalVotes === 1 ? 'голос' : totalVotes < 5 ? 'голоса' : 'голосов'})
        </span>
      )}
      {userRating && (
        <span className="text-xs text-green-600">· Ваша оценка: {userRating}</span>
      )}
    </div>
  );
};
