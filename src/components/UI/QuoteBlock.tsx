'use client'

import React, { useCallback } from 'react'
import { CornerUpRightIcon } from 'lucide-react'

interface QuoteBlockProps {
  authorName: string
  excerpt: string
  sourceId?: string | null
  onClickSource?: (id: string) => void
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ authorName, excerpt, sourceId, onClickSource }) => {
  const isDeleted = !sourceId
  const maxLen = 200
  const truncated = excerpt.length > maxLen ? excerpt.slice(0, maxLen) + '...' : excerpt

  const handleClick = useCallback(() => {
    if (!sourceId || !onClickSource) return
    onClickSource(sourceId)
  }, [sourceId, onClickSource])

  return (
    <div
      role="blockquote"
      aria-label={`Цитата от ${authorName}`}
      className={`border-l-3 rounded-r px-3 py-2 mb-2 text-xs ${
        isDeleted
          ? 'border-gray-300 bg-gray-50'
          : 'border-blue-400 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors'
      }`}
      onClick={isDeleted ? undefined : handleClick}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {!isDeleted && <CornerUpRightIcon className="w-3 h-3 text-blue-500" />}
        <span className={`font-semibold ${isDeleted ? 'text-gray-400' : 'text-blue-700'}`}>
          {isDeleted ? 'Сообщение удалено' : `${authorName} написал(а):`}
        </span>
      </div>
      {!isDeleted && (
        <p className="text-gray-600 break-words whitespace-pre-wrap">{truncated}</p>
      )}
    </div>
  )
}
