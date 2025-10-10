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
  const [vkLoading, setVkLoading] = useState(false);
  const { register, loginWithVK } = useAuth();
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

  // VK Authentication handlers
  const vkidOnSuccess = async (data: { access_token: string; user_id: number }) => {
    setVkLoading(true);
    setError('');

    try {
      console.log('VK auth success:', data);
      // The data contains access_token and user_id after successful exchange
      await loginWithVK('', ''); // Will use access_token directly
      router.push('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации через VK';
      setError(errorMessage);
    } finally {
      setVkLoading(false);
    }
  };

  const vkidOnError = (error: unknown) => {
    console.error('VK auth error:', error);
    setError('Ошибка авторизации через VK');
    setVkLoading(false);
  };

  const initVKAuth = () => {
    if (typeof window === 'undefined') return;

    // @ts-ignore - VKIDSDK is loaded via script
    if ('VKIDSDK' in window) {
      // @ts-ignore
      const VKID = window.VKIDSDK;

      if (!VKID) return; // Type guard

      // Use environment variable for redirect URL or window.location.origin as fallback
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      VKID.Config.init({
        app: 54219432,
        redirectUrl: redirectUrl,
        // @ts-ignore
        responseMode: VKID.ConfigResponseMode.Callback,
        // @ts-ignore
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oneTap = new VKID.OneTap();
      const container = document.getElementById('vk-signin-button');

      if (container) {
        // Clear any existing content
        container.innerHTML = '';
        
        oneTap.render({
          container: container,
          showAlternativeLogin: true,
          // @ts-ignore
          styles: {
            borderRadius: 8,
            height: 40
          }
        })
        // @ts-ignore
        .on(VKID.WidgetEvents.ERROR, vkidOnError)
        // @ts-ignore
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, function (payload: { code: string; device_id: string }) {
          const code = payload.code;
          const deviceId = payload.device_id;

          setVkLoading(true);
          console.log('VK registration success, exchanging code...', { code, deviceId });

          // @ts-ignore
          VKID.Auth.exchangeCode(code, deviceId)
            .then(async (tokenData: { access_token: string; user_id: number }) => {
              console.log('VK token exchanged successfully');
              
              // Send access token to backend
              await loginWithVK('', '', tokenData.access_token);
              console.log('Registration with VK completed, redirecting...');
              router.push('/');
            })
            .catch((error: unknown) => {
              console.error('VK token exchange error:', error);
              vkidOnError(error);
            });
        });
      }
    }
  };


  // Load VK ID SDK script
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="@vkid/sdk"]');
    if (existingScript) {
      // Script already loaded, just init
      if ('VKIDSDK' in window) {
        initVKAuth();
      }
      return;
    }

    const vkScript = document.createElement('script');
    vkScript.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    vkScript.async = true;
    vkScript.defer = true;
    vkScript.onload = () => {
      console.log('VK SDK loaded');
      // Small delay to ensure SDK is fully initialized
      setTimeout(() => {
        initVKAuth();
      }, 100);
    };
    document.head.appendChild(vkScript);

    return () => {
      // Clear the container on unmount to prevent duplicates
      const container = document.getElementById('vk-signin-button');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

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
              className="flex w-full justify-center rounded-md bg-blue-500 px-4 py-2 text-base font-semibold leading-6 text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>

          {/* VK OAuth Button - Inside form for better flow */}
          <div className="mt-4">
            <div id="vk-signin-button" className="w-full flex justify-center items-center min-h-[40px] rounded-md"></div>
            {vkLoading && (
              <div className="mt-2 text-center text-sm text-gray-600 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Регистрация через VK...
              </div>
            )}
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold leading-6 text-blue-500 hover:text-blue-700">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;