import { useEffect, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { defineCourseEditorTheme } from '@/lib/markdown-editor-theme'
import { captureReviewScroll, restoreReviewScroll, reviewSourceDecorations, reviewSourceOptions, type ReviewLineChange, type ReviewScrollPosition, type ReviewSide } from '@/lib/content-review-editor'

type Instance = Parameters<OnMount>[0]

/** A separate readonly model: scrolling this pane never changes the other editor. */
export default function ReviewSourcePane({ value, path, side, changes, wrap, position, onScroll }: {
  value: string; path: string; side: ReviewSide; changes: ReviewLineChange[] | null; wrap: boolean
  position: ReviewScrollPosition; onScroll: (position: ReviewScrollPosition) => void
}) {
  const editor = useRef<Instance | null>(null)
  const decoration = useRef<ReturnType<Instance['createDecorationsCollection']> | null>(null)
  const subscription = useRef<{ dispose(): void } | null>(null)
  const latest = useRef({ changes, position, onScroll })
  latest.current = { changes, position, onScroll }
  useEffect(() => { decoration.current?.set(reviewSourceDecorations(changes, side)) }, [changes, side])
  useEffect(() => () => { subscription.current?.dispose(); editor.current = null; decoration.current = null }, [])
  const mount: OnMount = current => {
    editor.current = current
    decoration.current = current.createDecorationsCollection(reviewSourceDecorations(latest.current.changes, side))
    restoreReviewScroll(current, latest.current.position)
    subscription.current = current.onDidScrollChange(() => latest.current.onScroll(captureReviewScroll(current)))
  }
  return <section className="min-h-0 min-w-0 overflow-hidden bg-[#FCF9F7]" aria-label={side === 'original' ? 'Publicado antes · desplazamiento independiente' : 'Propuesta después · desplazamiento independiente'}>
    <Editor height="100%" path={path} value={value} language="markdown" beforeMount={defineCourseEditorTheme} theme="resistenciaTheme" onMount={mount} options={{ ...reviewSourceOptions(wrap), ariaLabel: side === 'original' ? 'Publicado antes, solo lectura' : 'Propuesta después, solo lectura' }} loading={<p role="status" className="p-4 text-sm">Preparando panel independiente…</p>} />
  </section>
}
