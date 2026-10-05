'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { workspaceFetch } from '@/lib/workspace-api'
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { withSubtopicTitle } from '@/lib/course-titles'
import type { CourseDocument } from '@/lib/content-schema'
import { useRef } from 'react'
import { Folder, FileText, Plus, Clock, CheckCircle2, MessageSquare, ChevronRight, ChevronUp, ChevronDown, Pencil, Trash2, X, Check, RotateCcw } from 'lucide-react'
import { chapters as initialChapters, type Chapter, type Section } from '@/lib/course-data'

const RESET_VERSION = '2026_10_05_clean_v4';

export default function Dashboard({ session }: { session: any }) {
  const expansionStorageKey = `mc361_expanded_chapters:${session?.email || 'guest'}`
  const [expandedChapters, setExpandedChapters] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(expansionStorageKey) || '[]')
      return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === 'string') : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(expansionStorageKey, JSON.stringify(expandedChapters))
    } catch {
      // Chapters still expand when browser storage is unavailable.
    }
  }, [expansionStorageKey, expandedChapters])

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
  const [localChapters, setLocalChapters] = useState<Chapter[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('mc361_clean_version') !== RESET_VERSION) {
          localStorage.removeItem('mc361_local_chapters');
          return initialChapters;
        }
        const cached = localStorage.getItem('mc361_local_chapters');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
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
  const newSubtopicInputRef = useRef<HTMLInputElement>(null)
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
  const [deleteConfirm, setDeleteConfirm] = useState<{chapter: string, index: number, title: string, isPublished: boolean} | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!session?.email) { setIsLoading(false); return }
      
      try {
        const structureSnap = await getDoc(doc(db, 'course', 'chapters'));
        const statusMap: Record<string, any> = {};
        const currentList: Chapter[] = (structureSnap.exists() && Array.isArray(structureSnap.data().list))
          ? structureSnap.data().list
          : initialChapters;

        if (structureSnap.exists() && Array.isArray(structureSnap.data().list)) {
          setLocalChapters(structureSnap.data().list);
        }

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
        setDocumentsStatus(statusMap);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [session]);

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

    const updatedChapters = localChapters.map(c => {
      if (c.number === chapterNumber) {
        return { ...c, sections: [...c.sections, newSection] };
      }
      return c;
    });

    try {
      // 1. Guardar la estructura en Firestore
      await setDoc(doc(db, 'course', 'chapters'), {
        list: updatedChapters,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Crear borrador inicial en Firestore
      const docSlug = safeTitle;
      const draftId = `${chapterNumber}_${docSlug}`;
      await setDoc(doc(db, 'drafts', draftId), {
        chapterId: chapterNumber,
        slug: docSlug,
        title: newTitle,
        contentMarkdown: `# ${newTitle}\n\nEscribe el contenido aquí...`,
        authorEmail: session.email,
        status: 'draft',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Sincronizar en desarrollo local (opcional)
      workspaceFetch('/api/subchapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, newSection })
      }).catch(() => {});

      setLocalChapters(updatedChapters);
      setCreatingInChapter(null);
      setNewTitle('');
      showToast('Subtema creado exitosamente', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Error al crear subtema: ' + (e.message || ''), 'error');
    } finally {
      setIsProcessing(false);
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
    const chapterNumInt = parseInt(chapterNumber, 10);
    newSections.forEach((sec, idx) => {
      sec.id = `${chapterNumInt}.${idx + 1}`;
    });

    setIsProcessing(true);
    const updatedChapters = localChapters.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c);
    setLocalChapters(updatedChapters);

    try {
      await setDoc(doc(db, 'course', 'chapters'), {
        list: updatedChapters,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      workspaceFetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      }).catch(() => {});

      showToast('Orden actualizado', 'success');
    } catch (e) {
      showToast('Error reordenando', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  const executeDelete = async (chapterNumber: string, sectionIndex: number) => {
    if (!canEditChapter(chapterNumber)) {
      showToast('No tienes permisos para modificar este capítulo.', 'error');
      setDeleteConfirm(null);
      return;
    }

    setIsProcessing(true);
    const chData = localChapters.find(c => c.number === chapterNumber);
    if (!chData) return;
    
    const sectionToDelete = chData.sections[sectionIndex];
    const rawSlug = sectionToDelete?.slug ? sectionToDelete.slug.split('/').pop() : (sectionToDelete?.id || '');
    const docId = `${chapterNumber}_${rawSlug}`;
    const docStatus = documentsStatus[docId];
    const isPublished = Boolean(docStatus?.publishedContent || docStatus?.status === 'approved');

    if (isPublished && session?.role !== 'admin') {
      showToast('Solo los administradores pueden eliminar subtemas ya publicados.', 'error');
      setDeleteConfirm(null);
      setIsProcessing(false);
      return;
    }
    const newSections = [...chData.sections];
    newSections.splice(sectionIndex, 1);
    
    const chapterNumInt = parseInt(chapterNumber, 10);
    newSections.forEach((sec, idx) => {
      sec.id = `${chapterNumInt}.${idx + 1}`;
    });

    const updatedChapters = localChapters.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c);
    setLocalChapters(updatedChapters);

    try {
      await setDoc(doc(db, 'course', 'chapters'), {
        list: updatedChapters,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Si existe borrador o publicación en Firestore, limpiarlo
      const rawSlug = sectionToDelete?.slug ? sectionToDelete.slug.split('/').pop() : (sectionToDelete?.id || '');
      if (rawSlug) {
        await deleteDoc(doc(db, 'drafts', `${chapterNumber}_${rawSlug}`)).catch(() => null);
      }

      workspaceFetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      }).catch(() => {});

      showToast('Subtema eliminado exitosamente', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Error eliminando subtema: ' + (e.message || ''), 'error');
    } finally {
      setIsProcessing(false);
      setDeleteConfirm(null);
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
    
    const newSections = chData.sections.map((section, index) => index === sectionIndex ? { ...section, title: editTitle.trim() } : section);

    const updatedChapters = localChapters.map(c => c.number === chapterNumber ? { ...c, sections: newSections } : c);

    try {
      const section = newSections[sectionIndex];
      const slug = section.slug?.split('/').slice(1).join('/') || section.id;
      const draftRef = doc(db, 'drafts', `${chapterNumber}_${slug}`);
      const draft = await getDoc(draftRef);
      const batch = writeBatch(db);
      batch.set(doc(db, 'course', 'chapters'), {
        list: updatedChapters,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      if (draft.exists()) {
        const renamed = withSubtopicTitle(draft.data() as CourseDocument, section.title);
        const updateData: any = { title: renamed.title, contentMarkdown: renamed.contentMarkdown };
        if (draft.data()?.publishedContent) {
          updateData.publishedTitle = section.title;
        }
        batch.update(draftRef, updateData);
      }
      await batch.commit();
      setLocalChapters(updatedChapters);
      setDocumentsStatus((current) => current[draftRef.id] ? {
        ...current,
        [draftRef.id]: withSubtopicTitle(current[draftRef.id], section.title),
      } : current);

      workspaceFetch('/api/subchapters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber, sections: newSections })
      }).catch(() => {});

      setEditingSection(null);
      showToast('Subtema editado', 'success');
    } catch (e) {
      showToast('Error editando', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  // Filtrar capítulos que el usuario puede ver
  const visibleChapters = localChapters.filter(c => session.role === 'admin' || assignedChapters.includes(c.number))
  const handleResetDb = async () => {
    if (!confirm('¿Estás seguro de que deseas restablecer todos los subtemas y borradores a 0? Esta acción borrará borradores y subtemas extras.')) return;
    try {
      setIsProcessing(true);
      await setDoc(doc(db, 'course', 'chapters'), {
        list: initialChapters,
        updatedAt: new Date().toISOString(),
        version: RESET_VERSION
      });
      const allDrafts = await getDocs(collection(db, 'drafts'));
      const batch = writeBatch(db);
      allDrafts.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('mc361_local_chapters');
        localStorage.setItem('mc361_clean_version', RESET_VERSION);
      }
      setLocalChapters(initialChapters);
      setDocumentsStatus({});
      showToast('Base de datos y subtemas restablecidos a 0.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } catch (e: any) {
      console.error(e);
      showToast('Error al restablecer: ' + (e.message || ''), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const allChaptersExpanded = visibleChapters.length > 0 && visibleChapters.every((chapter) => expandedChapters.includes(chapter.number))

  if (isLoading) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#8B0000] border-t-transparent rounded-full" /></div>

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
          <h1 className="text-3xl font-serif font-bold text-[#4b1719]">Contenido</h1>
          <p className="text-sm text-[#8b6d6d] mt-1">Abre un capítulo para gestionar sus subtemas. Recordaremos los que dejes abiertos.</p>
        </div>
        <div className="flex items-center gap-2">
          {session?.role === 'admin' && (
            <button
              type="button"
              onClick={handleResetDb}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#d5baba] bg-white px-3 py-2 text-xs font-semibold text-[#8B0000] hover:bg-[#f8eaea] disabled:opacity-40 transition-colors"
              title="Restablecer todos los subtemas y borradores a 0"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restablecer a 0
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpandedChapters(allChaptersExpanded ? [] : visibleChapters.map((chapter) => chapter.number))}
            disabled={visibleChapters.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#d5baba] bg-white px-3 py-2 text-xs font-semibold text-[#6a2022] hover:bg-[#f8eaea] disabled:cursor-default disabled:opacity-40"
          >
            {allChaptersExpanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
            {allChaptersExpanded ? 'Contraer todo' : 'Expandir todo'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleChapters.map(chapter => (
          <div key={chapter.number} className="bg-white rounded-xl border border-[#eadada] overflow-hidden shadow-sm">
            <div className={`bg-[#fbf7f4] flex flex-wrap items-center gap-2 pr-3 ${expandedChapters.includes(chapter.number) ? 'border-b border-[#eadada]' : ''}`}>
              <h2 className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter.number)}
                  aria-expanded={expandedChapters.includes(chapter.number)}
                  aria-controls={`chapter-sections-${chapter.number}`}
                  className="flex w-full items-center gap-3 rounded-lg px-5 py-4 text-left hover:bg-[#f5ecec] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8B0000]"
                >
                  <ChevronRight aria-hidden="true" className={`size-4 shrink-0 text-[#8b6d6d] transition-transform ${expandedChapters.includes(chapter.number) ? 'rotate-90' : ''}`} />
                  <Folder aria-hidden="true" className="size-5 shrink-0 text-[#8b6d6d]" />
                  <span className="min-w-0 flex-1 font-serif text-lg font-bold text-[#4b1719]">Capítulo {chapter.number}: {chapter.title}</span>
                  <span className="hidden shrink-0 text-xs font-normal text-[#8b6d6d] sm:inline">{chapter.sections.length} {chapter.sections.length === 1 ? 'subtema' : 'subtemas'}</span>
                </button>
              </h2>
              <button 
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
                className="text-xs font-bold uppercase tracking-wider text-[#8B0000] hover:bg-[#f1dddd] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Subtema
              </button>
            </div>
            
            <div id={`chapter-sections-${chapter.number}`} hidden={!expandedChapters.includes(chapter.number)} className="divide-y divide-[#f5ecec]">
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
                        <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingSection({chapter: chapter.number, index: idx}); setEditTitle(section.title); }} disabled={isProcessing} className="p-1.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] rounded" title="Editar Título">
                             <Pencil className="w-4 h-4" />
                           </button>
                           {canEditChapter(chapter.number) && (
                             <button 
                               onClick={() => {
                                 const isPublished = Boolean(docStatus?.publishedContent || docStatus?.status === 'approved');
                                 setDeleteConfirm({ chapter: chapter.number, index: idx, title: section.title, isPublished });
                               }} 
                               disabled={isProcessing} 
                               className="p-1.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] rounded" 
                               title="Eliminar"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                        </div>
                        <div className="flex flex-col border border-[#eadada] rounded bg-white mr-2">
                          <button onClick={() => handleReorder(chapter.number, idx, 'up')} disabled={idx === 0 || isProcessing} className="p-0.5 text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] disabled:opacity-30">
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleReorder(chapter.number, idx, 'down')} disabled={idx === chapter.sections.length - 1 || isProcessing} className="p-0.5 border-t border-[#eadada] text-[#8b6d6d] hover:bg-[#f1dddd] hover:text-[#8B0000] disabled:opacity-30">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
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
                      ref={newSubtopicInputRef}
                      aria-label={`Título del nuevo subtema del capítulo ${chapter.number}`}
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
            <div className={`w-12 h-12 rounded-full ${deleteConfirm.isPublished && session?.role !== 'admin' ? 'bg-[#fff5e6] text-[#b45309]' : 'bg-[#f8eaea] text-[#8B0000]'} flex items-center justify-center mx-auto mb-4`}>
              <Trash2 className="w-6 h-6" />
            </div>
            
            {deleteConfirm.isPublished && session?.role !== 'admin' ? (
              <>
                <h3 className="text-lg font-bold text-[#3E3030] mb-2">Subtema Publicado</h3>
                <p className="text-sm text-[#756565] mb-6">
                  <strong>{deleteConfirm.title}</strong> ya ha sido aprobado y está publicado en el curso oficial. Por seguridad, solo los <strong>Administradores</strong> pueden eliminar contenido público.
                </p>
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#8B0000] hover:bg-[#6a0000] rounded-lg transition-colors"
                >
                  Entendido
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
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
