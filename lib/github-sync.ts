/**
 * Helper to commit files to GitHub with automatic 409 Conflict retry and SHA synchronization.
 */
export async function commitToGitHubWithRetry({
  filePath,
  message,
  getContent,
  maxRetries = 5,
}: {
  filePath: string;
  message: string;
  getContent: (existingContent: string | null) => string;
  maxRetries?: number;
}): Promise<{ success: boolean; error?: string }> {
  const githubToken = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO;

  if (!githubToken || !githubRepo) {
    return { success: false, error: 'Credenciales de GitHub no configuradas' };
  }

  const url = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;
  const headers = {
    'Authorization': `Bearer ${githubToken.trim()}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'resistencia-materiales-app',
    'Content-Type': 'application/json'
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. Obtener el archivo actual y su SHA
      const getRes = await fetch(url, { headers });
      let sha: string | undefined = undefined;
      let existingText: string | null = null;

      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
        if (fileData.content) {
          existingText = Buffer.from(fileData.content, 'base64').toString('utf-8');
        }
      }

      // 2. Generar el nuevo contenido sobre el archivo fresco
      const newText = getContent(existingText);

      // 3. Enviar el commit
      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message,
          content: Buffer.from(newText).toString('base64'),
          sha
        })
      });

      if (putRes.ok) {
        return { success: true };
      }

      // 4. Si hay conflicto 409 o 422 (otro commit se realizó en paralelo o el SHA cambió), esperar y reintentar con el nuevo SHA
      const isConflict = putRes.status === 409 || putRes.status === 422;
      if (isConflict && attempt < maxRetries - 1) {
        const delay = 600 * (attempt + 1) + Math.floor(Math.random() * 300);
        console.warn(`Conflicto (${putRes.status}) en GitHub para ${filePath}, reintentando en ${delay}ms (intento ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      const errData = await putRes.json().catch(() => ({}));
      console.error(`Error de GitHub PUT en ${filePath}:`, errData);
      return { success: false, error: errData.message || putRes.statusText };
    } catch (e: any) {
      console.error(`Excepción en commitToGitHubWithRetry (${filePath}):`, e);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      return { success: false, error: e.message || 'Error de conexión con GitHub' };
    }
  }

  return { success: false, error: 'Excedido el número máximo de reintentos en GitHub' };
}
