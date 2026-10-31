import { lazy, Suspense, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { examTypes, validExam, type PastExam } from '@/lib/exam-data'

const Editor = lazy(() => import('@monaco-editor/react'))
const ContentRenderer = lazy(() => import('@/components/content-renderer'))
const input = 'w-full rounded-lg border border-[#dcc3c3] bg-white px-3 py-2.5 text-sm text-[#3b2022]'
const starter = () => ({
  id: '', period: '2026-2', type: 'practica' as PastExam['type'], title: '',
  contentMarkdown: '## Indicaciones\n\nDuración: 110 minutos. Justifica tus respuestas e indica las unidades.\n\n<Problem number={1} title="Esfuerzo normal">\n\nUn elemento soporta una carga axial de 20 kN y tiene un área de 100 mm². Calcula el esfuerzo normal.\n\n<Solution>\n\n$$\n\\sigma = \\frac{P}{A} = \\frac{20000}{100} = 200\\, \\text{MPa}\n$$\n\n</Solution>\n\n</Problem>\n',
})

export default function ExamManagement() {
  const [exams, setExams] = useState<PastExam[]>([])
  const [current, setCurrent] = useState<PastExam>(starter)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'exams'))
      setExams(snapshot.docs.flatMap(item => validExam(item.data()) ? [{ ...item.data(), id: item.id } as PastExam] : []).sort((a, b) => b.period.localeCompare(a.period) || a.title.localeCompare(b.title, 'es', { numeric: true })))
    } catch { setError('No se pudieron cargar los exámenes. Comprueba la conexión y que las reglas de Firestore estén actualizadas.') }
    finally { setLoading(false) }
  }
  useEffect(() => onAuthStateChanged(auth, user => {
    setReady(Boolean(user))
    if (user) void load()
    else { setLoading(false); setError('Inicia sesión nuevamente para administrar los exámenes.') }
  }), [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function change(update: Partial<PastExam>) { setCurrent(value => ({ ...value, ...update })); setDirty(true); setMessage('') }
  function select(exam: PastExam) {
    if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return
    setCurrent(exam); setDirty(false); setMessage(''); setError('')
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    const { id, ...data } = { ...current, title: current.title.trim(), contentMarkdown: current.contentMarkdown.trim() }
    if (!validExam(data)) { setError('Completa el título, un periodo como 2026-1 y el contenido (máximo 200 000 caracteres).'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const reference = id ? doc(db, 'exams', id) : doc(collection(db, 'exams'))
      await setDoc(reference, data)
      setCurrent({ ...data, id: reference.id }); setDirty(false)
      setMessage('Evaluación publicada. Ya está disponible en Exámenes pasados.')
      await load()
    } catch { setError('No se pudo publicar la evaluación. Comprueba tu sesión, conexión y permisos. Tu contenido sigue en el editor.') }
    finally { setBusy(false) }
  }
  async function remove(exam: PastExam) {
    if (!window.confirm(`¿Eliminar "${exam.title}" del periodo ${exam.period}? Esta acción no se puede deshacer.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await deleteDoc(doc(db, 'exams', exam.id))
      if (current.id === exam.id) { setCurrent(starter()); setDirty(false) }
      await load(); setMessage('Evaluación eliminada.')
    } catch { setError('No se pudo eliminar la evaluación.') }
    finally { setBusy(false) }
  }

  return <div className="text-[#4d3838]">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-3xl font-bold text-[#4b1719]">Exámenes pasados</h1><p className="mt-2 text-sm">Publica evaluaciones como páginas web, con fórmulas, imágenes y soluciones.</p></div><a href="/examenes" className="text-sm font-semibold text-[#7f0303]">Ver archivo público ↗</a></div>
    {message && <p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-[#e3caca] bg-white p-4">
        <button disabled={busy} onClick={() => select(starter())} className="mb-4 w-full rounded-lg bg-[#7f0303] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">+ Nueva evaluación</button>
        {loading ? <p role="status" className="text-sm">Cargando…</p> : !exams.length ? <p className="text-sm">Aún no hay evaluaciones.</p> : <ul className="space-y-3">{exams.map(exam => <li key={exam.id} className="rounded-lg border border-[#eadada] p-3"><button disabled={busy} onClick={() => select(exam)} className="w-full text-left text-sm"><span className="block text-xs text-[#967070]">{exam.period} · {examTypes.find(type => type.id === exam.type)?.label}</span><span className="mt-1 block font-semibold">{exam.title}</span></button><button disabled={busy || !ready} onClick={() => remove(exam)} className="mt-2 text-xs text-red-700 disabled:opacity-50">Eliminar</button></li>)}</ul>}
      </aside>
      <form onSubmit={save} className="min-w-0 rounded-xl border border-[#e3caca] bg-white p-5">
        <h2 className="mb-5 font-serif text-xl font-bold">{current.id ? 'Editar evaluación' : 'Nueva evaluación'}</h2>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Periodo<input className={`${input} mt-2`} required pattern="[0-9]{4}-[12]" placeholder="2026-1" value={current.period} onChange={event => change({ period: event.target.value })} /><span className="mt-1 block text-[11px] font-normal">Año y semestre; por ejemplo, 2025-2.</span></label>
          <label className="text-xs font-semibold">Tipo<select className={`${input} mt-2`} value={current.type} onChange={event => change({ type: event.target.value as PastExam['type'] })}>{examTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <label className="text-xs font-semibold sm:col-span-2">Título<input className={`${input} mt-2`} required maxLength={160} placeholder="Práctica calificada 1" value={current.title} onChange={event => change({ title: event.target.value })} /></label>
        </fieldset>
        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Contenido Markdown</h3><a href="/guia-colaboradores" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#7f0303]">Guía de formato ↗</a></div>
        <p className="mb-3 text-xs leading-5">Usa el mismo formato del curso: Problem, Solution, Formula, Table y TableGrid. Para imágenes, utiliza una URL completa o una ruta pública como /imagenes/figura.png.</p>
        <div className="overflow-hidden rounded-lg border border-[#dcc3c3]">
          <Suspense fallback={<p className="p-5 text-sm">Cargando editor…</p>}><Editor height="400px" language="markdown" value={current.contentMarkdown} onChange={value => change({ contentMarkdown: value || '' })} options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14, readOnly: busy, scrollBeyondLastLine: false, automaticLayout: true }} /></Suspense>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4"><button disabled={busy || !ready || loading} className="rounded-lg bg-[#7f0303] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando…' : current.id ? 'Publicar cambios' : 'Publicar evaluación'}</button>{current.id && <a href={`/examenes/${current.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7f0303]">Ver página publicada ↗</a>}</div>
        <h3 className="mb-4 mt-8 border-t border-[#eadada] pt-6 text-sm font-semibold">Vista previa</h3>
        <div className="rounded-lg bg-[#faf5f3] p-4"><h2 className="font-serif text-2xl font-bold">{current.title || 'Título de la evaluación'}</h2><Suspense fallback={<p>Cargando vista previa…</p>}><ContentRenderer document={{ schemaVersion: 2, chapterId: current.period, slug: current.id || 'nueva-evaluacion', title: current.title, contentMarkdown: current.contentMarkdown }} /></Suspense></div>
      </form>
    </div>
  </div>
}
