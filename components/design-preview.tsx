import { useEffect, useId, useRef, useState } from 'react'
import { Archive, BookOpen, Check, CheckCircle2, ChevronDown, CircleHelp, FileText, Layers, Moon, Pencil, Plus, Sun, Users, X } from 'lucide-react'
import { Badge, Button, TextField } from '@/components/ui/controls'

type SampleChapter = { number: string; title: string; sections: { title: string; state: 'published' | 'review' | 'draft' }[] }
const samples: SampleChapter[] = [
  { number: '01', title: 'Esfuerzos, falla y factor de seguridad', sections: [{ title: 'Concepto de esfuerzo', state: 'published' }, { title: 'Esfuerzos en elementos y conexiones', state: 'published' }, { title: 'Resistencia y seguridad', state: 'review' }] },
  { number: '02', title: 'Deformaciones y ley de Hooke', sections: [{ title: 'Deformación unitaria', state: 'draft' }, { title: 'Ley de Hooke', state: 'published' }] },
  { number: '03', title: 'Cambio de temperatura y problemas hiperestáticos', sections: [{ title: 'Deformación térmica', state: 'draft' }] },
]
const stateLabel = { published: 'Publicado', review: 'En revisión', draft: 'Borrador' } as const
const stateTone = { published: 'success', review: 'warning', draft: 'neutral' } as const

export default function DesignPreview() {
  const [palette, setPalette] = useState<'ink' | 'burgundy'>('ink')
  const [dark, setDark] = useState(false)
  const [chapters, setChapters] = useState(samples)
  const [expanded, setExpanded] = useState<string[]>(['01'])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const id = useId()
  const visible = chapters.filter(chapter => `${chapter.number} ${chapter.title}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')))
  useEffect(() => () => clearTimeout(timer.current), [])

  function openEditor(chapter?: SampleChapter) {
    setEditing(chapter?.number || null)
    setTitle(chapter?.title || '')
    setError('')
    dialog.current?.showModal()
  }
  function saveChapter(event: React.FormEvent) {
    event.preventDefault()
    const value = title.trim()
    if (!value) { setError('Escribe el título del capítulo.'); return }
    if (editing) setChapters(current => current.map(chapter => chapter.number === editing ? { ...chapter, title: value } : chapter))
    else setChapters(current => [...current, { number: String(Math.max(0, ...current.map(chapter => Number(chapter.number))) + 1).padStart(2, '0'), title: value, sections: [] }])
    dialog.current?.close()
    setMessage(editing ? 'Título actualizado en esta muestra.' : 'Capítulo añadido a esta muestra.')
  }
  function previewSave() {
    setBusy(true)
    setMessage('')
    timer.current = setTimeout(() => { setBusy(false); setMessage('Ejemplo de confirmación: cambios guardados.') }, 900)
  }

  return <div className="ui-theme design-preview" data-theme={dark ? 'dark' : 'light'} data-palette={palette}>
    <div className="design-review-bar">
      <p><strong>Muestra de diseño</strong> · Etapa 1</p>
      <div className="design-review-options">
        <div className="design-palette" role="group" aria-label="Variante de color">
          <button type="button" aria-pressed={palette === 'ink'} onClick={() => setPalette('ink')}>Tinta</button>
          <button type="button" aria-pressed={palette === 'burgundy'} onClick={() => setPalette('burgundy')}>Granate</button>
        </div>
        <Button variant="ghost" iconOnly aria-label={dark ? 'Ver muestra en modo claro' : 'Ver muestra en modo oscuro'} onClick={() => setDark(value => !value)}>{dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</Button>
        <a className="ui-button ui-button--secondary" href="/">Volver a la web</a>
      </div>
    </div>
    <div className="design-shell">
      <aside className="design-sidebar" aria-label="Accesos de la plataforma">
        <a className="design-brand" href="/"><img src="/logo-uni.png" alt="UNI" width="36" height="44" /><div><strong>Resistencia de Materiales</strong><span>MC361 · UNI</span></div></a>
        <nav className="design-nav" aria-label="Espacio de trabajo">
          <a href="#contenido-muestra" aria-current="page"><Layers aria-hidden="true" />Contenido</a>
          <a href="/examenes"><FileText aria-hidden="true" />Exámenes</a>
          <a href="/acerca-de"><Users aria-hidden="true" />Equipo del proyecto</a>
          <a href="/guia-colaboradores"><CircleHelp aria-hidden="true" />Guía de colaboradores</a>
        </nav>
        <div className="design-sidebar-note"><BookOpen size={20} aria-hidden="true" /><p>Una misma base visual para organizar, editar y estudiar.</p></div>
      </aside>
      <main className="design-main" id="contenido-muestra">
        <div className="design-topline"><span>Espacio de trabajo / Contenido</span><Badge tone="info">Vista de administrador</Badge></div>
        <header className="design-heading"><div><h1>Contenido del curso</h1><p>Organiza los capítulos y prepara los temas que acompañan el estudio.</p></div><Button variant="primary" onClick={() => openEditor()}><Plus aria-hidden="true" />Nuevo capítulo</Button></header>
        <div className="ui-alert"><CircleHelp aria-hidden="true" /><p>Contenido de ejemplo para revisar el diseño. Los cambios de esta página se conservan solo mientras esté abierta.</p></div>
        <div style={{ marginBlock: '1.25rem' }}><TextField label="Buscar en esta muestra" type="search" value={query} placeholder="Título o número de capítulo" onChange={event => setQuery(event.target.value)} /></div>
        <section className="design-chapters" aria-labelledby="chapter-list-title">
          <div className="design-list-heading"><h2 id="chapter-list-title">Capítulos</h2><span>{visible.length} {visible.length === 1 ? 'capítulo' : 'capítulos'}</span></div>
          {visible.map(chapter => <article className="design-chapter" key={chapter.number}>
            <div className="design-chapter-header">
              <button className="design-chapter-toggle" type="button" aria-expanded={expanded.includes(chapter.number)} aria-controls={`${id}-${chapter.number}`} onClick={() => setExpanded(current => current.includes(chapter.number) ? current.filter(number => number !== chapter.number) : [...current, chapter.number])}>
                <span className="design-chapter-number">{chapter.number}</span><span className="design-chapter-copy"><strong>{chapter.title}</strong><span>{chapter.sections.length} {chapter.sections.length === 1 ? 'sección' : 'secciones'}</span></span><ChevronDown aria-hidden="true" />
              </button>
              <div className="design-chapter-actions"><Button variant="ghost" iconOnly aria-label={`Renombrar capítulo ${chapter.number}`} title="Renombrar capítulo" onClick={() => openEditor(chapter)}><Pencil aria-hidden="true" /></Button></div>
            </div>
            <div id={`${id}-${chapter.number}`} hidden={!expanded.includes(chapter.number)} className="design-sections">
              {chapter.sections.map((section, index) => <div className="design-section" key={section.title}><div className="design-section-name"><span>{Number(chapter.number)}.{index + 1}</span><span>{section.title}</span></div><Badge tone={stateTone[section.state]}>{section.state === 'published' && <Check aria-hidden="true" />}{stateLabel[section.state]}</Badge></div>)}
              {!chapter.sections.length && <p className="ui-field-note">Este capítulo de ejemplo todavía no tiene secciones.</p>}
            </div>
          </article>)}
          {!visible.length && <p style={{ padding: '1.5rem', color: 'var(--ui-muted)' }}>No hay capítulos que coincidan con la búsqueda.</p>}
        </section>
        <section className="design-components" aria-labelledby="controls-title">
          <div className="design-section-heading"><h2 id="controls-title">Controles y estados</h2><p>La misma tipografía, espaciado y comportamiento visual en cada pantalla.</p></div>
          <div className="design-component-grid">
            <div className="design-component-panel"><h3>Acciones</h3><div className="design-control-row"><Button variant="primary" busy={busy} onClick={previewSave}>{busy ? 'Guardando…' : 'Probar guardado'}</Button><Button onClick={() => { setQuery(''); setMessage('Búsqueda restablecida.') }}>Restablecer búsqueda</Button></div><div className="design-control-row"><Button variant="ghost" onClick={() => setMessage('Ejemplo de una acción de menor prioridad.')}>Acción secundaria</Button><Button disabled>Sin cambios</Button></div><div className="design-control-row"><Button variant="danger" onClick={() => setMessage('Ejemplo de acción sensible. No se ha eliminado ningún contenido.')}><Archive aria-hidden="true" />Acción sensible</Button></div></div>
            <div className="design-component-panel"><h3>Campos de formulario</h3><TextField label="Título del tema" placeholder="Por ejemplo, esfuerzo normal" hint="Una indicación breve junto al campo." /><TextField label="Ejemplo de campo con error" defaultValue="" error="Este campo muestra cómo se indica un dato pendiente." /></div>
            <div className="design-component-panel"><h3>Estados del contenido</h3><div className="design-control-row"><Badge tone="neutral">Borrador</Badge><Badge tone="warning">En revisión</Badge><Badge tone="success"><Check aria-hidden="true" />Publicado</Badge></div><p className="ui-field-note" style={{ marginTop: '1rem' }}>Cada estado tiene texto y un color propio; el color no es la única indicación.</p></div>
            <div className="design-component-panel"><h3>Confirmaciones y errores</h3><div className="ui-alert ui-alert--success"><CheckCircle2 aria-hidden="true" /><p>Los cambios se guardaron correctamente.</p></div><div className="ui-alert ui-alert--danger" style={{ marginTop: '.75rem' }}><X aria-hidden="true" /><p>No se pudo guardar. El texto sigue disponible para reintentar.</p></div></div>
          </div>
        </section>
        <p className="design-sample-feedback" role="status" aria-live="polite">{message}</p>
        <footer>Propuesta visual para revisar antes de aplicarla a las pantallas de la plataforma.</footer>
      </main>
    </div>
    <dialog className="ui-dialog" ref={dialog} aria-labelledby={`${id}-dialog-title`} aria-describedby={`${id}-dialog-description`}>
      <form noValidate onSubmit={saveChapter}>
        <div className="design-dialog-heading"><div><h2 id={`${id}-dialog-title`}>{editing ? 'Renombrar capítulo' : 'Nuevo capítulo'}</h2><p id={`${id}-dialog-description`}>Este cambio se aplica únicamente a la muestra.</p></div><Button iconOnly variant="ghost" aria-label="Cerrar ventana" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></Button></div>
        <TextField label="Título del capítulo" required maxLength={160} autoFocus value={title} error={error} onChange={event => { setTitle(event.target.value); setError('') }} />
        <div className="design-dialog-footer"><Button onClick={() => dialog.current?.close()}>Cancelar</Button><Button type="submit" variant="primary">{editing ? 'Guardar título' : 'Crear capítulo'}</Button></div>
      </form>
    </dialog>
  </div>
}
