import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { createContext, memo, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkNumberHeadings from '@/lib/remark-number-headings'
import { normalizeLegacyMdx } from '@/lib/course-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'
import { Image, ImageGrid, Definition, Formula, Example, Problem, Solution, Summary, Table } from '@/components/mdx-components'
import type { CourseDocument } from '@/lib/content-schema'

type TableOptions = { align?: 'left' | 'center' | 'right'; width?: string; columnWidths?: string[] }
const TableContext = createContext<TableOptions>({})

function tableLength(value: string): string | undefined {
  const clean = value.trim()
  return /^\d+(?:\.\d+)?(?:px|%|rem|em|vw)?$/.test(clean) ? (/^\d+(?:\.\d+)?$/.test(clean) ? `${clean}px` : clean) : undefined
}

function MarkdownTable({ children }: { children?: ReactNode }) {
  const { align, width, columnWidths } = useContext(TableContext)
  return <div className="my-6 max-w-full overflow-x-auto rounded-lg border border-[#e3caca] dark:border-[#382022] bg-white dark:bg-[#1a0f10] shadow-sm" style={{ width: width || '100%', marginInline: 'auto' }}>
    <table style={{ width: '100%', textAlign: align || 'left', tableLayout: columnWidths?.length ? 'fixed' : undefined }}>
      {columnWidths?.length ? <colgroup>{columnWidths.map((value, index) => <col key={index} style={{ width: tableLength(value) }} />)}</colgroup> : null}
      {children}
    </table>
  </div>
}

function MarkdownCell({ header, children, style }: ComponentPropsWithoutRef<'td'> & { header?: boolean }) {
  const { align } = useContext(TableContext)
  const Tag = header ? 'th' : 'td'
  return <Tag style={{ ...style, textAlign: style?.textAlign || align || 'left', overflowWrap: 'anywhere' }}>{children}</Tag>
}

const allowedDirectives = new Set(['definition', 'note', 'example', 'problem', 'solution', 'quiz', 'summary', 'formula', 'imagegrid', 'image', 'table', 'tablegrid'])


function remarkCourseDirectives({ chapterNumber, problemOffset = 0 }: { chapterNumber?: string; problemOffset?: number } = {}) {
  return (tree: unknown) => {
    let problemIndex = problemOffset
    visit(tree as never, ['containerDirective', 'leafDirective'], (node: any) => {
      if (!allowedDirectives.has(node.name)) return
      let title = node.attributes?.title || node.label || ''
      let number = node.attributes?.number || ''
      if (node.name === 'problem' || node.name === 'example') {
        const legacyPrefix = /^(?:Problem|Problema|Example|Ejemplo)\s+(\d+(?:\.\d+)*)\s*:?\s*/i
        while (legacyPrefix.test(title)) {
          const match = title.match(legacyPrefix)
          number ||= match[1]
          title = title.replace(legacyPrefix, '')
        }
        if (node.name === 'problem') {
          problemIndex++
          number = chapterNumber ? `${Number(chapterNumber)}.${problemIndex}` : number || String(problemIndex)
        }
      }
      node.data ||= {}
      node.data.hName = 'div'
      node.data.hProperties = {
        'data-course-kind': node.name,
        'data-course-title': title,
        'data-course-number': number,
        'data-course-image': node.attributes?.image || '',
        'data-course-image-alt': node.attributes?.imageAlt || '',
        'data-course-image-caption': node.attributes?.imageCaption || '',
        'data-course-image-width': node.attributes?.imageWidth || '',
        'data-course-image-position': node.attributes?.imagePosition || '',
        'data-course-question': node.attributes?.question || '',
        'data-course-column-widths': node.attributes?.columnWidths || '',
        'data-course-columns': node.attributes?.columns || '',
        'data-course-src': node.attributes?.src || '',
        'data-course-alt': node.attributes?.alt || '',
        'data-course-caption': node.attributes?.caption || '',
        'data-course-width': node.attributes?.width || '',
        'data-course-height': node.attributes?.height || '',
        'data-course-size': node.attributes?.size || '',
        'data-course-position': node.attributes?.position || '',
        'data-course-align': node.attributes?.align || '',
      }
    })
  }
}

function CourseDirective({
  kind,
  title,
  number,
  image,
  imageAlt,
  imageCaption,
  imageWidth,
  imagePosition,
  question,
  columns,
  columnWidths,
  position,
  src,
  alt,
  caption,
  width,
  height,
  size,
  align,
  children
}: {
  kind: string;
  title?: string;
  number?: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  imageWidth?: string;
  imagePosition?: string;
  question?: string;
  columns?: string;
  columnWidths?: string;
  position?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: string;
  height?: string;
  size?: string;
  align?: string;
  children: ReactNode
}) {
  if (kind === 'image') {
    return (
      <Image
        src={src || ''}
        alt={alt || 'Imagen del curso'}
        caption={caption || title || undefined}
        width={width || undefined}
        height={height || undefined}
        size={(size as any) || undefined}
        align={(align as any) || undefined}
      />
    )
  }
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
    return <Example title={title || undefined} number={number}>{children}</Example>
  }
  if (kind === 'problem') {
    return <Problem title={title || undefined} number={number} image={image} imageAlt={imageAlt} imageCaption={imageCaption} imageWidth={imageWidth} imagePosition={imagePosition === 'left' ? 'left' : 'right'}>{children}</Problem>
  }
  if (kind === 'summary') {
    return <Summary title={title}>{children}</Summary>
  }
  if (kind === 'tablegrid') {
    const grid = columns === '3' ? 'md:grid-cols-3' : columns === '4' ? 'md:grid-cols-4' : 'md:grid-cols-2'
    return <div className={`course-table-grid my-7 grid grid-cols-1 items-start gap-6 ${grid}`}>{children}</div>
  }
  if (kind === 'table') {
    const options: TableOptions = {
      align: align === 'left' || align === 'center' || align === 'right' ? align : undefined,

      columnWidths: columnWidths ? columnWidths.split(',').map(value => value.trim()) : undefined,
    }
    return <TableContext.Provider value={options}>
      <div className="course-table-block min-w-0 max-w-full" style={{ width: width ? tableLength(width) : '100%', marginLeft: position === 'left' ? 0 : 'auto', marginRight: position === 'right' ? 0 : 'auto' }}>
        <Table title={title}>{children}</Table>
      </div>
    </TableContext.Provider>
  }
  
  // definition or note fallback
  return <Definition title={title}>{children}</Definition>
}

function DirectiveDiv(props: ComponentPropsWithoutRef<'div'> & { node?: unknown }) {
  const { node: _node, children, ...rest } = props
  const kind = String(rest['data-course-kind' as keyof typeof rest] || '')
  if (!kind) return <div {...rest}>{children}</div>
  const title = String(rest['data-course-title' as keyof typeof rest] || '')
  const number = String(rest['data-course-number' as keyof typeof rest] || '')
  const question = String(rest['data-course-question' as keyof typeof rest] || '')
  const position = String(rest['data-course-position' as keyof typeof rest] || '')
  const columnWidths = String(rest['data-course-column-widths' as keyof typeof rest] || '')
  const columns = String(rest['data-course-columns' as keyof typeof rest] || '')
  const src = String(rest['data-course-src' as keyof typeof rest] || '')
  const alt = String(rest['data-course-alt' as keyof typeof rest] || '')
  const caption = String(rest['data-course-caption' as keyof typeof rest] || '')
  const width = String(rest['data-course-width' as keyof typeof rest] || '')
  const height = String(rest['data-course-height' as keyof typeof rest] || '')
  const size = String(rest['data-course-size' as keyof typeof rest] || '')
  const align = String(rest['data-course-align' as keyof typeof rest] || '')
  return (
    <CourseDirective
      kind={kind}
      title={title}
      number={number}
      image={String(rest['data-course-image' as keyof typeof rest] || '')}
      imageAlt={String(rest['data-course-image-alt' as keyof typeof rest] || '')}
      imageCaption={String(rest['data-course-image-caption' as keyof typeof rest] || '')}
      imageWidth={String(rest['data-course-image-width' as keyof typeof rest] || '')}
      imagePosition={String(rest['data-course-image-position' as keyof typeof rest] || '')}
      question={question}
      columns={columns}
      columnWidths={columnWidths}
      position={position}
      src={src}
      alt={alt}
      caption={caption}
      width={width}
      height={height}
      size={size}
      align={align}
    >
      {children}
    </CourseDirective>
  )
}

export function ContentRenderer({ document, headingPrefix, problemOffset = 0 }: { document: CourseDocument; headingPrefix?: string; problemOffset?: number }) {
  return <article className="mdx-content">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, [remarkCourseDirectives, { chapterNumber: headingPrefix?.split('.')[0], problemOffset }], [remarkNumberHeadings, { prefix: headingPrefix }]]}
      rehypePlugins={[rehypeKatex]}
      components={{
        img: ({ src, alt, title }: any) => <Image src={src || ''} alt={alt || ''} caption={title || undefined} />,
        div: DirectiveDiv,
        table: MarkdownTable,
        thead: ({ children }: any) => (
          <thead className="border-b-2 border-[#e3caca] dark:border-[#382022] bg-[#fbf2f0] dark:bg-[#251316]">
            {children}
          </thead>
        ),
        tbody: ({ children }: any) => (
          <tbody className="divide-y divide-[#f0dedd] dark:divide-[#2d181a]">
            {children}
          </tbody>
        ),
        tr: ({ children }: any) => (
          <tr className="transition-colors hover:bg-[#faf4f3] dark:hover:bg-[#201012]">
            {children}
          </tr>
        ),
        th: (props) => <MarkdownCell {...props} header />,
        td: MarkdownCell,
      }}
    >
      {normalizeLegacyMdx(document.contentMarkdown)}
    </ReactMarkdown>
  </article>
}


export default memo(ContentRenderer)
