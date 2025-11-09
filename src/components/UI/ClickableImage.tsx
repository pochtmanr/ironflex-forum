'use client'

import React, { useState } from 'react'
import ImageLightbox from './ImageLightbox'

interface ClickableImageProps {
  src: string
  alt: string
  className?: string
}

export default function ClickableImage({ src, alt, className = '' }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className={`relative cursor-pointer group ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto rounded-lg"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
          <svg 
            className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <ImageLightbox
          src={src}
          alt={alt}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

