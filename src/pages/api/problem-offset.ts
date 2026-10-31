import type { APIRoute } from 'astro'
import { getChapterProblemOffset, getLiveChapters } from '@/lib/course-service'

export const GET: APIRoute = async ({ url }) => {
  const chapter = (await getLiveChapters()).find(item => item.number === url.searchParams.get('chapter'))
  const slug = url.searchParams.get('slug')
  if (!chapter || !slug) return Response.json({ error: 'Capítulo o sección no encontrado.' }, { status: 404 })
  try {
    return Response.json({ offset: await getChapterProblemOffset(chapter, slug) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'No se pudo calcular la numeración de problemas.' }, { status: 503 })
  }
}
