import { useEffect, useId, useRef } from 'react'
import Editor, { type EditorProps, type OnMount } from '@monaco-editor/react'
import { replaceEditorText, type MarkdownEditorInstance } from '@/lib/editor-history'

type Props = Omit<EditorProps, 'value' | 'defaultValue' | 'path'> & { value: string; documentId: string }

/** Own the model for the document, independently of preview layout and React state. */
export default function MarkdownEditor({ value, documentId, onMount, onChange, ...props }: Props) {
  const instance = useId()
  const editor = useRef<MarkdownEditorInstance | null>(null)
  const latest = useRef(value)
  const emitted = useRef<string | undefined>()
  latest.current = value
  useEffect(() => {
    if (editor.current && value !== emitted.current) replaceEditorText(editor.current, value)
  }, [value, documentId])
  const mount: OnMount = (current, monaco) => {
    editor.current = current
    replaceEditorText(current, latest.current)
    onMount?.(current, monaco)
  }
  return <Editor {...props} key={documentId} path={`inmemory://mc361/${encodeURIComponent(instance)}/${encodeURIComponent(documentId)}.md`} defaultValue={value} onMount={mount} onChange={(text, event) => { emitted.current = text; onChange?.(text, event) }} />
}
