'use client';

import React, { useEffect, useRef } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { EDITOR_JS_TOOLS } from './editor-js-config';

interface EditorJsWrapperProps {
  data: string; // JSON string format
  onChange: (data: string) => void;
  holder: string;
}

export default function EditorJsWrapper({ data, onChange, holder }: EditorJsWrapperProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef(false);

  // Helper to parse data safely
  const parseData = (jsonStr: string): OutputData => {
    try {
      if (!jsonStr || jsonStr.trim() === '') return { blocks: [] };
      return JSON.parse(jsonStr);
    } catch (e) {
      // If it's not valid JSON, it might be legacy Markdown. 
      // We return empty blocks and handle detection elsewhere if needed.
      return { blocks: [] };
    }
  };

  useEffect(() => {
    if (!isInitialized.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: EDITOR_JS_TOOLS as any,
        data: parseData(data),
        placeholder: 'Escribe algo increíble para tu CMS...',
        onChange: async (api) => {
          const content = await api.saver.save();
          onChange(JSON.stringify(content));
        },
        onReady: () => {
          console.log('[AddContent Editor] Editor.js is ready');
          editorRef.current = editor;
        },
      });

      isInitialized.current = true;
    }

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
        editorRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []); // Only initialize once

  return (
    <div className="editor-js-container p-8 min-h-[600px] flex justify-center">
      <div id={holder} className="prose max-w-none text-[var(--mc-ink)] w-full max-w-[900px] pl-[60px]" />
      <style jsx global>{`
        .ce-block__content, .ce-toolbar__content {
          max-width: 800px;
          margin-left: 0; /* Align with the pl-[60px] to ensure space for toolbox */
        }
        .ce-toolbar__content {
          max-width: 820px;
        }
        .ce-header {
           font-family: 'Sofia Sans', sans-serif;
           font-weight: 500;
           color: var(--mc-ink);
        }
        .ce-paragraph {
           font-size: 16px;
           line-height: 1.6;
        }
        .editor-js-container .prose h1 { font-size: 2.5rem; margin-top: 2rem; }
        .editor-js-container .prose h2 { font-size: 2rem; margin-top: 1.5rem; }
        .ce-toolbar__plus, .ce-toolbar__settings-btn {
           background-color: var(--mc-white);
           border: 1px solid var(--mc-dust-taupe);
           color: var(--mc-ink);
           transition: all 0.2s ease;
        }
        .ce-toolbar__plus:hover, .ce-toolbar__settings-btn:hover {
           background-color: var(--mc-canvas);
           transform: scale(1.1);
        }
        .ce-toolbar {
           left: -10px; /* Slight offset to keep it within the pl-[60px] zone */
        }
        .codex-editor--narrow .ce-toolbox {
           left: 0;
        }
      `}</style>
    </div>
  );
}
