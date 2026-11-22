import { isChapterList, type Chapter, type Section } from './course-data'
import { slugify } from './content-schema'

export type CourseStructureAction =
  | { type: 'create-chapter'; title: string }
  | { type: 'rename-chapter'; chapter: string; title: string }
  | { type: 'archive-chapter'; chapter: string }
  | { type: 'restore-chapter'; chapter: string }
  | { type: 'move-chapter'; chapter: string; direction: 'up' | 'down'; activeOnly?: boolean }
  | { type: 'create-section'; chapter: string; title: string }
  | { type: 'rename-section'; chapter: string; slug: string; title: string }
  | { type: 'remove-section'; chapter: string; slug: string }
  | { type: 'move-section'; chapter: string; slug: string; direction: 'up' | 'down' }

export interface CourseStructureChange {
  chapters: Chapter[]
  chapter: Chapter
  chapterIndex: number
  section?: Section
}

function cleanTitle(value: string) {
  const title = value.trim()
  if (!title || title.length > 160) throw new Error('Escribe un título de entre 1 y 160 caracteres.')
  return title
}
export function shortSectionSlug(section: Section) { return section.slug?.split('/').pop() || section.id }

/** Pure operations keep identities, published links and the input snapshot intact. */
export function applyCourseStructureAction(source: Chapter[], action: CourseStructureAction): CourseStructureChange {
  if (!isChapterList(source)) throw new Error('La estructura del curso no es válida. Recarga antes de continuar.')
  const chapters = structuredClone(source)
  if (action.type === 'create-chapter') {
    const highest = Math.max(0, ...chapters.map(chapter => Number(chapter.number)).filter(Number.isSafeInteger))
    const number = String(highest + 1).padStart(2, '0')
    const chapter: Chapter = { number, title: cleanTitle(action.title), sections: [] }
    chapters.push(chapter)
    return { chapters, chapter, chapterIndex: chapters.length - 1 }
  }
  const chapterIndex = chapters.findIndex(chapter => chapter.number === action.chapter)
  if (chapterIndex < 0) throw new Error('El capítulo ya no existe. Actualiza la lista.')
  const chapter = chapters[chapterIndex]
  if (action.type === 'rename-chapter') chapter.title = cleanTitle(action.title)
  else if (action.type === 'archive-chapter') chapter.archived = true
  else if (action.type === 'restore-chapter') chapter.archived = false
  else if (action.type === 'move-chapter') {
    const step = action.direction === 'up' ? -1 : 1
    let destination = chapterIndex + step
    while (action.activeOnly && chapters[destination]?.archived) destination += step
    if (destination < 0 || destination >= chapters.length) throw new Error('El capítulo ya está en el extremo de la lista.')
    ;[chapters[chapterIndex], chapters[destination]] = [chapters[destination], chapters[chapterIndex]]
    return { chapters, chapter, chapterIndex: destination }
  } else if (action.type === 'create-section') {
    const title = cleanTitle(action.title)
    const folder = chapter.sections.find(section => section.slug?.includes('/'))?.slug?.split('/')[0] || `${chapter.number}-capitulo`
    const base = slugify(title) || 'seccion'
    let slug = base, suffix = 2
    while (chapter.sections.some(section => shortSectionSlug(section) === slug)) slug = `${base}-${suffix++}`
    const section = { id: `${Number(chapter.number)}.${chapter.sections.length + 1}`, title, slug: `${folder}/${slug}` }
    chapter.sections.push(section)
    chapter.sections.forEach((entry, position) => { entry.id = `${Number(chapter.number)}.${position + 1}` })
    return { chapters, chapter, chapterIndex, section }
  } else {
    const index = chapter.sections.findIndex(section => section.slug === action.slug || shortSectionSlug(section) === action.slug)
    if (index < 0) throw new Error('La sección cambió o ya no existe. Actualiza la lista.')
    const section = chapter.sections[index]
    if (action.type === 'rename-section') section.title = cleanTitle(action.title)
    else if (action.type === 'remove-section') chapter.sections.splice(index, 1)
    else if (action.type === 'move-section') {
      const destination = index + (action.direction === 'up' ? -1 : 1)
      if (destination < 0 || destination >= chapter.sections.length) throw new Error('La sección ya está en el extremo de la lista.')
      ;[chapter.sections[index], chapter.sections[destination]] = [chapter.sections[destination], chapter.sections[index]]
    }
    chapter.sections.forEach((entry, position) => { entry.id = `${Number(chapter.number)}.${position + 1}` })
    return { chapters, chapter, chapterIndex, section }
  }
  return { chapters, chapter, chapterIndex }
}

export function canChangeCourseStructure(session: { role: string; assignedChapters: string[] }, chapters: Chapter[], action: CourseStructureAction) {
  if (session.role === 'admin') return true
  if (session.role !== 'editor' || !action.type.endsWith('-section') || !('chapter' in action)) return false
  return session.assignedChapters.includes(action.chapter) && chapters.some(chapter => chapter.number === action.chapter && !chapter.archived)
}
