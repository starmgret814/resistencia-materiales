import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import staticChapters from '@/lib/chapters.json';

/**
 * Load chapters from Firestore first (where dynamically-created subtemas live),
 * falling back to the static chapters.json bundled at build time.
 */
async function loadChapters(): Promise<any[]> {
  try {
    // Use the client-side Firebase SDK via dynamic import to read course/chapters
    // We use a lightweight fetch to the Firestore REST API to avoid importing
    // the full client SDK in a server context.
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
    const { chapterId, slug, contentMarkdown } = data;

    if (!chapterId || !slug || !contentMarkdown) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), { status: 400 });
    }

    // Load chapters from Firestore (includes dynamically-created subtemas)
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

    const githubToken = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO;
    const isVercel = Boolean(process.env.VERCEL);

    if (githubToken && githubRepo) {
      // 1. Integración con GitHub (Requerido en producción Vercel)
      try {
        const getUrl = `https://api.github.com/repos/${githubRepo}/contents/${relativePath}`;
        const headers = {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'resistencia-materiales-app'
        };

        const getRes = await fetch(getUrl, { headers });

        let sha: string | undefined = undefined;
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        // Hacer el commit en GitHub
        const subtopicTitle = section?.title || slug;
        const commitRes = await fetch(getUrl, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Actualizado: ${subtopicTitle} desde el Editor Admin`,
            content: Buffer.from(contentMarkdown).toString('base64'),
            sha: sha
          })
        });

        if (!commitRes.ok) {
          const errData = await commitRes.json();
          console.error("Error en GitHub API:", errData);
          return new Response(
            JSON.stringify({ error: `Error en GitHub API: ${errData.message || JSON.stringify(errData)}` }),
            { status: commitRes.status }
          );
        }

        // Si estamos en Vercel, no intentamos escribir en disco (es read-only)
        if (isVercel) {
          return new Response(JSON.stringify({ success: true, committedToGitHub: true }), { status: 200 });
        }
      } catch (githubErr: any) {
        console.error("Fallo la subida a Github:", githubErr);
        if (isVercel) {
          return new Response(JSON.stringify({ error: `Fallo la conexión con GitHub: ${githubErr.message}` }), { status: 500 });
        }
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
      const sectionDir = path.join(process.cwd(), 'src', 'content', 'resistencia', section.slug);
      const filePath = path.join(sectionDir, 'index.mdx');

      await fs.mkdir(sectionDir, { recursive: true });
      await fs.writeFile(filePath, contentMarkdown, 'utf-8');
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
