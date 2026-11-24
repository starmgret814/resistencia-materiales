'use client'

import { lazy, Suspense, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Bold,
  Pencil,
  Download,
  FileInput,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  ImageUp,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  PanelLeftOpen,
  Redo2,
  Sigma,
  Undo2,
  Cloud,
  Send,
  Loader2,
  CheckCircle2,
  BookOpen,
  Table as TableIcon,
  Plus,
  ChevronDown,
  FileDiff,
  X
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { workspaceFetch } from '@/lib/workspace-api'
import { workspaceButtonClass, workspaceInputClass } from '@/lib/workspace-controls'
import { workspaceGuide } from '@/lib/workspace-guides'
import { imageTableSnippet } from '@/lib/table-snippets'
import { uploadCourseImage } from '@/lib/image-upload'
import { doc, getDoc } from 'firebase/firestore'
import Editor from '@/components/markdown-editor'
import { defineCourseEditorTheme } from '@/lib/markdown-editor-theme'
import { insertEditorText, insertEditorTextAtRange, replaceEditorText, type MarkdownEditorSelection } from '@/lib/editor-history'
import PreviewErrorBoundary from '@/components/preview-error-boundary'
import { LocalDraftNotice, LocalDraftStatus } from '@/components/local-draft-notice'
import { localDraftKey } from '@/lib/local-draft'
import { useLocalDraft } from '@/lib/use-local-draft'
import { chapters, type Chapter } from '@/lib/course-data'
import { changeCourseStructure, loadCourseCatalog } from '@/lib/course-structure-store'
import { findSubtopicNumber, findSubtopicTitle, withSubtopicTitle } from '@/lib/course-titles'
import { matchesPreviousChapterOneRevision } from '@/lib/chapter-one-revision'
import { loadContentReview } from '@/lib/content-review-client'
import { sameReviewBaseline, REVIEW_CONFLICT_MESSAGE, type ContentReviewBaseline } from '@/lib/content-review'
import { publishReviewedContent, saveDraftPreservingPublication } from '@/lib/content-publication'
import {
  starterDocument,
  validateCourseDocument,
  type CourseDocument,
} from '@/lib/content-schema'

const ContentReview = lazy(() => import('@/components/content-review'))

export default function ContentEditor({ session, initialChapter, initialSlug }: { session?: any, initialChapter: string, initialSlug: string }) {
  const guide = workspaceGuide(session?.role)
  const [document, setDocument] = useState<CourseDocument>(() => ({ ...structuredClone(starterDocument), chapterId: initialChapter, slug: initialSlug }))
  const deferredDocument = useDeferredValue(document)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const ContentRenderer = useMemo(() => lazy(() => import('@/components/content-renderer')), [previewAttempt])
  const validation = useMemo(() => validateCourseDocument(document), [document])

  const [courseChapters, setCourseChapters] = useState<Chapter[]>(chapters)
  const [problemOffset, setProblemOffset] = useState<number | null>(null)
  const [problemNumberError, setProblemNumberError] = useState(false)
  const [numberingRetry, setNumberingRetry] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [reviewDocument, setReviewDocument] = useState<CourseDocument | null>(null)
  const reviewButton = useRef<HTMLButtonElement>(null)
  const publicationInFlight = useRef(false)
  const automaticallyReviewed = useRef('')
  const titleEditCancelled = useRef(false)
  const titleSaveInFlight = useRef(false)

  const currentChapter = useMemo(() => {
    return courseChapters.find((c) => c.number === document.chapterId)
  }, [courseChapters, document.chapterId])

  useEffect(() => {
    const controller = new AbortController()
    setProblemOffset(null)
    setProblemNumberError(false)
    const parameters = new URLSearchParams({ chapter: document.chapterId, slug: document.slug })
    fetch(`/api/problem-offset?${parameters}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('No se pudo cargar la numeración')
        const data = await response.json()
        if (!Number.isSafeInteger(data.offset) || data.offset < 0) throw new Error('Numeración no válida')
        if (!controller.signal.aborted) setProblemOffset(data.offset)
      })
      .catch(() => { if (!controller.signal.aborted) setProblemNumberError(true) })
    return () => controller.abort()
  }, [document.chapterId, document.slug, numberingRetry])

  const currentSection = useMemo(() => {
    if (!currentChapter) return null
    return currentChapter.sections.find((s) => {
      if (!s.slug) return s.id === document.slug
      const parts = s.slug.split('/')
      const shortSlug = parts.length > 1 ? parts[1] : parts[0]
      return s.slug === document.slug || shortSlug === document.slug || s.id === document.slug
    })
  }, [currentChapter, document.slug])
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const localBackup = useLocalDraft(
    session?.email ? localDraftKey(session.email, 'chapter', `${initialChapter}/${initialSlug}`) : null,
    { contentMarkdown: document.contentMarkdown },
    isLoaded && !loadError && document.chapterId === initialChapter && document.slug === initialSlug,
  )
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  useEffect(() => {
    if (localBackup.pending) { setReviewDocument(null); automaticallyReviewed.current = ''; return }
    if (session?.role !== 'admin' || !isLoaded || loadError || document.chapterId !== initialChapter) return
    const key = `${initialChapter}/${initialSlug}`
    if (automaticallyReviewed.current === key || new URLSearchParams(window.location.search).get('from') !== 'requests') return
    automaticallyReviewed.current = key
    setReviewDocument({ ...document })
  }, [session?.role, isLoaded, loadError, localBackup.pending, initialChapter, initialSlug, document])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (session?.email && initialChapter && initialSlug) {
      loadDraft(initialChapter, initialSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, initialChapter, initialSlug])

  const loadDraft = async (chapterId: string, slug: string) => {
    if (!session?.email) return;
    setIsLoaded(false);
    setLoadError(null);
    try {
      const draftId = `${chapterId}_${slug}`;
      const [list, snap] = await Promise.all([
        loadCourseCatalog().catch(() => chapters),
        getDoc(doc(db, 'drafts', draftId)),
      ]);
      setCourseChapters(list);
      const currentTitle = findSubtopicTitle(list, chapterId, slug);
      if (snap && snap.exists()) {
        const data = snap.data();
        let loaded = data as CourseDocument;
        if (await matchesPreviousChapterOneRevision(chapterId, slug, data.contentMarkdown)) {
          try {
            const parameters = new URLSearchParams({ chapter: chapterId, slug });
            const response = await fetch(`/api/mdx?${parameters}`, { cache: 'no-store' });
            const source = await response.json();
            if (response.ok && typeof source.content === 'string' && source.content.trim()) {
              loaded = { ...loaded, contentMarkdown: source.content };
            }
          } catch { /* Preserve the original draft when the source cannot load. */ }
        }
        setDocument(withSubtopicTitle(loaded, currentTitle));
      } else {
        // No hay borrador ni versión en Firestore -> Subtema nuevo en blanco
        const initialTitle = currentTitle || 'Subtema';
        setDocument({
          schemaVersion: 2,
          title: initialTitle,
          chapterId,
          slug,
          contentMarkdown: `# ${initialTitle}\n\nEscribe el contenido del subtema aquí...`,
        });
      }
    } catch (error) {
      console.error('Error cargando borrador', error);
      setLoadError('No se pudo cargar el documento. Reintenta la conexión antes de editar; el contenido guardado no se ha modificado.');
    } finally {
      setIsLoaded(true);
    }
  }

  const loadSubtopicTitle = async (chapterId: string, slug: string) =>
    findSubtopicTitle(await loadCourseCatalog(), chapterId, slug);

  const renameSubtopic = async () => {
    if (titleEditCancelled.current || titleSaveInFlight.current) return
    const title = titleInput.trim()
    if (!title || title === document.title) { setIsEditingTitle(false); return }
    titleSaveInFlight.current = true
    setIsRenaming(true)
    try {
      const change = await changeCourseStructure(session, { type: 'rename-section', chapter: document.chapterId, slug: document.slug, title })
      setDocument(current => withSubtopicTitle(current, title))
      setCourseChapters(change.chapters)
      setIsEditingTitle(false)
      showToast('Nombre del subtema actualizado.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo cambiar el nombre del subtema.', 'error')
    } finally { titleSaveInFlight.current = false; setIsRenaming(false) }
  }

  const saveDraft = async (status: 'draft' | 'pending_approval', silent = false) => {
    if (localBackup.pending) return;
    if (!session?.email) return showToast('No tienes sesión activa.', 'error');
    try {
      setIsSaving(true);
      const currentTitle = await loadSubtopicTitle(document.chapterId, document.slug);
      const currentDocument = withSubtopicTitle(document, currentTitle);
      await saveDraftPreservingPublication(currentDocument, status, session);

      setDocument(currentDocument);
      localBackup.acknowledge({ contentMarkdown: currentDocument.contentMarkdown });
      if (!silent) showToast(status === 'draft' ? 'Borrador guardado exitosamente.' : 'Enviado para revisión del administrador.', 'success');
    } catch (e: any) {
      console.error(e);
      if (!silent) showToast('Error guardando en la nube: ' + (e.message || ''), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const publishDraft = async (candidate: CourseDocument, baseline?: ContentReviewBaseline) => {
    if (localBackup.pending) throw new Error('Resuelve la copia local antes de aprobar.');
    if (!session?.email || session.role !== 'admin') throw new Error('No tienes permisos para aprobar.');
    if (!candidate.contentMarkdown.trim()) throw new Error('El contenido no puede estar vacío.');
    if (publicationInFlight.current) return;
    publicationInFlight.current = true;
    try {
      setIsSaving(true);
      // Recheck the public view, then guard the write against concurrent drafts/publications.
      const current = await loadContentReview(candidate.chapterId, candidate.slug);
      if (baseline && !sameReviewBaseline(baseline, current)) throw new Error(REVIEW_CONFLICT_MESSAGE);
      if (candidate.title !== current.sectionTitle) throw new Error('El nombre de la sección cambió. Vuelve al editor y carga el nombre actual antes de aprobar.');
      const currentDocument = { ...candidate, chapterId: current.chapterId, slug: current.slug };
      await publishReviewedContent(currentDocument, current.revision, session);

      localBackup.acknowledge({ contentMarkdown: currentDocument.contentMarkdown });
      setReviewDocument(null);

      // 2. Sincronización secundaria en segundo plano con GitHub (respaldo en el repositorio)
      workspaceFetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: currentDocument.chapterId,
          slug: currentDocument.slug,
          title: currentDocument.title,
          contentMarkdown: currentDocument.contentMarkdown
        })
      }).catch(err => {
        console.warn('Respaldo en GitHub no completado:', err);
      });
      
      showToast('¡Aprobado y publicado exitosamente en la plataforma!', 'success');
      
      const isFromRequests = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'requests';
      setTimeout(() => {
        window.location.href = isFromRequests ? '/workspace-mc361/management/requests' : '/workspace-mc361/content/chapters';
      }, 1500);

    } catch (e: any) {
      console.error(e);
      publicationInFlight.current = false;
      setIsSaving(false);
      throw e;
    }
  }

  const editorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function closeReview() {
    setReviewDocument(null)
    setTimeout(() => { reviewButton.current?.focus(); editorRef.current?.layout() }, 0)
  }

  function publishDirectly() {
    void publishDraft({ ...document }).catch(error => showToast(error instanceof Error ? error.message : 'No se pudo publicar el contenido.', 'error'))
  }

  function execCommand(command: string) {
    const editor = editorRef.current
    if (!editor) return
    editor.trigger('toolbar', command, null)
    editor.focus()
  }

  function updateMarkdown(contentMarkdown: string) {
    setDocument((current) => {
      return {
        ...current,
        contentMarkdown,
      }
    })
  }

  function insertMarkdown(before: string, after = '', placeholder = '', multilinePrefix = '') {
    const editor = editorRef.current
    if (!editor) return

    const selection = editor.getSelection()
    const model = editor.getModel()
    if (!selection || !model) return

    let selectedText = model.getValueInRange(selection)

    if (multilinePrefix && selectedText.includes('\n')) {
      const lines = selectedText.split('\n')
      selectedText = lines.map((line: string, idx: number) => {
        const prefix = multilinePrefix === '1. ' ? `${idx + 1}. ` : multilinePrefix
        return `${prefix}${line}`
      }).join('\n')
      before = ''
      after = ''
    } else if (!selectedText) {
      selectedText = placeholder
    }

    const insertText = `${before}${selectedText}${after}`

    insertEditorText(editor, insertText)
  }

  function downloadMarkdown() {
    const blob = new Blob([document.contentMarkdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${document.slug || 'pagina'}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importProjectMarkdown() {
    if (isImporting || isSaving) return
    setIsImporting(true)
    try {
      const parameters = new URLSearchParams({ chapter: document.chapterId, slug: document.slug })
      const response = await fetch(`/api/mdx?${parameters}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || typeof data.content !== 'string' || !data.content.trim()) {
        throw new Error(response.status === 404 ? 'Este tema no tiene un archivo Markdown en el proyecto.' : 'No se pudo leer el Markdown del proyecto.')
      }
      const editor = editorRef.current
      const model = editor?.getModel()
      if (!model || model.isDisposed()) throw new Error('Espera a que cargue el área de escritura antes de importar.')
      const current = model.getValue()
      if (data.content === current) return showToast('Ya tienes esta versión en el editor.', 'success')
      if (!window.confirm('¿Cargar el Markdown del proyecto en este editor? Reemplazará el texto que estás viendo. No se guardará ni publicará automáticamente. Puedes deshacer la importación con Ctrl + Z.')) return
      replaceEditorText(editor, data.content, 'import-project-markdown', false)
      editor.focus()
      showToast('Markdown importado. Revisa la vista previa antes de guardar o publicar.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No se pudo importar el Markdown.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  function insertEducationalBlock(kind: string) {
    if (kind === 'definition') insertMarkdown('\n<Definition title="Definición">\n', '\n</Definition>\n', 'Escribe la definición.')
    else if (kind === 'note') insertMarkdown('\n<Note title="Nota importante">\n', '\n</Note>\n', 'Escribe la observación.')
    else if (kind === 'term') insertMarkdown('<Term definition="Explicación breve del concepto.">', '</Term>', 'término')
    else if (kind === 'equation-ref') insertMarkdown('[', '](#eq-1.1.1)', 'ecuación (1.1.1)')
    else if (kind === 'numbered-image') insertMarkdown('\n\n<Image src="figura.png" alt="Descripción de la figura" number="1.1" caption="Explicación de la figura" />\n\n')
    else if (kind === 'example') insertMarkdown('\n<Example number={1} title="Ejemplo resuelto">\n', '\n\n<Solution>\nDescribe la solución paso a paso.\n</Solution>\n</Example>\n', 'Escribe el enunciado.')
    else if (kind === 'problem') insertMarkdown('\n<Problem title="Problema propuesto">\n', '\n\n<Solution>\nDescribe la solución paso a paso.\n</Solution>\n</Problem>\n', 'Escribe el problema.')
    else if (kind === 'problemimage') insertMarkdown('\n<Problem title="Título del problema" image="figura.png" imageAlt="Diagrama del problema" imageWidth="38%" imagePosition="right">\n\n', '\n\n<Solution>\nDescribe la solución paso a paso.\n</Solution>\n</Problem>\n', 'Escribe el enunciado. La imagen aparecerá a su costado.')
    else if (kind === 'quiz') insertMarkdown('\n<Quiz question="Escribe la pregunta">\n', '\n</Quiz>\n', 'Escribe la respuesta.')
    else if (kind === 'tool-stress') insertMarkdown('\n\n<Tool id="esfuerzo-normal" />\n\n')
    else if (kind === 'tool-axial') insertMarkdown('\n\n<Tool id="deformacion-axial" />\n\n')
    else if (kind === 'tool-mohr-stress') insertMarkdown('\n\n<Tool id="mohr-esfuerzos" />\n\n')
    else if (kind === 'tool-mohr-strain') insertMarkdown('\n\n<Tool id="mohr-deformaciones" />\n\n')
    else if (kind === 'summary') insertMarkdown('\n<Summary title="Resumen">\n', '\n</Summary>\n', 'Resume los puntos principales.')
    else if (kind === 'table') insertMarkdown('\n<Table title="Título de la tabla" align="center" width="100%" columnWidths="40%, 30%, 30%">\n\n| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| Dato 1 | Valor A | $x$ |\n| Dato 2 | Valor B | $y$ |\n\n</Table>\n')
    else if (kind === 'image-table') insertMarkdown(imageTableSnippet)
    else if (kind === 'tablegrid') insertMarkdown('\n<TableGrid columns="2">\n\n<Table title="Tabla 1" align="center">\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n</Table>\n\n<Table title="Tabla 2" align="center">\n\n| C | D |\n| --- | --- |\n| 3 | 4 |\n\n</Table>\n\n</TableGrid>\n')
    else if (kind === 'imagegrid') insertMarkdown('\n<ImageGrid columns={2}>\n  <Image src="imagen-1.png" alt="Descripción de la primera imagen" caption="Figura 1" />\n\n  <Image src="imagen-2.png" alt="Descripción de la segunda imagen" caption="Figura 2" />\n</ImageGrid>\n')
  }

  const [isUploading, setIsUploading] = useState(false)
  const uploadMode = useRef<'insert' | 'url'>('insert')
  const uploadInFlight = useRef(false)
  const uploadSelection = useRef<MarkdownEditorSelection | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      uploadSelection.current = null
      return
    }
    if (uploadInFlight.current) return
    const mode = uploadMode.current
    uploadInFlight.current = true

    try {
      setIsUploading(true)

      const url = await uploadCourseImage(file)
      if (mode === 'url') {
        const editor = editorRef.current
        const model = editor?.getModel()
        if (!editor || !model || model.isDisposed() || !uploadSelection.current) {
          showToast('La imagen se subió, pero no se pudo insertar el enlace en el editor.', 'error')
          return
        }
        editor.updateOptions({ readOnly: isSaving || Boolean(localBackup.pending) })
        if (!insertEditorTextAtRange(editor, uploadSelection.current, url, 'image-upload')) {
          showToast('La imagen se subió, pero no se pudo insertar el enlace en el editor.', 'error')
          return
        }
        updateMarkdown(model.getValue())
        showToast('Enlace insertado en el documento.', 'success')
      } else {
        insertMarkdown('\n<Image src="', '" alt="Descripción de la imagen" caption="Figura" />\n', url)
      }

    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la imagen. Vuelve a intentarlo.', 'error')
    } finally {
      setIsUploading(false)
      uploadInFlight.current = false
      uploadSelection.current = null
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImageUploadClick = (mode: 'insert' | 'url') => {
    if (uploadInFlight.current) return
    uploadMode.current = mode
    uploadSelection.current = editorRef.current?.getSelection() ?? null
    fileInputRef.current?.click()
  }

  const toolClass = 'editor-toolbar-icon inline-flex shrink-0 items-center justify-center rounded-md text-[#6f5050] hover:bg-[#f1dddd] hover:text-[#7f0303] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40'

  if (!isLoaded || loadError) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-[#f8f5f4]">
        <div className="flex flex-col items-center gap-3">
          {loadError ? <div role="alert" className="max-w-md space-y-4 p-5 text-center text-sm"><p>{loadError}</p><button type="button" onClick={() => void loadDraft(initialChapter, initialSlug)} className={workspaceButtonClass()}>Reintentar carga</button></div> : <><Loader2 className="w-8 h-8 animate-spin text-[#8B0000]" /><p className="text-sm font-semibold text-[#8b6d6d] animate-pulse">Cargando documento...</p></>}
        </div>
      </div>
    );
  }

  return <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[#f3ece8] text-[#3b2022]">
    {session?.role === 'admin' && reviewDocument && <Suspense fallback={<div role="status" className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4 bg-[#fbf7f4]"><p>Abriendo revisión…</p><button type="button" onClick={closeReview} className={workspaceButtonClass()}>Volver al editor</button></div>}><ContentReview candidate={reviewDocument} onClose={closeReview} onPublish={publishDraft} onReloadDraft={current => { if (editorRef.current) replaceEditorText(editorRef.current, current.contentMarkdown, 'review-reload', true); setDocument(current); setReviewDocument({ ...current }); localBackup.acknowledge({ contentMarkdown: current.contentMarkdown }) }} /></Suspense>}
    {localBackup.pending && <div className="shrink-0 px-4 pt-3 sm:px-6"><LocalDraftNotice savedAt={localBackup.pending.savedAt} content={localBackup.pending.values.contentMarkdown} onRecover={() => { const recovered = localBackup.recover(); if (recovered) updateMarkdown(recovered.contentMarkdown) }} onDiscard={localBackup.discard} /></div>}
    {toast && (
      <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl shadow-[#4b1719]/10 border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#f4fbf7] border-[#d1e8da] text-[#1c663b]' : 'bg-[#fdf6f6] border-[#f1dada] text-[#8B0000]'}`}>
        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
        <p className="font-semibold text-sm">{toast.message}</p>
      </div>
    )}
    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

    <div hidden={Boolean(reviewDocument)} className={reviewDocument ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
    <div className="flex shrink-0 gap-2 border-b border-[#ddcaca] bg-white px-4 py-2 xl:hidden" role="group" aria-label="Vista del editor">
      <button type="button" aria-pressed={mobilePane === 'edit' && !previewExpanded} onClick={() => { setMobilePane('edit'); setPreviewExpanded(false) }} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${mobilePane === 'edit' && !previewExpanded ? 'bg-[#f1dddd] text-[#7f0303]' : 'text-[#765e5e]'}`}><Pencil className="size-4" aria-hidden="true" />Editar</button>
      <button type="button" aria-pressed={mobilePane === 'preview' || previewExpanded} onClick={() => setMobilePane('preview')} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${mobilePane === 'preview' || previewExpanded ? 'bg-[#f1dddd] text-[#7f0303]' : 'text-[#765e5e]'}`}><Eye className="size-4" aria-hidden="true" />Vista previa</button>
    </div>

    <div className={`mx-auto grid w-full max-w-[1800px] flex-1 min-h-0 grid-rows-[minmax(0,1fr)] gap-5 p-3 sm:p-6 ${previewExpanded ? 'grid-cols-1' : 'xl:grid-cols-2'}`}>
      <section className={`min-w-0 flex-col space-y-4 min-h-0 ${previewExpanded ? 'hidden' : mobilePane === 'edit' ? 'flex' : 'hidden xl:flex'}`}>
        {/* Document Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-[#ddcaca] shadow-sm">
          <div className="min-w-0 flex-1 basis-64">
            <div className="flex items-center gap-1.5 text-xs text-[#8b6d6d]">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#9c4d4d]">
                Capítulo {document.chapterId}
              </span>
              {currentChapter?.title && (
                <>
                  <span className="text-[#c5a8a8]">·</span>
                  <span className="font-medium text-[#7d6060] truncate max-w-[280px] sm:max-w-md">
                    {currentChapter.title}
                  </span>
                </>
              )}
            </div>
            {isEditingTitle ? (
              <div className="mt-1 flex items-center gap-2">
                {currentSection?.id && (
                  <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#8B0000]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#8B0000] border border-[#8B0000]/20">
                    {currentSection.id}
                  </span>
                )}
                <input
                  aria-label="Nombre del subtema"
                  title="Enter para guardar · Escape para cancelar"
                  autoFocus
                  value={titleInput}
                  onFocus={event => event.currentTarget.select()}
                  onChange={event => setTitleInput(event.target.value)}
                  readOnly={isRenaming}
                  className={`${workspaceInputClass()} min-w-0 flex-1`}
                  onBlur={() => { void renameSubtopic(); }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') { event.preventDefault(); void renameSubtopic(); }
                    if (event.key === 'Escape' && !titleSaveInFlight.current) {
                      event.preventDefault(); titleEditCancelled.current = true; setIsEditingTitle(false);
                    }
                  }}
                />
                {isRenaming && <Loader2 className="size-4 shrink-0 animate-spin text-[#8B0000]" aria-label="Guardando nombre" />}
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2.5">
                {currentSection?.id && (
                  <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#8B0000]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#8B0000] border border-[#8B0000]/20">
                    {currentSection.id}
                  </span>
                )}
                <h2 className="min-w-0 break-words font-sans text-lg font-bold text-[#4b1719]">{document.title}</h2>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    titleEditCancelled.current = false;
                    setTitleInput(document.title);
                    setIsEditingTitle(true);
                  }}
                  className={workspaceButtonClass('quiet', true)}
                  title="Cambiar nombre del subtema"
                  aria-label="Cambiar nombre del subtema"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={importProjectMarkdown} disabled={isSaving || isImporting || isEditingTitle} className={workspaceButtonClass()} title="Cargar el archivo MDX del proyecto; no guarda ni publica automáticamente">
              {isImporting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileInput className="size-4" aria-hidden="true" />}
              {isImporting ? 'Importando…' : 'Importar del proyecto'}
            </button>
            <a
              href={guide.href}
              target="_blank"
              rel="noopener noreferrer"
              className={workspaceButtonClass()}
              title={`Abrir ${guide.label.toLowerCase()} en una nueva pestaña`}
              aria-label={`Abrir ${guide.label.toLowerCase()} en una nueva pestaña`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Guía</span>
            </a>
             <button
              onClick={() => saveDraft('draft')}
              disabled={isSaving || isImporting || isEditingTitle || Boolean(localBackup.pending)}
              className={workspaceButtonClass()}
              title="Guardar progreso en la nube (borrador)"
            >
              <Cloud className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Avance'}
            </button>
            {session?.role === 'admin' ? (
              <>
              <button
                ref={reviewButton}
                type="button"
                onClick={() => setReviewDocument({ ...document })}
                disabled={isSaving || isImporting || isEditingTitle || Boolean(localBackup.pending)}
                className={workspaceButtonClass()}
                title="Comparar con la versión publicada"
              >
                <FileDiff className="w-4 h-4" aria-hidden="true" />
                Revisar cambios
              </button>
              <button type="button" onClick={publishDirectly} disabled={isSaving || isImporting || isEditingTitle || Boolean(localBackup.pending)} className={workspaceButtonClass('success')} title="Publicar el texto actual sin abrir la comparación"><CheckCircle2 className="size-4" aria-hidden="true" />{publicationInFlight.current ? 'Publicando…' : 'Publicar'}</button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (!document.contentMarkdown.trim()) {
                    return showToast('El contenido no puede estar vacío.', 'error');
                  }
                  saveDraft('pending_approval');
                }}
                disabled={isSaving || isImporting || isEditingTitle || Boolean(localBackup.pending)}
                className={workspaceButtonClass('primary')}
                title="Enviar a revisión del administrador"
              >
                <Send className="w-4 h-4" />
                Solicitar Revisión
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-[#ddcaca] bg-white shadow-sm">
          <fieldset disabled={isSaving || Boolean(localBackup.pending)} onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault() }} className="editor-toolbar min-w-0 shrink-0 flex items-center gap-2 border-b border-[#eadada] bg-[#fbf7f4] p-2 rounded-t-xl">
            <div role="group" aria-label="Formato del texto" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto p-1.5">
            <button type="button" className={toolClass} title="Deshacer" aria-label="Deshacer" onClick={() => execCommand('undo')}><Undo2 className="size-4" /></button>
            <button type="button" className={toolClass} title="Rehacer" aria-label="Rehacer" onClick={() => execCommand('redo')}><Redo2 className="size-4" /></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" aria-hidden="true" />
            <button type="button" className={toolClass} title="Negrita" aria-label="Negrita" onClick={() => insertMarkdown('**', '**', 'texto')}><Bold className="size-4" /></button>
            <button type="button" className={toolClass} title="Cursiva" aria-label="Cursiva" onClick={() => insertMarkdown('*', '*', 'texto')}><Italic className="size-4" /></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" />
            <button type="button" className={toolClass} title="Título H1" aria-label="Título H1" onClick={() => insertMarkdown('\n# ', '\n', 'Título Principal')}><Heading1 className="size-4" /></button>
            <button type="button" className={toolClass} title="Subtítulo H2" aria-label="Subtítulo H2" onClick={() => insertMarkdown('\n## ', '\n', 'Subtítulo')}><Heading2 className="size-4" /></button>
            <button type="button" className={toolClass} title="Subtítulo H3" aria-label="Subtítulo H3" onClick={() => insertMarkdown('\n### ', '\n', 'Subtítulo menor')}><Heading3 className="size-4" /></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" />
            <button type="button" className={toolClass} title="Lista" aria-label="Lista" onClick={() => insertMarkdown('\n- ', '\n', 'Elemento', '- ')}><List className="size-4" /></button>
            <button type="button" className={toolClass} title="Lista numerada" aria-label="Lista numerada" onClick={() => insertMarkdown('\n1. ', '\n', 'Elemento', '1. ')}><ListOrdered className="size-4" /></button>
            <button type="button" className={toolClass} title="Enlace" aria-label="Enlace" onClick={() => insertMarkdown('[', '](https://ejemplo.com)', 'texto del enlace')}><Link className="size-4" /></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" />
            <button type="button" className={toolClass} title="Fórmula" aria-label="Fórmula" onClick={() => insertMarkdown('\n<Formula label="Nombre de la fórmula">\n$$\n', '\n$$\n</Formula>\n', '\\sigma = \\frac{P}{A}')}><Sigma className="size-4" /></button>
            <button
              type="button"
              className={toolClass}
              title="Insertar Tabla"
              aria-label="Tabla"
              onClick={() => insertMarkdown(
                '\n<Table align="center" width="100%" columnWidths="40%, 30%, 30%">\n\n| Cara perpendicular al eje | Esfuerzo normal | Esfuerzos cortantes |\n| --- | --- | --- |\n| $x$ | $\\sigma_x$ | $\\tau_{xy}$, $\\tau_{xz}$ |\n| $y$ | $\\sigma_y$ | $\\tau_{yx}$, $\\tau_{yz}$ |\n| $z$ | $\\sigma_z$ | $\\tau_{zx}$, $\\tau_{zy}$ |\n\n</Table>\n'
              )}
            >
              <TableIcon className="size-4" />
            </button>
            <button type="button" disabled={isUploading} className={toolClass} title="Subir e insertar imagen" aria-label="Imagen" onClick={() => handleImageUploadClick('insert')}>
              {isUploading && uploadMode.current === 'insert' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImageIcon className="size-4" aria-hidden="true" />}
            </button>
            <button type="button" disabled={isUploading} className={toolClass} title="Subir imagen e insertar su enlace en el cursor" aria-label="Subir imagen e insertar enlace" onClick={() => handleImageUploadClick('url')}>
              {isUploading && uploadMode.current === 'url' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImageUp className="size-4" aria-hidden="true" />}
            </button>
            </div>
            <ToolbarSelect onChange={insertEducationalBlock} />
          </fieldset>
          {isUploading && <p role="status" className="shrink-0 border-b border-[#eadada] px-3 py-2 text-xs text-[#765e5e]">{uploadMode.current === 'url' ? 'Subiendo imagen e insertando su enlace…' : 'Subiendo imagen para insertarla…'}</p>}
          <div className="relative flex-1 min-h-0">
            <Editor
              documentId={`${document.chapterId}_${document.slug}`}
              height="100%"
              defaultLanguage="markdown"
              value={document.contentMarkdown}
              onChange={(value) => updateMarkdown(value || '')}
              beforeMount={defineCourseEditorTheme}
              onMount={(editor, monaco) => {
                editorRef.current = editor
                monaco.editor.setTheme('resistenciaTheme')
                setTimeout(() => {
                  try { editor.layout(); } catch {}
                }, 50)
              }}
              options={{
                readOnly: isSaving || isUploading || Boolean(localBackup.pending),
                automaticLayout: true,
                lineNumbers: 'on',
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 14.5,
                lineHeight: 28,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderWhitespace: 'none',
                tabSize: 2,
                bracketPairColorization: { enabled: false },
              }}
              className="absolute inset-0 w-full bg-[#fffdfc] outline-none"
            />
          </div>
          <div className="shrink-0 rounded-b-xl border-t border-[#eadada] bg-[#fbf7f4] px-4 py-2 text-[10px] text-[#967070]"><p>Markdown · GFM · LaTeX · {document.contentMarkdown.length.toLocaleString('es')} caracteres</p><p className="mt-1"><LocalDraftStatus failed={localBackup.failed} savedAt={localBackup.savedAt} /></p></div>
        </div>
      </section>

      <aside className={`min-w-0 flex-col min-h-0 ${mobilePane === 'preview' || previewExpanded ? 'flex' : 'hidden xl:flex'}`}>
        <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#d8c2c2] bg-white shadow-lg shadow-[#4b1719]/5">
          <div className="flex flex-wrap shrink-0 items-center justify-between gap-2 border-b border-[#eadada] bg-[#fbf7f4] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#765e5e]">
              <Eye className="size-4 text-[#7f0303]" />Vista previa en vivo
            </p>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {document.contentMarkdown.trim() !== '' && (
                <span
                  title={validation.errors.join(' | ')}
                  className={`max-w-full break-words rounded-full px-2.5 py-1 text-xs font-semibold ${validation.success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
                >
                  {validation.success ? 'Markdown válido' : (validation.errors[0] || 'Observación')}
                </span>
              )}
              <button type="button" onClick={downloadMarkdown} className={workspaceButtonClass()} title="Descargar como archivo Markdown" aria-label="Descargar Markdown">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Exportar MD</span>
              </button>
              <button type="button" onClick={() => setPreviewExpanded((expanded) => !expanded)} className={workspaceButtonClass()} aria-label={previewExpanded ? 'Mostrar editor Markdown' : 'Expandir vista previa'}>
                {previewExpanded ? <PanelLeftOpen className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                <span className="hidden sm:inline">{previewExpanded ? 'Volver a editar' : 'Vista completa'}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#fbf7f4] p-5 sm:p-8 [&::-webkit-scrollbar]:w-[14px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent group-hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(100,100,100,0.4)] [&::-webkit-scrollbar-thumb:hover]:!bg-[rgba(100,100,100,0.7)] [&::-webkit-scrollbar-thumb:active]:!bg-[rgba(100,100,100,0.9)]">
            <div className="editor-preview-content mx-auto max-w-[760px]">
              <PreviewErrorBoundary key={previewAttempt} resetKey={deferredDocument.contentMarkdown} onRetry={() => setPreviewAttempt(value => value + 1)}>
              <Suspense fallback={<p role="status" className="text-sm text-[#8b6d6d]">Cargando vista previa...</p>}>
                {problemOffset !== null ? <ContentRenderer document={deferredDocument} headingPrefix={findSubtopicNumber(courseChapters, deferredDocument.chapterId, deferredDocument.slug)} problemOffset={problemOffset} /> : problemNumberError ? <p role="alert" className="text-sm text-[#8b2020]">No se pudo comprobar la numeración del capítulo. <button type="button" onClick={() => setNumberingRetry(value => value + 1)} className="underline">Reintentar</button></p> : <p role="status" className="text-sm">Calculando numeración de problemas…</p>}
              </Suspense>
              </PreviewErrorBoundary>
            </div>
          </div>
        </div>
      </aside>
    </div>
    </div>
  </div>
}

function ToolbarSelect({ onChange }: { onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsId = useId()

  useEffect(() => {
    if (open) containerRef.current?.querySelector<HTMLButtonElement>('[data-block-option]')?.focus()
  }, [open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const options = [
    { value: 'definition', label: 'Definición' },
    { value: 'note', label: 'Nota' },
    { value: 'term', label: 'Término con explicación' },
    { value: 'equation-ref', label: 'Referencia a ecuación' },
    { value: 'numbered-image', label: 'Figura numerada' },
    { value: 'example', label: 'Ejemplo' },
    { value: 'problem', label: 'Problema' },
    { value: 'problemimage', label: 'Problema con imagen al costado' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'tool-stress', label: 'Calculadora de esfuerzo' },
    { value: 'tool-mohr-stress', label: 'Mohr: esfuerzos' },
    { value: 'tool-mohr-strain', label: 'Mohr: deformaciones' },
    { value: 'tool-axial', label: 'Calculadora de deformación' },
    { value: 'summary', label: 'Resumen' },
    { value: 'tablegrid', label: 'Tablas en una fila' },
    { value: 'table', label: 'Tabla con título' },
    { value: 'image-table', label: 'Tabla con imágenes' },
    { value: 'imagegrid', label: 'Cuadrícula de imágenes' },
  ]

  return (
    <div className="relative shrink-0" ref={containerRef}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); return }
        if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-block-option]'))
        const index = buttons.indexOf(event.target as HTMLButtonElement)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowDown' ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length
        event.preventDefault(); buttons[next]?.focus()
      }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={open ? optionsId : undefined}
        aria-label="Insertar componente"
        title="Insertar componente"
        className="editor-toolbar-trigger inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-[#d8c1c1] bg-white px-2.5 text-xs font-semibold leading-5 text-[#6a2022] hover:bg-[#f8eaea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B0000]"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        <span>Insertar componente</span>
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div id={optionsId} role="group" aria-label="Componentes disponibles" className="absolute top-full right-0 z-50 mt-2 max-h-[min(20rem,50dvh)] w-64 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-lg border border-[#e5cfcd] bg-white py-1 shadow-xl shadow-[#4b1719]/10">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              data-block-option
              onClick={() => { onChange(option.value); setOpen(false) }}
              className="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm font-medium text-[#4d3838] transition-colors hover:bg-[#f8eaea] hover:text-[#7f0303] focus-visible:bg-[#f8eaea] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8B0000]"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
