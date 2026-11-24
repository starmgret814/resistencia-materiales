import type { CourseDocument } from './content-schema'

export interface ContentReviewBaseline {
  chapterId: string
  slug: string
  fullSlug: string
  sectionTitle: string
  revision: string
  headingPrefix?: string
  problemOffset: number
  published: CourseDocument | null
  draft: CourseDocument | null
  publishedAt?: string
}

/** A revision of both the draft and publication, without persisting extra documents. */
export async function contentReviewRevision(data: Record<string, unknown> | null): Promise<string> {
  const fields = ['chapterId', 'slug', 'title', 'contentMarkdown', 'status', 'updatedAt', 'publishedContent', 'publishedTitle', 'publishedAt']
  const value = data === null ? null : fields.map(field => [field, data[field] ?? null])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function sameReviewBaseline(a: ContentReviewBaseline, b: ContentReviewBaseline): boolean {
  return a.revision === b.revision && a.chapterId === b.chapterId && a.slug === b.slug
    && a.sectionTitle === b.sectionTitle && a.fullSlug === b.fullSlug
    && a.headingPrefix === b.headingPrefix && a.problemOffset === b.problemOffset
    && a.published?.contentMarkdown === b.published?.contentMarkdown
    && a.published?.title === b.published?.title
    && a.draft?.contentMarkdown === b.draft?.contentMarkdown && a.draft?.title === b.draft?.title
}

export function reviewHasChanges(published: CourseDocument | null, candidate: CourseDocument): boolean {
  const lines = (text: string) => text.replace(/\r\n?/g, '\n')
  return !published || published.title !== candidate.title || lines(published.contentMarkdown) !== lines(candidate.contentMarkdown)
}

export function isContentReviewBaseline(value: unknown): value is ContentReviewBaseline {
  if (!value || typeof value !== 'object') return false
  const data = value as ContentReviewBaseline
  return typeof data.chapterId === 'string' && typeof data.slug === 'string'
    && typeof data.fullSlug === 'string' && typeof data.sectionTitle === 'string'
    && typeof data.revision === 'string' && /^[a-f0-9]{64}$/.test(data.revision)
    && Number.isSafeInteger(data.problemOffset) && data.problemOffset >= 0
    && (data.headingPrefix === undefined || typeof data.headingPrefix === 'string')
    && [data.published, data.draft].every(document => document === null || Boolean(document && typeof document.title === 'string'
      && typeof document.contentMarkdown === 'string'))
}

export const REVIEW_CONFLICT_MESSAGE = 'El borrador o la versión publicada cambió durante la revisión. Actualiza la comparación antes de aprobar.'
