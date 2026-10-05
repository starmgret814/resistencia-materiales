import type { APIRoute } from 'astro';

export const POST: APIRoute = ({ cookies }) => {
  cookies.delete('session_token', { path: '/' });
  cookies.delete('firebase_id_token', { path: '/' });
  return new Response(null, { status: 204 });
};
