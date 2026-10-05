import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import staticChapters from '@/lib/chapters.json';
import { commitToGitHubWithRetry } from '@/lib/github-sync';

/**
 * Load chapters from Firestore first (where dynamically-created and reordered subtemas live),
 * falling back to the static chapters.json bundled at build time.
 */
async function loadChapters(): Promise<any[]> {
  try {
    const { initializeApp: initClientApp, getApps: getClientApps, getApp: getClientApp } = await import('firebase/app');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: "AIzaSyBuHiDaNFsryCyFDjqUtdymTYH93oqltg0",
      authDomain: "resistencia-materiales.firebaseapp.com",
      projectId: "resistencia-materiales",
      storageBucket: "resistencia-materiales.firebasestorage.app",
      messagingSenderId: "721587919055",
      appId: "1:721587919055:web:c6bf064ea1a84ab8bc3fba",
    };

    const app = getClientApps().length > 0 ? getClientApp() : initClientApp(firebaseConfig);
    const db = getFirestore(app);
    const snapshot = await getDoc(doc(db, 'course', 'chapters'));

    if (snapshot.exists() && Array.isArray(snapshot.data().list)) {
      return snapshot.data().list;
    }
  } catch (e) {
    console.warn('Could not load chapters from Firestore, using static fallback:', e);
  }
  return structuredClone(staticChapters) as any[];
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const session = locals.session;

    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden aprobar y publicar cambios a GitHub.' }), { status: 403 });
    }

    const data = await request.json();
    const { chapterId, slug, contentMarkdown, title } = data;

    if (!chapterId || !slug || !contentMarkdown) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), { status: 400 });
    }

    // Load chapters from Firestore (includes dynamically-created and reordered subtemas)
    const chapters = await loadChapters();

    const chData = chapters.find((c: any) => c.number === chapterId);
    if (!chData) {
      return new Response(JSON.stringify({ error: 'Capítulo no encontrado' }), { status: 404 });
    }

    const section = chData.sections.find((s: any) => {
      if (!s.slug) return s.id === slug;
      const parts = s.slug.split('/');
      const shortSlug = parts.length > 1 ? parts[1] : parts[0];
      return s.slug === slug || shortSlug === slug || s.id === slug;
    });

    const chapterFolder = chData.sections.find((s: any) => s.slug?.includes('/'))?.slug?.split('/')[0] 
      || `${chData.number.padStart(2, '0')}-capitulo`;

    let fullSectionSlug: string;
    if (section && section.slug) {
      fullSectionSlug = section.slug.includes('/')
        ? section.slug
        : `${chapterFolder}/${section.slug}`;
    } else {
      const cleanSlug = slug.includes('/') ? slug.split('/')[1] : slug;
      fullSectionSlug = `${chapterFolder}/${cleanSlug}`;
    }

    // El path relativo dentro de src/
    const relativePath = `src/content/resistencia/${fullSectionSlug}/index.mdx`;
    const subtopicTitle = title || section?.title || slug;

    const githubToken = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO;
    const isVercel = Boolean(process.env.VERCEL);

    if (githubToken && githubRepo) {
      // 1. Integración con GitHub con reintento automático en caso de conflicto 409
      // 1.1 Commit del archivo MDX
      const mdxCommit = await commitToGitHubWithRetry({
        filePath: relativePath,
        message: `Actualizado: ${subtopicTitle} desde el Editor Admin`,
        getContent: () => contentMarkdown
      });

      if (!mdxCommit.success) {
        console.error("Error en GitHub API al guardar MDX:", mdxCommit.error);
        return new Response(
          JSON.stringify({ error: `Fallo la conexión con GitHub: ${mdxCommit.error}` }),
          { status: 500 }
        );
      }

      if (isVercel) {
        return new Response(JSON.stringify({ success: true, committedToGitHub: true }), { status: 200 });
      }
    } else if (isVercel) {
      return new Response(
        JSON.stringify({
          error: 'GITHUB_TOKEN y GITHUB_REPO no están configurados en las variables de entorno de Vercel. En producción se requiere GitHub para guardar los cambios.'
        }),
        { status: 500 }
      );
    }

    // 2. Guardar en el disco duro local (Solo en desarrollo local)
    try {
      const sectionDir = path.join(process.cwd(), 'src', 'content', 'resistencia', fullSectionSlug);
      const filePath = path.join(sectionDir, 'index.mdx');

      await fs.mkdir(sectionDir, { recursive: true });
      await fs.writeFile(filePath, contentMarkdown, 'utf-8');

      // Actualizar también localmente lib/chapters.json respetando el orden de Firestore
      const localChaptersPath = path.join(process.cwd(), 'lib', 'chapters.json');
      const localContent = await fs.readFile(localChaptersPath, 'utf-8');
      const localChapters = JSON.parse(localContent);
      let targetLocalCh = localChapters.find((c: any) => c.number === chapterId);
      if (targetLocalCh && chData && Array.isArray(chData.sections)) {
        targetLocalCh.sections = chData.sections.map((fsSec: any) => {
          const isCurrent = (
            fsSec.slug === slug ||
            fsSec.slug === fullSectionSlug ||
            fsSec.id === slug ||
            (fsSec.slug && slug && fsSec.slug.split('/').pop() === slug.split('/').pop())
          );
          const existingInRepo = targetLocalCh.sections?.find((s: any) =>
            s.id === fsSec.id ||
            (s.slug && fsSec.slug && s.slug === fsSec.slug) ||
            (s.slug && fsSec.slug && s.slug.split('/').pop() === fsSec.slug.split('/').pop())
          );
          return {
            id: fsSec.id,
            title: isCurrent ? subtopicTitle : (fsSec.title || existingInRepo?.title || ''),
            slug: isCurrent ? fullSectionSlug : (fsSec.slug || existingInRepo?.slug || null)
          };
        });
        await fs.writeFile(localChaptersPath, JSON.stringify(localChapters, null, 2), 'utf-8');
      }
    } catch (fsErr: any) {
      if (!isVercel) {
        throw fsErr;
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('Error publicando MDX:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
