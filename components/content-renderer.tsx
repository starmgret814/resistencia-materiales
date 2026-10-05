import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'
import { Image, ImageGrid, Definition, Formula, Example, Problem, Solution, Summary } from '@/components/mdx-components'
import type { CourseDocument } from '@/lib/content-schema'

const allowedDirectives = new Set(['definition', 'note', 'example', 'problem', 'solution', 'quiz', 'summary', 'formula', 'imagegrid'])

function attribute(source: string, name: string): string {
  return source.match(new RegExp(`${name}=["']([^"']*)["']`))?.[1]
    || source.match(new RegExp(`${name}=\\{([^}]*)\\}`))?.[1]
    || ''
}

function normalizeLegacyMdx(markdown: string): string {
  // Text copied from chats/editors commonly escapes Markdown punctuation and inserts space entities.
  let normalized = markdown
    .replace(/&#x20;|&nbsp;/gi, ' ')
    .replace(/\\([#*<>_])/g, '$1')

  normalized = normalized.replace(/<(Solution)\s*>\s*([\s\S]*?)\s*<\/\1>/gi, (_match, _tag, body) => `:::solution\n${body.trim()}\n:::`)

  normalized = normalized.replace(/<Image\b([\s\S]*?)\/>/gi, (_match, attrs) => {
    const src = attribute(attrs, 'src')
    const alt = attribute(attrs, 'alt') || 'Imagen del curso'
    const caption = attribute(attrs, 'caption').replace(/"/g, "'")
    return src ? `![${alt}](${src}${caption ? ` "${caption}"` : ''})` : ''
  })

  normalized = normalized.replace(/<ImageGrid([^>]*)>\s*([\s\S]*?)\s*<\/ImageGrid>/gi, (_match, attrs, body) => {
    const columns = attribute(attrs, 'columns') || '2'
    return `::::imagegrid{columns="${columns}"}\n${body.trim()}\n::::`
  })

  normalized = normalized.replace(/<Quiz([^>]*)>\s*([\s\S]*?)\s*<\/Quiz>/gi, (_match, attrs, body) => {
    const question = attribute(attrs, 'question') || 'Pregunta'
    return `:::quiz{question="${question}"}\n${body.trim()}\n:::`
  })

  for (const tag of ['Definition', 'Note', 'Example', 'Problem', 'Summary']) {
    const pattern = new RegExp(`<(${tag})([^>]*)>\\s*([\\s\\S]*?)\\s*<\\/${tag}>`, 'gi')
    normalized = normalized.replace(pattern, (_match, _name, attrs, body) => {
      const kind = tag.toLowerCase()
      const title = attribute(attrs, 'title')
      const number = attribute(attrs, 'number')
      const displayTitle = number ? `${tag} ${number}${title ? `: ${title}` : ''}` : title
      return `::::${kind}${displayTitle ? `{title="${displayTitle}"}` : ''}\n${body.trim()}\n::::`
    })
  }

  normalized = normalized.replace(/<Formula([^>]*)>\s*([\s\S]*?)\s*<\/Formula>/gi, (_match, attrs, body) => {
    const label = attribute(attrs, 'label')
    const latex = body.trim().replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '')
    return `:::formula${label ? `{title="${label}"}` : ''}\n$$\n${latex}\n$$\n:::`
  })

  return normalized
}

function remarkCourseDirectives() {
  return (tree: unknown) => {
    visit(tree as never, ['containerDirective'], (node: any) => {
      if (!allowedDirectives.has(node.name)) return
      node.data ||= {}
      node.data.hName = 'div'
      node.data.hProperties = {
        'data-course-kind': node.name,
        'data-course-title': node.attributes?.title || node.label || '',
        'data-course-question': node.attributes?.question || '',
        'data-course-columns': node.attributes?.columns || '',
      }
    })
  }
}

function CourseDirective({ kind, title, question, columns, children }: { kind: string; title?: string; question?: string; columns?: string; children: ReactNode }) {
  if (kind === 'imagegrid') {
    return <ImageGrid columns={columns === '3' ? 3 : columns === '4' ? 4 : 2}>{children}</ImageGrid>
  }
  if (kind === 'formula') {
    return <Formula label={title}>{children}</Formula>
  }
  if (kind === 'solution') {
    return <Solution>{children}</Solution>
  }
  if (kind === 'quiz') {
    return <section className="my-8 rounded-lg border border-[#e5c6c4] bg-[#f7e9e8] p-5"><p className="font-semibold text-[#4b1719]">{question || title || 'Pregunta'}</p><details className="group mt-3"><summary className="cursor-pointer text-xs font-semibold text-[#7f0303] underline underline-offset-4">Ver respuesta</summary><div className="mt-3 border-t border-[#e5c6c4] pt-3">{children}</div></details></section>
  }
  if (kind === 'example') {
    const number = title?.match(/\d+/)?.[0]
    const cleanTitle = title?.replace(/Ejemplo \d+:?/, '').trim()
    return <Example title={cleanTitle || undefined} number={number}>{children}</Example>
  }
  if (kind === 'problem') {
    const number = title?.match(/\d+/)?.[0]
    const cleanTitle = title?.replace(/Problema \d+:?/, '').trim()
    return <Problem title={cleanTitle || undefined} number={number}>{children}</Problem>
  }
  if (kind === 'summary') {
    return <Summary title={title}>{children}</Summary>
  }
  
  // definition or note fallback
  return <Definition title={title}>{children}</Definition>
}

function DirectiveDiv(props: ComponentPropsWithoutRef<'div'> & { node?: unknown }) {
  const { node: _node, children, ...rest } = props
  const kind = String(rest['data-course-kind' as keyof typeof rest] || '')
  if (!kind) return <div {...rest}>{children}</div>
  const title = String(rest['data-course-title' as keyof typeof rest] || '')
  const question = String(rest['data-course-question' as keyof typeof rest] || '')
  const columns = String(rest['data-course-columns' as keyof typeof rest] || '')
  return <CourseDirective kind={kind} title={title} question={question} columns={columns}>{children}</CourseDirective>
}

export function ContentRenderer({ document }: { document: CourseDocument }) {
  return <article className="mdx-content">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkCourseDirectives]}
      rehypePlugins={[rehypeKatex]}
      components={{
        img: ({ src, alt, title }: any) => <Image src={src || ''} alt={alt || ''} caption={title || undefined} />,
        div: DirectiveDiv,
      }}
    >
      {normalizeLegacyMdx(document.contentMarkdown)}
    </ReactMarkdown>
  </article>
}

export default memo(ContentRenderer)
