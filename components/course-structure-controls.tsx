import { useId, useRef, useState } from 'react'
import { Archive, ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import type { Chapter } from '@/lib/course-data'
import type { CourseStructureAction } from '@/lib/course-structure'

type Apply = (action: CourseStructureAction) => Promise<boolean>
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d5baba] bg-white px-3 py-2 text-xs font-semibold text-[#6a2022] hover:bg-[#f8eaea] disabled:opacity-40'

function TitleDialog({ title, initial, label, busy, onSave, trigger }: { title: string; initial: string; label: string; busy: boolean; onSave: (value: string) => Promise<boolean>; trigger: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState('')
  return <>
    <button type="button" disabled={busy} className={button} onClick={() => { setValue(initial); setError(''); dialog.current?.showModal(); input.current?.focus() }}>{trigger}</button>
    <dialog ref={dialog} aria-labelledby={id} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#e3caca] bg-white p-6 text-[#4d3838] shadow-xl backdrop:bg-[#3b2022]/40" onCancel={event => { if (busy) event.preventDefault() }}>
      <form onSubmit={async event => { event.preventDefault(); setError(''); if (await onSave(value)) dialog.current?.close(); else setError('No se pudo guardar. Revisa la conexión y tus permisos antes de reintentar.') }}>
        <div className="flex items-start justify-between gap-3"><h2 id={id} className="font-sans text-xl font-semibold">{title}</h2><button type="button" disabled={busy} onClick={() => dialog.current?.close()} aria-label="Cerrar" className="rounded-md p-2"><X className="size-4" aria-hidden="true" /></button></div>
        <label className="mt-5 block text-sm font-semibold">{label}<input ref={input} required maxLength={160} value={value} disabled={busy} onChange={event => setValue(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dcc3c3] px-3 py-3 text-base font-normal outline-none focus:border-[#8B0000]" /></label>
        {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} className={button} onClick={() => dialog.current?.close()}>Cancelar</button><button disabled={busy || !value.trim()} className="rounded-lg bg-[#7f0303] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </dialog>
  </>
}

export function CourseStructureControls({ busy, archived, onToggleArchived, onApply }: { busy: boolean; archived: boolean; onToggleArchived: () => void; onApply: Apply }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2">
    <TitleDialog title="Crear capítulo" initial="" label="Título del capítulo" busy={busy} onSave={title => onApply({ type: 'create-chapter', title })} trigger={<><Plus className="size-4" aria-hidden="true" />Nuevo capítulo</>} />
    <button type="button" onClick={onToggleArchived} aria-pressed={archived} className={button}><Archive className="size-4" aria-hidden="true" />{archived ? 'Ocultar archivados' : 'Ver archivados'}</button>
    <p className="w-full text-xs leading-6 text-[#8b6d6d]">Puedes crear, renombrar y ordenar capítulos. Al archivarlos, sus textos se conservan y puedes restaurarlos. Los números y direcciones existentes se mantienen al reordenar.</p>
  </div>
}

export function ChapterActions({ chapter, first, last, busy, onApply }: { chapter: Chapter; first: boolean; last: boolean; busy: boolean; onApply: Apply }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [error, setError] = useState('')
  return <div className="flex flex-wrap items-center gap-1 pb-2 pl-5 sm:pb-0 sm:pl-0">
    <TitleDialog title={`Renombrar capítulo ${chapter.number}`} initial={chapter.title} label="Título del capítulo" busy={busy} onSave={title => onApply({ type: 'rename-chapter', chapter: chapter.number, title })} trigger={<><Pencil className="size-3.5" aria-hidden="true" /><span className="sr-only">Renombrar capítulo {chapter.number}</span></>} />
    <button className={button} disabled={busy || first} onClick={() => void onApply({ type: 'move-chapter', chapter: chapter.number, direction: 'up' })} title="Subir capítulo" aria-label={`Subir capítulo ${chapter.number}`}><ArrowUp className="size-3.5" aria-hidden="true" /></button>
    <button className={button} disabled={busy || last} onClick={() => void onApply({ type: 'move-chapter', chapter: chapter.number, direction: 'down' })} title="Bajar capítulo" aria-label={`Bajar capítulo ${chapter.number}`}><ArrowDown className="size-3.5" aria-hidden="true" /></button>
    {chapter.archived ? <button className={button} disabled={busy} onClick={() => void onApply({ type: 'restore-chapter', chapter: chapter.number })}><RotateCcw className="size-3.5" aria-hidden="true" />Restaurar</button> : <button className={button} disabled={busy} onClick={() => { setError(''); dialog.current?.showModal() }} aria-label={`Archivar capítulo ${chapter.number}`}><Archive className="size-3.5" aria-hidden="true" /></button>}
    <dialog ref={dialog} aria-labelledby={id} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[#e3caca] bg-white p-6 text-[#4d3838] shadow-xl backdrop:bg-[#3b2022]/40" onCancel={event => { if (busy) event.preventDefault() }}>
      <h2 id={id} className="font-sans text-xl font-semibold">Archivar capítulo</h2><p className="mt-3 text-sm leading-7">«{chapter.title}» dejará de aparecer en la página pública. Sus secciones, borradores y publicaciones se conservan. Puedes recuperarlo en «Ver archivados».</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button className={button} disabled={busy} onClick={() => dialog.current?.close()}>Cancelar</button><button className={button} disabled={busy} onClick={async () => { setError(''); if (await onApply({ type: 'archive-chapter', chapter: chapter.number })) dialog.current?.close(); else setError('No se pudo archivar. Revisa la conexión y tus permisos antes de reintentar.') }}>{busy ? 'Guardando…' : 'Archivar capítulo'}</button></div>
    </dialog>
  </div>
}
