import type { AstroCookies } from 'astro'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const projectId = 'resistencia-materiales'
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))

export interface WorkspaceSession {
  email: string
  uid: string
  role: 'admin' | 'editor'
  assignedChapters: string[]
}

export class SessionError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function verifyWorkspaceSession(idToken: string): Promise<WorkspaceSession> {
  let payload
  try {
    ;({ payload } = await jwtVerify(idToken, keys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
      clockTolerance: 30,
    }))
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    if (code === 'ERR_JWT_EXPIRED') {
      throw new SessionError('La sesión expiró. Se intentará renovar automáticamente.', 401)
    }
    if (code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' || code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' || code === 'ERR_JWS_INVALID' || code === 'ERR_JWT_INVALID') {
      throw new SessionError('La sesión no es válida para esta plataforma. Inicia sesión nuevamente.', 401)
    }
    console.error('No se pudieron obtener o validar las claves públicas de Google.', error)
    throw new SessionError('No se pudo contactar con Google para validar la sesión. Comprueba la conexión e inténtalo nuevamente.', 503)
  }
  if (typeof payload.email !== 'string' || !payload.sub || payload.email_verified !== true) {
    throw new SessionError('Se requiere una cuenta con correo verificado.', 401)
  }
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(payload.email)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  })
  if (response.status === 404 || response.status === 403) throw new SessionError('Tu acceso a la plataforma fue revocado.', 403)
  if (!response.ok) throw new SessionError('No se pudieron comprobar los permisos actuales. Inténtalo de nuevo.', 503)
  const user = await response.json()
  const role = user.fields?.role?.stringValue || 'editor'
  if (role !== 'admin' && role !== 'editor') throw new SessionError('Tu cuenta no tiene un rol autorizado.', 403)
  const assignedChapters = (user.fields?.assignedChapters?.arrayValue?.values || [])
    .map((value: { stringValue?: string }) => value.stringValue)
    .filter((value: unknown): value is string => typeof value === 'string')
  return { email: payload.email, uid: payload.sub, role, assignedChapters }
}

export function setWorkspaceSession(cookies: AstroCookies, session: WorkspaceSession, idToken: string) {
  const options = { path: '/', httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax' as const, maxAge: 60 * 60 * 24 * 7 }
  cookies.set('firebase_id_token', idToken, options)
  // Display data only: authorization always verifies the token and current Firestore record.
  cookies.set('session_token', JSON.stringify(session), options)
}

export function canEditChapter(session: WorkspaceSession, chapter: string) {
  return session.role === 'admin' || session.assignedChapters.includes(chapter)
}
