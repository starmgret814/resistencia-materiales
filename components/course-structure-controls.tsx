import { useId, useRef, useState } from 'react'
import { Archive, ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import type { Chapter } from '@/lib/course-data'
import { COURSE_TITLE_MAX_LENGTH, courseTitleError, type CourseStructureAction } from '@/lib/course-structure'
import { workspaceButtonClass, workspaceInputClass } from '@/lib/workspace-controls'

type Apply = (action: CourseStructureAction) => Promise<boolean>
const button = workspaceButtonClass()
const iconButton = workspaceButtonClass('secondary', true)

function TitleDialog({ title, initial, label, busy, onSave, trigger, primary = false, iconOnly = false }: { title: string; initial: string; label: string; busy: boolean; onSave: (value: string) => Promise<boolean>; trigger: React.ReactNode; primary?: boolean; iconOnly?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const saving = useRef(false)
  const id = useId()
  const [value, setValue] = useState(initial)
  const [fieldError, setFieldError] = useState('')
  const [saveError, setSaveError] = useState('')
  const showErrorInside = Boolean(fieldError && !value.trim())
  const fieldId = `${id}-title`
  const descriptions = [`${id}-hint`, fieldError && `${id}-field-error`, saveError && `${id}-save-error`].filter(Boolean).join(' ')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || saving.current) return
    setSaveError('')
    const error = courseTitleError(value)
    setFieldError(error)
    if (error) {
      // Native placeholders are visible only when the value is truly empty.
      if (!value.trim()) setValue('')
      input.current?.focus()
      return
    }
    saving.current = true
    try {
      if (await onSave(value.trim())) dialog.current?.close()
      else setSaveError('No se pudo guardar. Revisa la conexión y tus permisos e inténtalo de nuevo.')
    } catch {
      setSaveError('No se pudo guardar. El título se conserva para que puedas reintentar.')
    } finally { saving.current = false }
  }

  return <>
    <button type="button" disabled={busy} title={title} aria-label={iconOnly ? title : undefined} className={workspaceButtonClass(primary ? 'primary' : 'secondary', iconOnly)} onClick={() => { setValue(initial); setFieldError(''); setSaveError(''); dialog.current?.showModal(); input.current?.focus() }}>{trigger}</button>
    <dialog ref={dialog} aria-labelledby={id} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-[#e3caca] bg-white p-6 text-[#4d3838] shadow-xl backdrop:bg-[#3b2022]/40" onCancel={event => { if (busy || saving.current) event.preventDefault() }}>
      <form noValidate aria-busy={busy} onSubmit={submit}>
        <div className="flex items-start justify-between gap-3"><h2 id={id} className="font-sans text-xl font-semibold">{title}</h2><button type="button" disabled={busy} onClick={() => dialog.current?.close()} aria-label="Cerrar" title="Cerrar" className={workspaceButtonClass('quiet', true)}><X className="size-4" aria-hidden="true" /></button></div>
        <div className="mt-5 space-y-2">
          <label htmlFor={fieldId} className="block text-sm font-semibold">{label}</label>
          <input id={fieldId} ref={input} required maxLength={COURSE_TITLE_MAX_LENGTH} value={value} placeholder={showErrorInside ? fieldError : undefined} disabled={busy} aria-invalid={fieldError ? true : undefined} aria-describedby={descriptions} onChange={event => { setValue(event.target.value); setSaveError(''); if (fieldError) setFieldError(courseTitleError(event.target.value)) }} className={workspaceInputClass(Boolean(fieldError))} />
          <p id={`${id}-hint`} className="text-sm leading-5 text-[#8b6d6d]">El título es obligatorio. Máximo {COURSE_TITLE_MAX_LENGTH} caracteres.</p>
          {fieldError && <p id={`${id}-field-error`} role="alert" className={showErrorInside ? 'sr-only' : 'text-sm leading-5 text-[#8B0000]'}>{fieldError}</p>}
          {saveError && <p id={`${id}-save-error`} role="alert" className="text-sm leading-5 text-[#8B0000]">{saveError}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" disabled={busy} className={button} onClick={() => dialog.current?.close()}>Cancelar</button><button type="submit" disabled={busy} className={workspaceButtonClass('primary')}>{busy ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </dialog>
  </>
}

export function CourseStructureControls({ busy, archived, onToggleArchived, onApply }: { busy: boolean; archived: boolean; onToggleArchived: () => void; onApply: Apply }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2">
    <TitleDialog primary title="Crear capítulo" initial="" label="Título del capítulo" busy={busy} onSave={title => onApply({ type: 'create-chapter', title })} trigger={<><Plus className="size-4" aria-hidden="true" />Nuevo capítulo</>} />
    <button type="button" onClick={onToggleArchived} aria-pressed={archived} className={button}><Archive className="size-4" aria-hidden="true" />{archived ? 'Ocultar archivados' : 'Ver archivados'}</button>
    <p className="w-full text-xs leading-6 text-[#8b6d6d]">Puedes crear, renombrar y ordenar capítulos. Al archivarlos, sus textos se conservan y puedes restaurarlos. Los números y direcciones existentes se mantienen al reordenar.</p>
  </div>
}

export function ChapterActions({ chapter, first, last, busy, onApply }: { chapter: Chapter; first: boolean; last: boolean; busy: boolean; onApply: Apply }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [error, setError] = useState('')
  return <div role="group" aria-label={`Acciones del capítulo ${chapter.number}`} className="flex flex-wrap items-center gap-1 pb-2 pl-5 sm:pb-0 sm:pl-0">
    <TitleDialog iconOnly title={`Renombrar capítulo ${chapter.number}`} initial={chapter.title} label="Título del capítulo" busy={busy} onSave={title => onApply({ type: 'rename-chapter', chapter: chapter.number, title })} trigger={<Pencil className="size-4" aria-hidden="true" />} />
    <button type="button" className={iconButton} disabled={busy || first} onClick={() => void onApply({ type: 'move-chapter', chapter: chapter.number, direction: 'up' })} title={`Subir capítulo ${chapter.number}`} aria-label={`Subir capítulo ${chapter.number}`}><ArrowUp className="size-4" aria-hidden="true" /></button>
    <button type="button" className={iconButton} disabled={busy || last} onClick={() => void onApply({ type: 'move-chapter', chapter: chapter.number, direction: 'down' })} title={`Bajar capítulo ${chapter.number}`} aria-label={`Bajar capítulo ${chapter.number}`}><ArrowDown className="size-4" aria-hidden="true" /></button>
    {chapter.archived ? <button type="button" className={button} disabled={busy} title={`Restaurar capítulo ${chapter.number}`} onClick={() => void onApply({ type: 'restore-chapter', chapter: chapter.number })}><RotateCcw className="size-4" aria-hidden="true" />Restaurar</button> : <button type="button" className={iconButton} disabled={busy} onClick={() => { setError(''); dialog.current?.showModal() }} title={`Archivar capítulo ${chapter.number}`} aria-label={`Archivar capítulo ${chapter.number}`}><Archive className="size-4" aria-hidden="true" /></button>}
    <dialog ref={dialog} aria-labelledby={id} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-[#e3caca] bg-white p-6 text-[#4d3838] shadow-xl backdrop:bg-[#3b2022]/40" onCancel={event => { if (busy) event.preventDefault() }}>
      <h2 id={id} className="font-sans text-xl font-semibold">Archivar capítulo</h2><p className="mt-3 text-sm leading-7">«{chapter.title}» dejará de aparecer en la página pública. Sus secciones, borradores y publicaciones se conservan. Puedes recuperarlo en «Ver archivados».</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button className={button} disabled={busy} onClick={() => dialog.current?.close()}>Cancelar</button><button className={button} disabled={busy} onClick={async () => { setError(''); if (await onApply({ type: 'archive-chapter', chapter: chapter.number })) dialog.current?.close(); else setError('No se pudo archivar. Revisa la conexión y tus permisos antes de reintentar.') }}>{busy ? 'Guardando…' : 'Archivar capítulo'}</button></div>
    </dialog>
  </div>
}
