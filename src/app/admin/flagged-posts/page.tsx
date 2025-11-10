'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface FlaggedPost {
  _id: string
  postId: string
  topicId: string
  topicTitle: string
  postContent: string
  postAuthorId: string
  postAuthorName: string
  flaggedBy: string
  flaggedByName: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  createdAt: string
}

export default function FlaggedPostsPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([])
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (currentUser === undefined) {
        return
      }

      if (!currentUser) {
        router.push('/login')
        return
      }

      if (!currentUser.isAdmin) {
        alert('У вас нет прав администратора')
        router.push('/')
        return
      }

      await loadFlaggedPosts()
    }

    checkAdminAndLoad()
  }, [currentUser, filter, router])

  const loadFlaggedPosts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/admin/flagged-posts?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load flagged posts')
      }

      const data = await response.json()
      setFlaggedPosts(data.flaggedPosts || [])
    } catch (error) {
      console.error('Error loading flagged posts:', error)
      alert('Ошибка загрузки жалоб')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (flagId: string, action: 'reviewed' | 'dismissed') => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/admin/flagged-posts/${flagId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action })
      })

      if (!response.ok) {
        throw new Error('Failed to update flag status')
      }

      // Reload the list
      await loadFlaggedPosts()
    } catch (error) {
      console.error('Error updating flag:', error)
      alert('Ошибка обновления статуса жалобы')
    }
  }

  const handleDeletePost = async (postId: string, flagId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      // Mark flag as reviewed
      await handleReview(flagId, 'reviewed')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Ошибка удаления комментария')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Назад к панели администратора
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Жалобы на комментарии</h1>
        <p className="text-gray-600 mt-2">Модерация жалоб от авторов тем</p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ожидают рассмотрения ({flaggedPosts.filter(f => f.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Все жалобы
          </button>
        </div>
      </div>

      {/* Flagged Posts List */}
      {flaggedPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Нет жалоб для отображения
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedPosts.map((flag) => (
            <div key={flag._id} className="bg-white rounded-lg shadow p-6">
              {/* Flag Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      flag.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      flag.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {flag.status === 'pending' ? 'Ожидает' :
                       flag.status === 'reviewed' ? 'Рассмотрено' :
                       'Отклонено'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(flag.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <Link
                    href={`/topic/${flag.topicId}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    target="_blank"
                  >
                    {flag.topicTitle}
                  </Link>
                </div>
              </div>

              {/* Post Content */}
              <div className="bg-gray-50 rounded p-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  Комментарий от <strong>{flag.postAuthorName}</strong>:
                </div>
                <div className="text-gray-900 whitespace-pre-wrap">
                  {flag.postContent.substring(0, 300)}
                  {flag.postContent.length > 300 && '...'}
                </div>
              </div>

              {/* Flag Reason */}
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <div className="text-sm text-red-600 mb-1">
                  Жалоба от <strong>{flag.flaggedByName}</strong>:
                </div>
                <div className="text-red-900">{flag.reason}</div>
              </div>

              {/* Actions */}
              {flag.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeletePost(flag.postId, flag._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Удалить комментарий
                  </button>
                  <button
                    onClick={() => handleReview(flag._id, 'reviewed')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Отметить как рассмотренное
                  </button>
                  <button
                    onClick={() => handleReview(flag._id, 'dismissed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Отклонить жалобу
                  </button>
                  <Link
                    href={`/topic/${flag.topicId}`}
                    target="_blank"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Открыть тему
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

