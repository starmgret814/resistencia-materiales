import { doc, getDoc, getDocFromServer, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import { chapters as seedChapters, isChapterList, type Chapter } from './course-data'
import { applyCourseStructureAction, canChangeCourseStructure, shortSectionSlug, type CourseStructureAction } from './course-structure'
import { withSubtopicTitle } from './course-titles'
import type { CourseDocument } from './content-schema'

export function readCourseCatalog(data: unknown): Chapter[] {
  const list = data && typeof data === 'object' && 'list' in data ? data.list : undefined
  if (!isChapterList(list)) throw new Error('La estructura guardada del curso no es válida. No se sobrescribirá.')
  return list
}

export async function loadCourseCatalog(): Promise<Chapter[]> {
  const snapshot = await getDoc(doc(db, 'course', 'chapters'))
  return snapshot.exists() ? readCourseCatalog(snapshot.data()) : structuredClone(seedChapters)
}

/** Re-read inside the transaction: concurrent collaborators never overwrite stale catalogs. */
export async function changeCourseStructure(session: { email: string; role: string; assignedChapters: string[] }, action: CourseStructureAction) {
  const catalogRef = doc(db, 'course', 'chapters')
  for (let conflict = 0; conflict < 3; conflict++) {
    let previousCatalog = ''
    try {
      return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(catalogRef)
        const current = snapshot.exists() ? readCourseCatalog(snapshot.data()) : structuredClone(seedChapters)
        previousCatalog = JSON.stringify(current)
        if (!canChangeCourseStructure(session, current, action)) throw new Error('No tienes permisos para realizar este cambio.')
        const change = applyCourseStructureAction(current, action)
        const draftRef = change.section ? doc(db, 'drafts', `${change.chapter.number}_${shortSectionSlug(change.section)}`) : null
        const needsDraft = action.type === 'create-section' || action.type === 'rename-section' || action.type === 'remove-section'
        const draft = draftRef && needsDraft ? await transaction.get(draftRef) : null
        if (action.type === 'create-section' && draft?.exists()) throw new Error('Ya existe contenido con esa dirección. Usa otro título para conservar el documento anterior.')
        if (action.type === 'remove-section' && draft?.exists() && session.role !== 'admin' && (draft.data().publishedContent || draft.data().status === 'approved')) throw new Error('Solo un administrador puede eliminar una sección publicada.')
        transaction.set(catalogRef, { list: change.chapters, editedChapterIndex: change.chapterIndex, updatedAt: new Date().toISOString() }, { merge: true })
        if (draftRef && change.section) {
          if (action.type === 'create-section') transaction.set(draftRef, { schemaVersion: 2, chapterId: change.chapter.number, slug: shortSectionSlug(change.section), title: change.section.title, contentMarkdown: `# ${change.section.title}\n\nEscribe el contenido aquí...`, authorEmail: session.email, status: 'draft', updatedAt: new Date().toISOString() })
          else if (action.type === 'remove-section' && draft?.exists()) transaction.delete(draftRef)
          else if (action.type === 'rename-section' && draft?.exists()) {
            const renamed = withSubtopicTitle(draft.data() as CourseDocument, change.section.title)
            transaction.update(draftRef, { title: renamed.title, contentMarkdown: renamed.contentMarkdown, ...(session.role === 'admin' && draft.data().publishedContent ? { publishedTitle: renamed.title } : {}) })
          }
        }
        return change
      })
    } catch (error) {
      // Rules can reject a stale whole-list write before the SDK reports ABORTED.
      // Retry only a proven catalog conflict; genuine permission failures stay denied.
      if (conflict === 2 || !error || typeof error !== 'object' || !('code' in error) || error.code !== 'permission-denied') throw error
      const latest = await getDocFromServer(catalogRef)
      if (!latest.exists()) throw error
      const current = readCourseCatalog(latest.data())
      if (JSON.stringify(current) === previousCatalog || !canChangeCourseStructure(session, current, action)) throw error
    }
  }
  throw new Error('El curso recibió varios cambios simultáneos. Actualiza la lista e inténtalo de nuevo.')
}
