'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bold,
  Code2,
  Download,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
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
  X
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Editor from '@monaco-editor/react'
import ContentRenderer from '@/components/content-renderer'
import { chapters } from '@/lib/course-data'
import {
  slugify,
  starterDocument,
  titleFromMarkdown,
  validateCourseDocument,
  type CourseDocument,
} from '@/lib/content-schema'

const inputClass = 'w-full rounded-lg border border-[#dcc3c3] bg-white px-3 py-2.5 text-sm text-[#3b2022] outline-none transition focus:border-[#9c4d4d] focus:ring-2 focus:ring-[#9c4d4d]/15'
const selectClass = 'appearance-none w-full rounded-lg border border-[#dcc3c3] bg-white px-3 py-2.5 text-sm text-[#3b2022] outline-none transition hover:border-[#9c4d4d] focus:border-[#9c4d4d] focus:ring-2 focus:ring-[#9c4d4d]/15 bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%238b6d6d\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat pr-10 cursor-pointer'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#7d6060]'

export default function ContentEditor({ session, initialChapter, initialSlug }: { session?: any, initialChapter: string, initialSlug: string }) {
  const [document, setDocument] = useState<CourseDocument>(() => ({ ...structuredClone(starterDocument), chapterId: initialChapter, slug: initialSlug }))
  const deferredDocument = useDeferredValue(document)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const validation = useMemo(() => validateCourseDocument(document), [document])

  const [assignedChapters, setAssignedChapters] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // CRUD de subtemas
  const [isCreatingNewSection, setIsCreatingNewSection] = useState(false)
  const [newSectionId, setNewSectionId] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [isCreatingSub, setIsCreatingSub] = useState(false)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreateSubchapter = async () => {
    if (!newSectionId || !newSectionTitle) return showToast('Debes llenar el número y el título del subtema', 'error');
    
    // Generar slug
    const safeTitle = newSectionTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-');
    const chapterData = chapters.find(c => c.number === document.chapterId);
    if (!chapterData) return;
    
    // El slug del curso completo sigue el formato: carpeta-del-capitulo/nombre-del-subtema
    // Necesitamos saber la carpeta del capítulo. Podemos extraerla del primer subtema existente.
    let chapterFolder = `${document.chapterId}-capitulo`; // Fallback
    if (chapterData.sections.length > 0 && chapterData.sections[0].slug) {
      chapterFolder = chapterData.sections[0].slug.split('/')[0];
    }
    
    const fullSlug = `${chapterFolder}/${safeTitle}`;

    const newSection = { id: newSectionId, title: newSectionTitle, slug: fullSlug };

    try {
      setIsCreatingSub(true);
      const res = await fetch('/api/subchapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber: document.chapterId, newSection })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Subtema creado exitosamente.', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Error: ' + data.error, 'error');
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    } finally {
      setIsCreatingSub(false);
    }
  }
  
  // Lista de todos los borradores del usuario actual
  const [myDrafts, setMyDrafts] = useState<any[]>([])

  const fetchMyDrafts = async () => {
    if (!session?.email) return;
    try {
      // Un admin ve todo (limitamos a 50 para no reventar lectura), el editor ve solo lo suyo
      const q = session.role === 'admin' 
        ? query(collection(db, 'drafts'))
        : query(collection(db, 'drafts'), where("authorEmail", "==", session.email));
      
      const snap = await getDocs(q);
      const drafts: any[] = [];
      snap.forEach(d => drafts.push({ id: d.id, ...d.data() }));
      setMyDrafts(drafts);
    } catch (e) {
      console.error("Error obteniendo borradores", e);
    }
  }

  useEffect(() => {
    if (session?.email && initialChapter && initialSlug) {
      loadDraft(initialChapter, initialSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email, initialChapter, initialSlug])

  const loadDraft = async (chapterId: string, slug: string) => {
    if (!session?.email) return;
    try {
      const draftId = `${chapterId}_${slug}`;
      const snap = await getDoc(doc(db, 'drafts', draftId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.authorEmail === session.email || session?.role === 'admin') {
          setDocument(data as CourseDocument);
        }
      } else {
        // Si no hay borrador en la nube, verificamos si ya existe el archivo MDX real en el sistema
        const mdxRes = await fetch(`/api/mdx?chapter=${chapterId}&slug=${slug}`);
        if (mdxRes.ok) {
          const mdxData = await mdxRes.json();
          setDocument({ 
            ...structuredClone(starterDocument), 
            chapterId, 
            slug,
            contentMarkdown: mdxData.content 
          });
        } else {
          // Si tampoco existe MDX, empezamos de cero
          setDocument({ ...structuredClone(starterDocument), chapterId, slug });
        }
      }
    } catch (e) {
      console.error("Error cargando borrador", e);
    } finally {
      setIsLoaded(true);
    }
  }

  const saveDraft = async (status: 'draft' | 'pending_approval', silent = false) => {
    if (!session?.email) return showToast('No tienes sesión activa.', 'error');
    try {
      setIsSaving(true);
      const draftId = `${document.chapterId}_${document.slug}`;
      const draftRef = doc(db, 'drafts', draftId);
      await setDoc(draftRef, {
        ...document,
        authorEmail: session.email,
        status,
        updatedAt: new Date().toISOString()
      });
      await fetchMyDrafts();
      if (!silent) showToast(status === 'draft' ? 'Borrador guardado exitosamente.' : 'Enviado para revisión del administrador.', 'success');
    } catch (e) {
      console.error(e);
      if (!silent) showToast('Error guardando en la nube.', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const publishDraft = async () => {
    if (!session?.email || session.role !== 'admin') return showToast('No tienes permisos.', 'error');
    try {
      setIsSaving(true);
      
      // 1. Guardar el archivo real en el backend (.mdx)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: document.chapterId,
          slug: document.slug,
          contentMarkdown: document.contentMarkdown
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al publicar');
      }

      // 2. Actualizar el estado en Firebase a 'approved'
      const draftId = `${document.chapterId}_${document.slug}`;
      const draftRef = doc(db, 'drafts', draftId);
      await setDoc(draftRef, {
        ...document,
        authorEmail: session.email,
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
      
      showToast('¡Aprobado y publicado exitosamente!', 'success');
      
      // Regresar al dashboard después de un momento
      setTimeout(() => {
        window.location.href = '/workspace-mc361/management/requests';
      }, 1500);

    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Error al publicar el documento.', 'error');
      setIsSaving(false);
    }
  }

  const editorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function execCommand(command: string) {
    const editor = editorRef.current
    if (!editor) return
    editor.trigger('toolbar', command, null)
    editor.focus()
  }

  function updateMarkdown(contentMarkdown: string) {
    setDocument((current) => {
      const title = titleFromMarkdown(contentMarkdown)
      return {
        ...current,
        title,
        slug: current.slug === 'nueva-pagina' ? slugify(title) : current.slug,
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

    editor.executeEdits('toolbar', [{
      range: selection,
      text: insertText,
      forceMoveMarkers: true
    }])
    editor.focus()
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

  function insertEducationalBlock(kind: string) {
    if (kind === 'definition') insertMarkdown('\n<Definition title="Definición">\n', '\n</Definition>\n', 'Escribe la definición.')
    else if (kind === 'note') insertMarkdown('\n<Note title="Nota importante">\n', '\n</Note>\n', 'Escribe la observación.')
    else if (kind === 'example') insertMarkdown('\n<Example number={1} title="Ejemplo resuelto">\n', '\n\n<Solution>\nDescribe la solución paso a paso.\n</Solution>\n</Example>\n', 'Escribe el enunciado.')
    else if (kind === 'problem') insertMarkdown('\n<Problem number={1} title="Problema propuesto">\n', '\n\n<Solution>\nDescribe la solución paso a paso.\n</Solution>\n</Problem>\n', 'Escribe el problema.')
    else if (kind === 'quiz') insertMarkdown('\n<Quiz question="Escribe la pregunta">\n', '\n</Quiz>\n', 'Escribe la respuesta.')
    else if (kind === 'summary') insertMarkdown('\n<Summary title="Resumen">\n', '\n</Summary>\n', 'Resume los puntos principales.')
    else if (kind === 'imagegrid') insertMarkdown('\n<ImageGrid columns={2}>\n  <Image src="imagen-1.png" alt="Descripción de la primera imagen" caption="Figura 1" />\n\n  <Image src="imagen-2.png" alt="Descripción de la segunda imagen" caption="Figura 2" />\n</ImageGrid>\n')
  }

  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file) // Cloudinary usa 'file', no 'image'

      // Credenciales de Cloudinary
      const cloudName = 'dtjpmhekb'
      const uploadPreset = 'resistencia-materiales-imagenes'

      formData.append('upload_preset', uploadPreset)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.secure_url) {
        insertMarkdown('\n<Image src="', '" alt="Descripción de la imagen" caption="Figura" />\n', data.secure_url)
      } else {
        throw new Error(data.error?.message || 'Error desconocido de Cloudinary')
      }

    } catch (err) {
      console.error('Error subiendo imagen:', err)
      showToast('Hubo un error al subir la imagen. Verifica tu conexión o tu API Key.', 'error')
    } finally {
      setIsUploading(false)
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  const toolClass = 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#6f5050] hover:bg-[#f1dddd] hover:text-[#7f0303]'

  // Formatear el correo de la UNI (ej: juan.perez.a@uni.pe -> Juan Perez A.)
  const formatName = (email?: string) => {
    if (!email) return 'Invitado';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 3) {
      const nombre = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const apellido = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      const inicial = parts[2].charAt(0).toUpperCase();
      return `${nombre} ${apellido} ${inicial}.`;
    }
    return email.split('@')[0];
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f5f4]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B0000]" />
          <p className="text-sm font-semibold text-[#8b6d6d] animate-pulse">Cargando documento...</p>
        </div>
      </div>
    );
  }

  return <div className="flex h-screen flex-col overflow-hidden bg-[#f3ece8] text-[#3b2022]">
    {toast && (
      <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl shadow-[#4b1719]/10 border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#f4fbf7] border-[#d1e8da] text-[#1c663b]' : 'bg-[#fdf6f6] border-[#f1dada] text-[#8B0000]'}`}>
        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
        <p className="font-semibold text-sm">{toast.message}</p>
      </div>
    )}
    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    <header className="shrink-0 border-b border-[#ddcaca] bg-[#fbf7f4]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#7f0303]">
            EDITOR MARKDOWN
          </p>
          <span className="h-4 w-px bg-[#ddcaca]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#7f0303]">
            {formatName(session?.email)} {session?.role === 'admin' ? '(Admin)' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <a href="/workspace-mc361/content/chapters" className="text-xs font-semibold text-[#8b6d6d] hover:text-[#8B0000] hover:underline mr-4 flex items-center gap-1">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Contenido
            </a>
          </div>



          <button
            onClick={async () => {
              const { auth } = await import('@/lib/firebase');
              window.document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              await auth.signOut();
              window.location.href = '/workspace-mc361/login';
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-[#f8eaea] text-[#6a2022] text-sm font-semibold rounded-md transition-colors"
            title="Cerrar Sesión"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <div className={`mx-auto grid w-full max-w-[1800px] flex-1 min-h-0 gap-5 p-4 sm:p-6 ${previewExpanded ? 'grid-cols-1' : 'xl:grid-cols-2'}`}>
      {!previewExpanded && <section className="flex min-w-0 flex-col space-y-4 min-h-0">
        {/* Document Header Info */}
        <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-[#ddcaca] shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b6d6d]">Editando Subtema</p>
            <h2 className="text-lg font-serif font-bold text-[#4b1719] mt-0.5">Capítulo {document.chapterId} · {document.slug}</h2>
          </div>
          <div className="flex gap-2">
             <button
              onClick={() => saveDraft('draft')}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#d8c1c1] hover:bg-[#f1dddd] text-[#3b2022] text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
              title="Guardar progreso en la nube (borrador)"
            >
              <Cloud className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar Avance'}
            </button>
            {session?.role === 'admin' ? (
              <button
                onClick={publishDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1c663b] hover:bg-[#15502e] text-white text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
                title="Publicar directamente en la web"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar y Publicar
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!document.contentMarkdown.trim()) {
                    return showToast('El contenido no puede estar vacío.', 'error');
                  }
                  saveDraft('pending_approval');
                }}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#8B0000] hover:bg-[#6a0000] text-white text-sm font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
                title="Enviar a revisión del administrador"
              >
                <Send className="w-4 h-4" />
                Solicitar Revisión
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-[#ddcaca] bg-white shadow-sm">
          <div onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault() }} className="shrink-0 flex flex-wrap items-center gap-1 border-b border-[#eadada] bg-[#fbf7f4] p-2 rounded-t-xl">
            <button type="button" className={toolClass} title="Deshacer" aria-label="Deshacer" onClick={() => execCommand('undo')}><Undo2 className="size-4" /></button>
            <button type="button" className={toolClass} title="Rehacer" aria-label="Rehacer" onClick={() => execCommand('redo')}><Redo2 className="size-4" /></button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" />
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
            <button type="button" disabled={isUploading} className={`${toolClass} ${isUploading ? 'opacity-50 cursor-wait' : ''}`} title="Subir Imagen a la Nube" aria-label="Imagen" onClick={handleImageUploadClick}>
              {isUploading ? <span className="size-4 animate-spin rounded-full border-2 border-[#8b6d6d] border-t-transparent" /> : <ImageIcon className="size-4" />}
            </button>
            <span className="mx-1 h-6 w-px shrink-0 bg-[#decaca]" />
            <ToolbarSelect onChange={insertEducationalBlock} />
          </div>
          <div className="relative flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={document.contentMarkdown}
              onChange={(value) => updateMarkdown(value || '')}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('resistenciaTheme', {
                  base: 'vs',
                  inherit: true,
                  rules: [
                    { token: 'identifier', foreground: '3E3030' },
                    { token: 'variable', foreground: '3E3030' },

                    { token: 'keyword', foreground: '8B0000', fontStyle: 'bold' },
                    { token: 'keyword.md', foreground: '8B0000', fontStyle: 'bold' },
                    { token: 'tag', foreground: '8B0000', fontStyle: 'bold' },
                    { token: 'tag.html', foreground: '8B0000', fontStyle: 'bold' },
                    { token: 'tag.md', foreground: '8B0000', fontStyle: 'bold' },
                    { token: 'type.identifier', foreground: '8B0000', fontStyle: 'bold' },

                    { token: 'attribute.name', foreground: 'A52A2A' },
                    { token: 'attribute.name.html', foreground: 'A52A2A' },
                    { token: 'attribute.name.md', foreground: 'A52A2A' },

                    { token: 'string', foreground: '8A5A20' },
                    { token: 'string.html', foreground: '8A5A20' },
                    { token: 'string.md', foreground: '8A5A20' },
                    { token: 'string.xml', foreground: '8A5A20' },
                    { token: 'string.link.md', foreground: '8A5A20', fontStyle: 'underline' },
                    { token: 'attribute.value', foreground: '8A5A20' },
                    { token: 'attribute.value.html', foreground: '8A5A20' },
                    { token: 'attribute.value.md', foreground: '8A5A20' },

                    { token: 'constant', foreground: '9B3F3F' },
                    { token: 'type', foreground: '9B3F3F' },
                    { token: 'math.md', foreground: '9B3F3F' },

                    { token: 'number', foreground: '7A5A8E' },

                    { token: 'comment', foreground: '756565', fontStyle: 'italic' },
                    { token: 'delimiter', foreground: '756565' },
                    { token: 'delimiter.html', foreground: '756565' },
                    { token: 'delimiter.md', foreground: '756565' },

                    { token: 'invalid', foreground: '3E3030' },
                    { token: 'escape', foreground: '3E3030' },
                    { token: 'string.escape', foreground: '3E3030' },
                    { token: 'keyword.escape', foreground: '3E3030' },
                    { token: 'punctuation', foreground: '756565' },
                    { token: 'punctuation.md', foreground: '756565' },
                  ],
                  colors: {
                    'editor.foreground': '#3E3030',
                    'editor.background': '#FCF9F7',
                    'editorCursor.foreground': '#8B0000',
                    'editor.lineHighlightBackground': '#8B000012',
                    'editorLineNumber.foreground': '#E5D7D4',
                    'editorLineNumber.activeForeground': '#8B0000',
                    'editor.selectionBackground': '#F3D9D7',
                    'editorBracketHighlight.unexpectedBracket.foreground': '#3E3030',
                    'editorError.foreground': '#3E3030',
                  }
                })
              }}
              onMount={(editor, monaco) => {
                editorRef.current = editor
                monaco.editor.setTheme('resistenciaTheme')
              }}
              options={{
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
          <div className="shrink-0 rounded-b-xl border-t border-[#eadada] bg-[#fbf7f4] px-4 py-2 text-[10px] text-[#967070]">Markdown · GFM · LaTeX · {document.contentMarkdown.length.toLocaleString('es')} caracteres</div>
        </div>
      </section>}

      <aside className={`flex min-w-0 flex-col min-h-0 ${previewExpanded ? '' : ''}`}>
        <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#d8c2c2] bg-white shadow-lg shadow-[#4b1719]/5">
          <div className="flex flex-wrap shrink-0 items-center justify-between gap-2 border-b border-[#eadada] bg-[#fbf7f4] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#765e5e]">
              <Eye className="size-4 text-[#7f0303]" />Vista previa en vivo
            </p>
            <div className="flex items-center gap-2">
              {document.contentMarkdown.trim() !== '' && (
                <span
                  title={validation.errors.join(' | ')}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${validation.success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
                >
                  {validation.success ? 'Markdown válido' : (validation.errors[0] || 'Observación')}
                </span>
              )}
              <button type="button" onClick={downloadMarkdown} className="inline-flex items-center gap-1.5 rounded-md border border-[#d5baba] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#6a2022] hover:bg-[#f8eaea]" title="Descargar como archivo Markdown">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Exportar MD</span>
              </button>
              <button type="button" onClick={() => setPreviewExpanded((expanded) => !expanded)} className="inline-flex items-center gap-1.5 rounded-md border border-[#d5baba] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#6a2022] hover:bg-[#f8eaea]" aria-label={previewExpanded ? 'Mostrar editor Markdown' : 'Expandir vista previa'}>
                {previewExpanded ? <PanelLeftOpen className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                <span className="hidden sm:inline">{previewExpanded ? 'Volver a editar' : 'Vista completa'}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#fbf7f4] p-5 sm:p-8 [&::-webkit-scrollbar]:w-[14px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent group-hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(100,100,100,0.4)] [&::-webkit-scrollbar-thumb:hover]:!bg-[rgba(100,100,100,0.7)] [&::-webkit-scrollbar-thumb:active]:!bg-[rgba(100,100,100,0.9)]">
            <div className="mx-auto max-w-[760px]">
              <ContentRenderer document={deferredDocument} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
}

function CustomSelect({
  value,
  onChange,
  options,
  className = "w-full"
}: {
  value: string,
  onChange: (value: string) => void,
  options: { value: string, label: string }[],
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
        <span className="truncate">{selected ? selected.label : 'Seleccionar...'}</span>
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
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-[#fbf7f4] ${value === option.value ? 'bg-[#f8eaea] text-[#7f0303] font-medium' : 'text-[#4d3838]'}`}
            >
              <span className="truncate pr-4">{option.label}</span>
              {value === option.value && (
                <svg className="ml-auto h-4 w-4 shrink-0 text-[#7f0303]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolbarSelect({ onChange }: { onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
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

  const options = [
    { value: 'definition', label: 'Definición' },
    { value: 'note', label: 'Nota' },
    { value: 'example', label: 'Ejemplo' },
    { value: 'problem', label: 'Problema' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'summary', label: 'Resumen' },
    { value: 'imagegrid', label: 'Cuadrícula de imágenes' },
  ]

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center justify-between gap-1.5 rounded-md border border-[#d8c1c1] bg-white pl-2 pr-2 text-xs font-semibold text-[#6f5050] outline-none transition hover:border-[#b78383] hover:bg-[#f1dddd]"
      >
        <span>Insertar componente</span>
        <svg className="h-3 w-3 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border border-[#e5cfcd] bg-white py-1 shadow-xl shadow-[#4b1719]/10">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className="flex w-full items-center px-3 py-2 text-left text-xs font-medium text-[#4d3838] transition-colors hover:bg-[#f8eaea] hover:text-[#7f0303]"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
