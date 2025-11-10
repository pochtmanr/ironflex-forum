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
    articles: 0,
    trainings: 0,
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
        <div className="bg-teal-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-teal-600">{stats.articles}</div>
          <div className="text-sm text-gray-600">Статей</div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-pink-600">{stats.trainings}</div>
          <div className="text-sm text-gray-600">Тренингов</div>
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

        {/* Forum Stats */}
        <Link href="/admin/stats" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Статистика форума</h3>
            <p className="text-gray-600">Просмотр активности и статистики форума</p>
          </div>
        </Link>

        {/* Articles Management */}
        <Link href="/admin/articles" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление статьями</h3>
            <p className="text-gray-600">Создание и редактирование статей для сайта</p>
          </div>
        </Link>

        {/* Trainings Management */}
        <Link href="/admin/trainings" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Управление тренингами</h3>
            <p className="text-gray-600">Создание и редактирование тренингов и курсов</p>
          </div>
        </Link>
      </div>

      {/* Deployment Section */}
      <DeploymentPanel />
    </div>
  )
}

// Deployment Panel Component
function DeploymentPanel() {
  const [deploying, setDeploying] = React.useState(false)
  const [deployStatus, setDeployStatus] = React.useState<string>('')
  const [lastCommit, setLastCommit] = React.useState<string>('Loading...')

  React.useEffect(() => {
    fetchDeploymentStatus()
  }, [])

  const fetchDeploymentStatus = async () => {
    try {
      const response = await fetch('/api/admin/deploy')
      const data = await response.json()
      if (data.success) {
        setLastCommit(data.lastCommit)
      }
    } catch (error) {
      console.error('Failed to fetch deployment status:', error)
    }
  }

  const handleDeploy = async () => {
    if (!confirm('Вы уверены, что хотите развернуть последнюю версию с GitHub?\n\nЭто перезапустит все контейнеры и может занять несколько минут.')) {
      return
    }

    setDeploying(true)
    setDeployStatus('Начинается развертывание...')

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setDeployStatus('❌ Ошибка: Не найден токен авторизации')
        setDeploying(false)
        return
      }

      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setDeployStatus('✅ Развертывание завершено успешно!')
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        setDeployStatus(`❌ Ошибка: ${data.error || data.details || 'Unknown error'}`)
      }
    } catch (error) {
      setDeployStatus(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Развертывание с GitHub</h3>
            <p className="text-sm text-gray-600">Обновить проект до последней версии</p>
          </div>
        </div>
        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {deploying ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Развертывание...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Развернуть</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Последний коммит:</span>
          <span className="text-gray-900 font-mono text-xs">{lastCommit}</span>
        </div>
        {deployStatus && (
          <div className={`mt-3 p-3 rounded-lg ${deployStatus.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {deployStatus}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>⚠️ Развертывание перезапустит все контейнеры Docker и может занять 2-5 минут.</p>
        <p className="mt-1">📦 Будет загружена последняя версия из ветки main на GitHub.</p>
      </div>
    </div>
  )
}
