import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkNumberHeadings, { type NumberedHeading } from './remark-number-headings'
import { normalizeLegacyMdx } from './course-markdown'

/** Parse the same normalized Markdown as the page so code examples never enter the index. */
export async function getCourseHeadings(markdown: string, prefix?: string): Promise<NumberedHeading[]> {
  let headings: NumberedHeading[] = []
  const processor = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [remarkGfm, remarkMath, remarkDirective, [remarkNumberHeadings, {
      prefix,
      onHeadings: (items: NumberedHeading[]) => { headings = items },
    }]],
  })
  await processor.render(normalizeLegacyMdx(markdown))
  return headings.filter(heading => heading.level === 2 || heading.level === 3)
}

export async function countCourseProblems(markdown: string): Promise<number> {
  let count = 0
  function countProblems() {
    return (tree: unknown) => {
      function walk(node: { type?: string; name?: string; children?: unknown[] }) {
        if ((node.type === 'containerDirective' || node.type === 'leafDirective') && node.name === 'problem') count++
        node.children?.forEach(child => walk(child as typeof node))
      }
      walk(tree as Parameters<typeof walk>[0])
    }
  }
  const processor = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkGfm, remarkMath, remarkDirective, countProblems] })
  await processor.render(normalizeLegacyMdx(markdown))
  return count
}
