'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface EditableCommentProps {
  commentId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt?: Date
  onUpdate: (commentId: string, newContent: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
}

export default function EditableComment({
  commentId,
  userId,
  content,
  createdAt,
  updatedAt,
  onUpdate,
  onDelete
}: EditableCommentProps) {
  const { currentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const isOwner = currentUser?.id === userId || currentUser?.isAdmin

  const handleSave = async () => {
    if (!editedContent.trim()) {
      setError('Комментарий не может быть пустым')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await onUpdate(commentId, editedContent)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
    setError('')
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return
    }

    setIsSaving(true)
    try {
      await onDelete(commentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления')
      setIsSaving(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      {isEditing ? (
        // Edit mode
        <div className="space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            disabled={isSaving}
          />
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <div>
          <div className="prose max-w-none mb-3">
            <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <span>{formatDate(createdAt)}</span>
              {updatedAt && updatedAt !== createdAt && (
                <span className="text-gray-400">(изменено {formatDate(updatedAt)})</span>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Редактировать
                </button>
                {onDelete && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

