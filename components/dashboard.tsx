'use client'

import { useEffect, useRef, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { withSubtopicTitle } from '@/lib/course-titles'
import { Folder, FileText, Plus, Clock, CheckCircle2, MessageSquare, ChevronRight, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Pencil, Trash2, X, Check } from 'lucide-react'
import { chapters as initialChapters, isChapterList, type Chapter } from '@/lib/course-data'
import { changeCourseStructure } from '@/lib/course-structure-store'
import { COURSE_TITLE_MAX_LENGTH, shortSectionSlug, type CourseStructureAction } from '@/lib/course-structure'
import { CourseStructureControls, ChapterActions } from '@/components/course-structure-controls'
import { workspaceButtonClass, workspaceInputClass } from '@/lib/workspace-controls'
import { useModalFocus } from '@/lib/use-modal-focus'

const catalogCacheKey = 'mc361:course-catalog:v1';

export default function Dashboard({ session }: { session: any }) {
  const expansionStorageKey = `mc361_expanded_chapters:${session?.email || 'guest'}`
  const [expandedChapters, setExpandedChapters] = useState<string[]>([])
  const [storageReady, setStorageReady] = useState(false)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(expansionStorageKey) || '[]')
      setExpandedChapters(Array.isArray(saved) ? saved.filter((value): value is string => typeof value === 'string') : [])
      const cached = localStorage.getItem(catalogCacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (isChapterList(parsed)) setLocalChapters(parsed)
      }
    } catch { /* Browser storage is optional. */ }
    setStorageReady(true)
  }, [expansionStorageKey])

  useEffect(() => {
    if (!storageReady) return
    try {
      localStorage.setItem(expansionStorageKey, JSON.stringify(expandedChapters))
    } catch {
      // Chapters still expand when browser storage is unavailable.
    }
  }, [expansionStorageKey, expandedChapters, storageReady])

  const toggleChapter = (number: string) => {
    setExpandedChapters((current) => current.includes(number)
      ? current.filter((chapter) => chapter !== number)
      : [...current, number])
  }

  const assignedChapters: string[] = session?.assignedChapters || []
  const canEditChapter = (chapterNumber: string) => {
    if (!session) return false
    if (session.role === 'admin') return true
    return assignedChapters.includes(chapterNumber)
  }
  const [documentsStatus, setDocumentsStatus] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const [localChapters, setLocalChapters] = useState<Chapter[]>(initialChapters)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (!storageReady || !dataReady) return
    try {
      localStorage.setItem(catalogCacheKey, JSON.stringify(localChapters));
    } catch { /* Keep working without browser storage. */ }
  }, [localChapters, storageReady, dataReady]);

  // Para crear nuevo subtema in-line
  const [creatingInChapter, setCreatingInChapter] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const newSubtopicInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mutationInFlight = useRef(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  
  // Para editar título
  const [editingSection, setEditingSection] = useState<{chapter: string, index: number} | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  // Confirmar eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{chapter: string, index: number, title: string, isPublished: boolean} | null>(null)
  const deleteDialog = useRef<HTMLDivElement>(null)
  useModalFocus(Boolean(deleteConfirm), deleteDialog, () => { if (!isProcessing) setDeleteConfirm(null) })

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setDataReady(false);
    setLoadError(null);
    const timeout = window.setTimeout(() => {
      active = false;
      setIsLoading(false);
      setLoadError('La conexión está tardando demasiado. Mostramos el temario disponible; reintenta para cargar los datos actuales y habilitar los cambios.');
    }, 15000);
    async function loadData() {
      if (!session?.email) { window.clearTimeout(timeout); setIsLoading(false); return }
      
      try {
        await auth.authStateReady();
        if (!active) return;
        if (!auth.currentUser || auth.currentUser.email !== session.email) throw new Error('La sesión del navegador no coincide con la plataforma. Recarga la página o vuelve a iniciar sesión.');
        const structureSnap = await getDoc(doc(db, 'course', 'chapters'));
        if (!active) return;
        const statusMap: Record<string, any> = {};
        if (structureSnap.exists() && !isChapterList(structureSnap.data().list)) throw new Error('El temario guardado tiene un formato inválido. No se habilitarán cambios hasta que pueda cargarse correctamente.');
        const currentList: Chapter[] = (structureSnap.exists() && isChapterList(structureSnap.data().list))
          ? structureSnap.data().list
          : initialChapters;

        setLocalChapters(currentList);

        if (session.role === 'admin') {
          const draftsSnap = await getDocs(query(collection(db, 'drafts')));
          draftsSnap.forEach(d => { statusMap[d.id] = d.data(); });
        } else {
          // 1. Borradores con autoría del usuario
          try {
            const ownSnap = await getDocs(query(collection(db, 'drafts'), where("authorEmail", "==", session.email)));
            ownSnap.forEach(d => { statusMap[d.id] = d.data(); });
          } catch (err) {
            console.warn('No se pudieron consultar borradores por autor:', err);
          }

          // 2. Para los subtemas de capítulos asignados, consultar borradores individuales
          // permitidos por canEditChapter en firestore.rules (ej. editados o iniciados por admin)
          const assignedList = currentList.filter(c => assignedChapters.includes(c.number));
          const draftFetches: Promise<any>[] = [];
          for (const ch of assignedList) {
            for (const sec of ch.sections) {
              const parts = sec.slug ? sec.slug.split('/') : [];
              const slug = parts.length > 1 ? parts[1] : (sec.slug || sec.id);
              const draftId = `${ch.number}_${slug}`;
              if (!statusMap[draftId]) {
                draftFetches.push(
                  getDoc(doc(db, 'drafts', draftId))
                    .then(snap => {
                      if (snap.exists()) {
                        statusMap[draftId] = snap.data();
                      }
                    })
                    .catch(() => null)
                );
              }
            }
          }
          if (draftFetches.length > 0) {
            await Promise.all(draftFetches);
          }
        }
        if (!active) return;
        setDocumentsStatus(statusMap);
        setDataReady(true);
      } catch (e) {
        console.error(e);
        if (active) setLoadError(e instanceof Error ? e.message : 'No se pudieron cargar los datos actuales del curso. Inténtalo nuevamente.');
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }
    loadData();
    return () => { active = false; window.clearTimeout(timeout); };
  }, [session, retry]);

  const applyChange = async (action: CourseStructureAction, message: string): Promise<boolean> => {
    if (!dataReady || mutationInFlight.current) return false
    mutationInFlight.current = true
    setIsProcessing(true)
    try {
      const change = await changeCourseStructure({ email: session.email, role: session.role, assignedChapters }, action)
      setLocalChapters(change.chapters)
      setEditingSection(null)
      if (action.type === 'archive-chapter') setCreatingInChapter(null)
      if (change.section) {
        const draftId = `${change.chapter.number}_${shortSectionSlug(change.section)}`
        setDocumentsStatus(current => {
          const next = { ...current }
          if (action.type === 'remove-section') delete next[draftId]
          else if (action.type === 'create-section') next[draftId] = { title: change.section!.title, status: 'draft', updatedAt: new Date().toISOString() }
          else if (action.type === 'rename-section' && next[draftId]) next[draftId] = withSubtopicTitle(next[draftId], change.section!.title)
          return next
        })
      }
      if (action.type === 'create-chapter') setExpandedChapters(current => [...current, change.chapter.number])
      showToast(message, 'success')
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo guardar el cambio. El contenido anterior se conserva.', 'error')
      return false
    } finally { mutationInFlight.current = false; setIsProcessing(false) }
  }

  const handleChapterAction = (action: CourseStructureAction) => applyChange(action.type === 'move-chapter' ? { ...action, activeOnly: !showArchived } : action,
    action.type === 'archive-chapter' ? 'Capítulo archivado. Sus contenidos se conservan.'
      : action.type === 'restore-chapter' ? 'Capítulo restaurado.'
      : action.type === 'create-chapter' ? 'Capítulo creado.'
      : action.type === 'move-chapter' ? 'Orden de capítulos actualizado.' : 'Título del capítulo actualizado.')

  const handleCreate = async (chapter: string) => {
    if (await applyChange({ type: 'create-section', chapter, title: newTitle }, 'Subtema creado.')) {
      setCreatingInChapter(null)
      setNewTitle('')
    }
  }
  const handleReorder = async (chapter: string, index: number, direction: 'up' | 'down') => {
    const section = localChapters.find(item => item.number === chapter)?.sections[index]
    if (section) await applyChange({ type: 'move-section', chapter, slug: shortSectionSlug(section), direction }, 'Orden actualizado.')
  }
  const executeDelete = async (chapter: string, index: number) => {
    const section = localChapters.find(item => item.number === chapter)?.sections[index]
    if (section && await applyChange({ type: 'remove-section', chapter, slug: shortSectionSlug(section) }, 'Subtema eliminado.')) setDeleteConfirm(null)
  }
  const handleSaveEdit = async (chapter: string, index: number) => {
    const section = localChapters.find(item => item.number === chapter)?.sections[index]
    if (section && await applyChange({ type: 'rename-section', chapter, slug: shortSectionSlug(section), title: editTitle }, 'Título del subtema actualizado.')) setEditingSection(null)
  }

  // Filtrar capítulos que el usuario puede ver
  const visibleChapters = localChapters.filter(c => (session.role === 'admin' || assignedChapters.includes(c.number)) && (!c.archived || showArchived && session.role === 'admin'))
  const allChaptersExpanded = visibleChapters.length > 0 && visibleChapters.every((chapter) => expandedChapters.includes(chapter.number))

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#3b2022] relative">
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl shadow-[#4b1719]/10 border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#f4fbf7] border-[#d1e8da] text-[#1c663b]' : 'bg-[#fdf6f6] border-[#f1dada] text-[#8B0000]'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-semibold text-sm">{toast.message}</p>
        </div>
      )}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-[#4b1719]">Contenido</h1>
          <p className="text-sm text-[#8b6d6d] mt-1">Abre un capítulo para gestionar sus subtemas. Recordaremos los que dejes abiertos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpandedChapters(allChaptersExpanded ? [] : visibleChapters.map((chapter) => chapter.number))}
            disabled={visibleChapters.length === 0}
            className={workspaceButtonClass()}
          >
            {allChaptersExpanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
            {allChaptersExpanded ? 'Contraer todo' : 'Expandir todo'}
          </button>
        </div>
      </div>

      {session.role === 'admin' && <CourseStructureControls busy={isProcessing || !dataReady} archived={showArchived} onToggleArchived={() => setShowArchived(value => !value)} onApply={handleChapterAction} />}

      {isLoading && <p role="status" className="mb-5 flex items-center gap-2 text-sm text-[#8b6d6d]"><Clock className="size-4 animate-pulse" aria-hidden="true" />Actualizando capítulos y estados de publicación…</p>}
      {loadError && <div role="alert" className="mb-5 rounded-lg border border-[#d5baba] bg-[#f8eaea] p-4 text-sm"><p>{loadError}</p><button type="button" onClick={() => setRetry(value => value + 1)} className={`${workspaceButtonClass()} mt-3`}>Reintentar carga</button></div>}
      {!visibleChapters.length && <p className="rounded-lg border border-dashed border-[#d5baba] p-6 text-sm">{session.role === 'admin' ? 'El curso todavía no tiene capítulos.' : 'Tu cuenta no tiene capítulos asignados. Un administrador debe asignarte los capítulos que puedes editar.'}</p>}
      <div className="space-y-3">
        {visibleChapters.map(chapter => (
          <div key={chapter.number} className="bg-white rounded-xl border border-[#eadada] overflow-hidden shadow-sm">
            <div className={`bg-[#fbf7f4] flex flex-wrap items-center gap-2 pr-3 transition-colors hover:bg-[#f5ecec] focus-within:bg-[#f5ecec] ${expandedChapters.includes(chapter.number) ? 'border-b border-[#eadada]' : ''}`}>
              <h2 className="min-w-0 w-full flex-none lg:w-auto lg:flex-1">
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter.number)}
                  aria-expanded={expandedChapters.includes(chapter.number)}
                  aria-controls={`chapter-sections-${chapter.number}`}
                  className="flex w-full items-center gap-3 rounded-lg px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8B0000]"
                >
                  <ChevronRight aria-hidden="true" className={`size-4 shrink-0 text-[#8b6d6d] transition-transform ${expandedChapters.includes(chapter.number) ? 'rotate-90' : ''}`} />
                  <Folder aria-hidden="true" className="size-5 shrink-0 text-[#8b6d6d]" />
                  <span className="min-w-0 flex-1 break-words font-sans text-lg font-bold text-[#4b1719]">Capítulo {chapter.number}: {chapter.title}</span>
                  <span className="hidden shrink-0 text-xs font-normal text-[#8b6d6d] sm:inline">{chapter.sections.length} {chapter.sections.length === 1 ? 'subtema' : 'subtemas'}</span>
                </button>
              </h2>
              {chapter.archived && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Archivado</span>}
              {session.role === 'admin' && <ChapterActions chapter={chapter} first={visibleChapters[0]?.number === chapter.number} last={visibleChapters.at(-1)?.number === chapter.number} busy={isProcessing || !dataReady} onApply={handleChapterAction} />}
              <button 
                type="button"
                disabled={!dataReady || isProcessing || Boolean(chapter.archived)}
                onClick={() => {
                  setExpandedChapters((current) => current.includes(chapter.number) ? current : [...current, chapter.number]);
                  setCreatingInChapter(chapter.number);
                  setNewTitle('');
                  // Wait until the chapter and its input are visible before focusing.
                  requestAnimationFrame(() => {
                    const input = newSubtopicInputRef.current;
                    input?.focus({ preventScroll: true });
                    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  });
                }}
                className={workspaceButtonClass('quiet')}
              >
                <Plus className="size-4" aria-hidden="true" /> Añadir subtema
              </button>
            </div>
            
            <div id={`chapter-sections-${chapter.number}`} hidden={!expandedChapters.includes(chapter.number)} className="divide-y divide-[#f5ecec]">
              {chapter.sections.length === 0 && creatingInChapter !== chapter.number ? (
                <p className="p-5 text-sm text-[#8b6d6d] italic">No hay subtemas aún.</p>
              ) : (
                chapter.sections.map((section, idx) => {
                  const docSlug = shortSectionSlug(section);
                  const draftId = `${chapter.number}_${docSlug}`;
                  const docStatus = documentsStatus[draftId];
                  
                  let statusBadge = <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">Sin empezar</span>
                  if (docStatus?.status === 'draft') statusBadge = <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true"/> En progreso</span>
                  if (docStatus?.status === 'pending_approval') statusBadge = <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden="true"/> En revisión</span>
                  if (docStatus?.status === 'approved') statusBadge = <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="size-3.5" aria-hidden="true"/> Aprobado</span>

                  return (
                    <div key={section.id} className="group flex flex-col gap-3 p-3 hover:bg-[#fdfafa] transition-colors lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`} aria-label={`Abrir el contenido de ${section.title}`} className="size-11 shrink-0 rounded-lg bg-[#f5ecec] flex items-center justify-center text-[#7d6060] group-hover:bg-[#8B0000] group-hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B0000] transition-colors">
                          <FileText className="w-5 h-5" />
                        </a>
                        
                        {editingSection?.chapter === chapter.number && editingSection?.index === idx ? (
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <span className="font-semibold text-[15px] text-[#8b6d6d]">{section.id} ·</span>
                            <input 
                              autoFocus
                              aria-label={`Título del subtema ${section.id}`}
                              maxLength={COURSE_TITLE_MAX_LENGTH}
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(chapter.number, idx)
                                if (e.key === 'Escape') setEditingSection(null)
                              }}
                              className={`${workspaceInputClass()} min-w-0 flex-1`}
                            />
                            <button type="button" onClick={() => handleSaveEdit(chapter.number, idx)} disabled={isProcessing || !dataReady || Boolean(chapter.archived)} aria-label={`Guardar título del subtema ${section.id}`} title="Guardar título" className={workspaceButtonClass('primary', true)}>
                              <Check className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setEditingSection(null)} aria-label="Cancelar cambio de título" title="Cancelar" className={workspaceButtonClass('quiet', true)}>
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`} className="min-w-0 flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B0000]">
                            <p className="break-words font-semibold text-[15px] group-hover:text-[#8B0000] transition-colors">{section.id} · {section.title}</p>
                            <p className="text-xs text-[#8b6d6d] mt-0.5">Última modificación: {docStatus?.updatedAt ? new Date(docStatus.updatedAt).toLocaleDateString('es-PE') : 'Nunca'}</p>
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {statusBadge}
                        <div role="group" aria-label={`Editar subtema ${section.id}`} className="flex items-center gap-1">
                           <button type="button" onClick={() => { setEditingSection({chapter: chapter.number, index: idx}); setEditTitle(section.title); }} disabled={isProcessing || !dataReady || Boolean(chapter.archived)} className={workspaceButtonClass('quiet', true)} title="Renombrar subtema" aria-label={`Renombrar subtema ${section.id}`}>
                             <Pencil className="w-4 h-4" />
                           </button>
                           {canEditChapter(chapter.number) && (
                             <button 
                               type="button"
                               onClick={() => {
                                 const isPublished = Boolean(docStatus?.publishedContent || docStatus?.status === 'approved');
                                 setDeleteConfirm({ chapter: chapter.number, index: idx, title: section.title, isPublished });
                               }} 
                               disabled={isProcessing || !dataReady || Boolean(chapter.archived)}
                               className={workspaceButtonClass('quiet', true)}
                               title="Eliminar subtema"
                               aria-label={`Eliminar subtema ${section.id}`}
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                        <div role="group" aria-label={`Orden del subtema ${section.id}`} className="flex items-center gap-1">
                          <button type="button" onClick={() => handleReorder(chapter.number, idx, 'up')} disabled={idx === 0 || isProcessing || !dataReady} className={workspaceButtonClass('secondary', true)} title="Subir subtema" aria-label={`Subir subtema ${section.id}`}>
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => handleReorder(chapter.number, idx, 'down')} disabled={idx === chapter.sections.length - 1 || isProcessing || !dataReady} className={workspaceButtonClass('secondary', true)} title="Bajar subtema" aria-label={`Bajar subtema ${section.id}`}>
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`} className={workspaceButtonClass('quiet', true)} title="Abrir contenido" aria-label={`Abrir el contenido de ${section.title}`}>
                          <ChevronRight className="w-5 h-5 text-[#dcc3c3] hover:text-[#8B0000] transition-colors" />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
              
              {creatingInChapter === chapter.number && (
                <div className="p-4 bg-[#fcf9f9]">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <input 
                      ref={newSubtopicInputRef}
                      aria-label={`Título del nuevo subtema del capítulo ${chapter.number}`}
                      maxLength={COURSE_TITLE_MAX_LENGTH}
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate(chapter.number)}
                      placeholder="Título del nuevo subtema..."
                      className={`${workspaceInputClass()} min-w-0 flex-1 basis-full sm:basis-0`}
                    />
                    <button type="button" onClick={() => setCreatingInChapter(null)} className={workspaceButtonClass()}>Cancelar</button>
                    <button type="button" onClick={() => handleCreate(chapter.number)} disabled={isProcessing || !dataReady || Boolean(chapter.archived)} className={workspaceButtonClass('primary')}>
                      {isProcessing ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Confirmar Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3e3030]/40 backdrop-blur-sm p-4">
          <div ref={deleteDialog} role="dialog" aria-modal="true" aria-labelledby="delete-section-title" aria-describedby="delete-section-description" tabIndex={-1} className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E5D7D4] overflow-hidden flex flex-col p-6 text-center">
            <div className={`w-12 h-12 rounded-full ${deleteConfirm.isPublished && session?.role !== 'admin' ? 'bg-[#fff5e6] text-[#b45309]' : 'bg-[#f8eaea] text-[#8B0000]'} flex items-center justify-center mx-auto mb-4`}>
              <Trash2 className="w-6 h-6" />
            </div>
            
            {deleteConfirm.isPublished && session?.role !== 'admin' ? (
              <>
                <h3 id="delete-section-title" className="text-lg font-bold text-[#3E3030] mb-2">Subtema Publicado</h3>
                <p id="delete-section-description" className="text-sm text-[#756565] mb-6">
                  <strong>{deleteConfirm.title}</strong> ya ha sido aprobado y está publicado en el curso oficial. Por seguridad, solo los <strong>Administradores</strong> pueden eliminar contenido público.
                </p>
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className={`${workspaceButtonClass('primary')} w-full`}
                >
                  Entendido
                </button>
              </>
            ) : (
              <>
                <h3 id="delete-section-title" className="text-lg font-bold text-[#3E3030] mb-2">Eliminar Subtema</h3>
                <p id="delete-section-description" className="text-sm text-[#756565] mb-6">
                  ¿Estás seguro de que quieres eliminar <strong>{deleteConfirm.title}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setDeleteConfirm(null)} className={`${workspaceButtonClass()} flex-1`}>
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      executeDelete(deleteConfirm.chapter, deleteConfirm.index);
                      setDeleteConfirm(null);
                    }}
                    className={`${workspaceButtonClass('primary')} flex-1`}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
