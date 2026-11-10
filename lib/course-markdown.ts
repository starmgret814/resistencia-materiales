function attribute(source: string, name: string): string {
  return source.match(new RegExp(`${name}=["']([^"']*)["']`))?.[1]
    || source.match(new RegExp(`${name}=\\{([^}]*)\\}`))?.[1]
    || ''
}

export function normalizeLegacyMdx(markdown: string): string {
  // Examples of components inside fenced code must remain literal Markdown.
  const fenced: string[] = []
  markdown = markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[ \t]*$/gm, block => {
    fenced.push(block)
    return `COURSECODEBLOCK${fenced.length - 1}END`
  })
  // Text copied from chats/editors commonly escapes Markdown punctuation and inserts space entities.
  let normalized = markdown
    .replace(/&#x20;|&nbsp;/gi, ' ')
    .replace(/\\([#*<>_])/g, '$1')

  normalized = normalized.replace(/<Tool\b([^>]*?)\s*\/>/gi, (_match, attrs) => {
    const id = attribute(attrs, 'id')
    const title = attribute(attrs, 'title')
    const properties = `id="${id.replace(/"/g, '&quot;')}"${title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''}`
    return `\n\n::tool{${properties}}\n\n`
  })

  normalized = normalized.replace(/<(Solution)\s*>\s*([\s\S]*?)\s*<\/\1>/gi, (_match, _tag, body) => `:::solution\n${body.trim()}\n:::`)

  normalized = normalized.replace(/<Image\b([\s\S]*?)\/>/gi, (_match, attrs) => {
    const src = attribute(attrs, 'src')
    const alt = attribute(attrs, 'alt') || 'Imagen del curso'
    const caption = attribute(attrs, 'caption').replace(/"/g, "'")
    const width = attribute(attrs, 'width')
    const height = attribute(attrs, 'height')
    const size = attribute(attrs, 'size')
    const align = attribute(attrs, 'align')

    if (width || height || size || align) {
      let props = `src="${src}" alt="${alt}"`
      if (caption) props += ` caption="${caption}"`
      if (width) props += ` width="${width}"`
      if (height) props += ` height="${height}"`
      if (size) props += ` size="${size}"`
      if (align) props += ` align="${align}"`
      return `:::image{${props}}\n:::`
    }

    return src ? `![${alt}](${src}${caption ? ` "${caption}"` : ''})` : ''
  })

  normalized = normalized.replace(/<ImageGrid([^>]*)>\s*([\s\S]*?)\s*<\/ImageGrid>/gi, (_match, attrs, body) => {
    const columns = attribute(attrs, 'columns') || '2'
    return `::::imagegrid{columns="${columns}"}\n${body.trim()}\n::::`
  })

  normalized = normalized.replace(/<Quiz([^>]*)>\s*([\s\S]*?)\s*<\/Quiz>/gi, (_match, attrs, body) => {
    const question = attribute(attrs, 'question') || 'Pregunta'
    return `:::quiz{question="${question}"}\n${body.trim()}\n:::`
  })

  normalized = normalized.replace(/<TableGrid\b([^>]*)>\s*([\s\S]*?)\s*<\/TableGrid>/gi, (_match, attrs, body) => {
    const columns = attribute(attrs, 'columns') || '2'
    return `\n\n:::::tablegrid{columns="${columns}"}\n\n${body.trim()}\n\n:::::\n\n`
  })

  normalized = normalized.replace(/<Table([^>]*)>\s*([\s\S]*?)\s*<\/Table>/gi, (_match, attrs, body) => {
    const title = attribute(attrs, 'title') || attribute(attrs, 'caption')
    const options = { title, align: attribute(attrs, 'align'), width: attribute(attrs, 'width'), columnWidths: attribute(attrs, 'columnWidths'), position: attribute(attrs, 'position') }
    const properties = Object.entries(options).filter(([, value]) => value).map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`).join(' ')
    return `\n\n::::table{${properties}}\n\n${body.trim()}\n\n::::\n\n`
  })

  for (const tag of ['Definition', 'Note', 'Example', 'Problem', 'Summary']) {
    const pattern = new RegExp(`<(${tag})([^>]*)>\\s*([\\s\\S]*?)\\s*<\\/${tag}>`, 'gi')
    normalized = normalized.replace(pattern, (_match, _name, attrs, body) => {
      const kind = tag.toLowerCase()
      const title = attribute(attrs, 'title')
      const number = attribute(attrs, 'number')
      const options = { title, number, image: attribute(attrs, 'image'), imageAlt: attribute(attrs, 'imageAlt'), imageCaption: attribute(attrs, 'imageCaption'), imageWidth: attribute(attrs, 'imageWidth'), imagePosition: attribute(attrs, 'imagePosition') }
      const properties = Object.entries(options).filter(([, value]) => value).map(([key, value]) => `${key}="${value.replace(/"/g, '&quot;')}"`).join(' ')
      return `\n\n::::${kind}${properties ? `{${properties}}` : ''}\n\n${body.trim()}\n\n::::\n\n`
    })
  }

  normalized = normalized.replace(/<Formula([^>]*)>\s*([\s\S]*?)\s*<\/Formula>/gi, (_match, attrs, body) => {
    const label = attribute(attrs, 'label')
    const latex = body.trim().replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '')
    return `:::formula${label ? `{title="${label}"}` : ''}\n$$\n${latex}\n$$\n:::`
  })

  return normalized.replace(/COURSECODEBLOCK(\d+)END/g, (_match, index) => fenced[Number(index)])
}

