import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import { contentReviewRevision, REVIEW_CONFLICT_MESSAGE } from './content-review'
import type { CourseDocument } from './content-schema'

function documentFields(candidate: CourseDocument) {
  // A loaded Firestore record may also carry stale publication metadata. Never copy it back.
  return {
    schemaVersion: 2,
    chapterId: candidate.chapterId,
    slug: candidate.slug,
    title: candidate.title,
    contentMarkdown: candidate.contentMarkdown,
    ...(typeof candidate.summary === 'string' ? { summary: candidate.summary } : {}),
  }
}

/** Older approvals used contentMarkdown itself as the public copy. Preserve it before editing. */
export function legacyPublicationFields(data: Record<string, any> | null) {
  if (!data || data.status !== 'approved' || data.publishedContent || typeof data.contentMarkdown !== 'string' || !data.contentMarkdown.trim()) return {}
  return {
    publishedContent: data.contentMarkdown,
    publishedTitle: data.publishedTitle || data.title,
    ...(data.publishedAt || data.updatedAt ? { publishedAt: data.publishedAt || data.updatedAt } : {}),
    ...(data.publishedBy || data.authorEmail ? { publishedBy: data.publishedBy || data.authorEmail } : {}),
  }
}

export async function saveDraftPreservingPublication(candidate: CourseDocument, status: 'draft' | 'pending_approval', session: { email: string; role: string }) {
  const reference = doc(db, 'drafts', `${candidate.chapterId}_${candidate.slug}`)
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference)
    const data = snapshot.exists() ? snapshot.data() : null
    transaction.set(reference, {
      ...legacyPublicationFields(data),
      ...documentFields(candidate),
      authorEmail: session.role === 'admin' && data?.authorEmail ? data.authorEmail : session.email,
      lastEditedBy: session.email,
      status,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  })
}

/** Compare and publish atomically; never overwrite a draft changed during review. */
export async function publishReviewedContent(candidate: CourseDocument, expectedRevision: string, session: { email: string; role: string }) {
  if (session.role !== 'admin') throw new Error('Solo un administrador puede aprobar contenido.')
  if (!candidate.contentMarkdown.trim()) throw new Error('El contenido no puede estar vacío.')
  const reference = doc(db, 'drafts', `${candidate.chapterId}_${candidate.slug}`)
  const now = new Date().toISOString()
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference)
    const data = snapshot.exists() ? snapshot.data() : null
    if (await contentReviewRevision(data) !== expectedRevision) throw new Error(REVIEW_CONFLICT_MESSAGE)
    transaction.set(reference, {
      ...documentFields(candidate),
      authorEmail: data?.authorEmail || session.email,
      lastEditedBy: session.email,
      status: 'approved',
      publishedContent: candidate.contentMarkdown,
      publishedTitle: candidate.title,
      publishedAt: now,
      publishedBy: session.email,
      updatedAt: now,
    }, { merge: true })
  })
}
