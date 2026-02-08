'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../UI/SearchBar';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState<string | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Navigation items
  const navItems = [
    { href: '/', label: 'Форум' },
    { href: '/faq', label: 'FAQ' },
    { href: '/administration', label: 'Администрация' },
  ];

  // Check if current path matches
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Set user photo URL from MongoDB user data
  useEffect(() => {
    if (currentUser) {
      setUserPhotoURL(currentUser.photoURL || undefined);
    } else {
      setUserPhotoURL(undefined);
    }
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = (user: { displayName?: string; username?: string; email?: string }) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:block">
        {/* Logo Section - Centered, above navbar */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-2">
            <div className="flex items-center justify-center py-6">
              <Link href="/" className="inline-flex items-center">
                <img
                  src="/images/4_logo1.svg"
                  alt="Протокол Тарновского"
                  className="h-14 max-w-full"
                />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-lg font-semibold text-gray-400 -mt-4 mb-2">Форум</p>

        {/* Navigation bar - Below logo */}
        <div className="max-w-7xl mx-auto px-2">
          <div className="bg-gray-50 border border-gray-200 rounded-sm">
            <div className="flex items-center justify-between py-2 px-3">
              {/* Navigation Links */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Search and Profile */}
              <div className="flex items-center gap-4">
                <Suspense fallback={<div className="w-72 h-8 bg-gray-200 animate-pulse rounded"></div>}>
                  <SearchBar />
                </Suspense>

                {/* Desktop Profile Dropdown */}
                {currentUser && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      {userPhotoURL ? (
                        <img src={userPhotoURL} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getUserInitials(currentUser)
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {currentUser.displayName || 'Пользователь'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {currentUser.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Профиль
                          </div>
                        </Link>
                        {currentUser.isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Админ-панель
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setProfileDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Выход
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Login/Register for non-authenticated users on desktop */}
                {!currentUser && (
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Вход
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header - visible only on mobile */}
      <div className="md:hidden">
        {/* Logo Section - Centered */}
        <div className="bg-white py-2">
          <div className="flex items-center justify-between">
            <div className="w-10 flex-shrink-0" />
            <Link href="/" className="inline-flex items-center flex-1 justify-center">
              <img
                src="/images/4_logo1.svg"
                alt="Протокол Тарновского"
                className="h-10 max-w-[80%]"
              />
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              aria-label="Открыть меню"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor"/>
                <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor"/>
                <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <p className="text-center text-base font-semibold text-gray-400 mb-4">Форум</p>

        {/* Mobile search - always visible */}
        <div className="bg-white px-4 py-2">
          <Suspense fallback={<div className="h-8 bg-gray-200 animate-pulse rounded"></div>}>
            <SearchBar isMobile={true} />
          </Suspense>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-white/20 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile menu drawer */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4">
            <span className="text-lg font-semibold text-gray-800">Меню</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors  hover:bg-gray-200"
              aria-label="Закрыть меню"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Navigation items */}
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded transition-colors ${
                      isActive(item.href)
                        ? 'text-white bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section in drawer */}
          <div className=" p-4 mt-4">
            {currentUser ? (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="User Avatar" className="w-10 h-10 rounded-full object-cover mr-3" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                      {getUserInitials(currentUser)}
                    </div>
                  )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.displayName || 'Пользователь'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                </div>
                <div className="space-y-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Мой профиль
                    </div>
                  </Link>
                  {currentUser.isAdmin && (
                    <Link 
                      href="/admin" 
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Админ-панель
                      </div>
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Выход
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 mb-3 text-center">
                  Войдите в аккаунт или зарегистрируйтесь для доступа ко всем функциям
                </p>
                <Link 
                  href="/login" 
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-3 py-1.5 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Вход
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-3 py-1.5 text-center shadow-md shadow-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default Header;
