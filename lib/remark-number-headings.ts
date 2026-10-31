interface MarkdownNode {
  type: string
  value?: string
  alt?: string
  children?: MarkdownNode[]
  data?: { hProperties?: Record<string, unknown> }
}

interface Heading extends MarkdownNode {
  depth: number
  children: MarkdownNode[]
}

export interface NumberedHeading {
  level: number
  id: string
  text: string
}

interface Options {
  /** Course section number, e.g. 5.2. Omit for pages outside the course. */
  prefix?: string
  onHeadings?: (headings: NumberedHeading[]) => void
}

function headingText(node: MarkdownNode): string {
  return node.children?.map(headingText).join('') || node.value || node.alt || ''
}

function walk(node: MarkdownNode, type: string, callback: (node: MarkdownNode) => void) {
  if (node.type === type) callback(node)
  node.children?.forEach(child => walk(child, type, callback))
}

/** Number headings relative to their course section, without changing saved Markdown. */
export default function remarkNumberHeadings({ prefix, onHeadings }: Options = {}) {
  return (tree: unknown) => {
    const base = prefix && /^\d+\.\d+$/.test(prefix) ? prefix.split('.').map(Number).join('.') : undefined
    const counters = [0, 0, 0, 0, 0]
    const headings: NumberedHeading[] = []
    const ids = new Map<string, number>()

    walk(tree as MarkdownNode, 'heading', (entry) => {
      const node = entry as Heading
      // Replace written heading numbers while retaining bold, links and formulas.
      // A bare integer ("3 dimensiones") remains part of the actual title.
      if (base) {
        let first = true
        walk(node, 'text', (text) => {
          if (!first) return
          first = false
          text.value = (text.value || '').replace(/^\s*(?:\d+(?:\.\d+)+\.?|\d+\.)(?:\s+|$)/, '')
        })
        let number = base
        if (node.depth === 1) counters.fill(0)
        else {
          const index = node.depth - 2
          for (let parent = 0; parent < index; parent++) {
            if (!counters[parent]) counters[parent] = 1
          }
          counters[index]++
          counters.fill(0, index + 1)
          number += `.${counters.slice(0, index + 1).join('.')}`
        }
        node.children.unshift({ type: 'text', value: `${number} ` })
      }

      const text = headingText(node).trim()
      const slug = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'titulo'
      const occurrence = ids.get(slug) || 0
      ids.set(slug, occurrence + 1)
      const id = occurrence ? `${slug}-${occurrence}` : slug
      node.data ||= {}
      node.data.hProperties = { ...node.data.hProperties, id }
      headings.push({ level: node.depth, id, text })
    })
    onHeadings?.(headings)
  }
}
