'use client';

import React from 'react';
import Link from 'next/link';
import { TrashIcon, PlusIcon, MessageCircleIcon } from 'lucide-react';

// ============= DELETE BUTTON =============
interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  disabled = false,
  title = "Удалить",
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1.5 border-2 border-gray-700/30 bg-white text-gray-700/80 text-xs rounded-md hover:bg-red-100/40 hover:text-red-700 hover:border-red-700/40 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
};

// ============= PRIMARY BUTTON =============
interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} bg-blue-500 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold touch-manipulation shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

// ============= SECONDARY BUTTON =============
interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClasses[size]} bg-white shadow-md shadow-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-50/20 active:bg-blue-100/20 transition-colors font-semibold touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

// ============= CREATE TOPIC BUTTON =============
interface CreateTopicButtonProps {
  categoryId?: string | number;
  className?: string;
}

export const CreateTopicButton: React.FC<CreateTopicButtonProps> = ({
  categoryId,
  className = ''
}) => {
  const href = categoryId ? `/create-topic?category=${categoryId}` : '/create-topic';
  
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 bg-gray-600 border-2 border-gray-400/60 text-white rounded-lg hover:bg-gray-500 active:bg-gray-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm flex-shrink-0 touch-manipulation shadow-md ${className}`}
    >
      <PlusIcon className="w-4 h-4" />
      <span>Новое обсуждение</span>
    </Link>
  );
};

// ============= NEW DISCUSSION BUTTON (Alternative) =============
interface NewDiscussionButtonProps {
  categoryId?: string | number;
  text?: string;
  className?: string;
}

export const NewDiscussionButton: React.FC<NewDiscussionButtonProps> = ({
  categoryId,
  text = 'Новое обсуждение',
  className = ''
}) => {
  const href = categoryId ? `/create-topic?category=${categoryId}` : '/create-topic';
  
  return (
    <Link
      href={href}
      className={`px-2 py-1 bg-gray-600 border-2 border-gray-400/60 text-white rounded-lg hover:bg-gray-500 transition-colors font-medium flex items-center justify-center space-x-2 text-sm flex-shrink-0 touch-manipulation shadow-md ${className}`}
    >
      {text}
    </Link>
  );
};

// ============= LINK BUTTON (styled as button) =============
interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  children,
  variant = 'primary',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-white shadow-md shadow-blue-500/10 text-blue-600 hover:bg-blue-50/20 active:bg-blue-100/20',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
  };

  return (
    <Link
      href={href}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-colors font-semibold touch-manipulation shadow-md inline-block text-center ${className}`}
    >
      {children}
    </Link>
  );
};

// ============= ICON BUTTON =============
interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  variant?: 'default' | 'danger' | 'success';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  disabled = false,
  title,
  variant = 'default',
  className = ''
}) => {
  const variantClasses = {
    default: 'border-gray-700/30 text-gray-700/80 hover:bg-gray-100 hover:border-gray-700',
    danger: 'border-gray-700/30 text-gray-700/80 hover:bg-red-100/40 hover:text-red-700 hover:border-red-700/40',
    success: 'border-gray-700/30 text-gray-700/80 hover:bg-green-100/40 hover:text-green-700 hover:border-green-700/40'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1.5 border-2 ${variantClasses[variant]} bg-white text-xs rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
    </button>
  );
};

// ============= BUTTON WITH ICON =============
interface ButtonWithIconProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export const ButtonWithIcon: React.FC<ButtonWithIconProps> = ({
  icon,
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = ''
}) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-white shadow-md shadow-blue-500/10 text-blue-600 hover:bg-blue-50/20 active:bg-blue-100/20',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 ${variantClasses[variant]} rounded-lg transition-colors font-semibold touch-manipulation shadow-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

// ============= BACK BUTTON =============
interface BackButtonProps {
  href: string;
  text?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  text = 'Назад',
  className = ''
}) => {
  return (
    <Link
      href={href}
      className={`text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {text}
    </Link>
  );
};

// ============= PAGINATION BUTTONS =============
interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  direction: 'prev' | 'next';
  className?: string;
}

export const PaginationButton: React.FC<PaginationButtonProps> = ({
  onClick,
  disabled = false,
  direction,
  className = ''
}) => {
  const text = direction === 'prev' ? 'Назад' : 'Вперед';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${className}`}
    >
      {text}
    </button>
  );
};

// Export all components as named exports
export default {
  DeleteButton,
  PrimaryButton,
  SecondaryButton,
  CreateTopicButton,
  NewDiscussionButton,
  LinkButton,
  IconButton,
  ButtonWithIcon,
  BackButton,
  PaginationButton
};

