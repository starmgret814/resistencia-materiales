/**
 * Course structure metadata.
 *
 * Firestore's course/chapters document is the editable course catalog.
 * The bundled JSON is only the initial seed and an offline fallback.
 * Creating or renaming chapters in the dashboard never requires editing it.
 */

export interface Section {
  /** Short numeric or alphanumeric id, e.g. "2.1" */
  id: string
  /** Human-readable title shown in the sidebar */
  title: string
  /**
   * Slug path relative to `src/content/resistencia/`.
   * Example: "02-esfuerzo-deformacion/esfuerzo-normal"
   * When `null` the section is listed but marked as "coming soon".
   */
  slug: string | null
}

export interface Chapter {
  /** Persistent chapter identifier, e.g. "01"; independent of its display position. */
  number: string
  /** Chapter title */
  title: string
  /** Ordered list of sections inside this chapter */
  sections: Section[]
  /** Hidden from the public course while its content remains recoverable. */
  archived?: boolean
}

/** Reject malformed browser caches or remote data before rendering chapter cards. */
export function isChapterList(value: unknown): value is Chapter[] {
  return Array.isArray(value) && value.every(chapter => chapter && typeof chapter.number === 'string' && typeof chapter.title === 'string' && (chapter.archived === undefined || typeof chapter.archived === 'boolean') && Array.isArray(chapter.sections) && chapter.sections.every((section: Section) => section && typeof section.id === 'string' && typeof section.title === 'string' && (section.slug === null || typeof section.slug === 'string')))
}

export function activeChapters(value: Chapter[]) { return value.filter(chapter => !chapter.archived) }

import chaptersData from './chapters.json';

export const chapters: Chapter[] = chaptersData as Chapter[];

/**
 * Given a slug like "02-esfuerzo-deformacion/esfuerzo-normal",
 * find the section metadata and its neighbours for prev/next navigation.
 */
export function findSectionBySlug(slug: string, catalog: Chapter[] = chapters) {
  const sections = activeChapters(catalog).flatMap(chapter =>
    chapter.sections.map(section => ({ ...section, chapterNumber: chapter.number, chapterTitle: chapter.title }))
  )
  const index = sections.findIndex(section => section.slug === slug || section.id === slug || section.slug?.split('/').pop() === slug)
  if (index === -1) return null
  return {
    section: sections[index],
    previous: sections.slice(0, index).reverse().find(section => section.slug) || null,
    next: sections.slice(index + 1).find(section => section.slug) || null,
  }
}
