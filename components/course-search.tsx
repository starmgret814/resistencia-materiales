'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, FileText, ArrowRight, ArrowUp, ArrowDown, CornerDownLeft, X } from 'lucide-react'
import { chapters, type Chapter } from '@/lib/course-data'
import { searchCourse } from '@/lib/course-search'
import { useModalFocus } from '@/lib/use-modal-focus'
import { cn } from '@/lib/utils'

/**
 * Command-palette-style search for course content.
 * Opens with Ctrl+K (or Cmd+K on Mac).
 */
export default function CourseSearch({ courseChapters = chapters }: { courseChapters?: Chapter[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useModalFocus(open, modalRef, () => setOpen(false))

  // ─── Keyboard shortcut ─────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(-1)
      // Small delay to ensure the modal is rendered
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // ─── Search logic ──────────────────────────────────────────────────
  const matches = useMemo(() => searchCourse(courseChapters, query), [courseChapters, query])
  const results = matches.slice(0, query.trim() ? 30 : 6)

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
    if (listRef.current) listRef.current.scrollTop = 0
  }, [query, courseChapters])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const selected = list.children[selectedIndex] as HTMLElement | undefined
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, query])

  // ─── Navigate to result ────────────────────────────────────────────
  const navigateTo = useCallback((slug: string) => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      import('astro:transitions/client').then(({ navigate }) => {
        return navigate(`/curso/${slug}`)
      }).catch(() => {
        window.location.href = `/curso/${slug}`
      })
    }
  }, [])

  // ─── Keyboard navigation within results ────────────────────────────
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => results.length ? Math.min(i + 1, results.length - 1) : -1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = results[Math.max(0, selectedIndex)]
      if (result?.slug) {
        navigateTo(result.slug)
      }
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-modal-backdrop
        className="fixed inset-0 z-50 bg-[#3a1718]/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Modal */}
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="course-search-title" tabIndex={-1} className="course-search-modal fixed inset-x-0 top-[10vh] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-[#e3caca] dark:border-[#382022] bg-[#fbf7f4] dark:bg-[#1a0f10] shadow-2xl shadow-[#7f0303]/10">
          <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-3">
            <h2 id="course-search-title" className="text-[13px] font-semibold text-[#4b1719] dark:text-[#ead4d2]">Buscar en el curso</h2>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[#866b6b] hover:bg-[#f2dddd] dark:text-[#cbb0ae] dark:hover:bg-[#381618]" aria-label="Cerrar búsqueda"><X className="size-3.5" strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
          {/* Search input */}
          <div className="course-search-field mx-5 mb-3 flex items-center gap-2.5 rounded-lg px-3">
            <Search className="size-3.5 shrink-0 text-[#967070] dark:text-[#a08282]" />
            <input
              ref={inputRef}
              data-modal-autofocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Tema, capítulo o número de sección"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#3b2022] dark:text-[#f3e6e4] outline-none placeholder:text-[#967070] dark:placeholder:text-[#ab8e8e]"
              aria-label="Buscar en el curso"
              aria-describedby="course-search-hint"
            />
          </div>

          {/* Results list */}
          <p id="course-search-hint" className="px-5 pb-1 text-xs font-medium text-[#765e5e] dark:text-[#cbb0ae]" role="status">{query.trim() ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}${matches.length > 30 ? ' · mostrando los primeros 30' : ''}` : 'Explora las secciones'}</p>
          <div ref={listRef} className="course-search-results max-h-[45vh] overflow-y-auto px-3 pb-3 pt-1">
            {results.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-[#967070] dark:text-[#a08282]">No se encontraron resultados</p>
                <p className="mt-1 text-xs text-[#b28a8a] dark:text-[#7d5e60]">Intenta con otro término</p>
              </div>
            ) : (
              results.map((section, index) => (
                <button
                  key={section.slug}
                  onClick={() => section.slug && navigateTo(section.slug)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onFocus={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-[#f3e7e4] dark:bg-[#381618] text-[#7f0303] dark:text-[#fca5a5]'
                      : 'text-[#604747] dark:text-[#dfc2c0] hover:bg-[#f3e7e4] dark:hover:bg-[#2e1517]'
                  )}
                >
                  <FileText className={cn(
                    'size-4 shrink-0 transition-colors',
                    index === selectedIndex ? 'text-[#a34a4a] dark:text-[#f87171]' : 'text-[#b28a8a] dark:text-[#8a686a]'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'truncate text-[13px] font-medium transition-colors',
                      index === selectedIndex ? 'text-[#7f0303] dark:text-[#fca5a5]' : 'text-[#4b1719] dark:text-[#e8d2d0]'
                    )}>
                      {section.title}
                    </p>
                    <p className={cn(
                      'truncate text-[11px] transition-colors',
                      index === selectedIndex ? 'text-[#a34a4a] dark:text-[#f87171]' : 'text-[#967070] dark:text-[#ab8e8e]'
                    )}>
                      Capítulo {section.chapterNumber} · {section.chapterTitle}
                    </p>
                  </div>
                  {index === selectedIndex && (
                    <ArrowRight className="size-3.5 shrink-0 text-[#a34a4a] dark:text-[#f87171] transition-all" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e3caca] dark:border-[#382022] px-5 py-3">
            <div className="flex items-center gap-1.5 text-[10px] text-[#967070] dark:text-[#a08282]">
              <kbd aria-label="Flechas arriba y abajo" className="inline-flex rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1 py-0.5"><ArrowUp className="size-3" aria-hidden="true" /><ArrowDown className="size-3" aria-hidden="true" /></kbd>
              <span>navegar</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#967070] dark:text-[#a08282]">
              <kbd aria-label="Enter" className="rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1 py-0.5"><CornerDownLeft className="size-3" aria-hidden="true" /></kbd>
              <span>abrir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#967070] dark:text-[#a08282]">
              <kbd className="rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1 py-0.5">esc</kbd>
              <span>cerrar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
