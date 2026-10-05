import type { APIRoute } from 'astro';
import { SessionError, verifyWorkspaceSession, setWorkspaceSession } from '@/lib/server-session';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== 'string' || !idToken) return Response.json({ error: 'Falta el token de Google.' }, { status: 401 });
    const session = await verifyWorkspaceSession(idToken);
    setWorkspaceSession(cookies, session, idToken);
    return Response.json({ success: true, role: session.role, assignedChapters: session.assignedChapters });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error de autenticacion.' }, {
      status: error instanceof SessionError ? error.status : 503,
    });
  }
};
