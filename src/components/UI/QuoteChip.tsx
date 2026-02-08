'use client'

import React from 'react'
import { XIcon } from 'lucide-react'

export interface QuotedMessage {
  id: string
  authorName: string
  authorId: string
  excerpt: string
  timestamp: string
}

interface QuoteChipProps {
  quote: QuotedMessage
  onDismiss: () => void
  compact?: boolean
}

function formatQuoteTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const QuoteChip: React.FC<QuoteChipProps> = ({ quote, onDismiss, compact = false }) => {
  const maxLen = compact ? 80 : 120
  const truncated = quote.excerpt.length > maxLen
    ? quote.excerpt.slice(0, maxLen) + '...'
    : quote.excerpt

  return (
    <div
      role="status"
      aria-label={`Цитата: ${quote.authorName}: ${truncated}`}
      className="flex items-start gap-2 bg-gray-100 border-l-3 border-blue-500 rounded-r px-3 py-2 mb-2 animate-in slide-in-from-top-2 duration-150"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-blue-700">{quote.authorName}</span>
          <span className="text-gray-400">&middot;</span>
          <span className="text-gray-400">{formatQuoteTime(quote.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-600 truncate mt-0.5">{truncated}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Удалить цитату"
        className="flex-shrink-0 p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
