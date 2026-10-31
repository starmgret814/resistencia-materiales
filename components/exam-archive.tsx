import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { FileText, ArrowRight, Search, RotateCw, ChevronDown, Archive, X } from 'lucide-react'
import { db } from '@/lib/firebase'
import { examPeriods, examTypes, validExam, type PastExam } from '@/lib/exam-data'

export default function ExamArchive() {
  const [exams, setExams] = useState<PastExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState('all')
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const snapshot = await getDocs(collection(db, 'exams'))
      setExams(snapshot.docs.flatMap(doc => validExam(doc.data()) ? [{ ...doc.data(), id: doc.id } as PastExam] : []))
    } catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const allPeriods = examPeriods(exams)
  const hasFilters = search.trim().length > 0 || type !== 'all'
  const query = search.toLocaleLowerCase('es').trim()
  const filtered = exams.filter(exam => (period === 'all' || exam.period === period) && (type === 'all' || exam.type === type) && `${exam.title} ${exam.period} ${examTypes.find(item => item.id === exam.type)?.label}`.toLocaleLowerCase('es').includes(query))
  const periods = allPeriods.filter(item => (period === 'all' || item === period) && (!hasFilters || filtered.some(exam => exam.period === item)))
  const control = 'h-11 min-w-0 rounded-lg border border-[#e3caca] bg-white px-3 text-sm text-[#4b1719] outline-none transition focus:border-[#a35a5a] focus:ring-2 focus:ring-[#7f0303]/10 dark:border-[#422527] dark:bg-[#1a0f10] dark:text-[#f2e1df]'
  const reset = () => { setSearch(''); setType('all'); setPeriod('all') }

  return <section aria-label="Archivo de exámenes" className="mt-7">
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Buscar evaluación</span><Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[#a47b7b]" aria-hidden="true" />
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar una evaluación…" className={`${control} w-full pl-10`} />
      </label>
      <label className="sm:w-56"><span className="sr-only">Tipo de evaluación</span>
        <select value={type} onChange={event => setType(event.target.value)} className={`${control} w-full`}>
          <option value="all">Todas las evaluaciones</option>
          {examTypes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    </div>
    <div role="group" aria-label="Filtrar por periodo" className="mt-4 flex flex-wrap gap-2">
      {['all', ...allPeriods].map(item => <button key={item} type="button" aria-pressed={period === item} onClick={() => setPeriod(item)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f0303] ${period === item ? 'border-[#7f0303] bg-[#7f0303] text-white dark:border-[#fca5a5] dark:bg-[#fca5a5] dark:text-[#281517]' : 'border-[#e3caca] text-[#765e5e] hover:border-[#b78383] hover:bg-[#f8eaea] dark:border-[#422527] dark:text-[#cbb0ae] dark:hover:bg-[#281517]'}`}>{item === 'all' ? 'Todos los periodos' : item}</button>)}
    </div>
    <div className="mb-4 mt-7 flex items-center justify-between gap-3 text-xs text-[#967070] dark:text-[#ab8e8e]">
      <p aria-live="polite">{loading ? 'Consultando archivo…' : error ? 'Archivo académico' : `${filtered.length} ${filtered.length === 1 ? 'evaluación disponible' : 'evaluaciones disponibles'}`}</p>
      {(hasFilters || period !== 'all') && <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-[#7f0303] hover:underline dark:text-[#fca5a5]"><X className="size-3" aria-hidden="true" />Limpiar filtros</button>}
    </div>
    {loading ? <div role="status" className="space-y-3"><span className="sr-only">Cargando exámenes…</span>{[0, 1, 2].map(item => <div key={item} className="h-20 animate-pulse rounded-xl border border-[#e3caca] bg-[#f4e8e6] motion-reduce:animate-none dark:border-[#382022] dark:bg-[#231416]" />)}</div> : error ? <div role="alert" className="rounded-xl border border-[#e3caca] bg-white p-8 text-center dark:border-[#382022] dark:bg-[#1a0f10]">
      <Archive className="mx-auto mb-3 size-6 text-[#a47b7b]" aria-hidden="true" /><p className="text-sm font-semibold">No se pudo cargar el archivo</p><p className="mt-2 text-xs text-[#866b6b] dark:text-[#ab8e8e]">Vuelve a intentarlo en unos momentos.</p><button type="button" onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#dfc5c3] px-4 py-2 text-xs font-semibold dark:border-[#422527]"><RotateCw className="size-3.5" aria-hidden="true" />Reintentar</button>
    </div> : !periods.length ? <div role="status" className="rounded-xl border border-dashed border-[#dfc5c3] py-12 text-center dark:border-[#422527]"><Search className="mx-auto mb-3 size-6 text-[#a47b7b]" aria-hidden="true" /><p className="text-sm font-semibold">No encontramos evaluaciones con esos filtros</p><button type="button" onClick={reset} className="mt-3 text-xs text-[#7f0303] underline dark:text-[#fca5a5]">Ver todo el archivo</button></div> : <div className="space-y-3">
      {periods.map((item, index) => {
        const evaluations = filtered.filter(exam => exam.period === item)
        return <details key={`${item}-${hasFilters}-${period}`} open={evaluations.length > 0 || index === 0 || period !== 'all'} className="group/period overflow-hidden rounded-xl border border-[#e3caca] bg-white dark:border-[#382022] dark:bg-[#1a0f10]">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 transition-colors hover:bg-[#fdf8f6] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#7f0303] sm:px-6 dark:hover:bg-[#231416] [&::-webkit-details-marker]:hidden">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f8eeeb] text-[#9b6262] dark:bg-[#2d191b] dark:text-[#d4a5a2]"><Archive className="size-4" aria-hidden="true" /></span>
            <h2 className="flex-1 font-serif text-xl font-semibold tracking-tight">{item}</h2>
            <span className="text-[11px] text-[#967070] dark:text-[#ab8e8e]">{evaluations.length ? `${evaluations.length} ${evaluations.length === 1 ? 'evaluación' : 'evaluaciones'}` : 'Por completar'}</span>
            <ChevronDown className="size-4 text-[#a47b7b] transition-transform group-open/period:rotate-180" aria-hidden="true" />
          </summary>
          {evaluations.length ? <div className="grid gap-5 border-t border-[#f0e0de] px-5 py-5 sm:grid-cols-2 sm:px-6 dark:border-[#382022]">
            {examTypes.filter(category => evaluations.some(exam => exam.type === category.id)).map(category => <section key={category.id}>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#967070] dark:text-[#ab8e8e]">{category.label}</h3>
              <ul className="space-y-1">{evaluations.filter(exam => exam.type === category.id).sort((a, b) => a.title.localeCompare(b.title, 'es', { numeric: true })).map(exam => <li key={exam.id}>
                <a href={`/examenes/${encodeURIComponent(exam.id)}`} className="group/exam flex items-center gap-3 rounded-lg px-2 py-3 text-sm transition-colors hover:bg-[#f8eeeb] focus-visible:outline-2 focus-visible:outline-[#7f0303] dark:hover:bg-[#2d191b]" aria-label={`${exam.title}, ${item}`}>
                  <FileText className="size-4 shrink-0 text-[#b18a85]" aria-hidden="true" /><span className="min-w-0 flex-1 break-words font-medium">{exam.title}</span><ArrowRight className="size-3.5 shrink-0 text-[#a47b7b] transition-transform group-hover/exam:translate-x-0.5" aria-hidden="true" />
                </a>
              </li>)}</ul>
            </section>)}
          </div> : <div className="border-t border-[#f0e0de] px-6 py-7 dark:border-[#382022]"><p className="text-sm text-[#765e5e] dark:text-[#cbb0ae]">Todavía no hay evaluaciones publicadas para este periodo.</p><p className="mt-1 text-xs text-[#a47b7b] dark:text-[#ab8e8e]">Aparecerán aquí cuando estén disponibles.</p></div>}
        </details>
      })}
    </div>}
  </section>
}
