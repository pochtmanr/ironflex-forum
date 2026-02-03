'use client'

import React from 'react';
import {
  DecoratorNode,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  $createParagraphNode,
  $isNodeSelection,
  $getSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
} from 'lexical';
import type { Klass } from 'lexical';
import type { TextMatchTransformer } from '@lexical/markdown';

export type SerializedImageNode = {
  type: 'image';
  version: 1;
  src: string;
  altText: string;
};

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode.src, serializedNode.altText);
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'block';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    img.setAttribute('alt', this.__altText);
    img.style.maxWidth = '100%';
    img.style.maxHeight = '400px';
    img.style.height = 'auto';
    return { element: img };
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): React.ReactElement {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          maxWidth: '100%',
          maxHeight: '400px',
          height: 'auto',
          display: 'block',
          borderRadius: '4px',
          margin: '8px 0',
        }}
        draggable={false}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

export function $createImageNode(src: string, altText: string): ImageNode {
  return new ImageNode(src, altText);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

// Markdown transformer: ![alt](url) <-> ImageNode
export const IMAGE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ImageNode] as Array<Klass<LexicalNode>>,
  export: (node: LexicalNode) => {
    if (!$isImageNode(node)) return null;
    return `![${node.__altText}](${node.__src})`;
  },
  importRegExp: /!(?:\[([^\]]*)\])(?:\(([^)]+)\))/,
  regExp: /!(?:\[([^\]]*)\])(?:\(([^)]+)\))$/,
  replace: (textNode, match) => {
    const altText = match[1] || '';
    const src = match[2];
    const imageNode = $createImageNode(src, altText);
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};
