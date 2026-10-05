import type { APIRoute } from 'astro'

const base = 'https://firestore.googleapis.com/v1/projects/resistencia-materiales/databases/(default)/documents/users/'

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  if (locals.session?.role !== 'admin') return Response.json({ error: 'No tienes permisos de administrador.' }, { status: 403 })
  try {
    const { email, role, assignedChapters, isEditing } = await request.json()
    if (typeof email !== 'string' || !email.includes('@') || !['admin', 'editor'].includes(role) || !Array.isArray(assignedChapters) || !assignedChapters.every((value: unknown) => typeof value === 'string')) {
      return Response.json({ error: 'Datos del colaborador inválidos.' }, { status: 400 })
    }
    const fields: Record<string, unknown> = {
      role: { stringValue: role },
      assignedChapters: { arrayValue: { values: (role === 'admin' ? [] : assignedChapters).map((chapter: string) => ({ stringValue: chapter })) } },
    }
    if (!isEditing) fields.createdAt = { stringValue: new Date().toISOString() }
    const mask = Object.keys(fields).map((field) => `updateMask.fieldPaths=${field}`).join('&')
    const response = await fetch(`${base}${encodeURIComponent(email.trim().toLowerCase())}?${mask}`, {
      method: 'PATCH',
      headers: { Authorization: request.headers.get('authorization') || `Bearer ${cookies.get('firebase_id_token')!.value}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    return response.ok ? Response.json({ success: true }) : Response.json({ error: 'Firestore rechazó el cambio de permisos.' }, { status: response.status })
  } catch {
    return Response.json({ error: 'No se pudo guardar el colaborador.' }, { status: 503 })
  }
}

export const DELETE: APIRoute = async ({ request, cookies, locals }) => {
  if (locals.session?.role !== 'admin') return Response.json({ error: 'No tienes permisos de administrador.' }, { status: 403 })
  const email = new URL(request.url).searchParams.get('email')
  if (!email) return Response.json({ error: 'Falta el correo del colaborador.' }, { status: 400 })
  try {
    const response = await fetch(`${base}${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: { Authorization: request.headers.get('authorization') || `Bearer ${cookies.get('firebase_id_token')!.value}` },
    })
    return response.ok ? Response.json({ success: true }) : Response.json({ error: 'Firestore rechazó la eliminación.' }, { status: response.status })
  } catch {
    return Response.json({ error: 'No se pudo eliminar el colaborador.' }, { status: 503 })
  }
}
