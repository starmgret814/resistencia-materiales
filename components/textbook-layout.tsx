'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { chapters, type Chapter } from '@/lib/course-data'
import CourseSearch from '@/components/course-search'

// ─── Logo ──────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <a href="/" className="flex size-9 items-center justify-center rounded-lg bg-[#7f0303] text-[#fff8f4] shadow-sm" aria-label="Universidad Nacional de Ingeniería">
      <span className="font-serif text-lg font-semibold tracking-tight">UNI</span>
    </a>
  )
}

// ─── Header ────────────────────────────────────────────────────────────
function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    let theme;
    try { theme = localStorage.getItem('theme'); } catch {}
    const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e3caca] dark:border-[#382022] bg-[#fbf7f4]/95 dark:bg-[#1a0f10]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fbf7f4]/80 dark:supports-[backdrop-filter]:bg-[#1a0f10]/80 transition-colors">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenu} className="inline-flex size-9 items-center justify-center rounded-md text-[#7f0303] dark:text-[#f87171] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] lg:hidden transition-colors" aria-label="Abrir navegación">
            <Menu className="size-5" />
          </button>
          <LogoMark />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f0303] dark:text-[#f87171]">Universidad Nacional de Ingeniería</p>
            <p className="truncate font-serif text-base font-semibold text-[#3a1718] dark:text-[#f5dedd]">Resistencia de Materiales</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={onSearch} className="hidden h-9 items-center gap-2 rounded-md border border-[#d5c0c0] dark:border-[#422527] bg-white/70 dark:bg-[#231416] px-3 text-sm text-[#765e5e] dark:text-[#cbb0ae] shadow-sm hover:border-[#b78383] hover:text-[#7f0303] dark:hover:text-[#f87171] md:flex transition-colors" aria-label="Buscar en el curso">
            <Search className="size-4" /><span>Buscar en el curso</span><kbd className="ml-3 rounded border border-[#e3caca] dark:border-[#422527] bg-[#f7f5f0] dark:bg-[#150c0d] px-1.5 py-0.5 text-[10px] text-[#967070] dark:text-[#a08282]">⌘ K</kbd>
          </button>
          <button onClick={onSearch} className="inline-flex size-9 items-center justify-center rounded-md text-[#7f0303] dark:text-[#f87171] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] md:hidden transition-colors" aria-label="Buscar"><Search className="size-5" /></button>
          <button onClick={toggleDark} className="inline-flex size-9 items-center justify-center rounded-md text-[#7f0303] dark:text-[#f87171] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] transition-colors" title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
            {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Sidebar ───────────────────────────────────────────────────────────
function Sidebar({
  open,
  onClose,
  activeSlug,
  customChapters,
  navigatingSlug,
  onNavigate,
  examsActive,
}: {
  open: boolean
  onClose: () => void
  activeSlug: string | null
  customChapters?: Chapter[]
  navigatingSlug?: string | null
  onNavigate?: (slug: string) => void
  examsActive: boolean
}) {
  const courseChapters = customChapters && customChapters.length > 0 ? customChapters : chapters
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand the chapter that contains the active section
    if (!activeSlug) return ''
    for (const ch of courseChapters) {
      if (ch.sections.some((s) => s.slug === activeSlug)) return ch.number
    }
    return '01'
  })

  /** Total section count for the subtitle. */
  const totalSections = courseChapters.reduce((acc, ch) => acc + ch.sections.length, 0)

  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-[#3a1718]/40 lg:hidden" onClick={onClose} aria-label="Cerrar navegación" />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[292px] shrink-0 flex-col border-r border-[#e3caca] dark:border-[#382022] bg-[#f8efed] dark:bg-[#1a0f10] pt-[68px] transition-transform duration-200 lg:sticky lg:top-[68px] lg:z-0 lg:pt-0 lg:h-[calc(100vh-68px)] lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#967070] dark:text-[#ab8e8e]">Contenido del curso</p>
            <p className="mt-1 text-sm text-[#6b5150] dark:text-[#d3bcbb]">{courseChapters.length} capítulos · {totalSections} secciones</p>
          </div>
          <button onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-md text-[#795e5e] dark:text-[#cbb0ae] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] lg:hidden transition-colors" aria-label="Cerrar navegación"><X className="size-4" /></button>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-8" aria-label="Capítulos del curso">
          <div className="mb-5 border-b border-[#e3caca] pb-5 dark:border-[#382022]">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#967070] dark:text-[#ab8e8e]">Recursos de estudio</p>
            <a href="/examenes" onClick={onClose} aria-current={examsActive ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f0303]', examsActive ? 'bg-[#efdcda] text-[#7f0303] dark:bg-[#381618] dark:text-[#fca5a5]' : 'text-[#604747] hover:bg-[#f3e0df] dark:text-[#dfc2c0] dark:hover:bg-[#2d191b]')}>
              <FileText className="size-4 shrink-0" aria-hidden="true" /><span className="flex-1">Exámenes pasados</span><ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
            </a>
          </div>
          {courseChapters.map((chapter) => {
            const isExpanded = expanded === chapter.number
            return (
              <div key={chapter.number} className="mb-1">
                <button onClick={() => setExpanded(isExpanded ? '' : chapter.number)} className={cn('flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors', isExpanded ? 'text-[#4b1719] dark:text-[#fca5a5] font-bold' : 'text-[#604747] dark:text-[#dfc2c0] hover:bg-[#f3e0df] dark:hover:bg-[#2d191b]')}>
                  <span className="w-5 font-mono text-[10px] font-semibold text-[#a47b7b] dark:text-[#b48888]">{chapter.number}</span>
                  <span className="flex-1 text-[13px] font-semibold">{chapter.title}</span>
                  {isExpanded ? <ChevronDown className="size-3.5 text-[#967070] dark:text-[#ab8e8e]" /> : <ChevronRight className="size-3.5 text-[#967070] dark:text-[#ab8e8e]" />}
                </button>
                {isExpanded && <div className="ml-8 border-l border-[#e5c6c4] dark:border-[#3d2224] pb-1 pl-3">
                  {chapter.sections.map((section) => {
                    const isActive = section.slug === activeSlug
                    const isNavigating = navigatingSlug === section.slug
                    const href = section.slug ? `/curso/${section.slug}` : '#'
                    return (
                      <a
                        key={section.id}
                        href={href}
                        onClick={(e) => {
                          if (!section.slug) {
                            e.preventDefault()
                            return
                          }
                          if (section.slug !== activeSlug) {
                            onNavigate?.(section.slug)
                          }
                          onClose()
                        }}
                        className={cn(
                          'relative block w-full rounded-r-md px-3 py-2 text-left text-xs leading-tight transition-colors',
                          isActive
                            ? 'bg-[#f2dddd] dark:bg-[#381618] font-semibold text-[#7f0303] dark:text-[#fca5a5] before:absolute before:-left-[13px] before:top-0 before:h-full before:w-0.5 before:bg-[#7f0303] dark:before:bg-[#ef4444]'
                            : section.slug
                              ? 'text-[#765e5e] dark:text-[#cdb2b0] hover:bg-[#f3e0df] dark:hover:bg-[#2d181a] hover:text-[#6a2022] dark:hover:text-[#fca5a5]'
                              : 'cursor-default text-[#b8a0a0] dark:text-[#684f50]'
                        )}
                      >
                        {isNavigating ? (
                          <span className="inline-block animate-spin size-2.5 mr-1.5 border-2 border-[#8B0000] dark:border-[#fca5a5] border-t-transparent rounded-full align-middle" />
                        ) : (
                          <span className="mr-1.5 text-[10px] text-[#b28a8a] dark:text-[#9c7878]">{section.id}</span>
                        )}
                        {section.title}
                      </a>
                    )
                  })}
                </div>}
              </div>
            )
          })}
        </nav>
        <div className="border-t border-[#e3caca] dark:border-[#382022] p-4">
          <div className="flex items-center gap-3 rounded-lg bg-[#f1dddd] dark:bg-[#2a1416] px-3 py-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-white dark:bg-[#1a0f10] text-[#8f2929] dark:text-[#f87171]">
              <CircleHelp className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6a2022] dark:text-[#fca5a5]">¿Necesitas ayuda?</p>
              <p className="text-[11px] text-[#795e5e] dark:text-[#bca4a3]">Consulta la guía del curso</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Table of Contents (page-level) ────────────────────────────────────
function TableOfContents({ headings }: { headings?: { id: string; text: string; level: number }[] }) {
  const items = headings ?? []

  if (items.length === 0) return null

  return (
    <aside className="hidden w-[190px] shrink-0 xl:block">
      <div className="sticky top-[108px] border-l border-[#e3caca] dark:border-[#382022] pl-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#967070] dark:text-[#ab8e8e]">En esta página</p>
        <nav className="flex flex-col gap-3 text-xs">
          {items.map((h, i) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={cn(
                i === 0 ? 'font-semibold text-[#7f0303] dark:text-[#f87171]' : 'text-[#765e5e] dark:text-[#cbb0ae] hover:text-[#7f0303] dark:hover:text-[#f87171]',
                h.level >= 3 && 'pl-3'
              )}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

// ─── Course layout wrapper ─────────────────────────────────────────────
export interface TextbookLayoutProps {
  activeSlug: string | null
  chapterNumber?: string
  chapterTitle?: string
  sectionTitle?: string
  headings?: { id: string; text: string; level: number }[]
  previous?: { slug: string; title: string } | null
  next?: { slug: string; title: string } | null
  customChapters?: Chapter[]
  variant?: 'course' | 'archive' | 'exam'
  children: React.ReactNode
}

export default function TextbookLayout({
  activeSlug,
  chapterNumber,
  chapterTitle,
  sectionTitle,
  headings,
  previous,
  next,
  customChapters,
  variant = 'course',
  children,
}: TextbookLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null)

  useEffect(() => {
    setNavigatingSlug(null)
  }, [activeSlug])

  return (
    <div className="min-h-screen bg-[#fbf7f4] dark:bg-[#140b0c] text-[#3b2022] dark:text-[#f3e6e4] transition-colors duration-200">
      <Header onMenu={() => setSidebarOpen(true)} onSearch={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
      }} />
      <CourseSearch />
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          activeSlug={activeSlug} 
          customChapters={customChapters}
          navigatingSlug={navigatingSlug}
          onNavigate={setNavigatingSlug}
          examsActive={variant !== 'course'}
        />
        <main className="min-w-0 flex-1">
          <div className="flex justify-center">
            {/* ─── Content area ─── */}
            <article className={cn('mx-auto w-full min-w-0 px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-10', variant === 'archive' ? 'max-w-[1100px]' : 'max-w-[840px]')}>
              {/* Breadcrumb */}
              {chapterNumber && chapterTitle && (
                <div className="mb-8 flex items-center gap-2 text-[11px] font-medium text-[#866b6b] dark:text-[#ab8e8e]">
                  <span>CAPÍTULO {chapterNumber}</span>
                  <span className="text-[#c9a4a4] dark:text-[#543336]">/</span>
                  <span className="text-[#7f0303] dark:text-[#f87171]">{chapterTitle.toUpperCase()}</span>
                </div>
              )}

              {/* MDX content slot */}
              <div className={variant === 'course' ? 'mdx-content' : undefined}>
                {children}
              </div>

              {/* Prev / Next navigation */}
              {(previous || next) && (
                <div className="mt-16 grid gap-3 border-t border-[#dedbd3] dark:border-[#382022] pt-5 sm:grid-cols-2">
                  {previous ? (
                    <a 
                      href={`/curso/${previous.slug}`} 
                      onClick={() => setNavigatingSlug(previous.slug)}
                      className="group rounded-lg p-3 text-left hover:bg-[#f8eaea] dark:hover:bg-[#2a1416] transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#967070] dark:text-[#ab8e8e] flex items-center gap-1">
                        {navigatingSlug === previous.slug ? (
                          <span className="inline-block animate-spin size-2.5 border-2 border-[#8B0000] dark:border-[#fca5a5] border-t-transparent rounded-full" />
                        ) : '←'} Anterior
                      </p>
                      <p className="mt-1 font-serif text-sm font-semibold text-[#604747] dark:text-[#dfc2c0] group-hover:text-[#7f0303] dark:group-hover:text-[#f87171]">{previous.title}</p>
                    </a>
                  ) : <div />}
                  {next ? (
                    <a 
                      href={`/curso/${next.slug}`} 
                      onClick={() => setNavigatingSlug(next.slug)}
                      className="group rounded-lg p-3 text-right hover:bg-[#f8eaea] dark:hover:bg-[#2a1416] transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#967070] dark:text-[#ab8e8e] flex items-center justify-end gap-1">
                        Siguiente {navigatingSlug === next.slug ? (
                          <span className="inline-block animate-spin size-2.5 border-2 border-[#8B0000] dark:border-[#fca5a5] border-t-transparent rounded-full" />
                        ) : '→'}
                      </p>
                      <p className="mt-1 font-serif text-sm font-semibold text-[#604747] dark:text-[#dfc2c0] group-hover:text-[#7f0303] dark:group-hover:text-[#f87171]">{next.title}</p>
                    </a>
                  ) : <div />}
                </div>
              )}
            </article>

            <TableOfContents headings={headings} />
          </div>
        </main>
      </div>
    </div>
  )
}
