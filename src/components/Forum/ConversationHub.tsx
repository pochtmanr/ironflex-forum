'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { forumAPI } from '../../services/api'
import { supabase } from '@/lib/supabase'
import { SendIcon, Loader2Icon, LockIcon } from 'lucide-react'
import Link from 'next/link'

interface ConversationMessage {
  id: string
  user_id: string
  user_name: string
  user_photo_url: string | null
  content: string
  created_at: string
}

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 35%)`
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин. назад`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч. назад`

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function UserAvatar({ name, photoUrl, size = 24 }: { name: string; photoUrl: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  const initials = name.charAt(0).toUpperCase()
  return (
    <div
      className="rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initials}
    </div>
  )
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
  '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
  '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
  '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
  '💪', '🦾', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗',
  '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💫', '🌈',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🥊', '🥋',
  '🏋️', '🤸', '🧘', '🏊', '🚣', '🎯', '🎮', '🎲',
  '✅', '❌', '❎', '✔️', '☑️', '💯', '🔴', '🟢',
]

interface ConversationHubProps {
  className?: string
}

const ConversationHub: React.FC<ConversationHubProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentUser } = useAuth()

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('conversation_hub')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages'
        },
        (payload) => {
          const newMsg = payload.new as ConversationMessage
          setMessages((prev) => {
            // Skip if already present (from optimistic update replaced by server response)
            if (prev.some((m) => m.id === newMsg.id)) return prev
            // If this is our own message, it was already added optimistically — skip
            if (prev.some((m) => m.id.startsWith('temp-') && m.user_id === newMsg.user_id && m.content === newMsg.content)) {
              return prev
            }
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scrollToBottom])

  const loadMessages = async () => {
    try {
      const response = await forumAPI.getConversationMessages(50) as { messages: ConversationMessage[] }
      setMessages(response.messages || [])
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('Failed to load conversation messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || sending || !currentUser) return

    setError(null)
    setSending(true)

    // Optimistic message with temp id
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: ConversationMessage = {
      id: tempId,
      user_id: currentUser.id,
      user_name: currentUser.displayName || currentUser.username,
      user_photo_url: currentUser.photoURL || null,
      content,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setTimeout(scrollToBottom, 50)

    try {
      const response = await forumAPI.sendConversationMessage(content) as { message: ConversationMessage }
      // Replace temp message with real one from server
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...response.message } : m))
      )
    } catch (err) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      const message = err instanceof Error ? err.message : 'Не удалось отправить'
      setError(message)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    // Auto-resize textarea
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const before = newMessage.slice(0, start)
      const after = newMessage.slice(end)
      setNewMessage(before + emoji + after)
      // Restore cursor position after emoji
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length
        ta.focus()
      }, 0)
    } else {
      setNewMessage((prev) => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  return (
    <div className={`bg-white rounded-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-600 text-white px-4 py-3">
        <h2 className="text-lg font-bold">Беседка</h2>
        <p className="text-xs text-gray-300">Общий чат сообщества</p>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="h-80 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 border-l border-r border-gray-100"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
            Загрузка...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Пока нет сообщений. Начните разговор!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = currentUser?.id === msg.user_id
            return (
              <div key={msg.id} className={`flex gap-2 text-sm items-start rounded px-2 py-1 ${isOwn ? 'bg-blue-50' : ''}`}>
                <Link href={`/profile/${msg.user_id}`} className="flex-shrink-0 mt-0.5">
                  <UserAvatar name={msg.user_name} photoUrl={msg.user_photo_url} size={24} />
                </Link>
                <div className="min-w-0">
                  <span className="flex-shrink-0">
                    <Link
                      href={`/profile/${msg.user_id}`}
                      className="font-semibold hover:underline"
                      style={{ color: getUserColor(msg.user_id) }}
                    >
                      {msg.user_name}
                    </Link>
                    <span className="text-gray-400 text-xs ml-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </span>
                  <p className="text-gray-800 break-words whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            )
          })

        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border border-gray-100 px-4 py-3">
        {currentUser ? (
          <div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Написать сообщение..."
                  maxLength={500}
                  rows={1}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
                  disabled={sending}
                  style={{ minHeight: '38px' }}
                />
              </div>

              {/* Emoji button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                  title="Эмодзи"
                >
                  <span className="text-lg leading-none">😀</span>
                </button>

                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 max-h-[250px] overflow-y-auto w-[300px]">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="p-1.5 hover:bg-gray-100 rounded text-base transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Send button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 flex-shrink-0"
              >
                {sending ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-2">{error}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-1">
            <LockIcon className="w-4 h-4" />
            <span>
              <Link href="/login" className="text-blue-600 hover:underline">Войдите</Link>
              {' '}или{' '}
              <Link href="/register" className="text-blue-600 hover:underline">зарегистрируйтесь</Link>
              , чтобы писать
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ConversationHub)
