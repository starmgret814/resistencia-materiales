/** Previous, unannotated revisions. Only an exact match is eligible for the MDX update. */
const previousRevisions: Record<string, string> = {
  'subtema-inicial': 'b085cca2c6e3d88a780c4409804b143228d31b9ed3c567d4c44999eaf2d19639',
  'fundamentos-del-esfuerzo': '5b3c895872a9a144797ad5e7c146fbd1a7ba9886067368938574a37d35e987ad',
  'resistencia-y-seguridad': '69b6c6efd998a108a6b5267cacbba0f7ff468a24d48c5097077f132abe20a62e',
  problemas: '3c0831c8e6b7eceb270ee561548f56ef343045edf147a704c7a3e7e4b4fe1817',
  xd: 'f97e4b5554dd5009ac3b94f5a189333e07a5fde57d9fae5dd37c834db8e4b24e',
}

export async function matchesPreviousChapterOneRevision(chapterId: string, slug: string, markdown: string): Promise<boolean> {
  const expected = /^0?1$/.test(chapterId) && previousRevisions[slug.split('/').pop() || '']
  if (!expected || typeof markdown !== 'string' || !globalThis.crypto?.subtle) return false
  const normalized = markdown.replace(/\r\n?/g, '\n').trim()
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
  return hash === expected
}
