import type { Chapter } from './course-data'
import type { CourseDocument } from './content-schema'

/** Derive the section number from its current position, including reordered sections. */
export function findSubtopicNumber(chapters: Chapter[], chapterId: string, slug: string): string | undefined {
  const chapter = chapters.find(item => Number(item.number) === Number(chapterId))
  if (!chapter || !/^\d+$/.test(chapter.number)) return undefined
  const index = chapter.sections.findIndex(section => section.slug === slug || section.id === slug || section.slug?.split('/').pop() === slug)
  return index < 0 ? undefined : `${Number(chapter.number)}.${index + 1}`
}

export function findSubtopicTitle(chapters: Chapter[], chapterId: string, slug: string): string | undefined {
  const chapter = chapters.find((c) => c.number === chapterId);
  if (!chapter) return undefined;
  const section = chapter.sections.find((s) => {
    if (!s.slug) return s.id === slug;
    const parts = s.slug.split('/');
    const shortSlug = parts.length > 1 ? parts[1] : parts[0];
    return s.slug === slug || shortSlug === slug || s.id === slug;
  });
  return section?.title;
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
