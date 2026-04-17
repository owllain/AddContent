'use client';

import React from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  linkPlugin,
  tablePlugin,
  imagePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  Separator,
  CreateLink,
  InsertTable,
  BlockTypeSelect,
  MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface VisualEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  editorRef?: React.RefObject<MDXEditorMethods>;
}

/**
 * VisualEditor component using MDXEditor.
 * This is a highly customizable WYSIWYG editor that generates Markdown.
 */
export default function VisualEditor({ markdown, onChange, editorRef }: VisualEditorProps) {
  return (
    <div className="visual-editor-container rounded-[20px] border border-[var(--mc-dust-taupe)] bg-[var(--mc-white)] overflow-hidden">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={onChange}
        className="mc-body mdxeditor-rich"
        contentEditableClassName="prose max-w-none min-h-[300px] p-4 focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          tablePlugin(),
          imagePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--mc-canvas)] border-b border-[var(--mc-dust-taupe)]">
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertTable />
              </div>
            ),
          }),
        ]}
      />
      <style jsx global>{`
        .visual-editor-container .mdxeditor-rich {
          --accent-color: var(--mc-light-signal-orange);
        }
        .visual-editor-container [role="toolbar"] {
          background-color: var(--mc-canvas) !important;
          border-bottom: 1px solid var(--mc-dust-taupe) !important;
        }
        .visual-editor-container .prose h1 { font-size: 2.25rem; font-weight: 500; color: var(--mc-ink); margin-bottom: 1rem; }
        .visual-editor-container .prose h2 { font-size: 1.75rem; font-weight: 500; color: var(--mc-ink); margin-bottom: 0.875rem; }
        .visual-editor-container .prose p { color: var(--mc-ink); line-height: 1.75; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
