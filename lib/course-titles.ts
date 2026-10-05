import type { Chapter } from './course-data'
import type { CourseDocument } from './content-schema'

export function findSubtopicTitle(chapters: Chapter[], chapterId: string, slug: string): string | undefined {
  return chapters.find((chapter) => chapter.number === chapterId)?.sections
    .find((section) => (section.slug?.split('/').slice(1).join('/') || section.id) === slug)?.title
}

/** Rename the page heading while preserving the body and fenced code examples. */
export function withSubtopicTitle(document: CourseDocument, title?: string): CourseDocument {
  if (!title?.trim()) return document
  const lines = document.contentMarkdown.split('\n')
  let fence: { marker: string; length: number } | null = null
  for (let index = 0; index < lines.length; index++) {
    const fenceLine = lines[index].match(/^ {0,3}(`{3,}|~{3,})/)
    if (fenceLine) {
      if (!fence) fence = { marker: fenceLine[1][0], length: fenceLine[1].length }
      else if (fenceLine[1][0] === fence.marker && fenceLine[1].length >= fence.length) fence = null
      continue
    }
    if (!fence && /^\\?#\s+/.test(lines[index])) {
      lines[index] = `# ${title.trim()}${lines[index].endsWith('\r') ? '\r' : ''}`
      break
    }
  }
  return { ...document, title: title.trim(), contentMarkdown: lines.join('\n') }
}
