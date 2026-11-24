import type { Monaco } from '@monaco-editor/react'

export function defineCourseEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme('resistenciaTheme', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'identifier', foreground: '3E3030' },
      { token: 'variable', foreground: '3E3030' },

      { token: 'keyword', foreground: '8B0000', fontStyle: 'bold' },
      { token: 'keyword.md', foreground: '8B0000', fontStyle: 'bold' },
      { token: 'tag', foreground: '8B0000', fontStyle: 'bold' },
      { token: 'tag.html', foreground: '8B0000', fontStyle: 'bold' },
      { token: 'tag.md', foreground: '8B0000', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: '8B0000', fontStyle: 'bold' },

      { token: 'attribute.name', foreground: 'A52A2A' },
      { token: 'attribute.name.html', foreground: 'A52A2A' },
      { token: 'attribute.name.md', foreground: 'A52A2A' },

      { token: 'string', foreground: '8A5A20' },
      { token: 'string.html', foreground: '8A5A20' },
      { token: 'string.md', foreground: '8A5A20' },
      { token: 'string.xml', foreground: '8A5A20' },
      { token: 'string.link.md', foreground: '8A5A20', fontStyle: 'underline' },
      { token: 'attribute.value', foreground: '8A5A20' },
      { token: 'attribute.value.html', foreground: '8A5A20' },
      { token: 'attribute.value.md', foreground: '8A5A20' },

      { token: 'constant', foreground: '9B3F3F' },
      { token: 'type', foreground: '9B3F3F' },
      { token: 'math.md', foreground: '9B3F3F' },

      { token: 'number', foreground: '7A5A8E' },

      { token: 'comment', foreground: '756565', fontStyle: 'italic' },
      { token: 'delimiter', foreground: '756565' },
      { token: 'delimiter.html', foreground: '756565' },
      { token: 'delimiter.md', foreground: '756565' },

      { token: 'invalid', foreground: '3E3030' },
      { token: 'escape', foreground: '3E3030' },
      { token: 'string.escape', foreground: '3E3030' },
      { token: 'keyword.escape', foreground: '3E3030' },
      { token: 'punctuation', foreground: '756565' },
      { token: 'punctuation.md', foreground: '756565' },
    ],
    colors: {
      'editor.foreground': '#3E3030',
      'editor.background': '#FCF9F7',
      'editorCursor.foreground': '#8B0000',
      'editor.lineHighlightBackground': '#8B000012',
      'editorLineNumber.foreground': '#E5D7D4',
      'editorLineNumber.activeForeground': '#8B0000',
      'editor.selectionBackground': '#F3D9D7',
      'editorBracketHighlight.unexpectedBracket.foreground': '#3E3030',
      'editorError.foreground': '#3E3030',
    }
  })
}
