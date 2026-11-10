export class LoginSessionError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

/** Exchange a Firebase token for the verified, HTTP-only workspace session. */
export async function establishLoginSession(idToken: string) {
  let response: Response
  try {
    response = await fetch('/api/auth/signin', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new Error('No se pudo conectar con la plataforma. Comprueba la conexión e inténtalo nuevamente.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new LoginSessionError(typeof data?.error === 'string' ? data.error : 'No se pudo validar tu acceso a la plataforma.', response.status)
  if (data?.success !== true) throw new Error('La plataforma devolvió una respuesta inesperada. Recarga la página e inténtalo nuevamente.')
}

export function loginErrorMessage(error: unknown, hostname: string) {
  const code = (error as { code?: string } | null)?.code
  switch (code) {
    case 'auth/popup-blocked': return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio y vuelve a intentarlo.'
    case 'auth/popup-closed-by-user': return 'La ventana de Google se cerró antes de completar el acceso. Vuelve a intentarlo.'
    case 'auth/cancelled-popup-request': return 'Ya hay un acceso con Google en curso. Completa esa ventana o inténtalo nuevamente.'
    case 'auth/unauthorized-domain': return `El dominio ${hostname} no está autorizado para acceder con Google. Debe añadirse en Firebase Authentication → Configuración → Dominios autorizados.`
    case 'auth/operation-not-allowed': return 'El acceso con Google no está habilitado en la configuración de Firebase del proyecto.'
    case 'auth/network-request-failed': return 'No se pudo conectar con Google. Comprueba tu conexión y si alguna extensión está bloqueando el acceso.'
    case 'auth/internal-error': return 'No se pudo cargar el servicio de acceso de Google. Recarga la página y comprueba que el navegador o alguna extensión no esté bloqueando apis.google.com.'
    case 'auth/web-storage-unsupported': return 'El navegador no permite guardar la sesión. Habilita el almacenamiento del sitio e inténtalo nuevamente.'
    default: return error instanceof Error ? error.message : 'Ocurrió un error al iniciar sesión con Google.'
  }
}
