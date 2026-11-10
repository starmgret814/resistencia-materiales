/**
 * Course structure metadata.
 *
 * This file is the **single source of truth** for the sidebar navigation
 * and the mapping between chapter/section identifiers and their MDX content
 * slugs under `src/content/resistencia/`.
 *
 * When a contributor adds a new topic they should:
 *   1. Create the `.mdx` file under `src/content/resistencia/<chapter>/<section>/index.mdx`
 *   2. Add (or update) the corresponding entry here so the sidebar picks it up.
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
  /** Two-digit chapter number, e.g. "01" */
  number: string
  /** Chapter title */
  title: string
  /** Ordered list of sections inside this chapter */
  sections: Section[]
}

/** Reject malformed browser caches or remote data before rendering chapter cards. */
export function isChapterList(value: unknown): value is Chapter[] {
  return Array.isArray(value) && value.every(chapter => chapter && typeof chapter.number === 'string' && typeof chapter.title === 'string' && Array.isArray(chapter.sections) && chapter.sections.every((section: Section) => section && typeof section.id === 'string' && typeof section.title === 'string' && (section.slug === null || typeof section.slug === 'string')))
}

import chaptersData from './chapters.json';

export const chapters: Chapter[] = chaptersData as Chapter[];

/** Flat list of all sections, in sidebar order. */
export const allSections = chapters.flatMap((ch) =>
  ch.sections.map((sec) => ({ ...sec, chapterNumber: ch.number, chapterTitle: ch.title }))
)

/**
 * Given a slug like "02-esfuerzo-deformacion/esfuerzo-normal",
 * find the section metadata and its neighbours for prev/next navigation.
 */
export function findSectionBySlug(slug: string) {
  const index = allSections.findIndex((s) => s.slug === slug)
  if (index === -1) return null
  return {
    section: allSections[index],
    previous: index > 0 ? allSections[index - 1] : null,
    next: index < allSections.length - 1 ? allSections[index + 1] : null,
  }
}
