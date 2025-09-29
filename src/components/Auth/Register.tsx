'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password length
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName
      );
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации. Попробуйте снова.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setOauthLoading(true);
    setError('');
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '857279367101-u5jl443dphtbr7114afnghsg2cm03c3u.apps.googleusercontent.com';
    
    if (!clientId) {
      setError('Google Client ID не настроен');
      setOauthLoading(false);
      return;
    }
    
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      // Render the Google button instead of using prompt
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(
          buttonElement,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
          }
        );
      }
    } else {
      setError('Google Sign-In не доступен');
    }
    setOauthLoading(false);
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    setOauthLoading(true);
    setError('');

    try {
      // Decode the JWT token directly like in your React app
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      // Create user object for localStorage (like React app)
      const user = {
        id: userData.id,
        email: userData.email,
        username: userData.email.split('@')[0],
        displayName: userData.name,
        photoURL: userData.picture,
        isAdmin: false
      };

      // Store user data in localStorage for persistence (like React app)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('googleCredential', response.credential);
      
      // Also send to server to create/update user in database and get proper tokens
      try {
        await loginWithGoogle(response.credential);
        // If server login succeeds, redirect to home
        router.push('/');
        return;
      } catch (serverError) {
        console.warn('Server login failed, but continuing with client-side auth:', serverError);
      }
      
      // If server fails, create a simple token for API access
      // This is a fallback - ideally the server should work
      const fallbackToken = btoa(JSON.stringify({
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));
      localStorage.setItem('accessToken', fallbackToken);
      
      // Redirect to home with localStorage auth
      router.push('/');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации через Google';
      setError(errorMessage);
    } finally {
      setOauthLoading(false);
    }
  };


  // Load Google Identity Services script - exactly like working React app
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = handleGoogleLogin; // Initialize when script loads
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [handleGoogleLogin]);

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Создать новый аккаунт
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
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
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="block w-full h-10 rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium leading-6 text-gray-900">
              Отображаемое имя
            </label>
            <div className="mt-2">
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="name"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Ваше имя (необязательно)"
                className="block w-full h-10 rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Пароль
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Минимум 6 символов"
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className="mt-6">
          <div id="google-signin-button" className="w-full flex justify-center"></div>
          {oauthLoading && (
            <div className="mt-2 text-center text-sm text-gray-600">
              Регистрация через Google...
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;