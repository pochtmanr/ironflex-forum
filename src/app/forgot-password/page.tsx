'use client'

import React, { useState } from 'react';
import Link from 'next/link';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Произошла ошибка. Попробуйте позже.');
      }
    } catch (error) {
      setMessage('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Восстановление пароля
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Введите ваш email адрес для восстановления пароля
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-800">{message}</div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
              Email адрес
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="block w-full h-10 rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
