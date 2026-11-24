import { lazy, Suspense, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { DiffEditor, type MonacoDiffEditor } from '@monaco-editor/react'
import { ArrowLeft, CheckCircle2, Columns2, FileDiff, Loader2, RefreshCw } from 'lucide-react'
import type { CourseDocument } from '@/lib/content-schema'
import { reviewHasChanges, type ContentReviewBaseline } from '@/lib/content-review'
import { loadContentReview } from '@/lib/content-review-client'
import { defineCourseEditorTheme } from '@/lib/markdown-editor-theme'
import { workspaceButtonClass } from '@/lib/workspace-controls'
import WorkspaceSwitch from '@/components/workspace-switch'
import { captureReviewScroll, configureReviewDiff, restoreReviewScroll, reviewDiffOptions, type ReviewLineChange, type ReviewSide, type ReviewScrollPosition } from '@/lib/content-review-editor'
import ReviewSourcePane from '@/components/review-source-pane'
import { ContentProvider } from '@/lib/content-context'
import PreviewErrorBoundary from '@/components/preview-error-boundary'

const ContentRenderer = lazy(() => import('@/components/content-renderer'))

interface Props {
  candidate: CourseDocument
  onClose: () => void
  onPublish: (candidate: CourseDocument, baseline: ContentReviewBaseline) => Promise<void>
  onReloadDraft: (document: CourseDocument) => void
}

/** A full-width workspace view. The editable document stays mounted in the hidden editor view. */
export default function ContentReview({ candidate, onClose, onPublish, onReloadDraft }: Props) {
  const [baseline, setBaseline] = useState<ContentReviewBaseline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [retry, setRetry] = useState(0)
  const [view, setView] = useState<'changes' | 'page'>('page')
  const [wide, setWide] = useState(false)
  const [wrap, setWrap] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  const [lineChanges, setLineChanges] = useState<ReviewLineChange[] | null>(null)
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [sourceChanged, setSourceChanged] = useState(false)
  const region = useRef<HTMLElement>(null)
  const diffEditor = useRef<MonacoDiffEditor | null>(null)
  const publishedPage = useRef<HTMLDivElement>(null)
  const proposedPage = useRef<HTMLDivElement>(null)
  const syncingPageScroll = useRef<ReviewSide | null>(null)
  const lastPageScrolled = useRef<ReviewSide>('modified')
  const positions = useRef<Record<ReviewSide, ReviewScrollPosition>>({ original: { line: 1, left: 0 }, modified: { line: 1, left: 0 } })
  const lastScrolled = useRef<ReviewSide>('modified')
  const confirming = useRef(false)
  const firstRevision = useRef<string | null>(null)
  const id = useId()
  const diffSettings = useRef({ wide, wrap })
  diffSettings.current = { wide, wrap }
  useEffect(() => { region.current?.focus({ preventScroll: true }) }, [])

  useEffect(() => {
    if (view === 'changes' && !loading && diffEditor.current) configureReviewDiff(diffEditor.current, wide, wrap)
  }, [wide, wrap])

  useEffect(() => { if (view !== 'changes' || loading) diffEditor.current = null }, [view, loading])

  useEffect(() => {
    if (!syncScroll || !wide || view !== 'changes' || !diffEditor.current) return
    configureReviewDiff(diffEditor.current, wide, wrap)
    const active = lastScrolled.current
    const pane = active === 'original' ? diffEditor.current.getOriginalEditor() : diffEditor.current.getModifiedEditor()
    restoreReviewScroll(pane, positions.current[active])
  }, [syncScroll])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1000px)')
    const update = () => setWide(media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setBaseline(null); setLineChanges(null); setError(''); setNeedsRefresh(false)
    loadContentReview(candidate.chapterId, candidate.slug, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return
        setBaseline(data)
        const changed = firstRevision.current !== null && firstRevision.current !== data.revision
        setSourceChanged(changed)
        if (changed) {
          setNeedsRefresh(true)
          setError('Hay una edición posterior. Carga el borrador actual para revisarlo antes de aprobar. Tu propuesta anterior sigue disponible en el editor.')
        } else firstRevision.current = data.revision
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la comparación.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [candidate.chapterId, candidate.slug, retry])

  async function confirm() {
    if (!baseline || loading || confirming.current || needsRefresh) return
    confirming.current = true; setPublishing(true); setError('')
    try { await onPublish(candidate, baseline) }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo publicar. El contenido sigue disponible para reintentar.')
      // Any failure requires fresh data, including a transaction rejected by a concurrent edit.
      setNeedsRefresh(true)
    } finally { confirming.current = false; setPublishing(false) }
  }

  const changed = baseline ? reviewHasChanges(baseline.published, candidate) : false
  const kind = !baseline ? '' : !baseline.published ? 'Contenido nuevo' : changed ? 'Cambios en una sección publicada' : 'Sin diferencias de contenido'
  const independent = wide && !syncScroll

  function changeScrollMode(synchronized: boolean) {
    const editor = diffEditor.current
    if (!synchronized && editor) {
      positions.current.original = captureReviewScroll(editor.getOriginalEditor())
      positions.current.modified = captureReviewScroll(editor.getModifiedEditor())
    }
    setSyncScroll(synchronized)
    if (synchronized && view === 'page') syncPageScroll(lastPageScrolled.current, true)
  }

  function syncPageScroll(side: ReviewSide, force = false) {
    if ((!syncScroll && !force) || !wide || view !== 'page') return
    const source = side === 'original' ? publishedPage.current : proposedPage.current
    const target = side === 'original' ? proposedPage.current : publishedPage.current
    const targetSide: ReviewSide = side === 'original' ? 'modified' : 'original'
    if (!source || !target) return
    const sourceRange = Math.max(0, source.scrollHeight - source.clientHeight)
    const targetRange = Math.max(0, target.scrollHeight - target.clientHeight)
    const progress = sourceRange ? source.scrollTop / sourceRange : 0
    syncingPageScroll.current = targetSide
    target.scrollTop = progress * targetRange
    target.scrollLeft = source.scrollLeft
  }

  function handlePageScroll(side: ReviewSide) {
    if (syncingPageScroll.current === side) {
      syncingPageScroll.current = null
      return
    }
    lastPageScrolled.current = side
    syncPageScroll(side)
  }

  function mountDiff(editor: MonacoDiffEditor) {
    diffEditor.current = editor
    configureReviewDiff(editor, diffSettings.current.wide, diffSettings.current.wrap)
    const update = () => setLineChanges(editor.getLineChanges())
    update()
    const updates = editor.onDidUpdateDiff(update)
    editor.onDidDispose(() => { updates.dispose(); if (diffEditor.current === editor) diffEditor.current = null })
  }

  return <section ref={region} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} tabIndex={-1} className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#fbf7f4] text-[#3b2022]">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e3caca] bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0"><h1 id={`${id}-title`} className="text-lg font-bold">Revisar cambios</h1><p id={`${id}-description`} className="mt-1 break-words text-sm text-[#765e5e]">Capítulo {candidate.chapterId} · {candidate.title}</p></div>
        <button type="button" disabled={publishing} onClick={onClose} className={workspaceButtonClass()}><ArrowLeft className="size-4" aria-hidden="true" />Volver al editor</button>
      </header>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e3caca] px-4 py-3 sm:px-6">
        <div role="group" aria-label="Forma de comparar" className="flex flex-wrap gap-2">
          <button type="button" disabled={publishing} aria-pressed={view === 'changes'} onClick={() => setView('changes')} className={`${workspaceButtonClass()} aria-pressed:bg-[#f1dddd]`}><FileDiff className="size-4" aria-hidden="true" />Cambios resaltados</button>
          <button type="button" disabled={publishing} aria-pressed={view === 'page'} onClick={() => setView('page')} className={`${workspaceButtonClass()} aria-pressed:bg-[#f1dddd]`}><Columns2 className="size-4" aria-hidden="true" />Vista de la página</button>
          {view === 'changes' && <WorkspaceSwitch label="Ajustar líneas" checked={wrap} disabled={publishing} onCheckedChange={setWrap} />}
          {wide && <WorkspaceSwitch label="Sincronizar desplazamiento" checked={syncScroll} disabled={publishing} onCheckedChange={changeScrollMode} />}
        </div>
        <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-semibold" role="status">{loading ? 'Consultando publicación…' : kind}</span><button type="button" disabled={loading || publishing} onClick={() => setRetry(value => value + 1)} className={workspaceButtonClass()}><RefreshCw className="size-4" aria-hidden="true" />Actualizar comparación</button></div>
      </div>
      {error && <div role="alert" className="shrink-0 border-b border-[#d5baba] bg-[#f8eaea] px-4 py-3 text-sm text-[#8B0000] sm:px-6">{error}</div>}
      {sourceChanged && baseline && <div className="shrink-0 border-b border-[#dcc3c3] bg-white px-4 py-3 text-sm sm:px-6">
        {baseline.draft ? <><p className="mb-2 text-[#765e5e]">Cargarlo reemplaza el texto abierto por la edición actual del servidor. Puedes recuperar el texto anterior con Deshacer.</p><button type="button" disabled={publishing} className={workspaceButtonClass()} onClick={() => { onReloadDraft(baseline.draft!); firstRevision.current = baseline.revision; setSourceChanged(false); setNeedsRefresh(false); setError('') }}>Cargar borrador actual</button></> : <p>El documento se eliminó durante la revisión. Vuelve al panel para comprobar la sección antes de continuar.</p>}
      </div>}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading ? <div role="status" className="flex min-h-48 flex-1 items-center justify-center gap-3 p-6 text-sm"><Loader2 className="size-5 animate-spin" aria-hidden="true" />Cargando la versión que ven los estudiantes…</div> : !baseline ? <p className="p-6 text-sm">No se puede aprobar hasta comprobar la publicación. Usa «Actualizar comparación» para reintentar.</p> : <>
          <div className="shrink-0 space-y-2 px-4 py-3 text-sm sm:px-6">
            {!baseline.published ? <p className="rounded-md border border-[#d5baba] bg-white p-3"><strong>Antes: sin contenido publicado.</strong> Todo el contenido de la propuesta se publicará por primera vez.</p> : <p className="text-[#765e5e]">Se compara la versión publicada con el texto que tienes abierto en el editor.{!changed && ' El texto y el título coinciden.'}</p>}
            {baseline.published && baseline.published.title !== candidate.title && <div className="grid gap-2 rounded-md border border-[#dcc3c3] bg-white p-3 sm:grid-cols-2"><p><strong>Título anterior:</strong> {baseline.published.title}</p><p><strong>Título propuesto:</strong> {candidate.title}</p></div>}
          </div>
          {view === 'changes' ? <div className="flex min-h-[24rem] flex-1 flex-col px-3 pb-3 sm:px-6 sm:pb-5">
            <div className={`grid shrink-0 gap-1 rounded-t-lg border border-[#dcc3c3] bg-white px-3 py-2 text-xs font-semibold ${wide ? 'grid-cols-2' : ''}`}><span>Publicado · antes{!baseline.published ? ' · vacío' : ''}</span><span>Propuesta · después</span></div>
            <p className="shrink-0 border-x border-[#dcc3c3] bg-white px-3 py-2 text-xs text-[#765e5e]">Rojo: texto eliminado. Verde: texto añadido. Se muestra Markdown y LaTeX; usa «Vista de la página» para revisar las fórmulas y figuras.</p>
            {independent && <p className="border-x border-[#dcc3c3] bg-white px-3 py-2 text-xs text-[#765e5e]" role="status">Desplazamiento independiente: cada columna se mueve por separado.{lineChanges === null ? ' Calculando el resaltado de cambios…' : ''}</p>}
            <div className="relative min-h-[20rem] flex-1 overflow-hidden rounded-b-lg border border-[#dcc3c3]">
              <div aria-hidden={independent || undefined} className={`absolute inset-0 ${independent ? 'invisible pointer-events-none' : ''}`}>
                <DiffEditor key={baseline.revision} height="100%" language="markdown" original={baseline.published?.contentMarkdown || ''} modified={candidate.contentMarkdown} originalModelPath={`inmemory://mc361/review/${encodeURIComponent(id)}/before.md`} modifiedModelPath={`inmemory://mc361/review/${encodeURIComponent(id)}/after.md`} beforeMount={defineCourseEditorTheme} theme="resistenciaTheme" onMount={mountDiff} loading={<p role="status" className="p-6 text-sm">Cargando diferencias… También puedes usar «Vista de la página».</p>} options={reviewDiffOptions(wide, wrap)} />
              </div>
              {independent && <div className="absolute inset-0 grid min-h-0 grid-cols-2 divide-x divide-[#dcc3c3]">
                {(['original', 'modified'] as const).map(side => <ReviewSourcePane key={`${baseline.revision}-${side}`} side={side} value={side === 'original' ? baseline.published?.contentMarkdown || '' : candidate.contentMarkdown} path={`inmemory://mc361/review/${encodeURIComponent(id)}/independent-${side}.md`} changes={lineChanges} wrap={wrap} position={positions.current[side]} onScroll={position => { positions.current[side] = position; lastScrolled.current = side }} />)}
              </div>}
            </div>
          </div> : <div className="grid min-h-[24rem] flex-1 items-stretch gap-4 overflow-visible px-3 pb-5 lg:grid-cols-2 lg:overflow-hidden sm:px-6">
            <ReviewPage title="Publicado · antes" document={baseline.published} baseline={baseline} attempt={previewAttempt} onRetry={() => setPreviewAttempt(value => value + 1)} scrollRef={publishedPage} onScroll={() => handlePageScroll('original')} />
            <ReviewPage title="Propuesta · después" document={candidate} baseline={baseline} attempt={previewAttempt} onRetry={() => setPreviewAttempt(value => value + 1)} scrollRef={proposedPage} onScroll={() => handlePageScroll('modified')} />
          </div>}
        </>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e3caca] bg-white px-4 py-3 sm:px-6">
        <p className="max-w-2xl text-xs leading-5 text-[#765e5e]">Revisar no guarda ni publica. Si el borrador o la publicación cambian, actualiza la comparación antes de aprobar.</p>
        <button type="button" disabled={!baseline || loading || publishing || needsRefresh || !candidate.contentMarkdown.trim()} onClick={() => void confirm()} className={workspaceButtonClass('success')}><CheckCircle2 className="size-4" aria-hidden="true" />{publishing ? 'Publicando…' : 'Aprobar y publicar'}</button>
      </footer>
  </section>
}

function ReviewPage({ title, document, baseline, attempt, onRetry, scrollRef, onScroll }: { title: string; document: CourseDocument | null; baseline: ContentReviewBaseline; attempt: number; onRetry: () => void; scrollRef: RefObject<HTMLDivElement>; onScroll: () => void }) {
  return <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[#dcc3c3] bg-[#FCF9F7]">
    <h3 className="border-b border-[#e3caca] bg-[#f8efed] px-4 py-3 text-sm font-semibold">{title}</h3>
    {!document ? <p className="p-6 text-sm text-[#765e5e]">Esta sección todavía no tenía contenido publicado.</p> : <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-auto bg-[#FCF9F7] p-4 sm:p-6" onScroll={onScroll} onClickCapture={event => {
      // Hash links stay inside their own pane rather than jumping to the other copy.
      const link = (event.target as HTMLElement).closest('a')
      const href = link?.getAttribute('href')
      if (!href?.startsWith('#')) return
      event.preventDefault()
      const target = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[id]')).find(element => `#${element.id}` === href)
      target?.scrollIntoView({ block: 'nearest' })
    }}>
      <ContentProvider slug={baseline.fullSlug}><PreviewErrorBoundary key={attempt} resetKey={document.contentMarkdown} onRetry={onRetry}><Suspense fallback={<p role="status" className="text-sm">Preparando vista de la página…</p>}><ContentRenderer document={document} headingPrefix={baseline.headingPrefix} problemOffset={baseline.problemOffset} /></Suspense></PreviewErrorBoundary></ContentProvider>
    </div>}
  </section>
}
