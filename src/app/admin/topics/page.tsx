'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Topic {
  id: string
  categoryId: string
  userId: string
  userName: string
  userEmail: string
  title: string
  content: string
  mediaLinks: string[]
  views: number
  likes: number
  dislikes: number
  isPinned: boolean
  isLocked: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastPostAt: string
  replyCount: number
  categoryName?: string
}

export default function AdminTopics() {
  const { } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editingTopic, setEditingTopic] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/topics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics || [])
      } else {
        console.error('Failed to fetch topics')
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic and all its posts? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(topicId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTopics(topics.filter(topic => topic.id !== topicId))
        alert('Topic deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete topic')
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic')
    } finally {
      setDeleteLoading(null)
    }
  }

  const startEdit = (topic: Topic) => {
    setEditingTopic(topic.id)
    setEditTitle(topic.title)
    setEditContent(topic.content)
  }

  const cancelEdit = () => {
    setEditingTopic(null)
    setEditTitle('')
    setEditContent('')
  }

  const saveEdit = async (topicId: string) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content cannot be empty')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: editTitle.trim(),
          content: editContent.trim()
        })
      })

      if (response.ok) {
        setTopics(topics.map(topic => 
          topic.id === topicId 
            ? { ...topic, title: editTitle.trim(), content: editContent.trim() }
            : topic
        ))
        setEditingTopic(null)
        setEditTitle('')
        setEditContent('')
        alert('Topic updated successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update topic')
      }
    } catch (error) {
      console.error('Error updating topic:', error)
      alert('Failed to update topic')
    }
  }

  const toggleTopicStatus = async (topicId: string, statusType: string, currentValue: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/topics/${topicId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          statusType,
          value: !currentValue 
        })
      })

      if (response.ok) {
        setTopics(topics.map(topic => 
          topic.id === topicId 
            ? { ...topic, [statusType]: !currentValue }
            : topic
        ))
        alert(`Topic ${statusType} updated`)
      } else {
        const error = await response.json()
        alert(error.error || `Failed to update topic ${statusType}`)
      }
    } catch (error) {
      console.error(`Error updating topic ${statusType}:`, error)
      alert(`Failed to update topic ${statusType}`)
    }
  }

  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center py-8">
          <div className="text-gray-500">Загрузка тем...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление темами</h1>
        <div className="text-sm text-gray-500">
          Общее количество тем: {topics.length}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск тем по заголовку, контенту, автору или категории..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тема
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статистика
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTopics.map((topic) => (
                <tr key={topic.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingTopic === topic.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Заголовок темы"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Содержимое темы"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveEdit(topic.id)}
                            className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Отменить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-md">
                        <Link
                          href={`/topic/${topic.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 line-clamp-2"
                        >
                          {topic.title}
                        </Link>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {topic.content}
                        </p>
                        {topic.mediaLinks && topic.mediaLinks.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-600">📎 {topic.mediaLinks.length} attachment(s)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {topic.userName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {topic.userEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {topic.categoryName || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex space-x-2">
                        <span className="text-xs text-gray-600">👁️ {topic.views}</span>
                        <span className="text-xs text-gray-600">💬 {topic.replyCount}</span>
                      </div>
                      <div className="flex space-x-2">
                        <span className="text-xs text-green-600">👍 {topic.likes}</span>
                        <span className="text-xs text-red-600">👎 {topic.dislikes}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {topic.isPinned && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            📌 Закрепленная
                          </span>
                        )}
                        {topic.isLocked && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🔒 Заблокированная
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          topic.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {topic.isActive ? 'Активная' : 'Скрытая'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      {new Date(topic.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Последнее: {new Date(topic.lastPostAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {editingTopic === topic.id ? null : (
                        <>
                          <button
                            onClick={() => startEdit(topic)}
                            className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => toggleTopicStatus(topic.id, 'isPinned', topic.isPinned)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              topic.isPinned
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {topic.isPinned ? 'Открепить' : 'Закрепить'}
                          </button>
                          <button
                            onClick={() => toggleTopicStatus(topic.id, 'isLocked', topic.isLocked)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              topic.isLocked
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {topic.isLocked ? 'Разблокировать' : 'Заблокировать'}
                          </button>
                          <button
                            onClick={() => toggleTopicStatus(topic.id, 'isActive', topic.isActive)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              topic.isActive
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {topic.isActive ? 'Скрыть' : 'Показать'}
                          </button>
                          <button
                            onClick={() => deleteTopic(topic.id)}
                            disabled={deleteLoading === topic.id}
                            className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteLoading === topic.id ? '...' : 'Удалить'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTopics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Темы не найдены по вашему запросу.' : 'Темы не найдены.'}
          </div>
        )}
      </div>
    </div>
  )
}
