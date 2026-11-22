import type { APIRoute } from 'astro';
import { getLiveChapters } from '@/lib/course-service';
import { loadProjectMarkdown } from '@/lib/project-markdown';


export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const chapterNumber = url.searchParams.get('chapter');
    const docSlug = url.searchParams.get('slug');

    if (!chapterNumber || !docSlug) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }

    const chapters = await getLiveChapters();
    const chData = chapters.find(c => c.number === chapterNumber);
    if (!chData) {
      return new Response(JSON.stringify({ error: 'Capítulo no encontrado' }), { status: 404 });
    }

    const section = chData.sections.find((s: any) => {
      if (!s.slug) return s.id === docSlug;
      const parts = s.slug.split('/');
      const shortSlug = parts.length > 1 ? parts[1] : parts[0];
      return s.slug === docSlug || shortSlug === docSlug || s.id === docSlug;
    });

    if (!section || !section.slug) {
      return new Response(JSON.stringify({ error: 'Subtema no encontrado' }), { status: 404 });
    }

    const content = await loadProjectMarkdown(chapterNumber, docSlug, chapters);
    if (!content) return Response.json({ error: 'Archivo MDX no existe' }, { status: 404 });
    return Response.json({ content }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error leyendo archivo MDX:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
