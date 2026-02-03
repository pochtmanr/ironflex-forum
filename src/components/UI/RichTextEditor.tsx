'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import {
  $getRoot,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  EditorState,
} from 'lexical';
import {
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_STAR,
  ITALIC_STAR,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
} from '@lexical/markdown';
import type { Transformer } from '@lexical/markdown';
import { ImageNode, $createImageNode, IMAGE_TRANSFORMER } from './ImageNode';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}

// All transformers used for markdown <-> Lexical conversion
const EDITOR_TRANSFORMERS: Array<Transformer> = [
  IMAGE_TRANSFORMER,
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  INLINE_CODE,
  BOLD_STAR,
  ITALIC_STAR,
  STRIKETHROUGH,
  LINK,
];

// Toolbar component
function ToolbarPlugin({ onImageUpload }: { onImageUpload?: (file: File) => Promise<string> }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Update toolbar state based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const emojis = [
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
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
    '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
    '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗',
    '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️',
    '⭐', '🌟', '✨', '⚡', '🔥', '💥', '💫', '🌈',
    '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️',
    '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧',
    '💦', '☔', '🌊', '🌍', '🌎', '🌏', '🪐', '💫',
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
    '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
    '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
    '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣',
    '🎯', '🪀', '🪁', '🎮', '🕹️', '🎰', '🎲', '🧩',
    '♟️', '🎭', '🎨', '🧵', '🪡', '🧶', '🪢', '👓',
    '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣',
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
    '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
    '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️',
    '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
    '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈',
    '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
    '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮',
    '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜',
    '✅', '❌', '❎', '✔️', '☑️', '💯', '🔞', '🆘',
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫',
    '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫'
  ];

  const insertEmoji = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(emoji);
      }
    });
    setShowEmojiPicker(false);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.trim();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent();
        // If text is selected, wrap it as a link; otherwise use URL as label
        const label = selectedText || url;
        selection.insertRawText(`[${label}](${url})`);
      }
    });
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode(imageUrl, file.name);
          selection.insertNodes([imageNode]);
        } else {
          // Fallback: append to end
          const root = $getRoot();
          const paragraph = $createParagraphNode();
          const imageNode = $createImageNode(imageUrl, file.name);
          paragraph.append(imageNode);
          root.append(paragraph);
        }
      });
      e.target.value = '';
    } catch (error) {
      alert('Ошибка загрузки изображения');
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 flex-wrap bg-gray-50 p-2 relative">
      <button
        type="button"
        onClick={formatBold}
        className={`p-2 hover:bg-gray-200 rounded transition-colors ${isBold ? 'bg-blue-200 text-blue-800' : 'text-gray-700'}`}
        title="Жирный (Ctrl+B)"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={formatItalic}
        className={`p-2 hover:bg-gray-200 rounded transition-colors ${isItalic ? 'bg-blue-200 text-blue-800' : 'text-gray-700'}`}

        title="Курсив (Ctrl+I)"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="14" y1="4" x2="10" y2="20" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={formatStrikethrough}
        className={`p-2 hover:bg-gray-200 rounded transition-colors ${isStrikethrough ? 'bg-blue-200 text-blue-800' : 'text-gray-700'}`}
        title="Зачеркнутый"
      >
        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M7 5h10M8 19h8" />
        </svg>
      </button>

      {/* Link Insert */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Вставить ссылку"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {showLinkInput && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-[320px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">URL (YouTube, VK, Yandex, или любая ссылка)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } }}
                placeholder="https://..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl.trim()}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Вставить
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300"></div>

      {/* Emoji Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-900/70"
          title="Вставить эмодзи"
        >
          <span className="text-base">😀</span>
        </button>

        {showEmojiPicker && (
          <>
            {/* Backdrop to close picker */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiPicker(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200/50 rounded-lg shadow-xl p-3 z-50 max-h-[300px] overflow-y-auto w-[320px]">
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="p-2 hover:bg-gray-100 rounded text-base transition-colors text-gray-900/70"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {onImageUpload && (
        <>
          <div className="w-px h-6 bg-gray-300"></div>
          <label className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-900/70 cursor-pointer" title="Загрузить изображение">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
        </>
      )}
    </div>
  );
}

// Plugin to initialize editor content from markdown value
function UpdatePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    editor.update(() => {
      // Reverse the export normalization:
      // - &nbsp; lines back to empty lines
      // - \n\n back to \n so each paragraph break = one ParagraphNode
      const normalized = (value || '')
        .replace(/&nbsp;/g, '')
        .replace(/\n\n/g, '\n');
      $convertFromMarkdownString(
        normalized,
        EDITOR_TRANSFORMERS,
        undefined,
        true
      );
    });
  }, [editor, value, isInitialized]);

  return null;
}

// Stable ErrorBoundary component - must be defined outside render to avoid remounting
function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// Stable node array - defined once outside component
const EDITOR_NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode, ImageNode];

// Stable theme object - defined once outside component
const EDITOR_THEME = {
  paragraph: 'mb-2',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
};

const onError = (error: Error) => {
  console.error(error);
};

export const RichTextEditor: React.FC<RichTextEditorProps> = React.memo(({
  value,
  onChange,
  placeholder = 'Введите текст...',
  disabled = false,
  onImageUpload,
  className = '',
}) => {
  // Memoize initialConfig so LexicalComposer doesn't reinitialize on every render
  const initialConfig = useMemo(() => ({
    namespace: 'RichTextEditor',
    theme: EDITOR_THEME,
    onError,
    nodes: EDITOR_NODES,
    editable: !disabled,
  }), [disabled]);

  // Use ref for onChange to avoid recreating handleChange
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(EDITOR_TRANSFORMERS, undefined, true);
      // Lexical with shouldPreserveNewLines=true outputs \n per paragraph.
      // Convert to CommonMark: split into lines, then rejoin so that
      // - each non-empty line gets \n\n after it (paragraph break)
      // - each empty line becomes a &nbsp; paragraph (visible blank row)
      const lines = markdown.split('\n');
      const result = lines
        .map(line => (line === '' ? '&nbsp;' : line))
        .join('\n\n');
      onChangeRef.current(result);
    });
  }, []);

  return (
    <div className={`rich-text-editor-wrapper ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin onImageUpload={onImageUpload} />
        <div className="relative rounded-b-md">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[150px] p-3 focus:outline-none text-gray-900"
                style={{ caretColor: 'black' }}
                spellCheck={false}
              />
            }
            placeholder={
              <div className="absolute top-3 left-3 text-gray-900/70 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={EDITOR_TRANSFORMERS} />
          <UpdatePlugin value={value} />
        </div>
      </LexicalComposer>

      <style jsx global>{`
        .rich-text-editor-wrapper strong {
          font-weight: bold;
        }
        .rich-text-editor-wrapper em {
          font-style: italic;
        }
        .rich-text-editor-wrapper u {
          text-decoration: underline;
        }
        .rich-text-editor-wrapper s {
          text-decoration: line-through;
        }
        .rich-text-editor-wrapper img {
          max-width: 100%;
          max-height: 400px;
          height: auto;
        }
      `}</style>
    </div>
  );
});

export default RichTextEditor;
