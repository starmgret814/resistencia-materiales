'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useContentSlug } from '@/lib/content-context'

export function Definition({ children, title = 'Definición' }: { children: ReactNode; title?: string }) {
  return <aside className="my-7 rounded-r-lg border border-y-0 border-r-0 border-l-4 border-l-[#7f0303] dark:border-l-[#f87171] bg-[#f8eaea] dark:bg-[#281517] px-5 py-4"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#765e5e] dark:text-[#fca5a5]">{title}</p><div className="text-sm leading-7 text-[#4d3838] dark:text-[#ead4d2]">{children}</div></aside>
}

export function Formula({ children, label }: { children: ReactNode; label?: string }) {
  return <div className="my-7 px-5 py-6 text-center"><div className="font-serif text-3xl italic tracking-wide text-[#4b1719] dark:text-[#fca5a5] sm:text-4xl">{children}</div>{label && <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[#9a7777] dark:text-[#bca4a3]">{label}</p>}</div>
}

export function Example({ children, title, number }: { children: ReactNode; title?: string; number?: number | string }) {
  const displayTitle = number ? `Ejemplo ${number}${title ? `: ${title}` : ''}` : (title || 'Ejemplo resuelto')
  return <section className="my-8 rounded-r-lg border-y border-r border-l-4 border-y-[#e3caca] dark:border-y-[#3a2022] border-r-[#e3caca] dark:border-r-[#3a2022] border-l-[#8f2525] dark:border-l-[#f87171] bg-[#fdfaf9] dark:bg-[#1c1012] p-5 sm:p-6 shadow-sm"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f2525] dark:text-[#fca5a5]">{displayTitle}</p><div className="text-base leading-relaxed text-[#604747] dark:text-[#ead4d2]">{children}</div></section>
}

export function Problem({ children, title, number }: { children: ReactNode; title?: string; number?: number | string }) {
  const displayTitle = number ? `Problema ${number}${title ? `: ${title}` : ''}` : (title || 'Problema propuesto')
  return <section className="my-8 rounded-lg border-2 border-dashed border-[#d9aaaa] dark:border-[#4d282b] bg-[#fcf7f5] dark:bg-[#1a0e10] p-5 sm:p-6"><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6262] dark:text-[#fca5a5]">{displayTitle}</p><div className="text-base leading-relaxed text-[#604747] dark:text-[#ead4d2]">{children}</div></section>
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
      <div className="mt-4 pl-4 border-l-2 border-[#e3caca] dark:border-[#382022] text-base leading-relaxed text-[#604747] dark:text-[#ead4d2]">
        {children}
      </div>
    </details>
  )
}

export function Summary({ children, title = 'Resumen' }: { children: ReactNode; title?: string }) {
  return <section className="my-8 rounded-lg border border-[#dec4c1] dark:border-[#422225] bg-[#f9ebe9] dark:bg-[#251214] p-5 sm:p-6"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7f0303] dark:text-[#f87171]">{title}</p><div className="text-sm leading-7 text-[#4d3838] dark:text-[#ead4d2]">{children}</div></section>
}

export function Image({ 
  src, 
  alt, 
  caption, 
  slug: propSlug,
  size = 'full',
  align = 'center',
  width,
  height,
}: { 
  src: string; 
  alt: string; 
  caption?: string; 
  slug?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  height?: string | number;
}) {
  const contextSlug = useContentSlug()
  const slug = propSlug || contextSlug

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
      className={cn("my-8 w-full", alignClasses[align], !width && sizeClasses[size])}
      style={maxWidthStyle}
    >
      <img 
        src={resolvedSrc} 
        alt={alt} 
        className="h-auto w-full rounded-lg border border-[#e5cfcd]" 
        style={imgStyle}
        loading="lazy" 
      />
      {caption && <figcaption className="mt-2 text-center text-xs text-[#765e5e] dark:text-[#bca4a3]">{caption}</figcaption>}
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

export const mdxComponents = { Definition, Formula, Example, Problem, Solution, Summary, Image, ImageGrid }

export default mdxComponents
