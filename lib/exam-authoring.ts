export const examSnippets = [
  { id: 'problem', label: 'Problema', content: '\n\n<Problem title="Título del problema">\n\nEscribe el enunciado aquí.\n\n<Solution>\n\nEscribe la solución aquí.\n\n</Solution>\n\n</Problem>\n' },
  { id: 'formula', label: 'Fórmula', content: '\n\n<Formula>\n\n$$\n\\sigma = \\frac{P}{A}\n$$\n\n</Formula>\n' },
  { id: 'image', label: 'Imagen', content: '\n\n<Image src="/imagenes/figura.png" alt="Descripción de la figura" caption="Figura del problema" />\n' },
  { id: 'table', label: 'Tabla', content: '\n\n| Dato | Valor | Unidad |\n| :--- | :---: | :---: |\n| Carga | 20 | kN |\n' },
] as const

/** Validate before replacing the document; never interpret imported files as code. */
export function validateExamImport(name: string, bytes: number, text: string): string {
  if (!/\.(md|mdx|markdown)$/i.test(name)) throw new Error('Selecciona un archivo Markdown (.md, .mdx o .markdown).')
  if (bytes > 800000) throw new Error('El archivo es demasiado grande. El límite es de 200 000 caracteres.')
  const content = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()
  if (!content || content.includes('\0')) throw new Error('El archivo no contiene texto Markdown válido.')
  if (content.length > 200000) throw new Error('El contenido supera el límite de 200 000 caracteres.')
  return content
}
