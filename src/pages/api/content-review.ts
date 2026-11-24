import type { APIRoute } from 'astro'
import { doc, getDocFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { loadCourseCatalog } from '@/lib/course-structure-store'
import { approvedSubtopicFromData, effectiveCourseMarkdown, getChapterProblemOffset } from '@/lib/course-service'
import { contentReviewRevision, type ContentReviewBaseline } from '@/lib/content-review'
import { shortSectionSlug } from '@/lib/course-structure'
import { findSubtopicNumber, withSubtopicTitle } from '@/lib/course-titles'

export const GET: APIRoute = async ({ locals, url }) => {
  const headers = { 'Cache-Control': 'private, no-store' }
  if (locals.session?.role !== 'admin') return Response.json({ error: 'Solo un administrador puede revisar publicaciones.' }, { status: 403, headers })
  try {
    // Unlike a public fallback, an unavailable catalog must not look like a new section.
    const chapters = await loadCourseCatalog(true)
    const chapter = chapters.find(item => item.number === url.searchParams.get('chapter') && !item.archived)
    const slug = url.searchParams.get('slug')
    const section = chapter?.sections.find(item => item.id === slug || item.slug === slug || shortSectionSlug(item) === slug)
    if (!chapter || !section) return Response.json({ error: 'La sección no está disponible en el curso activo.' }, { status: 404, headers })
    const cleanSlug = shortSectionSlug(section)
    const snapshot = await getDocFromServer(doc(db, 'drafts', `${chapter.number}_${cleanSlug}`))
    const data = snapshot.exists() ? snapshot.data() : null
    const [published, revision, problemOffset, draftMarkdown] = await Promise.all([
      data ? approvedSubtopicFromData(data, chapter.number, cleanSlug) : null,
      contentReviewRevision(data),
      getChapterProblemOffset(chapter, section.slug || section.id),
      data && typeof data.contentMarkdown === 'string' ? effectiveCourseMarkdown(chapter.number, cleanSlug, data.contentMarkdown) : null,
    ])
    const baseline: ContentReviewBaseline = {
      chapterId: chapter.number,
      slug: cleanSlug,
      fullSlug: section.slug || cleanSlug,
      sectionTitle: section.title,
      revision,
      headingPrefix: findSubtopicNumber(chapters, chapter.number, section.slug || section.id),
      problemOffset,
      published: published ? { schemaVersion: 2, title: published.title, chapterId: chapter.number, slug: cleanSlug, contentMarkdown: published.contentMarkdown } : null,
      draft: draftMarkdown !== null ? withSubtopicTitle({ schemaVersion: 2, title: section.title, chapterId: chapter.number, slug: cleanSlug, contentMarkdown: draftMarkdown }, section.title) : null,
      publishedAt: published?.updatedAt,
    }
    return Response.json(baseline, { headers })
  } catch (error) {
    console.error('No se pudo cargar la comparación de publicación:', error)
    return Response.json({ error: 'No se pudo comprobar la versión publicada. Reintenta; este error no significa que el contenido sea nuevo.' }, { status: 503, headers })
  }
}
