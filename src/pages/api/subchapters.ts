import type { APIRoute } from 'astro'
import { canEditChapter } from '@/lib/server-session'

/** Legacy file-sync endpoint. Catalog writes now use the shared Firestore transaction service. */
const retired: APIRoute = async ({ request, locals }) => {
  if (!locals.session) return Response.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
  try {
    const { chapterNumber } = await request.json()
    if (typeof chapterNumber !== 'string' || !canEditChapter(locals.session, chapterNumber)) return Response.json({ error: 'No tienes permisos para este capítulo.' }, { status: 403 })
    return Response.json({ error: 'Este editor está desactualizado. Recarga la página para usar la gestión del curso en Firestore.' }, { status: 410 })
  } catch { return Response.json({ error: 'Solicitud inválida.' }, { status: 400 }) }
}

export const POST = retired
export const PUT = retired
