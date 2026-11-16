import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { OnMount } from '@monaco-editor/react'
import { Download, ExternalLink, FileUp, Plus, RotateCw } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { examTypes, validExam, type PastExam } from '@/lib/exam-data'
import { examSnippets, validateExamImport } from '@/lib/exam-authoring'
import PreviewErrorBoundary from '@/components/preview-error-boundary'
import { LocalDraftNotice, LocalDraftStatus } from '@/components/local-draft-notice'
import { localDraftKey } from '@/lib/local-draft'
import { useLocalDraft } from '@/lib/use-local-draft'
import { examFailure, type ExamFailure } from '@/lib/exam-errors'

const Editor = lazy(() => import('@monaco-editor/react'))
const input = 'w-full rounded-lg border border-[#dcc3c3] bg-white px-3 py-2.5 text-sm text-[#3b2022]'
const starter = () => ({
  id: '', period: `${new Date().getFullYear()}-${new Date().getMonth() < 6 ? 1 : 2}`, type: 'practica' as PastExam['type'], title: '',
  contentMarkdown: '## Indicaciones\n\nDuración: 110 minutos. Justifica tus respuestas e indica las unidades.\n\n<Problem number={1} title="Esfuerzo normal">\n\nUn elemento soporta una carga axial de 20 kN y tiene un área de 100 mm². Calcula el esfuerzo normal.\n\n<Solution>\n\n$$\n\\sigma = \\frac{P}{A} = \\frac{20000}{100} = 200\\, \\text{MPa}\n$$\n\n</Solution>\n\n</Problem>\n',
})

export default function ExamManagement() {
  const [exams, setExams] = useState<PastExam[]>([])
  const [current, setCurrent] = useState<PastExam>(starter)
  const [ready, setReady] = useState(false)
  const [owner, setOwner] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState<ExamFailure | null>(null)
  const loadAttempt = useRef(0)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [importing, setImporting] = useState(false)
  const [editorReady, setEditorReady] = useState(false)
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const ContentRenderer = useMemo(() => lazy(() => import('@/components/content-renderer')), [previewAttempt])
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const backupValues = { period: current.period, type: current.type, title: current.title, contentMarkdown: current.contentMarkdown }
  const localBackup = useLocalDraft(owner ? localDraftKey(owner, 'exam', current.id || 'new') : null, backupValues, ready)
  const blocked = busy || importing || Boolean(localBackup.pending)

  async function load() {
    const attempt = ++loadAttempt.current
    setLoading(true)
    setLoadError(null)
    try {
      const snapshot = await getDocs(collection(db, 'exams'))
      if (attempt === loadAttempt.current) setExams(snapshot.docs.flatMap(item => validExam(item.data()) ? [{ ...item.data(), id: item.id } as PastExam] : []).sort((a, b) => b.period.localeCompare(a.period) || a.title.localeCompare(b.title, 'es', { numeric: true })))
    } catch (cause) { if (attempt === loadAttempt.current) setLoadError(examFailure(cause, 'load')) }
    finally { if (attempt === loadAttempt.current) setLoading(false) }
  }
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setReady(Boolean(user))
      setOwner(user?.email || '')
      if (user) { setError(''); void load() }
      else { loadAttempt.current++; setExams([]); setLoadError(null); setLoading(false); setError('Inicia sesión nuevamente para administrar los exámenes.') }
    })
    return () => { loadAttempt.current++; unsubscribe() }
  }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function change(update: Partial<PastExam>) { setCurrent(value => ({ ...value, ...update })); setDirty(true); setMessage('') }
  function select(exam: PastExam) {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return
    setCurrent(exam); setDirty(false); setMessage(''); setError(''); setMode('edit')
  }
  function insert(content: string) {
    const editor = editorRef.current
    const selection = editor?.getSelection()
    if (!editor || !selection || blocked) return
    editor.pushUndoStop()
    editor.executeEdits('exam-template', [{ range: selection, text: content, forceMoveMarkers: true }])
    editor.pushUndoStop()
    editor.focus()
  }
  async function importMarkdown(file: File) {
    if (blocked) return
    setImporting(true); setError(''); setMessage('')
    try {
      if (file.size > 800000) throw new Error('El archivo es demasiado grande. El límite es de 200 000 caracteres.')
      const content = validateExamImport(file.name, file.size, await file.text())
      if (!window.confirm('Se reemplazará el contenido del editor con este archivo. El título, periodo y tipo se conservan. Nada se publica hasta que pulses Publicar. ¿Continuar?')) return
      const editor = editorRef.current
      const model = editor?.getModel()
      if (!editor || !model) throw new Error('Espera a que cargue el editor e inténtalo de nuevo.')
      editor.pushUndoStop()
      editor.executeEdits('exam-import', [{ range: model.getFullModelRange(), text: content, forceMoveMarkers: true }])
      editor.pushUndoStop()
      setMessage('Archivo importado. Revisa la vista previa antes de publicar. Puedes deshacer la importación con Ctrl + Z.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo leer el archivo. El contenido anterior se conserva.') }
    finally { setImporting(false) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([current.contentMarkdown], { type: 'text/markdown;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${current.period}-${current.type}-${(current.title || 'evaluacion').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60) || 'evaluacion'}.md`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (blocked || !ready || loading || loadError) return
    const { id, ...data } = { ...current, title: current.title.trim(), contentMarkdown: current.contentMarkdown.trim() }
    if (!validExam(data)) { setError('Completa el título, un periodo como 2026-1 y el contenido (máximo 200 000 caracteres).'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const reference = id ? doc(db, 'exams', id) : doc(collection(db, 'exams'))
      await setDoc(reference, data)
      localBackup.acknowledge({ period: data.period, type: data.type, title: data.title, contentMarkdown: data.contentMarkdown })
      setCurrent({ ...data, id: reference.id }); setDirty(false)
      setMessage('Evaluación publicada. Ya está disponible en Exámenes pasados.')
      await load()
    } catch (cause) { setError(examFailure(cause, 'save').message) }
    finally { setBusy(false) }
  }
  async function remove(exam: PastExam) {
    if (!window.confirm(`¿Eliminar "${exam.title}" del periodo ${exam.period}? Esta acción no se puede deshacer.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteDoc(doc(db, 'exams', exam.id))
      if (current.id === exam.id) { setCurrent(starter()); setDirty(false) }
      await load(); setMessage('Evaluación eliminada.')
    } catch (cause) { setError(examFailure(cause, 'remove').message) }
    finally { setBusy(false) }
  }

  return <div className="text-[#4d3838]">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-sans text-3xl font-bold text-[#4b1719]">Exámenes pasados</h1><p className="mt-2 text-sm">Publica evaluaciones como páginas web, con fórmulas, imágenes y soluciones.</p></div><a href="/examenes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7f0303]">Ver archivo público <ExternalLink className="size-3.5" aria-hidden="true" /></a></div>
    {message && <p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {loadError && <div role="alert" className="mb-5 rounded-lg border border-[#e3caca] bg-red-50 p-4 text-sm text-red-800"><p>{loadError.message}</p><p className="mt-2 text-xs">Código: <code>{loadError.code}</code>. Puedes seguir preparando el contenido; la publicación estará disponible cuando se pueda consultar el archivo.</p><div className="mt-3 flex flex-wrap items-center gap-4"><button type="button" disabled={blocked || !ready || loading} onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold disabled:opacity-50"><RotateCw className="size-3.5" aria-hidden="true" />Reintentar carga</button>{loadError.code === 'permission-denied' && <a href="/guia-colaboradores#guia-examenes-permisos" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline underline-offset-4">Cómo revisar los permisos</a>}</div></div>}
    {localBackup.pending && <div className="mb-5"><LocalDraftNotice savedAt={localBackup.pending.savedAt} content={localBackup.pending.values.contentMarkdown} onRecover={() => { const recovered = localBackup.recover(); if (recovered) change({ ...recovered, type: examTypes.some(type => type.id === recovered.type) ? recovered.type as PastExam['type'] : current.type }) }} onDiscard={localBackup.discard} /></div>}
    <p className="mb-5 text-xs text-[#765e5e]"><LocalDraftStatus failed={localBackup.failed} savedAt={localBackup.savedAt} /></p>
    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-[#e3caca] bg-white p-4">
        <button disabled={blocked} onClick={() => select(starter())} className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7f0303] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" aria-hidden="true" />Nueva evaluación</button>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold">Evaluaciones publicadas</h2><button type="button" disabled={blocked || loading || !ready} onClick={() => void load()} aria-label="Actualizar lista de evaluaciones" className="rounded p-2 hover:bg-[#f8eaea] disabled:opacity-50"><RotateCw className="size-3.5" aria-hidden="true" /></button></div>
        {loading ? <p role="status" className="text-sm">Cargando…</p> : loadError ? <p className="text-sm">La lista no está disponible. Reintenta la carga para consultar las evaluaciones.</p> : !exams.length ? <p className="text-sm">Aún no hay evaluaciones.</p> : <ul className="max-h-[65vh] space-y-3 overflow-y-auto">{exams.map(exam => <li key={exam.id} className={`rounded-lg border p-3 ${current.id === exam.id ? 'border-[#a35a5a] bg-[#faf0ee]' : 'border-[#eadada]'}`}><button disabled={blocked} onClick={() => select(exam)} aria-pressed={current.id === exam.id} className="w-full text-left text-sm"><span className="block text-xs text-[#967070]">{exam.period} · {examTypes.find(type => type.id === exam.type)?.label}</span><span className="mt-1 block font-semibold">{exam.title}</span></button><button disabled={blocked || !ready} onClick={() => remove(exam)} className="mt-2 text-xs text-red-700 disabled:opacity-50">Eliminar</button></li>)}</ul>}
      </aside>
      <form onSubmit={save} className="min-w-0 rounded-xl border border-[#e3caca] bg-white p-5">
        <h2 className="mb-5 font-sans text-xl font-bold">{current.id ? 'Editar evaluación' : 'Nueva evaluación'}</h2>
        <fieldset disabled={blocked} className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Periodo<input className={`${input} mt-2`} required pattern="[0-9]{4}-[12]" placeholder="2026-1" value={current.period} onChange={event => change({ period: event.target.value })} /><span className="mt-1 block text-[11px] font-normal">Año y semestre; por ejemplo, 2025-2.</span></label>
          <label className="text-xs font-semibold">Tipo<select className={`${input} mt-2`} value={current.type} onChange={event => change({ type: event.target.value as PastExam['type'] })}>{examTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <label className="text-xs font-semibold sm:col-span-2">Título<input className={`${input} mt-2`} required maxLength={160} placeholder="Práctica calificada 1" value={current.title} onChange={event => change({ title: event.target.value })} /></label>
        </fieldset>
        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Contenido de la evaluación</h3><a href="/guia-colaboradores" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7f0303]">Guía de formato <ExternalLink className="size-3.5" aria-hidden="true" /></a></div>
        <p className="mb-4 text-xs leading-5">Escribe aquí o importa un archivo .md o .mdx. El examen se mostrará como una página web con el mismo formato de los capítulos. Para imágenes, usa una URL o una ruta pública.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <input ref={importRef} type="file" accept=".md,.mdx,.markdown,text/markdown" className="hidden" aria-label="Importar archivo Markdown" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importMarkdown(file) }} />
          <button type="button" disabled={blocked || !editorReady || mode !== 'edit'} onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-[#dcc3c3] px-3 py-2 text-xs font-semibold hover:bg-[#faf0ee] disabled:opacity-50"><FileUp className="size-4" aria-hidden="true" />{importing ? 'Importando…' : 'Importar Markdown'}</button>
          <button type="button" disabled={blocked || !current.contentMarkdown.trim()} onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-[#dcc3c3] px-3 py-2 text-xs font-semibold hover:bg-[#faf0ee] disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Descargar copia</button>
        </div>
        <div className="flex items-center gap-1 border-b border-[#dcc3c3] pb-2" role="group" aria-label="Vista del contenido">
          {(['edit', 'preview'] as const).map(view => <button key={view} type="button" aria-pressed={mode === view} aria-controls={`exam-${view}`} disabled={blocked} onClick={() => setMode(view)} className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${mode === view ? 'bg-[#f1dddd] text-[#7f0303]' : 'text-[#765e5e] hover:bg-[#faf0ee]'}`}>{view === 'edit' ? 'Editar contenido' : 'Vista previa'}</button>)}
          <span className="ml-auto hidden text-xs text-[#967070] sm:block">{current.contentMarkdown.length.toLocaleString('es')} / 200 000</span>
        </div>
        <div id="exam-edit" hidden={mode !== 'edit'}>
          <div className="flex flex-wrap items-center gap-2 py-3" role="group" aria-label="Insertar contenido"><span className="mr-1 text-xs text-[#765e5e]">Insertar:</span>{examSnippets.map(snippet => <button key={snippet.id} type="button" disabled={blocked || !editorReady} onClick={() => insert(snippet.content)} className="inline-flex items-center gap-1 rounded-md border border-[#eadada] px-2.5 py-1.5 text-xs hover:bg-[#faf0ee] disabled:opacity-50"><Plus className="size-3" aria-hidden="true" />{snippet.label}</button>)}</div>
          <div className="overflow-hidden rounded-lg border border-[#dcc3c3]">
            <Suspense fallback={<p className="p-5 text-sm">Cargando editor…</p>}><Editor key={current.id || 'new'} height="460px" language="markdown" value={current.contentMarkdown} onMount={editor => { editorRef.current = editor; setEditorReady(true) }} onChange={value => { if (value !== undefined && value !== current.contentMarkdown) change({ contentMarkdown: value }) }} options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14, readOnly: blocked, scrollBeyondLastLine: false, automaticLayout: true }} /></Suspense>
          </div>
        </div>
        <div id="exam-preview" hidden={mode !== 'preview'} className="min-w-0 rounded-lg bg-[#faf5f3] p-4 sm:p-6">
          {mode === 'preview' && <><p className="mb-2 text-xs text-[#967070]">{current.period} · {examTypes.find(type => type.id === current.type)?.label}</p><h2 className="font-sans text-2xl font-bold">{current.title || 'Título de la evaluación'}</h2><PreviewErrorBoundary key={previewAttempt} resetKey={current.contentMarkdown} onRetry={() => setPreviewAttempt(value => value + 1)}><Suspense fallback={<p role="status" className="py-8 text-sm">Cargando vista previa…</p>}><ContentRenderer document={{ schemaVersion: 2, chapterId: current.period, slug: current.id || 'nueva-evaluacion', title: current.title, contentMarkdown: current.contentMarkdown }} /></Suspense></PreviewErrorBoundary></>}
        </div>
        <div className="mt-5 border-t border-[#eadada] pt-5"><p className="mb-3 text-xs text-[#765e5e]">{dirty ? 'Tienes cambios sin publicar.' : current.id ? 'Estás editando una evaluación publicada.' : 'La evaluación aún no se ha publicado.'} Al publicar, estará visible para todos en el periodo seleccionado.</p><div className="flex flex-wrap items-center gap-4"><button disabled={blocked || !ready || loading || Boolean(loadError)} className="rounded-lg bg-[#7f0303] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando…' : current.id ? 'Publicar cambios' : 'Publicar evaluación'}</button>{current.id && <a href={`/examenes/${encodeURIComponent(current.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#7f0303]">Ver página publicada <ExternalLink className="size-3.5" aria-hidden="true" /></a>}</div></div>
      </form>
    </div>
  </div>
}
