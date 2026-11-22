import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';
import { fileURLToPath } from 'node:url';

/** @type {import('astro').AstroIntegration} */
const isolatedViteCache = {
  name: 'mc361:isolated-vite-cache',
  hooks: {
    'astro:config:setup': ({ command, updateConfig }) => {
      // Astro check/sync starts a temporary Vite server. Its optimized files
      // must never replace dependencies served by an already running dev server.
      updateConfig({
        vite: { cacheDir: fileURLToPath(new URL(`./node_modules/.vite/mc361-${command}/`, import.meta.url)) },
      });
    },
  },
};

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react(), mdx(), isolatedViteCache],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
    // Prepare shared client dependencies before navigating between workspace
    // screens, rather than rediscovering them when a new editor is opened.
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'lucide-react'],
    },
  },
});
