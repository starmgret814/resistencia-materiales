export const CONTENT_SCHEMA_VERSION = 2 as const

export interface CourseDocument {
  schemaVersion: typeof CONTENT_SCHEMA_VERSION
  title: string
  chapterId: string
  slug: string
  summary?: string
  contentMarkdown: string
}

export interface ValidationResult {
  success: boolean
  document?: CourseDocument
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function titleFromMarkdown(markdown: string): string {
  return markdown.match(/^\\?#\s+(.+)$/m)?.[1]?.trim().replace(/\\([#*<>_])/g, '$1') || 'Página sin título'
}

export function slugify(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function validateCourseDocument(value: unknown): ValidationResult {
  if (!isRecord(value)) return { success: false, errors: ['El contenido debe ser un objeto JSON.'] }

  const errors: string[] = []
  const contentMarkdown = text(value.contentMarkdown)
  if (!contentMarkdown) errors.push('contentMarkdown debe contener el texto Markdown de la página.')
  const inferredTitle = contentMarkdown ? titleFromMarkdown(contentMarkdown) : ''
  const title = text(value.title) || inferredTitle
  const chapterId = text(value.chapterId)
  const slug = text(value.slug)
  if (!title) errors.push('title es obligatorio.')
  if (!chapterId) errors.push('chapterId es obligatorio.')
  if (!slug) errors.push('slug es obligatorio.')
  else if (!/^[a-z0-9_./-]+$/i.test(slug)) errors.push('slug contiene caracteres inválidos.')
  if (errors.length) return { success: false, errors }

  return {
    success: true,
    errors: [],
    document: {
      schemaVersion: CONTENT_SCHEMA_VERSION,
      title,
      chapterId,
      slug,
      summary: text(value.summary) || undefined,
      contentMarkdown,
    },
  }
}

export const starterDocument: CourseDocument = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  title: 'Nueva página',
  chapterId: '01',
  slug: 'nueva-pagina',
  summary: 'Página creada desde el editor Markdown.',
  contentMarkdown: `# Nueva página

Empieza a escribir aquí usando **Markdown normal**.

## Concepto principal

Puedes usar listas:

- Primer elemento
- Segundo elemento

Y ecuaciones con LaTeX:

$$
\\sigma = \\frac{P}{A}
$$

<Definition title="Definición">
Escribe aquí una definición importante.
</Definition>
`,
}
