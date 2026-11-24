'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Home,
  Users,
  Command,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Menu,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { chapters, type Chapter } from '@/lib/course-data'
import CourseSearch from '@/components/course-search'
import { useModalFocus } from '@/lib/use-modal-focus'
import { defaultReadingPreferences, parseReadingPreferences, readingPreferenceStyle, READING_PREFERENCES_KEY, type ReadingPreferences } from '@/lib/reading-preferences'

// ─── Logo ──────────────────────────────────────────────────────────────
function LogoMark() {
  return (
  <img
    src="/logo-uni.png"
    alt="Universidad Nacional de Ingeniería"
    className="h-10 w-auto object-contain"
  />
  )
}

// ─── Header ────────────────────────────────────────────────────────────
function Header({ onMenu, onSearch, menuOpen }: { onMenu: () => void; onSearch: () => void; menuOpen: boolean }) {
  const [dark, setDark] = useState(false)
  const [mac, setMac] = useState(false)

  useEffect(() => {
    let theme;
    try { theme = localStorage.getItem('theme'); } catch {}
    const isDark = document.documentElement.classList.contains('dark') || theme === 'dark';
    setDark(isDark);
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  const toggleDark = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      try { localStorage.setItem('theme', 'light'); } catch {}
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e3caca] dark:border-[#382022] bg-[#fbf7f4]/95 dark:bg-[#1a0f10]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fbf7f4]/80 dark:supports-[backdrop-filter]:bg-[#1a0f10]/80 transition-colors">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMenu} aria-expanded={menuOpen} aria-controls="course-navigation" className="inline-flex size-11 items-center justify-center rounded-md text-[#7f0303] dark:text-[#f87171] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] lg:hidden transition-colors" aria-label="Abrir navegación">
            <Menu className="size-5" />
          </button>
          <a href="/" aria-label="Inicio del curso"><LogoMark /></a>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f0303] dark:text-[#f87171]">Universidad Nacional de Ingeniería</p>
            <p className="truncate font-sans text-base font-semibold text-[#3a1718] dark:text-[#f5dedd]">Resistencia de Materiales</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={onSearch} className="study-control study-search-desktop" aria-label="Buscar en el curso">
            <Search className="size-4" /><span>Buscar en el curso</span><kbd className="ml-3 inline-flex items-center gap-1 rounded border border-[#e3caca] dark:border-[#422527] bg-[#f7f5f0] dark:bg-[#150c0d] px-1.5 py-0.5 text-[10px] text-[#967070] dark:text-[#a08282]">{mac ? <Command className="size-3" aria-label="Command" /> : 'Ctrl'} K</kbd>
          </button>
          <button onClick={onSearch} className="study-control study-control-quiet study-control-icon study-search-mobile" aria-label="Buscar"><Search className="size-5" /></button>
          <button onClick={toggleDark} className="study-control study-control-quiet study-control-icon" title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
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
  homeActive,
  welcomeActive,
  aboutActive,
}: {
  open: boolean
  onClose: () => void
  activeSlug: string | null
  customChapters?: Chapter[]
  navigatingSlug?: string | null
  onNavigate?: (slug: string) => void
  examsActive: boolean
  homeActive: boolean
  welcomeActive: boolean
  aboutActive: boolean
}) {
  const asideRef = useRef<HTMLElement>(null)
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useModalFocus(open && mobile, asideRef, onClose)
  const courseChapters = customChapters ?? chapters
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand the chapter that contains the active section
    if (!activeSlug) return ''
    for (const ch of courseChapters) {
      if (ch.sections.some((s) => s.slug === activeSlug)) return ch.number
    }
    return courseChapters[0]?.number || ''
  })
  useEffect(() => {
    const chapter = courseChapters.find(item => item.sections.some(section => section.slug === activeSlug))
    if (chapter) setExpanded(chapter.number)
  }, [activeSlug, customChapters])
  useEffect(() => {
    if (mobile && !open) return
    asideRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
  }, [expanded, mobile, open, activeSlug])

  /** Total section count for the subtitle. */
  const totalSections = courseChapters.reduce((acc, ch) => acc + ch.sections.length, 0)

  return (
    <>
      {open && <div data-modal-backdrop className="fixed inset-0 z-40 bg-[#3a1718]/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside ref={asideRef} id="course-navigation" role={mobile ? 'dialog' : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Navegación del curso" tabIndex={-1} className={cn('course-sidebar fixed inset-y-0 left-0 z-50 flex w-[292px] max-w-[90vw] shrink-0 flex-col border-r border-[#e3caca] dark:border-[#382022] bg-[#f8efed] dark:bg-[#1a0f10] pt-[68px] transition-transform duration-200 lg:sticky lg:top-[68px] lg:z-0 lg:pt-0 lg:h-[calc(100dvh-68px)] lg:translate-x-0', open ? 'translate-x-0' : 'course-sidebar-closed -translate-x-full')}>
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#967070] dark:text-[#ab8e8e]">Contenido del curso</p>
            <p className="mt-1 text-sm text-[#6b5150] dark:text-[#d3bcbb]">{courseChapters.length} capítulos · {totalSections} secciones</p>
          </div>
          <button onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-md text-[#795e5e] dark:text-[#cbb0ae] hover:bg-[#f2dddd] dark:hover:bg-[#2d181a] lg:hidden transition-colors" aria-label="Cerrar navegación"><X className="size-4" /></button>
        </div>
        <nav className="course-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8" aria-label="Capítulos del curso">
          <div className="mb-5 border-b border-[#e3caca] pb-5 dark:border-[#382022]">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#967070] dark:text-[#ab8e8e]">Recursos de estudio</p>
            <a href="/" onClick={onClose} aria-current={homeActive ? 'page' : undefined} className={cn('mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors', homeActive ? 'bg-[#efdcda] text-[#7f0303] dark:bg-[#381618] dark:text-[#fca5a5]' : 'text-[#604747] hover:bg-[#f3e0df] dark:text-[#dfc2c0] dark:hover:bg-[#2d191b]')}><Home className="size-4 shrink-0" aria-hidden="true" />Inicio</a>
            <a href="/bienvenida" onClick={onClose} aria-current={welcomeActive ? 'page' : undefined} className={cn('mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors', welcomeActive ? 'bg-[#efdcda] text-[#7f0303] dark:bg-[#381618] dark:text-[#fca5a5]' : 'text-[#604747] hover:bg-[#f3e0df] dark:text-[#dfc2c0] dark:hover:bg-[#2d191b]')}><BookOpen className="size-4 shrink-0" aria-hidden="true" />Bienvenida al curso</a>
            <a href="/examenes" onClick={onClose} aria-current={examsActive ? 'page' : undefined} className={cn('mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7f0303]', examsActive ? 'bg-[#efdcda] text-[#7f0303] dark:bg-[#381618] dark:text-[#fca5a5]' : 'text-[#604747] hover:bg-[#f3e0df] dark:text-[#dfc2c0] dark:hover:bg-[#2d191b]')}>
              <FileText className="size-4 shrink-0" aria-hidden="true" /><span className="flex-1">Exámenes pasados</span><ChevronRight className="size-3.5 opacity-50" aria-hidden="true" />
            </a>
            <a href="/acerca-de" onClick={onClose} aria-current={aboutActive ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors', aboutActive ? 'bg-[#efdcda] text-[#7f0303] dark:bg-[#381618] dark:text-[#fca5a5]' : 'text-[#604747] hover:bg-[#f3e0df] dark:text-[#dfc2c0] dark:hover:bg-[#2d191b]')}><Users className="size-4 shrink-0" aria-hidden="true" />Acerca del proyecto</a>
          </div>
          {courseChapters.map((chapter) => {
            const isExpanded = expanded === chapter.number
            return (
              <div key={chapter.number} className="mb-1">
                <button aria-expanded={isExpanded} aria-controls={`chapter-${chapter.number}`} onClick={() => setExpanded(isExpanded ? '' : chapter.number)} className={cn('flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors', isExpanded ? 'text-[#4b1719] dark:text-[#fca5a5] font-bold' : 'text-[#604747] dark:text-[#dfc2c0] hover:bg-[#f3e0df] dark:hover:bg-[#2d191b]')}>
                  <span className="w-5 font-mono text-[10px] font-semibold text-[#a47b7b] dark:text-[#b48888]">{chapter.number}</span>
                  <span className="flex-1 text-[13px] font-semibold">{chapter.title}</span>
                  {isExpanded ? <ChevronDown className="size-3.5 text-[#967070] dark:text-[#ab8e8e]" /> : <ChevronRight className="size-3.5 text-[#967070] dark:text-[#ab8e8e]" />}
                </button>
                <div id={`chapter-${chapter.number}`} hidden={!isExpanded} className="ml-8 border-l border-[#e5c6c4] dark:border-[#3d2224] pb-1 pl-3">
                  {chapter.sections.map((section) => {
                    const isActive = section.slug === activeSlug
                    const isNavigating = navigatingSlug === section.slug
                    const href = section.slug ? `/curso/${section.slug}` : '#'
                    return (
                      <a
                        key={section.id}
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        aria-disabled={!section.slug || undefined}
                        tabIndex={section.slug ? undefined : -1}
                        title={!section.slug ? 'Contenido próximamente' : undefined}
                        onClick={(e) => {
                          if (!section.slug) {
                            e.preventDefault()
                            return
                          }
                          if (section.slug !== activeSlug && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                            onNavigate?.(section.slug)
                          }
                          onClose()
                        }}
                        className={cn(
                          'relative flex min-h-11 w-full items-center rounded-r-md px-3 py-2 text-left text-xs leading-relaxed transition-colors',
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
                        <span className="min-w-0 break-words">{section.title}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="border-t border-[#e3caca] dark:border-[#382022] p-4">
          <details className="rounded-lg bg-[#f1dddd] px-3 py-1 text-xs dark:bg-[#2a1416]"><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-[#6a2022] dark:text-[#fca5a5]"><CircleHelp className="size-4" aria-hidden="true" />Guía rápida</summary><div className="mb-2 mt-3 space-y-2 leading-relaxed text-[#795e5e] dark:text-[#cbb0ae]"><p>Para buscar un tema, pulsa Ctrl + K. En Mac, usa Command + K.</p><p>El índice de la página te lleva a cada apartado. Los enlaces al final del tema te llevan a la sección anterior o siguiente.</p><p>Intenta resolver los problemas antes de abrir sus soluciones.</p></div></details>
        </div>
      </aside>
    </>
  )
}

// ─── Table of Contents (page-level) ────────────────────────────────────
function TableOfContents({ headings }: { headings?: { id: string; text: string; level: number }[] }) {
  const items = headings ?? []
  const [active, setActive] = useState('')
  useEffect(() => {
    let frame = 0
    const update = () => {
      const visible = items.filter(item => {
        const element = document.getElementById(item.id)
        return element && element.getBoundingClientRect().top <= 150
      })
      setActive(visible.at(-1)?.id || items[0]?.id || '')
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [headings])

  if (items.length === 0) return null

  return (
    <aside className="hidden w-[190px] shrink-0 xl:block">
      <div className="reading-toc sticky top-[108px] max-h-[calc(100dvh-130px)] overflow-y-auto overscroll-contain border-l border-[#e3caca] dark:border-[#382022] pl-5 pr-3 pb-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#967070] dark:text-[#ab8e8e]">En esta página</p>
        <nav aria-label="Apartados del tema" className="flex flex-col gap-3 text-xs">
          {items.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              aria-current={active === h.id ? 'location' : undefined}
              className={cn(
                active === h.id ? 'font-semibold text-[#7f0303] dark:text-[#f87171]' : 'text-[#765e5e] dark:text-[#cbb0ae] hover:text-[#7f0303] dark:hover:text-[#f87171]',
                h.level >= 2 && 'pl-2', h.level >= 3 && 'pl-4'
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
function ReadingPosition() {
  const [position, setPosition] = useState(0)
  const [showTop, setShowTop] = useState(false)
  useEffect(() => {
    const content = document.getElementById('reading-content')
    if (!content) return
    let frame = 0
    const update = () => {
      const bounds = content.getBoundingClientRect()
      const distance = bounds.height - window.innerHeight + 100
      setPosition(distance > 0 ? Math.min(1, Math.max(0, (100 - bounds.top) / distance)) : 0)
      setShowTop(window.scrollY > 600)
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    observer.observe(content)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [])
  return <>
    <div className="reading-position" aria-hidden="true"><span style={{ transform: `scaleX(${position})` }} /></div>
    {showTop && <a href="#main-content" className="reading-back-top" aria-label="Volver al inicio del tema" title="Volver al inicio del tema"><ArrowUp className="size-5" aria-hidden="true" /></a>}
  </>
}

function ReadingControls({ preferences, onChange, focusMode, onFocusMode }: { preferences: ReadingPreferences; onChange: (next: ReadingPreferences) => void; focusMode: boolean; onFocusMode: () => void }) {
  const settings = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (settings.current?.open && !settings.current.contains(event.target as Node)) settings.current.open = false }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])
  const sliders = [
    { label: 'Tamaño del texto', key: 'fontSize' as const, min: 18, max: 26, step: 1, value: `${preferences.fontSize} px` },
    { label: 'Interlineado', key: 'leading' as const, min: 1.5, max: 2.1, step: .05, value: preferences.leading.toFixed(2).replace('.', ',') },
    { label: 'Ancho de lectura', key: 'width' as const, min: 680, max: 1080, step: 20, value: `${preferences.width} px` },
  ]
  return <div className="reading-controls flex flex-wrap items-center gap-2 font-sans">
    <details ref={settings} className="reading-settings" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
      <summary className="reading-context-control"><SlidersHorizontal className="size-4" aria-hidden="true" /><span>Ajustes</span><ChevronDown className="size-3.5" aria-hidden="true" /></summary>
      <div className="reading-settings-panel" role="group" aria-label="Preferencias de lectura">
        {sliders.map(slider => <label className="reading-slider" key={slider.key}><span><strong>{slider.label}</strong><output>{slider.value}</output></span><input type="range" min={slider.min} max={slider.max} step={slider.step} value={preferences[slider.key]} onChange={event => onChange({ ...preferences, [slider.key]: Number(event.target.value) })} /></label>)}
        <button type="button" className="reading-settings-reset" onClick={() => onChange({ ...defaultReadingPreferences })}>Restaurar valores predeterminados</button>
      </div>
    </details>
    <button type="button" className="reading-context-control" aria-pressed={focusMode} onClick={() => { if (settings.current) settings.current.open = false; onFocusMode() }} title={focusMode ? 'Mostrar nuevamente los paneles de navegación' : 'Ocultar los paneles y concentrarse en el contenido'}>
      {focusMode ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
      <span>{focusMode ? 'Salir' : 'Concentración'}</span>
    </button>
  </div>
}

export interface TextbookLayoutProps {
  activeSlug: string | null
  chapterNumber?: string
  chapterTitle?: string
  sectionTitle?: string
  headings?: { id: string; text: string; level: number }[]
  previous?: { slug: string; title: string } | null
  next?: { slug: string; title: string } | null
  customChapters?: Chapter[]
  variant?: 'course' | 'archive' | 'exam' | 'home' | 'welcome' | 'about'
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
  const [readingPreferences, setReadingPreferences] = useState<ReadingPreferences>(defaultReadingPreferences)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_PREFERENCES_KEY)
      if (saved) setReadingPreferences(parseReadingPreferences(JSON.parse(saved)))
    } catch {}
    setPreferencesLoaded(true)
  }, [])
  useEffect(() => {
    if (!preferencesLoaded) return
    try { localStorage.setItem(READING_PREFERENCES_KEY, JSON.stringify(readingPreferences)) } catch {}
  }, [preferencesLoaded, readingPreferences])
  useEffect(() => {
    if (!focusMode) return
    setSidebarOpen(false)
    const exit = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocusMode(false) }
    document.addEventListener('keydown', exit)
    return () => document.removeEventListener('keydown', exit)
  }, [focusMode])

  useEffect(() => {
    setNavigatingSlug(null)
  }, [activeSlug])

  useEffect(() => {
    if (!navigatingSlug) return
    const timeout = window.setTimeout(() => setNavigatingSlug(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [navigatingSlug])
  useEffect(() => {
    const closeMenuForSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') setSidebarOpen(false)
    }
    document.addEventListener('keydown', closeMenuForSearch)
    return () => document.removeEventListener('keydown', closeMenuForSearch)
  }, [])
  const courseChapters = customChapters ?? chapters
  const currentChapter = courseChapters.find(chapter => chapter.sections.some(section => section.slug === activeSlug))
  const available = currentChapter?.sections.filter(section => section.slug) ?? []
  const sectionIndex = available.findIndex(section => section.slug === activeSlug)

  return (
    <div className={cn('textbook-shell min-h-screen bg-[#fbf7f4] dark:bg-[#140b0c] text-[#3b2022] dark:text-[#f3e6e4] transition-colors duration-200', variant === 'course' && 'reading-preferences-active', focusMode && 'reading-focus-mode')} style={variant === 'course' ? readingPreferenceStyle(readingPreferences) : undefined}>
      <a href="#main-content" className="skip-to-content">Saltar al contenido</a>
      <Header menuOpen={sidebarOpen} onMenu={() => setSidebarOpen(true)} onSearch={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
      }} />
      <CourseSearch courseChapters={courseChapters} />
      {variant === 'course' && activeSlug && <ReadingPosition key={activeSlug} />}
      <div className="mx-auto flex max-w-[1600px]">
        {!focusMode && <Sidebar
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          activeSlug={activeSlug} 
          customChapters={customChapters}
          navigatingSlug={navigatingSlug}
          onNavigate={setNavigatingSlug}
          examsActive={variant === 'archive' || variant === 'exam'}
          homeActive={variant === 'home'}
          welcomeActive={variant === 'welcome'}
          aboutActive={variant === 'about'}
        />}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <div className="flex justify-center">
            {/* ─── Content area ─── */}
            <article className={cn('textbook-reading-column mx-auto w-full min-w-0 px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-10', variant === 'archive' ? 'max-w-[1100px]' : 'max-w-[840px]')}>
              {/* Breadcrumb */}
              {chapterNumber && chapterTitle && (
                <div className="chapter-context mb-7">
                  <div className="chapter-context-title"><span className="chapter-context-number">{chapterNumber}</span><div><p className="chapter-context-label">Capítulo</p><p className="chapter-context-name">{chapterTitle}</p></div></div>
                  <div className="chapter-context-actions">{variant === 'course' && <ReadingControls preferences={readingPreferences} onChange={setReadingPreferences} focusMode={focusMode} onFocusMode={() => setFocusMode(value => !value)} />}{available.length > 0 && <details className="chapter-switcher" onBlur={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }} onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
                    <summary><span>Secciones</span>{sectionIndex >= 0 && <span className="chapter-switcher-count" title={sectionTitle}>{sectionIndex + 1} / {available.length}</span>}<ChevronDown className="size-4" aria-hidden="true" /></summary>
                    <nav aria-label="Secciones de este capítulo">{available.map(section => <a key={section.id} href={`/curso/${section.slug}`} aria-current={section.slug === activeSlug ? 'page' : undefined} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}><span>{section.id}</span><span>{section.title}</span></a>)}</nav>
                  </details>}</div>
                </div>
              )}

              {headings && headings.length > 0 && <details className="reading-mobile-index mb-7 xl:hidden"><summary>En esta página</summary><nav aria-label="Apartados del tema">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>{heading.text}</a>)}</nav></details>}
              {/* MDX content slot */}
              <div id="reading-content" className={variant === 'course' ? 'mdx-content' : undefined}>
                {children}
              </div>

              {/* Prev / Next navigation */}
              {(previous || next) && (
                <nav aria-label="Continuar estudiando" className="reading-pagination mt-12 grid gap-3 border-t border-[#dedbd3] dark:border-[#382022] pt-5 sm:grid-cols-2">
                  {previous?.slug ? (
                    <a 
                      href={`/curso/${previous.slug}`} 
                      onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) setNavigatingSlug(previous.slug) }}
                      className="group rounded-lg border border-[#e3caca] p-4 text-left hover:bg-[#f8eaea] dark:border-[#422527] dark:hover:bg-[#2a1416] transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#967070] dark:text-[#ab8e8e] flex items-center gap-1">
                        {navigatingSlug === previous.slug ? (
                          <span className="inline-block animate-spin size-2.5 border-2 border-[#8B0000] dark:border-[#fca5a5] border-t-transparent rounded-full" />
                        ) : <ArrowLeft className="size-3.5" aria-hidden="true" />} Anterior
                      </p>
                      <p className="mt-1 font-sans text-sm font-semibold text-[#604747] dark:text-[#dfc2c0] group-hover:text-[#7f0303] dark:group-hover:text-[#f87171]">{previous.title}</p>
                    </a>
                  ) : <div />}
                  {next?.slug ? (
                    <a 
                      href={`/curso/${next.slug}`} 
                      onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) setNavigatingSlug(next.slug) }}
                      className="group rounded-lg border border-[#e3caca] p-4 text-right hover:bg-[#f8eaea] dark:border-[#422527] dark:hover:bg-[#2a1416] transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[#967070] dark:text-[#ab8e8e] flex items-center justify-end gap-1">
                        Siguiente {navigatingSlug === next.slug ? (
                          <span className="inline-block animate-spin size-2.5 border-2 border-[#8B0000] dark:border-[#fca5a5] border-t-transparent rounded-full" />
                        ) : <ArrowRight className="size-3.5" aria-hidden="true" />}
                      </p>
                      <p className="mt-1 font-sans text-sm font-semibold text-[#604747] dark:text-[#dfc2c0] group-hover:text-[#7f0303] dark:group-hover:text-[#f87171]">{next.title}</p>
                    </a>
                  ) : <div />}
                </nav>
              )}
            </article>

            {!focusMode && <TableOfContents headings={headings} />}
          </div>
        </main>
      </div>
    </div>
  )
}
