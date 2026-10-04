import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import chapters from '@/lib/chapters.json';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const sessionCookie = cookies.get('session_token');
    let session = null;
    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie.value);
      } catch (e) {}
    }

    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden aprobar y publicar cambios a GitHub.' }), { status: 403 });
    }

    const data = await request.json();
    const { chapterId, slug, contentMarkdown } = data;

    if (!chapterId || !slug || !contentMarkdown) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), { status: 400 });
    }

    const chData = (chapters as any[]).find((c: any) => c.number === chapterId);
    if (!chData) {
      return new Response(JSON.stringify({ error: 'Capítulo no encontrado' }), { status: 404 });
    }

    const section = chData.sections.find((s: any) => {
      const sSlug = s.slug ? s.slug.split('/')[1] : s.id;
      return sSlug === slug;
    });

    if (!section || !section.slug) {
      return new Response(JSON.stringify({ error: 'Subtema no encontrado' }), { status: 404 });
    }

    // El path relativo dentro de src/
    const relativePath = `src/content/resistencia/${section.slug}/index.mdx`;

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
        const commitRes = await fetch(getUrl, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Actualizado: ${section.title} desde el Editor Admin`,
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
