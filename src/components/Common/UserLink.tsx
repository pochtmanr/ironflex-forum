import React from 'react';
import { Link } from 'react-router-dom';

interface UserLinkProps {
  userId: string;
  userName: string;
  email?: string;
  className?: string;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const UserLink: React.FC<UserLinkProps> = ({ 
  userId, 
  userName, 
  email, 
  className = '',
  showAvatar = false,
  size = 'md'
}) => {
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarSizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Link
      to={`/profile/${userId}`}
      className={`inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors ${className}`}
    >
      {showAvatar && (
        <div className={`${avatarSizes[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
          {getUserInitials(userName)}
        </div>
      )}
      <span className={`${textSizes[size]} font-medium`}>
        {userName}
      </span>
    </Link>
  );
};

export default UserLink;
