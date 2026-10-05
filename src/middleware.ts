import { defineMiddleware } from 'astro:middleware';
import { canEditChapter, SessionError, verifyWorkspaceSession, setWorkspaceSession } from '@/lib/server-session';

export const onRequest = defineMiddleware(async ({ url, request, cookies, redirect, locals }, next) => {
  const pathname = url.pathname.replace(/\/+$/, '');
  const workspace = pathname.startsWith('/workspace-mc361');
  const login = pathname === '/workspace-mc361/login';
  const protectedApi = ['/api/publish', '/api/subchapters', '/api/users', '/api/editor-document'].includes(pathname);
  if ((!workspace || login) && !protectedApi) return next();
  try {
    const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    const token = bearer || cookies.get('firebase_id_token')?.value;
    if (!token) throw new SessionError('Inicia sesion nuevamente para validar tus permisos.', 401);
    const session = await verifyWorkspaceSession(token);
    locals.session = session;
    setWorkspaceSession(cookies, session, token);
    const adminOnly = pathname.startsWith('/workspace-mc361/management') || ['/api/publish', '/api/users'].includes(pathname);
    if (adminOnly && session.role !== 'admin') {
      return protectedApi ? Response.json({ error: 'No tienes permisos de administrador.' }, { status: 403 }) : redirect('/workspace-mc361/content/chapters');
    }
    const chapter = pathname.match(/^\/workspace-mc361\/content\/chapters\/([^/]+)\/edit$/)?.[1];
    if (chapter && !canEditChapter(session, decodeURIComponent(chapter))) return redirect('/workspace-mc361/content/chapters');
    return next();
  } catch (error) {
    const status = error instanceof SessionError ? error.status : 503;
    if (status === 401 || status === 403) {
      cookies.delete('session_token', { path: '/' });
      cookies.delete('firebase_id_token', { path: '/' });
    }
    if (protectedApi || status === 503) return Response.json({ error: error instanceof Error ? error.message : 'No se pudieron validar los permisos.' }, { status });
    return redirect('/workspace-mc361/login');
  }
});
