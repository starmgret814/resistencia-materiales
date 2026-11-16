'use client'

import type { ReactNode, CSSProperties, FC } from 'react'
import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useContentSlug } from '@/lib/content-context'

export function Definition({ children, title = 'Definición' }: { children: ReactNode; title?: string }) {
  return <aside className="my-7 rounded-r-lg border border-y-0 border-r-0 border-l-4 border-l-[#7f0303] dark:border-l-[#f87171] bg-[#f8eaea] dark:bg-[#281517] px-5 py-4"><p className="academic-label mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#765e5e] dark:text-[#fca5a5]">{title}</p><div className="academic-body text-[#4d3838] dark:text-[#ead4d2]">{children}</div></aside>
}

export function Formula({ children, label, number, id, boxed = false, bold = false }: { children: ReactNode; label?: string; number?: string; id?: string; boxed?: boolean; bold?: boolean }) {
  const anchor = id || (number ? `eq-${number}` : undefined)
  return <figure id={anchor} className="formula-block my-5 px-4 py-0">
    <div className={cn('formula-row', number && 'formula-row-numbered')}>
      {number && <span aria-hidden="true" />}
      <div className={cn('formula-equation', boxed && 'formula-equation-boxed', bold && 'formula-equation-bold')}>{children}</div>
      {number && <span className="formula-number"><a href={`#${anchor}`} aria-label={`Enlace a la ecuación ${number}`}>({number})</a></span>}
    </div>
    {label && <figcaption className="formula-label mt-3">{label}</figcaption>}
  </figure>
}

export function Term({ children, definition }: { children: ReactNode; definition: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const root = useRef<HTMLSpanElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const descriptionId = useId()
  const show = () => { clearTimeout(hideTimer.current); if (!open) { setPosition(null); setOpen(true) } }
  const contains = (target: Node | null) => root.current?.contains(target) || tooltip.current?.contains(target)
  const hide = () => { hideTimer.current = setTimeout(() => { if (!contains(document.activeElement)) setOpen(false) }, 180) }
  useEffect(() => () => clearTimeout(hideTimer.current), [])
  useEffect(() => {
    if (!open) return
    const place = () => {
      if (!trigger.current || !tooltip.current) return
      const target = trigger.current.getBoundingClientRect()
      const box = tooltip.current.getBoundingClientRect()
      const left = Math.max(16, Math.min(target.left + target.width / 2 - box.width / 2, window.innerWidth - box.width - 16))
      const below = target.bottom + 8
      const top = below + box.height <= window.innerHeight - 16 ? below : Math.max(16, target.top - box.height - 8)
      setPosition({ left, top })
    }
    const outside = (event: PointerEvent) => { if (!contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    place()
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open, definition])
  return <span ref={root} className="course-term" onMouseEnter={show} onMouseLeave={hide} onBlur={event => { if (!contains(event.relatedTarget as Node)) setOpen(false) }}>
    <button ref={trigger} type="button" className="course-term-trigger" aria-expanded={open} aria-describedby={open ? descriptionId : undefined} onFocus={show} onClick={show}>{children}</button>
    {open && createPortal(<span ref={tooltip} id={descriptionId} role="tooltip" className="course-term-tooltip" onMouseEnter={show} onMouseLeave={hide} style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden' }}>{definition}</span>, document.body)}
  </span>
}

export function Example({ children, title, number }: { children: ReactNode; title?: string; number?: number | string }) {
  const displayTitle = number ? `Ejemplo ${number}${title ? `: ${title}` : ''}` : (title || 'Ejemplo resuelto')
  return <section className="my-8 rounded-r-lg border-y border-r border-l-4 border-y-[#e3caca] dark:border-y-[#3a2022] border-r-[#e3caca] dark:border-r-[#3a2022] border-l-[#8f2525] dark:border-l-[#f87171] bg-[#fdfaf9] dark:bg-[#1c1012] p-5 sm:p-6 shadow-sm"><p className="academic-label mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f2525] dark:text-[#fca5a5]">{displayTitle}</p><div className="academic-body text-[#604747] dark:text-[#ead4d2]">{children}</div></section>
}

export function Problem({ children, title, number, image, imageAlt, imageCaption, imageNumber, imageWidth = '38%', imagePosition = 'right', imageLayout = 'auto' }: { children: ReactNode; title?: string; number?: number | string; image?: string; imageAlt?: string; imageCaption?: string; imageNumber?: string; imageWidth?: string; imagePosition?: 'left' | 'right'; imageLayout?: 'auto' | 'wrap' | 'stacked' }) {
  const displayTitle = number ? `Problema ${number}${title ? `: ${title}` : ''}` : (title || 'Problema propuesto')
  const parts = Children.toArray(children)
  const isSolution = (child: ReactNode) => isValidElement<{ 'data-course-kind'?: string }>(child) && (child.type === Solution || child.props['data-course-kind'] === 'solution')
  const width = /^(?:\d+(?:\.\d+)?)(?:px|%|rem|em)$/.test(imageWidth) ? imageWidth : '38%'
  const wideImage = width.endsWith('%') && Number.parseFloat(width) >= 50
  const stacked = imageLayout === 'stacked' || (imageLayout === 'auto' && wideImage)
  return <section className="my-8 rounded-lg border-2 border-dashed border-[#d9aaaa] dark:border-[#4d282b] bg-[#fcf7f5] dark:bg-[#1a0e10] p-5 sm:p-6"><p className="academic-label mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6262] dark:text-[#fca5a5]">{displayTitle}</p><div className="problem-content academic-body text-[#604747] dark:text-[#ead4d2]">
    {image ? <>
      <div className={cn('problem-illustrated', `problem-image-${imagePosition}`, stacked ? 'problem-layout-stacked' : 'problem-layout-wrap')} style={{ '--problem-image-width': width } as CSSProperties}>
        <div className="problem-figure min-w-0 [&>figure]:my-0"><Image src={image} alt={imageAlt || title || 'Figura del problema'} caption={imageCaption} number={imageNumber} /></div>
        <div className="problem-statement min-w-0">{parts.filter(child => !isSolution(child))}</div>
      </div>
      {parts.filter(isSolution)}
    </> : children}
  </div></section>
}

export function Solution({ children }: { children?: ReactNode }) {
  return (
    <details className="mt-5 group">
      <summary className="cursor-pointer list-none border-t border-[#e3caca] dark:border-[#382022] pt-4 font-semibold text-[#8f2525] dark:text-[#f87171] text-[11px] uppercase tracking-[0.16em] hover:text-[#4b1719] dark:hover:text-[#fca5a5] transition-colors">
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3 w-3 transition-transform group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Mostrar Solución
        </span>
      </summary>
      <div className="mt-4 pl-4 border-l-2 border-[#e3caca] dark:border-[#382022] academic-body text-[#604747] dark:text-[#ead4d2]">
        {children}
      </div>
    </details>
  )
}

export function Summary({ children, title = 'Resumen' }: { children: ReactNode; title?: string }) {
  return <section className="my-8 rounded-lg border border-[#dec4c1] dark:border-[#422225] bg-[#f9ebe9] dark:bg-[#251214] p-5 sm:p-6"><p className="academic-label mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7f0303] dark:text-[#f87171]">{title}</p><div className="academic-body text-[#4d3838] dark:text-[#ead4d2]">{children}</div></section>
}

export function Image({ 
  src, 
  alt, 
  caption, 
  number,
  id,
  slug: propSlug,
  size = 'full',
  align = 'center',
  width,
  height,
}: { 
  src: string; 
  alt: string; 
  caption?: string; 
  number?: string;
  id?: string;
  slug?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  height?: string | number;
}) {
  const contextSlug = useContentSlug()
  const slug = propSlug || contextSlug
  const anchor = id || (number ? `fig-${number}` : undefined)

  // Resolve relative paths (./image.png or image.png) to the content API
  let resolvedSrc = src
  if (slug && !src.startsWith('/') && !src.startsWith('http')) {
    // Strip leading ./ if present
    const filename = src.replace(/^\.\//, '')
    resolvedSrc = `/api/imagen/${slug}/${filename}`
  }

  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'w-full',
  }

  const alignClasses = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }

  const maxWidthStyle: React.CSSProperties = {
    ...(width ? { maxWidth: typeof width === 'number' ? `${width}px` : width } : {}),
  }
  const imgStyle: React.CSSProperties = {
    ...(height ? { maxHeight: typeof height === 'number' ? `${height}px` : height, objectFit: 'contain' as const } : {}),
  }

  return (
    <figure
      id={anchor}
      className={cn("course-figure my-8 w-full", alignClasses[align], !width && sizeClasses[size])}
      style={maxWidthStyle}
    >
      <img 
        src={resolvedSrc} 
        alt={alt} 
        className="h-auto w-full rounded-lg border border-[#e5cfcd]" 
        style={imgStyle}
        loading="lazy" 
      />
      {(caption || number) && <figcaption className="mt-2 text-center text-xs text-[#765e5e] dark:text-[#bca4a3]">{number && <><a className="course-reference" href={`#${anchor}`}>Figura {number}</a>{caption ? '. ' : ''}</>}{caption}</figcaption>}
    </figure>
  )
}

export function ImageGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={cn("my-8 grid gap-4 sm:gap-6 items-start [&>figure]:my-0", gridClasses[columns] || gridClasses[2])}>
      {children}
    </div>
  )
}

export interface TableProps {
  children: ReactNode;
  title?: string;
  caption?: string;
  /** Alignment for cell content: 'left', 'center', or 'right'. Default is 'center'. */
  align?: 'left' | 'center' | 'right';
  /** Optional widths for each column, e.g., ['100px', '2fr', 150]. */
  columnWidths?: (string | number)[];
}

export const Table: FC<TableProps> = ({ children, title, caption, align = 'center', columnWidths }) => {
  const displayTitle = title || caption;
  // Build CSS variable style for column widths
  const widthStyle: CSSProperties = {};
  if (columnWidths) {
    columnWidths.forEach((w, i) => {
      const value = typeof w === 'number' ? `${w}px` : w;
      // CSS variable --col-width-0, --col-width-1, ...
      // @ts-ignore
      widthStyle[`--col-width-${i}`] = value;
    });
  }
  return (
    <div className="my-7">
      {displayTitle && (
        <p className="academic-label mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#7f0303] dark:text-[#fca5a5]">
          {displayTitle}
        </p>
      )}
      <div style={{ ...widthStyle, textAlign: align }}>
        {children}
      </div>
    </div>
  );
};

export const mdxComponents = { Definition, Formula, Term, Example, Problem, Solution, Summary, Image, ImageGrid, Table };

export default mdxComponents;
