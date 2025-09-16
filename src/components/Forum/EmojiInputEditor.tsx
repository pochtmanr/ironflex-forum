import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import './emoji-input-fix.css';

interface EmojiInputEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onGifSelect?: (gifUrl: string) => void;
}

interface EmojiInputEditorRef {
  insertMention: (username: string) => void;
  focus: () => void;
  insertGif: (gifUrl: string) => void;
  insertFormatting: (format: string) => void;
  toggleEmojiPicker: (anchor?: HTMLElement | { x: number; y: number; height?: number }) => void;
}

const EmojiInputEditor = forwardRef<EmojiInputEditorRef, EmojiInputEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Начните писать...',
  className = '',
  disabled = false,
  autoFocus = false,
  onGifSelect
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number; height?: number } | null>(null);

  // Manage body scroll lock based on picker visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.body.classList.add('emoji-picker-open');
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.classList.remove('emoji-picker-open');
    }

    return () => {
      document.body.classList.remove('emoji-picker-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmojiPicker]);

  // Handle emoji picker visibility to fix container overflow issues
  useEffect(() => {
    const handlePickerToggle = () => {
      // Find all parent containers and temporarily fix overflow
      const containers = document.querySelectorAll('.bg-white.shadow-md, .max-w-9xl, .space-y-4');
      containers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.classList.add('has-emoji-picker-open');
        }
      });

      // Clean up after a delay
      const cleanup = () => {
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.classList.remove('has-emoji-picker-open');
          }
        });
      };

      return cleanup;
    };

    const container = containerRef.current;
    if (container) {
      // Listen for emoji picker events
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const pickerExists = document.querySelector('.react-input-emoji--picker');
            if (pickerExists) {
              handlePickerToggle();
            }
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  const insertMention = (username: string) => {
    const currentValue = value || '';
    const newValue = currentValue + `@${username} `;
    onChange(newValue);
  };

  const insertGif = (gifUrl: string) => {
    const currentValue = value || '';
    const newValue = currentValue + `![GIF](${gifUrl}) `;
    onChange(newValue);
    setShowGifPicker(false);
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const currentValue = value || '';
    
    let newText = '';
    let newCursorStart = start;
    let newCursorEnd = end;
    
    switch (format) {
      case 'bold':
        if (selectedText) {
          newText = currentValue.substring(0, start) + '**' + selectedText + '**' + currentValue.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        } else {
          newText = currentValue.substring(0, start) + '**текст**' + currentValue.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 7;
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = currentValue.substring(0, start) + '*' + selectedText + '*' + currentValue.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = end + 1;
        } else {
          newText = currentValue.substring(0, start) + '*текст*' + currentValue.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = start + 6;
        }
        break;
      case 'strikethrough':
        if (selectedText) {
          newText = currentValue.substring(0, start) + '~~' + selectedText + '~~' + currentValue.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = end + 2;
        } else {
          newText = currentValue.substring(0, start) + '~~текст~~' + currentValue.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 6;
        }
        break;
      case 'code':
        if (selectedText) {
          newText = currentValue.substring(0, start) + '`' + selectedText + '`' + currentValue.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = end + 1;
        } else {
          newText = currentValue.substring(0, start) + '`код`' + currentValue.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = start + 3;
        }
        break;
      case 'link':
        newText = currentValue.substring(0, start) + '[ссылка](url)' + currentValue.substring(end);
        newCursorStart = start + 1;
        newCursorEnd = start + 7;
        break;
      case 'linebreak':
        newText = currentValue.substring(0, start) + '\n' + currentValue.substring(end);
        newCursorStart = start + 1;
        newCursorEnd = start + 1;
        break;
      default:
        return;
    }
    
    onChange(newText);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (textarea) {
        textarea.setSelectionRange(newCursorStart, newCursorEnd);
        textarea.focus();
      }
    }, 0);
  };

  const focus = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      insertFormatting('linebreak');
    }
  };

  const handleEmojiClick = (emojiData: any, event?: any) => {
    // Prevent default to avoid page scrolling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value || '';
    const newText = currentValue.substring(0, start) + emojiData.emoji + currentValue.substring(end);
    
    onChange(newText);
    setShowEmojiPicker(false);
    
    // Set cursor position after emoji
    setTimeout(() => {
      if (textarea) {
        textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        textarea.focus();
      }
    }, 0);
  };

  const handleGifSelect = (gifUrl: string) => {
    insertGif(gifUrl);
    if (onGifSelect) {
      onGifSelect(gifUrl);
    }
  };

  const toggleEmojiPicker = (anchor?: HTMLElement | { x: number; y: number; height?: number }) => {
    if (anchor && (anchor as HTMLElement).getBoundingClientRect) {
      const rect = (anchor as HTMLElement).getBoundingClientRect();
      setAnchorPosition({ x: rect.left, y: rect.bottom, height: rect.height });
    } else if (anchor && (anchor as any).x !== undefined && (anchor as any).y !== undefined) {
      setAnchorPosition(anchor as { x: number; y: number; height?: number });
    } else {
      // Fallback to center of the textarea
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        setAnchorPosition({ x: rect.left + rect.width / 2 - 175, y: rect.top });
      }
    }
    setShowEmojiPicker((prev) => !prev);
  };

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('emoji-picker-open');
    };
  }, []);

  useImperativeHandle(ref, () => ({
    insertMention,
    focus,
    insertGif,
    insertFormatting,
    toggleEmojiPicker
  }));

  return (
    <div ref={containerRef} className="relative">
      {/* Main Input Area - just the textarea */}
      <div className="px-4 py-2 bg-white rounded-t-lg dark:bg-gray-800">
        <label htmlFor="comment" className="sr-only">Your comment</label>
        <textarea
          ref={textareaRef}
          id="comment"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full px-0 text-sm text-gray-900 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
          style={{ resize: 'none' }}
          rows={4}
          required
        />
      </div>

      {/* Emoji Picker - Positioned Above Input */}
      {showEmojiPicker && anchorPosition && createPortal(
        <>
          <div 
            className="z-[999999] bg-white border border-gray-200 rounded-lg shadow-lg"
            style={{
              position: 'fixed',
              top: Math.min(anchorPosition.y + 8, (window.innerHeight - 410)),
              left: Math.max(8, Math.min((anchorPosition.x ?? 0), window.innerWidth - 358)),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={false}
              previewConfig={{ showPreview: false }}
              searchPlaceHolder="Поиск эмодзи..."
              lazyLoadEmojis={true}
              autoFocusSearch={false}
            />
          </div>
          <div 
            className="fixed inset-0 z-[999998]" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEmojiPicker(false);
            }}
          />
        </>
      , document.body)}
    </div>
  );
});

EmojiInputEditor.displayName = 'EmojiInputEditor';

export default EmojiInputEditor;
export type { EmojiInputEditorRef };
