'use client';

import React from 'react';
import Link from 'next/link';

interface LoginPromptProps {
  message?: string;
  buttonText?: string;
  className?: string;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({
  message = 'Войдите в аккаунт, чтобы продолжить',
  buttonText = 'Войти',
  className = ''
}) => {
  return (
    <div className={`bg-white p-4 sm:p-6 text-center ${className}`}>
      <p className="text-gray-700 mb-4 text-sm sm:text-base">
        {message}
      </p>
      <Link
        href="/login"
        className="inline-block px-4 sm:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
      >
        {buttonText}
      </Link>
    </div>
  );
};

export default LoginPrompt;

