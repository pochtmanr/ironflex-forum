'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { chatSettingsAPI } from '@/services/api'
import { Loader2Icon, PlusIcon, XIcon, ShieldBanIcon, MessageSquareOffIcon, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

interface BlacklistedWord {
  id: string
  word: string
  created_at: string
}

interface ChatBan {
  id: string
  user_id: string
  user_name: string
  user_photo_url: string | null
  reason: string | null
  banned_at: string
  expires_at: string | null
  is_active: boolean
}

type Tab = 'blacklist' | 'bans'

export default function ChatSettingsPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('blacklist')

  // Blacklist state
  const [words, setWords] = useState<BlacklistedWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [loadingWords, setLoadingWords] = useState(true)
  const [addingWord, setAddingWord] = useState(false)
  const [wordError, setWordError] = useState<string | null>(null)

  // Bans state
  const [bans, setBans] = useState<ChatBan[]>([])
  const [loadingBans, setLoadingBans] = useState(true)
  const [banUserId, setBanUserId] = useState('')
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState<string>('0') // 0 = permanent, hours otherwise
  const [addingBan, setAddingBan] = useState(false)
  const [banError, setBanError] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser === undefined) return
    if (!currentUser || !currentUser.isAdmin) {
      router.push('/')
      return
    }
    loadBlacklist()
    loadBans()
  }, [currentUser, router])

  const loadBlacklist = async () => {
    try {
      const res = await chatSettingsAPI.getBlacklist() as { words: BlacklistedWord[] }
      setWords(res.words || [])
    } catch (err) {
      console.error('Failed to load blacklist:', err)
    } finally {
      setLoadingWords(false)
    }
  }

  const loadBans = async () => {
    try {
      const res = await chatSettingsAPI.getBans() as { bans: ChatBan[] }
      setBans(res.bans || [])
    } catch (err) {
      console.error('Failed to load bans:', err)
    } finally {
      setLoadingBans(false)
    }
  }

  const handleAddWord = async () => {
    const word = newWord.trim()
    if (!word || addingWord) return
    setWordError(null)
    setAddingWord(true)

    try {
      const res = await chatSettingsAPI.addBlacklistWord(word) as { word: BlacklistedWord }
      setWords((prev) => [res.word, ...prev])
      setNewWord('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setWordError(msg)
    } finally {
      setAddingWord(false)
    }
  }

  const handleRemoveWord = async (id: string) => {
    try {
      await chatSettingsAPI.removeBlacklistWord(id)
      setWords((prev) => prev.filter((w) => w.id !== id))
    } catch (err) {
      console.error('Failed to remove word:', err)
    }
  }

  const handleBanUser = async () => {
    if (!banUserId.trim() || addingBan) return
    setBanError(null)
    setAddingBan(true)

    try {
      const duration = parseInt(banDuration) || 0
      await chatSettingsAPI.banUser(banUserId.trim(), banReason.trim() || undefined, duration || undefined)
      setBanUserId('')
      setBanReason('')
      setBanDuration('0')
      // Reload bans to get fresh data with user names
      await loadBans()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      setBanError(msg)
    } finally {
      setAddingBan(false)
    }
  }

  const handleUnban = async (banId: string) => {
    try {
      await chatSettingsAPI.unbanUser(banId)
      setBans((prev) => prev.filter((b) => b.id !== banId))
    } catch (err) {
      console.error('Failed to unban:', err)
    }
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center text-gray-500">Проверка прав доступа...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Настройки чата</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('blacklist')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'blacklist'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquareOffIcon className="w-4 h-4" />
          Запрещённые слова
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bans')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldBanIcon className="w-4 h-4" />
          Блокировки пользователей
        </button>
      </div>

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Сообщения, содержащие эти слова или фразы, будут заблокированы. Проверка нечувствительна к регистру.
          </p>

          {/* Add word form */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="Введите слово или фразу..."
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              maxLength={100}
            />
            <button
              type="button"
              onClick={handleAddWord}
              disabled={addingWord || !newWord.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {addingWord ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
              Добавить
            </button>
          </div>
          {wordError && <p className="text-red-500 text-xs mb-3">{wordError}</p>}

          {/* Word list */}
          {loadingWords ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
              Загрузка...
            </div>
          ) : words.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Чёрный список пуст
            </div>
          ) : (
            <div className="space-y-2">
              {words.map((w) => (
                <div key={w.id} className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2">
                  <span className="text-sm text-gray-800 font-mono">{w.word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(w.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Удалить"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bans Tab */}
      {activeTab === 'bans' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Заблокированные пользователи не могут отправлять сообщения в общий чат.
          </p>

          {/* Ban user form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Заблокировать пользователя</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ID пользователя (UUID)</label>
                <input
                  type="text"
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  placeholder="Вставьте UUID пользователя..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Причина (необязательно)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Укажите причину блокировки..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Длительность</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="0">Навсегда</option>
                  <option value="1">1 час</option>
                  <option value="6">6 часов</option>
                  <option value="24">24 часа</option>
                  <option value="72">3 дня</option>
                  <option value="168">1 неделя</option>
                  <option value="720">30 дней</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleBanUser}
                disabled={addingBan || !banUserId.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {addingBan ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <ShieldBanIcon className="w-4 h-4" />}
                Заблокировать
              </button>
              {banError && <p className="text-red-500 text-xs">{banError}</p>}
            </div>
          </div>

          {/* Active bans list */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Активные блокировки</h3>
          {loadingBans ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
              Загрузка...
            </div>
          ) : bans.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Нет активных блокировок
            </div>
          ) : (
            <div className="space-y-2">
              {bans.map((ban) => (
                <div key={ban.id} className="flex items-center justify-between bg-white border border-gray-200 rounded px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {ban.user_name}
                      <span className="text-gray-400 text-xs ml-2 font-mono">{ban.user_id.slice(0, 8)}...</span>
                    </div>
                    {ban.reason && <div className="text-xs text-gray-500 mt-0.5">Причина: {ban.reason}</div>}
                    <div className="text-xs text-gray-400 mt-0.5">
                      {ban.expires_at
                        ? `Истекает: ${new Date(ban.expires_at).toLocaleString('ru-RU')}`
                        : 'Навсегда'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnban(ban.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Разблокировать
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
