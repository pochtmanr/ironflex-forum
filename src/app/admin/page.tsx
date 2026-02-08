'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    users: 0,
    topics: 0,
    posts: 0,
    flaggedPosts: 0
  })

  useEffect(() => {
    const checkAdmin = async () => {
      // Wait for auth to initialize
      if (currentUser === undefined) {
        console.log('Admin page: currentUser is undefined, waiting for auth to load...')
        return // Still loading auth
      }

      if (!currentUser) {
        console.log('Admin page: No user logged in, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Admin page: currentUser:', currentUser)
      console.log('Admin page: currentUser.isAdmin:', currentUser.isAdmin)

      // Check if user is admin in currentUser object first
      if (!currentUser.isAdmin) {
        console.log('Admin page: User is not an admin, redirecting to home')
        alert('У вас нет прав администратора')
        router.push('/')
        setLoading(false)
        return
      }

      console.log('Admin page: User is admin, fetching stats')

      // Fetch admin data
      try {
        let token = localStorage.getItem('accessToken')
        if (!token) {
          console.log('Admin page: No token found, redirecting to login')
          router.push('/login')
          setLoading(false)
          return
        }

        // Fetch stats
        let statsResponse = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Admin page: Stats response status:', statsResponse.status)

        // If 401, try to refresh the token
        if (statsResponse.status === 401) {
          console.log('Admin page: Token expired, attempting to refresh...')
          const refreshToken = localStorage.getItem('refreshToken')
          
          if (refreshToken) {
            try {
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
              })

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json()
                console.log('Admin page: Token refreshed successfully')
                
                // Update localStorage
                localStorage.setItem('accessToken', refreshData.accessToken)
                localStorage.setItem('refreshToken', refreshData.refreshToken)
                localStorage.setItem('user', JSON.stringify(refreshData.user))
                
                // Retry the stats request with new token
                statsResponse = await fetch('/api/admin/stats', {
                  headers: {
                    'Authorization': `Bearer ${refreshData.accessToken}`
                  }
                })
                
                console.log('Admin page: Retry stats response status:', statsResponse.status)
              } else {
                console.log('Admin page: Token refresh failed, redirecting to login')
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                router.push('/login')
                setLoading(false)
                return
              }
            } catch (refreshError) {
              console.error('Admin page: Token refresh error:', refreshError)
              router.push('/login')
              setLoading(false)
              return
            }
          } else {
            console.log('Admin page: No refresh token, redirecting to login')
            router.push('/login')
            setLoading(false)
            return
          }
        }

        if (statsResponse.ok) {
          const data = await statsResponse.json()
          console.log('Admin page: Stats data:', data)
          setStats(data)
        } else {
          console.error('Admin page: Failed to fetch stats:', statsResponse.status)
        }
      } catch (error) {
        console.error('Admin check error:', error)
        alert('Ошибка проверки прав администратора')
        router.push('/')
        return
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [currentUser, router])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-gray-500">Проверка прав доступа...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель управления</h1>
      <p className="text-gray-600 mb-8">Добро пожаловать, {currentUser?.displayName || currentUser?.username}!</p>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
          <div className="text-sm text-gray-600">Пользователей</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.topics}</div>
          <div className="text-sm text-gray-600">Тем</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.posts}</div>
          <div className="text-sm text-gray-600">Комментариев</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">
        {/* Category Management */}
        <Link href="/admin/categories" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Категория управления</h3>
            <p className="text-gray-600">Создание и управление категориями</p>
          </div>
        </Link>

        {/* User Management */}
        <Link href="/admin/users" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление пользователями</h3>
            <p className="text-gray-600">Управление пользователями и администраторами</p>
          </div>
        </Link>

        {/* Topic Management */}
        <Link href="/admin/topics" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление обсуждениями</h3>
            <p className="text-gray-600">Управление обсуждениями, закрепление, блокировка, редактирование и удаление</p>
          </div>
        </Link>

        {/* Post Management */}
        <Link href="/admin/posts" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление комментариями</h3>
            <p className="text-gray-600">Управление комментариями, редактирование контента и модерация дискуссий</p>
          </div>
        </Link>

        {/* Flagged Posts */}
        <Link href="/admin/flagged-posts" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative">
            {stats.flaggedPosts > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {stats.flaggedPosts}
              </div>
            )}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 2zm9-13.5V9" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Жалобы на комментарии</h3>
            <p className="text-gray-600">Просмотр и модерация жалоб на комментарии от авторов тем</p>
          </div>
        </Link>

        {/* Chat Settings */}
        <Link href="/admin/chat-settings" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Настройки чата</h3>
            <p className="text-gray-600">Чёрный список слов, блокировка пользователей в чате</p>
          </div>
        </Link>

        {/* Contact Requests */}
        <Link href="/admin/contact-requests" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Обращения</h3>
            <p className="text-gray-600">Просмотр заявок из формы обратной связи</p>
          </div>
        </Link>

      </div>
    </div>
  )
}
