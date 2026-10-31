import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { FileText, ArrowUpRight, Search, RotateCw } from 'lucide-react'
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
  const periods = examPeriods(exams).filter(item => period === 'all' || item === period)
  const filtered = exams.filter(exam => (type === 'all' || exam.type === type) && `${exam.title} ${exam.period}`.toLowerCase().includes(search.toLowerCase().trim()))
  const control = 'min-w-0 rounded-lg border border-[#dfc5c3] bg-white px-3 py-2.5 text-sm text-[#4b1719] dark:border-[#422527] dark:bg-[#231416] dark:text-[#f2e1df]'

  return <section aria-label="Archivo de exámenes">
    <div className="my-7 grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-xs font-semibold">Periodo
        <select value={period} onChange={event => setPeriod(event.target.value)} className={control}>
          <option value="all">Todos los periodos</option>
          {examPeriods(exams).map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold">Evaluación
        <select value={type} onChange={event => setType(event.target.value)} className={control}>
          <option value="all">Todas las evaluaciones</option>
          {examTypes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="relative sm:col-span-2">
        <span className="sr-only">Buscar examen</span><Search className="absolute left-3 top-3 size-4" aria-hidden="true" />
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por título o periodo…" className={`${control} w-full pl-9`} />
      </label>
    </div>
    {loading ? <p role="status" className="py-8 text-sm">Cargando exámenes…</p> : error ? <div role="alert" className="rounded-xl border border-[#dfc5c3] p-6">
      <p>No se pudo cargar el archivo de exámenes.</p><button onClick={load} className="mt-3 inline-flex items-center gap-2 font-semibold"><RotateCw className="size-4" /> Reintentar</button>
    </div> : <div className="space-y-5">
      {periods.filter(item => !search.trim() || filtered.some(exam => exam.period === item)).map(item => <section key={item} className="rounded-xl border border-[#e3caca] bg-white p-5 dark:border-[#382022] dark:bg-[#1a0f10]">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-serif text-2xl font-bold">{item}</h2><span className="text-xs text-[#967070]">{filtered.filter(exam => exam.period === item).length} documentos</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {examTypes.filter(category => type === 'all' || category.id === type).map(category => {
            const documents = filtered.filter(exam => exam.period === item && exam.type === category.id).sort((a, b) => a.title.localeCompare(b.title, 'es', { numeric: true }))
            return <div key={category.id} className="rounded-lg bg-[#faf5f3] p-4 dark:bg-[#231416]">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 shrink-0 text-[#9a4a4a]" />{category.label}</h3>
              {documents.length ? <ul className="space-y-2">{documents.map(exam => <li key={exam.id}><a href={`/examenes/${encodeURIComponent(exam.id)}`} className="flex items-start justify-between gap-2 rounded-md px-2 py-2 text-sm text-[#7f0303] hover:bg-[#f2dddd] dark:text-[#fca5a5] dark:hover:bg-[#381618]" aria-label={`${exam.title}, ${item}`}>{exam.title}<ArrowUpRight className="size-4 shrink-0" /></a></li>)}</ul> : <p className="text-xs text-[#866b6b] dark:text-[#ab8e8e]">Aún no hay evaluaciones disponibles.</p>}
            </div>
          })}
        </div>
      </section>)}
      {search.trim() && !filtered.some(exam => period === 'all' || exam.period === period) && <p role="status" className="py-6 text-sm">No hay exámenes que coincidan con tu búsqueda.</p>}
    </div>}
  </section>
}
