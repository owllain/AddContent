import Header from '@editorjs/header';
import List from '@editorjs/list';
import Image from '@editorjs/image';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import InlineCode from '@editorjs/inline-code';
import Underline from '@editorjs/underline';
import Marker from '@editorjs/marker';
import Delimiter from '@editorjs/delimiter';
import Checklist from '@editorjs/checklist';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';

export const EDITOR_JS_TOOLS = {
  header: {
    class: Header,
    config: {
      placeholder: 'Introduce un título...',
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
    },
    inlineToolbar: true,
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: 'unordered'
    }
  },
  // Checklist is often redundant with List in some configurations or user preference
  // We remove it here as requested to avoid duplication
  image: {
    class: Image,
    config: {
      endpoints: {
        byFile: '/api/upload/image', // We'll need to implement this or use base64
        byUrl: '/api/upload/image-url',
      }
    }
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: 'Introduce una cita...',
      captionPlaceholder: 'Autor de la cita',
    },
  },
  table: {
    class: Table,
    inlineToolbar: true,
  },
  code: {
    class: Code,
    config: {
      placeholder: 'Pega tu código aquí...'
    }
  },
  inlineCode: {
    class: InlineCode,
    shortcut: 'CMD+SHIFT+M',
  },
  underline: Underline,
  marker: Marker,
  delimiter: Delimiter,
  linkTool: {
    class: LinkTool,
    config: {
      endpoint: '/api/link-preview', // Interface for link previews
    }
  },
};
