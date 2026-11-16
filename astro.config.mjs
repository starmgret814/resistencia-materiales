import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react(), mdx()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
    // Portals are used by the lazy Markdown preview. Prebundle this entry before
    // navigation so discovering it later does not invalidate active editor modules.
    optimizeDeps: {
      include: ['react-dom', 'react-dom/client'],
    },
  },
});
