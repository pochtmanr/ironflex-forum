import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if current path matches
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearch(q);
  }, [location.search]);

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
  const getUserInitials = (user: any) => {
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

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    const base = '/';
    navigate(`${base}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <>
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:block">
        {/* Logo strip */}
        <div className="bg-white px-4 py-2">
          <Link to="/" className="inline-flex items-center">
            <img src="/images/4_logo1.svg" alt="Протокол Тарновского" className="h-8" />
          </Link>
        </div>
        
        {/* Navigation bar */}
        <div className="bg-gray-50 shadow-sm">
          <div className=" mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Navigation menu */}
              <nav>
                <ul className="flex items-center">
                  <li className="relative">
                    <Link 
                      to="/" 
                      className={`block px-4 py-3 transition-colors text-sm ${
                        isActive('/') 
                          ? 'text-white bg-gray-600' 
                          : 'text-gray-700 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      Форум
                    </Link>
                  </li>
                  <li className="relative">
                    <Link 
                      to="/articles" 
                      className={`block px-4 py-3 transition-colors text-sm ${
                        isActive('/articles') 
                          ? 'text-white bg-gray-600' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      Статьи
                    </Link>
                  </li>
                  <li className="relative">
                    <Link 
                      to="/trainings" 
                      className={`block px-4 py-3 transition-colors text-sm ${
                        isActive('/trainings') 
                          ? 'text-white bg-gray-600' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-white hover:bg-gray-600'
                      }`}
                    >
                      Тренировки
                    </Link>
                  </li>
                </ul>
              </nav>
              
              {/* Desktop search and profile */}
              <div className="flex items-center gap-4">
                <form onSubmit={onSubmitSearch} className="flex items-center gap-2 py-2">
                  <input
                    type="search"
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm w-72"
                  />
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-gray-600 text-white hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Найти
                  </button>
                </form>

                {/* Desktop Profile Dropdown */}
                {currentUser && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      {getUserInitials(currentUser)}
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
                          to="/profile"
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
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Вход
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium "
                    >
                      Регистрация
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header - visible only on mobile */}
      <div className="md:hidden">
        {/* Top bar with logo, profile, and burger */}
        <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
          <Link to="/" className="inline-flex items-center">
            <img src="/images/4_logo1.svg" alt="Протокол Тарновского" className="h-8" />
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Mobile Profile Picture */}
            {currentUser && (
              <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                {getUserInitials(currentUser)}
              </div>
            )}
            
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
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

        {/* Mobile search - always visible */}
        <div className="bg-gray-50 px-4 py-3 border-b">
          <form onSubmit={onSubmitSearch} className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Найти
            </button>
          </form>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile menu drawer */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Drawer header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
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
              <li>
                <Link 
                  to="/" 
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 font-medium transition-colors ${
                    isActive('/')
                      ? 'text-white bg-gray-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Форум
                </Link>
              </li>
              <li>
                <Link 
                  to="/articles" 
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 transition-colors ${
                    isActive('/articles')
                      ? 'text-white bg-gray-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Статьи
                </Link>
              </li>
              <li>
                <Link 
                  to="/trainings" 
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 transition-colors ${
                    isActive('/trainings')
                      ? 'text-white bg-gray-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Тренировки
                </Link>
              </li>
            </ul>
          </nav>

          {/* User section in drawer */}
          <div className="border-t p-4 mt-4">
            {currentUser ? (
              <>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                    {getUserInitials(currentUser)}
                  </div>
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
                    to="/profile" 
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
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Войдите в аккаунт для доступа ко всем функциям
                </p>
                <Link 
                  to="/login" 
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Вход
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-2 text-center border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium"
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