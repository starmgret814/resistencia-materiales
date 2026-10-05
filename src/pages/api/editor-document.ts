import type { APIRoute } from 'astro';
import { canEditChapter } from '@/lib/server-session';
import { chapters, type Chapter } from '@/lib/course-data';
import { findSubtopicTitle, withSubtopicTitle } from '@/lib/course-titles';
import { starterDocument } from '@/lib/content-schema';

const publishedFiles = import.meta.glob('/src/content/resistencia/**/*.{mdx,md}', { query: '?raw', import: 'default' });
const base = 'https://firestore.googleapis.com/v1/projects/resistencia-materiales/databases/(default)/documents/';

function decode(value: any): any {
  if ('stringValue' in value) return value.stringValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, decode(item)]));
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  return null;
}

export const GET: APIRoute = async ({ url, request, cookies, locals }) => {
  const started = performance.now();
  const chapterId = url.searchParams.get('chapter');
  const slug = url.searchParams.get('slug');
  const session = locals.session;
  if (!session || !chapterId || !canEditChapter(session, chapterId)) {
    return Response.json({ error: 'No tienes acceso a este capítulo.' }, { status: 403 });
  }
  if (!slug || slug.includes('/') || slug === '.' || slug === '..') {
    return Response.json({ error: 'Subtema no válido.' }, { status: 400 });
  }
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] || cookies.get('firebase_id_token')?.value;
  if (!token) return Response.json({ error: 'Inicia sesión nuevamente.' }, { status: 401 });
  try {
    const read = async (documentPath: string) => {
      const response = await fetch(base + documentPath, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('No se pudo leer el contenido de Firebase.');
      const data = await response.json();
      return decode({ mapValue: { fields: data.fields } });
    };
    const [structure, draft] = await Promise.all([
      read('course/chapters'), read(`drafts/${encodeURIComponent(`${chapterId}_${slug}`)}`),
    ]);
    const list: Chapter[] = Array.isArray(structure?.list) ? structure.list : chapters;
    const title = findSubtopicTitle(list, chapterId, slug);
    if (!title && !draft) return Response.json({ error: 'Subtema no encontrado.' }, { status: 404 });
    if (draft && draft.authorEmail !== session.email && session.role !== 'admin') {
      return Response.json({ error: 'Este borrador pertenece a otro colaborador.' }, { status: 403 });
    }
    let document = draft;
    if (!document) {
      const section = list.find(chapter => chapter.number === chapterId)?.sections.find(section =>
        (section.slug?.split('/').slice(1).join('/') || section.id) === slug);
      const fileSlug = section?.slug;
      const load = fileSlug && (publishedFiles[`/src/content/resistencia/${fileSlug}/index.mdx`]
        || publishedFiles[`/src/content/resistencia/${fileSlug}/index.md`]
        || publishedFiles[`/src/content/resistencia/${fileSlug}.mdx`]
        || publishedFiles[`/src/content/resistencia/${fileSlug}.md`]);
      document = { ...starterDocument, chapterId, slug, ...(load ? { contentMarkdown: await load() } : {}) };
    }
    return Response.json({ document: withSubtopicTitle(document, title) }, {
      headers: { 'Cache-Control': 'no-store', 'Server-Timing': `document;dur=${(performance.now() - started).toFixed(1)}` },
    });
  } catch (error) {
    console.error('Error cargando documento:', error);
    return Response.json({ error: 'No se pudo cargar el contenido. Revisa tu conexión y vuelve a intentar.' }, { status: 503 });
  }
};
