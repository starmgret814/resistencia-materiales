import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import defaultChapters from '@/lib/chapters.json';
import { canEditChapter } from '@/lib/server-session';

async function getChapters(): Promise<any[]> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'chapters.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return structuredClone(defaultChapters);
  }
}

async function saveChapters(chapters: any[], chapterNumber?: string, sections?: any[]) {
  const isVercel = Boolean(process.env.VERCEL);
  // Si estamos en entorno local, escribir en disco local
  if (!isVercel) {
    try {
      const contentStr = JSON.stringify(chapters, null, 2);
      const filePath = path.join(process.cwd(), 'lib', 'chapters.json');
      await fs.writeFile(filePath, contentStr, 'utf-8');
    } catch (e) {
      console.error("Error guardando localmente chapters.json:", e);
    }
  }
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const sessionCookie = cookies.get('session_token');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const data = await request.json();
    const { chapterNumber, newSection } = data;
    if (!locals.session || !canEditChapter(locals.session, chapterNumber)) return Response.json({ error: 'No tienes permisos para este capítulo.' }, { status: 403 });

    if (!chapterNumber || !newSection || !newSection.title?.trim()) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos (capítulo o título)' }), { status: 400 });
    }

    const chapters = await getChapters();

    const chapterIndex = chapters.findIndex((c: any) => c.number === chapterNumber);
    if (chapterIndex === -1) {
      return new Response(JSON.stringify({ error: `Capítulo ${chapterNumber} no encontrado` }), { status: 404 });
    }

    const targetChapter = chapters[chapterIndex];
    const chapterNumInt = parseInt(chapterNumber, 10);

    // Calcular el siguiente ID numérico disponible
    const existingNums = targetChapter.sections
      .map((s: any) => {
        const parts = s.id ? s.id.split('.') : [];
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const nextAutoId = `${chapterNumInt}.${maxNum + 1}`;

    // Si el ID viene vacío o ya existe, asignar automáticamente el siguiente
    if (!newSection.id || targetChapter.sections.some((s: any) => s.id === newSection.id)) {
      newSection.id = nextAutoId;
    }

    // Si el slug viene vacío, generarlo automáticamente
    if (!newSection.slug) {
      const chapterFolder = targetChapter.sections[0]?.slug?.split('/')[0] || `${chapterNumber}-capitulo`;
      const safeTitle = newSection.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-');
      newSection.slug = `${chapterFolder}/${safeTitle}`;
    }

    targetChapter.sections.push(newSection);

    await saveChapters(chapters, chapterNumber, targetChapter.sections);

    return new Response(JSON.stringify({ success: true, chapters }), { status: 200 });
  } catch (error: any) {
    console.error('Error al agregar subtema:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const sessionCookie = cookies.get('session_token');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const data = await request.json();
    const { chapterNumber, sections } = data;
    if (!locals.session || !canEditChapter(locals.session, chapterNumber)) return Response.json({ error: 'No tienes permisos para este capítulo.' }, { status: 403 });

    if (!chapterNumber || !Array.isArray(sections)) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), { status: 400 });
    }

    const chapters = await getChapters();

    const chapterIndex = chapters.findIndex((c: any) => c.number === chapterNumber);
    if (chapterIndex === -1) {
      return new Response(JSON.stringify({ error: 'Capítulo no encontrado' }), { status: 404 });
    }

    if (sections.length < chapters[chapterIndex].sections.length && locals.session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden eliminar subtemas del curso.' }), { status: 403 });
    }

    chapters[chapterIndex].sections = sections;

    await saveChapters(chapters, chapterNumber, sections);

    return new Response(JSON.stringify({ success: true, chapters }), { status: 200 });
  } catch (error: any) {
    console.error('Error al actualizar subtemas:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
