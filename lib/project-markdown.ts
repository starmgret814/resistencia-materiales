import { chapters } from './course-data'

const sources = import.meta.glob<string>('/src/content/resistencia/**/index.mdx', { query: '?raw', import: 'default' })

/** Load only a registered section's bundled source, in development or serverless. */
export async function loadProjectMarkdown(chapterId: string, slug: string): Promise<string | null> {
  const chapter = chapters.find(item => Number(item.number) === Number(chapterId))
  const section = chapter?.sections.find(item => item.id === slug || item.slug === slug || item.slug?.split('/').pop() === slug)
  if (!chapter || !section?.slug) return null
  const folder = chapter.sections.find(item => item.slug?.includes('/'))?.slug?.split('/')[0] || `${chapter.number.padStart(2, '0')}-capitulo`
  const fullSlug = section.slug.includes('/') ? section.slug : `${folder}/${section.slug}`
  const load = sources[`/src/content/resistencia/${fullSlug}/index.mdx`]
  return load ? await load() : null
}
