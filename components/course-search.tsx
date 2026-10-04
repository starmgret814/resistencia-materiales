'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, FileText, ArrowRight } from 'lucide-react'
import { chapters, allSections } from '@/lib/course-data'
import { cn } from '@/lib/utils'

/**
 * Command-palette-style search for course content.
 * Opens with Ctrl+K (or Cmd+K on Mac).
 */
export default function CourseSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
      setSelectedIndex(0)
      // Small delay to ensure the modal is rendered
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // ─── Search logic ──────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show all sections grouped by chapter when no query
      return allSections
        .filter((s) => s.slug !== null)
        .slice(0, 12)
    }

    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return allSections
      .filter((s) => {
        if (!s.slug) return false
        const title = s.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const chapter = s.chapterTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const id = s.id.toLowerCase()
        return title.includes(q) || chapter.includes(q) || id.includes(q) || s.slug.includes(q)
      })
      .slice(0, 10)
  }, [query])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const selected = list.children[selectedIndex] as HTMLElement | undefined
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // ─── Navigate to result ────────────────────────────────────────────
  const navigateTo = useCallback((slug: string) => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      import('astro:transitions/client').then(({ navigate }) => {
        navigate(`/curso/${slug}`)
      }).catch(() => {
        window.location.href = `/curso/${slug}`
      })
    }
  }, [])

  // ─── Keyboard navigation within results ────────────────────────────
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const result = results[selectedIndex]
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
        className="fixed inset-0 z-50 bg-[#3a1718]/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[15vh] z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-[#e3caca] dark:border-[#382022] bg-[#fbf7f4] dark:bg-[#1a0f10] shadow-2xl shadow-[#7f0303]/10">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[#e3caca] dark:border-[#382022] px-4">
            <Search className="size-4 shrink-0 text-[#967070] dark:text-[#a08282]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Buscar en el curso..."
              className="h-12 flex-1 bg-transparent text-sm text-[#3b2022] dark:text-[#f3e6e4] outline-none placeholder:text-[#b28a8a] dark:placeholder:text-[#7d5e60]"
              aria-label="Buscar en el curso"
            />
            <kbd className="hidden rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1.5 py-0.5 text-[10px] text-[#967070] dark:text-[#a08282] sm:inline-flex">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
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
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-[#f2dddd] dark:bg-[#381618] text-[#7f0303] dark:text-[#fca5a5]'
                      : 'text-[#604747] dark:text-[#dfc2c0] hover:bg-[#f2dddd]/50 dark:hover:bg-[#2e1517]'
                  )}
                >
                  <FileText className={cn(
                    'size-4 shrink-0 transition-colors',
                    index === selectedIndex ? 'text-[#a34a4a] dark:text-[#f87171]' : 'text-[#b28a8a] dark:text-[#8a686a]'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'truncate text-sm font-medium transition-colors',
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
          <div className="flex items-center gap-4 border-t border-[#e3caca] dark:border-[#382022] bg-[#f7f0ee]/40 dark:bg-[#140b0c]/40 px-4 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-[#967070] dark:text-[#a08282]">
              <kbd className="rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1 py-0.5">↑↓</kbd>
              <span>navegar</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#967070] dark:text-[#a08282]">
              <kbd className="rounded border border-[#e3caca] dark:border-[#382022] bg-[#f7f5f0] dark:bg-[#140b0c] px-1 py-0.5">↵</kbd>
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
