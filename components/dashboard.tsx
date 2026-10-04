'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { useRef } from 'react'
import { Folder, FileText, Plus, Clock, CheckCircle2, MessageSquare, ChevronRight, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react'
import { chapters as initialChapters, type Chapter, type Section } from '@/lib/course-data'

export default function Dashboard({ session }: { session: any }) {
  const [assignedChapters, setAssignedChapters] = useState<string[]>([])
  const [documentsStatus, setDocumentsStatus] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [localChapters, setLocalChapters] = useState<Chapter[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('mc361_local_chapters');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const countCached = parsed.reduce((acc: number, c: any) => acc + (c.sections?.length || 0), 0);
            const countInitial = initialChapters.reduce((acc: number, c: any) => acc + (c.sections?.length || 0), 0);
            if (countCached >= countInitial) {
              return parsed;
            }
          }
        }
      } catch {}
    }
    return initialChapters;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && localChapters) {
      localStorage.setItem('mc361_local_chapters', JSON.stringify(localChapters));
    }
  }, [localChapters]);

  // Para crear nuevo subtema in-line
  const [creatingInChapter, setCreatingInChapter] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  
  // Para editar título
  const [editingSection, setEditingSection] = useState<{chapter: string, index: number} | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  // Confirmar eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<{chapter: string, index: number, title: string} | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!session?.email) return
      
      try {
        // Cargar capítulos asignados
        const userDoc = await getDoc(doc(db, 'users', session.email))
        let assigned: string[] = []
        if (userDoc.exists()) {
          assigned = userDoc.data().assignedChapters || []
          setAssignedChapters(assigned)
        }

        // Cargar estado de los documentos (borradores/avances)
        const q = session.role === 'admin' 
          ? query(collection(db, 'drafts'))
          : query(collection(db, 'drafts'), where("authorEmail", "==", session.email))
          
        const snap = await getDocs(q)
        const statusMap: Record<string, any> = {}
        snap.forEach(d => {
          statusMap[d.id] = d.data()
        })
        setDocumentsStatus(statusMap)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [session])

  const handleCreate = async (chapterNumber: string) => {
    if (!newTitle.trim()) return showToast('Escribe el título', 'error')
    setIsProcessing(true)
    const chData = localChapters.find(c => c.number === chapterNumber)
    if (!chData) return
    
    // Auto calcular ID buscando el número más alto existente + 1
    const chapterNumInt = parseInt(chapterNumber, 10);
    const existingNums = chData.sections
      .map((s: Section) => {
        const parts = s.id ? s.id.split('.') : [];
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const autoId = `${chapterNumInt}.${maxNum + 1}`;
    
    const safeTitle = newTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-')
    const chapterFolder = chData.sections[0]?.slug?.split('/')[0] || `${chapterNumber}-capitulo`
    const fullSlug = `${chapterFolder}/${safeTitle}`
    const newSection = { id: autoId, title: newTitle, slug: fullSlug }

    try {
      const res = await fetch('/api/subchapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, newSection })
      })
      if (res.ok) {
        const data = await res.json()
        setLocalChapters(data.chapters)
        setCreatingInChapter(null)
        setNewTitle('')
        showToast('Subtema creado', 'success')
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Error al crear', 'error')
      }
    } catch (e: any) {
      showToast('Error de conexión', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReorder = async (chapterNumber: string, sectionIndex: number, direction: 'up' | 'down') => {
    if (isProcessing) return;
    const chData = localChapters.find(c => c.number === chapterNumber);
    if (!chData) return;
    
    const newSections = [...chData.sections];
    if (direction === 'up' && sectionIndex > 0) {
      [newSections[sectionIndex - 1], newSections[sectionIndex]] = [newSections[sectionIndex], newSections[sectionIndex - 1]];
    } else if (direction === 'down' && sectionIndex < newSections.length - 1) {
      [newSections[sectionIndex + 1], newSections[sectionIndex]] = [newSections[sectionIndex], newSections[sectionIndex + 1]];
    } else {
      return;
    }

    // Recalcular IDs basados en el nuevo orden, sin ceros a la izquierda
    const chapterNumInt = parseInt(chapterNumber, 10)
    newSections.forEach((sec, idx) => {
      sec.id = `${chapterNumInt}.${idx + 1}`;
    });

    setIsProcessing(true);
    // Optimistic UI update
    setLocalChapters(prev => prev.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c));

    try {
      await fetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      });
      showToast('Orden actualizado', 'success')
    } catch (e) {
      showToast('Error reordenando', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  const executeDelete = async (chapterNumber: string, sectionIndex: number) => {
    setIsProcessing(true);
    const chData = localChapters.find(c => c.number === chapterNumber);
    if (!chData) return;
    
    const newSections = [...chData.sections];
    newSections.splice(sectionIndex, 1);
    
    const chapterNumInt = parseInt(chapterNumber, 10);
    newSections.forEach((sec, idx) => {
      sec.id = `${chapterNumInt}.${idx + 1}`;
    });

    setLocalChapters(prev => prev.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c));

    try {
      await fetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      });
      showToast('Subtema eliminado', 'success')
    } catch (e) {
      showToast('Error eliminando', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleSaveEdit = async (chapterNumber: string, sectionIndex: number) => {
    if (!editTitle.trim()) {
      setEditingSection(null);
      return;
    }
    setIsProcessing(true);
    const chData = localChapters.find(c => c.number === chapterNumber);
    if (!chData) return;
    
    const newSections = [...chData.sections];
    newSections[sectionIndex].title = editTitle;

    setLocalChapters(prev => prev.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c));

    try {
      await fetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      });
      setEditingSection(null);
      showToast('Subtema editado', 'success')
    } catch (e) {
      showToast('Error editando', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  // Filtrar capítulos que el usuario puede ver
  const visibleChapters = localChapters.filter(c => session.role === 'admin' || assignedChapters.includes(c.number))

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#8B0000] border-t-transparent rounded-full" /></div>

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#3b2022] relative">
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl shadow-[#4b1719]/10 border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#f4fbf7] border-[#d1e8da] text-[#1c663b]' : 'bg-[#fdf6f6] border-[#f1dada] text-[#8B0000]'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-semibold text-sm">{toast.message}</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#4b1719]">Contenido</h1>
          <p className="text-sm text-[#8b6d6d] mt-1">Gestiona los subtemas y revisa su estado</p>
        </div>
      </div>

      <div className="space-y-6">
        {visibleChapters.map(chapter => (
          <div key={chapter.number} className="bg-white rounded-xl border border-[#eadada] overflow-hidden shadow-sm">
            <div className="bg-[#fbf7f4] px-5 py-3 border-b border-[#eadada] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-[#8b6d6d]" />
                <h2 className="font-serif font-bold text-lg text-[#4b1719]">Capítulo {chapter.number}: {chapter.title}</h2>
              </div>
              {session?.role === 'admin' && (
                <button 
                  onClick={() => { setCreatingInChapter(chapter.number); setNewTitle(''); }}
                  className="text-xs font-bold uppercase tracking-wider text-[#8B0000] hover:bg-[#f1dddd] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Añadir Subtema
                </button>
              )}
            </div>
            
            <div className="divide-y divide-[#f5ecec]">
              {chapter.sections.length === 0 && creatingInChapter !== chapter.number ? (
                <p className="p-5 text-sm text-[#8b6d6d] italic">No hay subtemas aún.</p>
              ) : (
                chapter.sections.map((section, idx) => {
                  const docSlug = section.slug ? section.slug.split('/')[1] : section.id;
                  const draftId = `${chapter.number}_${docSlug}`;
                  const docStatus = documentsStatus[draftId];
                  
                  let statusBadge = <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">Sin Empezar</span>
                  if (docStatus?.status === 'draft') statusBadge = <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> En Progreso</span>
                  if (docStatus?.status === 'pending_approval') statusBadge = <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><MessageSquare className="w-3 h-3"/> En Revisión</span>
                  if (docStatus?.status === 'approved') statusBadge = <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Aprobado</span>

                  return (
                    <div key={section.id} className="flex items-center justify-between p-2 pl-4 hover:bg-[#fdfafa] transition-colors group">
                      <div className="flex items-center gap-4 flex-1">
                        <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`} className="w-10 h-10 rounded-lg bg-[#f5ecec] flex items-center justify-center text-[#7d6060] group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
                          <FileText className="w-5 h-5" />
                        </a>
                        
                        {editingSection?.chapter === chapter.number && editingSection?.index === idx ? (
                          <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <span className="font-semibold text-[15px] text-[#8b6d6d]">{section.id} ·</span>
                            <input 
                              autoFocus
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(chapter.number, idx)
                                if (e.key === 'Escape') setEditingSection(null)
                              }}
                              className="flex-1 rounded border border-[#dcc3c3] px-2 py-1 text-[15px] font-semibold outline-none focus:border-[#9c4d4d]"
                            />
                            <button onClick={() => handleSaveEdit(chapter.number, idx)} disabled={isProcessing} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingSection(null)} className="p-1 text-[#8b6d6d] hover:bg-[#f1dddd] rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`} className="flex-1">
                            <p className="font-semibold text-[15px] group-hover:text-[#8B0000] transition-colors">{section.id} · {section.title}</p>
                            <p className="text-xs text-[#8b6d6d] mt-0.5">Última modificación: {docStatus?.updatedAt ? new Date(docStatus.updatedAt).toLocaleDateString('es-PE') : 'Nunca'}</p>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge}
                        {session?.role === 'admin' && (
                          <>
                            <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingSection({chapter: chapter.number, index: idx}); setEditTitle(section.title); }} disabled={isProcessing} className="p-1.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] rounded" title="Editar Título">
                                 <Pencil className="w-4 h-4" />
                               </button>
                               <button onClick={() => setDeleteConfirm({ chapter: chapter.number, index: idx, title: section.title })} disabled={isProcessing} className="p-1.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] rounded" title="Eliminar">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                            <div className="flex flex-col border border-[#eadada] rounded bg-white mr-2">
                              <button onClick={() => handleReorder(chapter.number, idx, 'up')} disabled={idx === 0 || isProcessing} className="p-0.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReorder(chapter.number, idx, 'down')} disabled={idx === chapter.sections.length - 1 || isProcessing} className="p-0.5 border-t border-[#eadada] text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                        <a data-astro-reload href={`/workspace-mc361/content/chapters/${chapter.number}/edit?slug=${docSlug}`}>
                          <ChevronRight className="w-5 h-5 text-[#dcc3c3] hover:text-[#8B0000] transition-colors" />
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
              
              {creatingInChapter === chapter.number && (
                <div className="p-4 bg-[#fcf9f9]">
                  <div className="flex items-center gap-3">
                    <input 
                      autoFocus
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate(chapter.number)}
                      placeholder="Título del nuevo subtema..."
                      className="flex-1 rounded border border-[#dcc3c3] px-3 py-2 text-sm outline-none focus:border-[#9c4d4d]"
                    />
                    <button onClick={() => setCreatingInChapter(null)} className="text-sm font-semibold text-[#8b6d6d] hover:underline px-2 py-1">Cancelar</button>
                    <button onClick={() => handleCreate(chapter.number)} disabled={isProcessing} className="bg-[#8B0000] text-white text-sm font-semibold px-4 py-2 rounded hover:bg-[#6a0000] disabled:opacity-50">
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
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E5D7D4] overflow-hidden flex flex-col p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f8eaea] text-[#8B0000] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#3E3030] mb-2">Eliminar Subtema</h3>
            <p className="text-sm text-[#756565] mb-6">
              ¿Estás seguro de que quieres eliminar <strong>{deleteConfirm.title}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-medium text-[#756565] bg-[#fbf7f4] hover:bg-[#E5D7D4] rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  executeDelete(deleteConfirm.chapter, deleteConfirm.index);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#8B0000] hover:bg-[#6a0000] rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = "w-full"
}: {
  value: string,
  onChange: (value: string) => void,
  options: { value: string, label: string }[],
  placeholder?: string,
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex ${className} items-center justify-between rounded-lg border border-[#dcc3c3] bg-white px-3 py-2.5 text-sm text-[#3b2022] outline-none transition hover:border-[#9c4d4d] focus:border-[#9c4d4d] focus:ring-2 focus:ring-[#9c4d4d]/15`}
      >
        <span className={selected ? "truncate" : "truncate text-[#8b6d6d]"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="ml-2 h-4 w-4 shrink-0 text-[#8b6d6d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#e5cfcd] bg-white py-1 shadow-xl shadow-[#4b1719]/10 [scrollbar-width:thin]">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                value === option.value 
                  ? 'bg-[#f8eaea] text-[#8B0000] font-medium' 
                  : 'text-[#3b2022] hover:bg-[#FCF9F7] hover:text-[#8B0000]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
