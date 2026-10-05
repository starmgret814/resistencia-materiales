import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const chapterNumber = url.searchParams.get('chapter');
    const docSlug = url.searchParams.get('slug');

    if (!chapterNumber || !docSlug) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }

    const chaptersPath = path.join(process.cwd(), 'lib', 'chapters.json');
    const chaptersContent = await fs.readFile(chaptersPath, 'utf-8');
    const chapters = JSON.parse(chaptersContent);

    const chData = chapters.find((c: any) => c.number === chapterNumber);
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

    const chapterFolder = chData.sections.find((s: any) => s.slug?.includes('/'))?.slug?.split('/')[0] 
      || `${chData.number.padStart(2, '0')}-capitulo`;

    const fullSectionSlug = section.slug.includes('/')
      ? section.slug
      : `${chapterFolder}/${section.slug}`;

    const filePath = path.join(process.cwd(), 'src', 'content', 'resistencia', fullSectionSlug, 'index.mdx');

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return new Response(JSON.stringify({ content: fileContent }), { status: 200 });
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return new Response(JSON.stringify({ error: 'Archivo MDX no existe' }), { status: 404 });
      }
      throw e;
    }
  } catch (error: any) {
    console.error('Error leyendo archivo MDX:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
