import type { Chapter } from './course-data'

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()

/** Search the same chapter data as the menu; every word can match a different field. */
export function searchCourse(chapters: Chapter[], query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return chapters.flatMap(chapter => chapter.sections
    .filter(section => Boolean(section.slug))
    .map(section => ({ ...section, chapterNumber: chapter.number, chapterTitle: chapter.title })))
    .filter(section => {
      const text = normalize(`${section.id} ${section.title} ${section.chapterTitle} ${section.slug}`)
      return terms.every(term => text.includes(term))
    })
}
