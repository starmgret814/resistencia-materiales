import { auth } from './firebase'

export async function workspaceFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Inicia sesión para continuar.')
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`)
  return fetch(url, { ...options, headers })
}
