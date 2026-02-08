'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { forumAPI, uploadAPI } from '../../services/api'
import { supabase } from '@/lib/supabase'
import { SendIcon, Loader2Icon, LockIcon, ImageIcon, XIcon, Trash2Icon, ReplyIcon } from 'lucide-react'
import Link from 'next/link'
import { ImageLightbox } from '@/components/UI/ImageLightbox'
import { QuoteChip } from '@/components/UI/QuoteChip'
import { QuoteBlock } from '@/components/UI/QuoteBlock'
import type { QuotedMessage } from '@/components/UI/QuoteChip'
import { optimizeImage, isImage } from '@/lib/imageOptimizer'

interface ConversationMessage {
  id: string
  user_id: string
  user_name: string
  user_photo_url: string | null
  content: string
  media_links: string[]
  created_at: string
  reply_to?: { id: string; author_name: string; excerpt: string } | null
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

const MAX_IMAGES = 3
const PAGE_SIZE = 50

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { currentUser } = useAuth()
  const isAdmin = currentUser?.isAdmin === true

  // Image upload state
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)

  // Quote/reply state
  const [quotedMessage, setQuotedMessage] = useState<QuotedMessage | null>(null)

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadMessages()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: listen for INSERT and DELETE events
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
            if (prev.some((m) => m.id === newMsg.id)) return prev
            if (prev.some((m) => m.id.startsWith('temp-') && m.user_id === newMsg.user_id && m.content === newMsg.content)) {
              return prev
            }
            return [...prev, { ...newMsg, media_links: newMsg.media_links || [], reply_to: newMsg.reply_to || null }]
          })
          setTimeout(scrollToBottom, 100)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_messages'
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id
          setMessages((prev) => prev.filter((m) => m.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [scrollToBottom])

  const loadMessages = async () => {
    try {
      const response = await forumAPI.getConversationMessages(PAGE_SIZE) as { messages: ConversationMessage[]; hasMore: boolean }
      setMessages((response.messages || []).map(m => ({ ...m, media_links: m.media_links || [] })))
      setHasMore(response.hasMore ?? false)
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('Failed to load conversation messages:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load older messages (infinite scroll up)
  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return

    const oldestMessage = messages[0]
    if (!oldestMessage) return

    setLoadingMore(true)
    const container = messagesContainerRef.current
    const prevScrollHeight = container?.scrollHeight || 0

    try {
      const response = await forumAPI.getConversationMessages(PAGE_SIZE, oldestMessage.created_at) as { messages: ConversationMessage[]; hasMore: boolean }
      const olderMessages = (response.messages || []).map(m => ({ ...m, media_links: m.media_links || [] }))
      setHasMore(response.hasMore ?? false)

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev])
        // Restore scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight
          }
        })
      }
    } catch (err) {
      console.error('Failed to load older messages:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, messages])

  // Scroll handler for infinite scroll (scroll up to load older)
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    // When scrolled near top (within 50px), load older
    if (container.scrollTop < 50 && hasMore && !loadingMore) {
      loadOlderMessages()
    }
  }, [hasMore, loadingMore, loadOlderMessages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = MAX_IMAGES - pendingImages.length
    const toAdd = files.slice(0, remaining).filter(f => f.type.startsWith('image/'))

    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPendingImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev
          return [...prev, { file, preview: reader.result as string }]
        })
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const { file } of pendingImages) {
      let fileToUpload = file
      // Optimize before upload
      if (isImage(file) && !file.type.includes('svg')) {
        try {
          fileToUpload = await optimizeImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.85,
            format: 'webp'
          })
        } catch {
          // Fall back to original
        }
      }
      const result = await uploadAPI.uploadFile(fileToUpload)
      const url = result.url || result.file_url
      if (url) urls.push(url)
    }
    return urls
  }

  // Admin: hard-delete a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin || deletingId) return
    setDeletingId(messageId)
    try {
      await forumAPI.deleteConversationMessage(messageId)
      // Optimistic removal (realtime DELETE will also fire)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (err) {
      console.error('Failed to delete message:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleQuoteMessage = useCallback((msg: ConversationMessage) => {
    setQuotedMessage({
      id: msg.id,
      authorName: msg.user_name,
      authorId: msg.user_id,
      excerpt: msg.content
        ? msg.content.slice(0, 150)
        : '[Изображение]',
      timestamp: msg.created_at
    })
    textareaRef.current?.focus()
  }, [])

  const handleScrollToMessage = useCallback((messageId: string) => {
    const container = messagesContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-message-id="${messageId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('quote-highlight')
      setTimeout(() => el.classList.remove('quote-highlight'), 1500)
    }
  }, [])

  const handleSend = async () => {
    const content = newMessage.trim()
    const hasImages = pendingImages.length > 0
    if ((!content && !hasImages) || sending || !currentUser) return

    setError(null)
    setSending(true)

    // Upload images first if any
    let mediaLinks: string[] = []
    if (hasImages) {
      setUploadingImages(true)
      try {
        mediaLinks = await uploadImages()
      } catch (err) {
        setError('Ошибка загрузки изображений')
        setSending(false)
        setUploadingImages(false)
        return
      }
      setUploadingImages(false)
    }

    // Build reply_to payload for API
    const replyToPayload = quotedMessage
      ? { id: quotedMessage.id, author_name: quotedMessage.authorName, excerpt: quotedMessage.excerpt }
      : null

    // Optimistic message with temp id
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: ConversationMessage = {
      id: tempId,
      user_id: currentUser.id,
      user_name: currentUser.displayName || currentUser.username,
      user_photo_url: currentUser.photoURL || null,
      content,
      media_links: mediaLinks,
      created_at: new Date().toISOString(),
      reply_to: replyToPayload,
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessage('')
    setPendingImages([])
    setQuotedMessage(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setTimeout(scrollToBottom, 50)

    try {
      const response = await forumAPI.sendConversationMessage(content, mediaLinks, replyToPayload) as { message: ConversationMessage }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...response.message, media_links: response.message.media_links || [] } : m))
      )
    } catch (err) {
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
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length
        ta.focus()
      }, 0)
    } else {
      setNewMessage((prev) => prev + emoji)
    }
    setShowEmojiPicker(false)
  }

  const openLightbox = (images: string[], index: number) => {
    setLightbox({ images, index })
  }

  const hasContent = newMessage.trim().length > 0 || pendingImages.length > 0

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
        {/* Loading older indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-2 text-gray-400 text-xs">
            <Loader2Icon className="w-4 h-4 animate-spin mr-1" />
            Загрузка...
          </div>
        )}

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
            const images = msg.media_links || []
            return (
              <div key={msg.id} data-message-id={msg.id} className={`group flex gap-2 text-sm items-start rounded px-2 py-1 ${isOwn ? 'bg-blue-50' : ''}`}>
                <Link href={`/profile/${msg.user_id}`} className="flex-shrink-0 mt-0.5">
                  <UserAvatar name={msg.user_name} photoUrl={msg.user_photo_url} size={24} />
                </Link>
                <div className="min-w-0 flex-1">
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
                  {/* Quoted message block */}
                  {msg.reply_to && (
                    <QuoteBlock
                      authorName={msg.reply_to.author_name}
                      excerpt={msg.reply_to.excerpt}
                      sourceId={msg.reply_to.id}
                      onClickSource={handleScrollToMessage}
                    />
                  )}
                  {msg.content && (
                    <p className="text-gray-800 break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {/* Image thumbnails */}
                  {images.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5">
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => openLightbox(images, idx)}
                          className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-gray-200 hover:border-blue-400 hover:opacity-90 transition-all cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Reply button */}
                {currentUser && !msg.id.startsWith('temp-') && (
                  <button
                    type="button"
                    onClick={() => handleQuoteMessage(msg)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-500"
                    title="Ответить"
                    aria-label={`Ответить на сообщение ${msg.user_name}`}
                  >
                    <ReplyIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Admin delete button */}
                {isAdmin && !msg.id.startsWith('temp-') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    disabled={deletingId === msg.id}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                    title="Удалить сообщение"
                  >
                    {deletingId === msg.id ? (
                      <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2Icon className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
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
            {/* Pending image previews */}
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-2">
                {pendingImages.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePendingImage(idx)}
                      className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {pendingImages.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Quote chip preview */}
            {quotedMessage && (
              <QuoteChip quote={quotedMessage} onDismiss={() => setQuotedMessage(null)} compact />
            )}

            {/* Upload progress */}
            {uploadingImages && (
              <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                <Loader2Icon className="w-3 h-3 animate-spin" />
                Загрузка изображений...
              </div>
            )}

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

              {/* Image upload button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || pendingImages.length >= MAX_IMAGES}
                  className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={pendingImages.length >= MAX_IMAGES ? `Максимум ${MAX_IMAGES} изображения` : 'Прикрепить изображение'}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
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
                disabled={sending || !hasContent}
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

      {/* Fullscreen Image Lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

export default React.memo(ConversationHub)
