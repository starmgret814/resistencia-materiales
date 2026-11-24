import { workspaceFetch } from './workspace-api'
import { isContentReviewBaseline, type ContentReviewBaseline } from './content-review'

export async function loadContentReview(chapter: string, slug: string, signal?: AbortSignal): Promise<ContentReviewBaseline> {
  const parameters = new URLSearchParams({ chapter, slug })
  const response = await workspaceFetch(`/api/content-review?${parameters}`, { cache: 'no-store', signal })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo cargar la versión publicada. Reintenta antes de aprobar.')
  if (!isContentReviewBaseline(data) || data.chapterId !== chapter) throw new Error('La respuesta de comparación no es válida. Reintenta antes de aprobar.')
  return data
}
