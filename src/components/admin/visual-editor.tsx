'use client';

import React from 'react';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditorMethods,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  imagePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  directivesPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  Separator,
  CreateLink,
  InsertTable,
  BlockTypeSelect,
  InsertCodeBlock,
  InsertAdmonition,
  ConditionalContents,
  ChangeAdmonitionType,
  InsertImage,
  AdmonitionDirectiveDescriptor,
  StrikeThroughSupSubToggles,
  CodeToggle,
} from '@mdxeditor/editor';
import { Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import '@mdxeditor/editor/style.css';


/**
 * Custom toolbar component to delete the currently selected block.
 * This is the "trashcan" functionality requested by the user.
 */
function DeleteBlockButton() {
  return (
    <button
      type="button"
      title="Borrar bloque"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors"
      onClick={() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Delete',
          bubbles: true,
          cancelable: true,
        });
        document.querySelector('.mdxeditor-rich [contenteditable="true"]')?.dispatchEvent(event);
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/**
 * Custom buttons for text alignment using HTML div wrappers
 */
function AlignmentButtons({ editorRef }: { editorRef: React.RefObject<MDXEditorMethods | null> }) {
  const applyAlignment = (align: string) => {
    // We use a simplified approach: wrap selection or current block in a div
    // Since MDXEditor is Lexical based, we can use insertMarkdown
    // Note: This is an additive action.
    editorRef.current?.insertMarkdown(`\n<div style="text-align: ${align}">\n\nContenido alineado\n\n</div>\n`);
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => applyAlignment('left')} className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100" title="Alinear Izquierda"><AlignLeft className="h-4 w-4" /></button>
      <button onClick={() => applyAlignment('center')} className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100" title="Centrar"><AlignCenter className="h-4 w-4" /></button>
      <button onClick={() => applyAlignment('right')} className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100" title="Alinear Derecha"><AlignRight className="h-4 w-4" /></button>
      <button onClick={() => applyAlignment('justify')} className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100" title="Justificar"><AlignJustify className="h-4 w-4" /></button>
    </div>
  );
}

interface VisualEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  editorRef?: React.RefObject<MDXEditorMethods | null>;
}

/**
 * VisualEditor component using MDXEditor.
 * This is a highly customizable WYSIWYG editor that generates Markdown.
 */
export default function VisualEditor({ markdown, onChange, editorRef }: VisualEditorProps) {
  return (
    <div className="visual-editor-container bg-[var(--mc-white)] overflow-hidden">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={onChange}
        className="mc-body mdxeditor-rich"
        contentEditableClassName="prose max-w-none min-h-[600px] p-8 focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          imagePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', html: 'HTML', python: 'Python' } }),
          directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'source' }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--mc-canvas)] border-b border-[var(--mc-dust-taupe)]">
                <DeleteBlockButton />
                <Separator />
                <AlignmentButtons editorRef={editorRef as any} />
                <Separator />
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles options={['Strikethrough']} />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <InsertImage />
                <CreateLink />
                <InsertTable />
                <Separator />
                <InsertCodeBlock />
                <InsertAdmonition />
                <ConditionalContents
                  options={[
                    { when: (editor) => editor?.editorType === 'admonition', contents: () => <ChangeAdmonitionType /> },
                  ]}
                />
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
