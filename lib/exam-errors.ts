export interface ExamFailure { code: string; message: string }

export function examFailure(cause: unknown, operation: 'load' | 'save' | 'remove'): ExamFailure {
  const raw = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
  const code = raw.replace(/^firestore\//, '')
  if (code === 'permission-denied') return {
    code,
    message: operation === 'load'
      ? 'Firestore rechazó la lectura de los exámenes. Un administrador del proyecto Firebase debe revisar las reglas publicadas para la colección exams.'
      : operation === 'save'
        ? 'Firestore rechazó la publicación. Comprueba que tu cuenta sea administradora y que las reglas publicadas permitan escribir en exams. Tu contenido sigue en el editor.'
        : 'Firestore rechazó la eliminación. Comprueba los permisos de administrador y las reglas publicadas para exams.',
  }
  if (code === 'unauthenticated') return { code, message: 'La sesión de Firebase no es válida. Guarda una copia de tu texto e inicia sesión nuevamente.' }
  if (code === 'unavailable' || code === 'deadline-exceeded') return { code, message: 'No se pudo conectar con Firestore. Comprueba tu conexión y vuelve a intentarlo. Tu contenido sigue en el editor.' }
  if (code === 'resource-exhausted') return { code, message: 'Firestore alcanzó un límite de uso. Conserva una copia de tu texto e inténtalo de nuevo más tarde.' }
  return { code: /^[a-z-]{1,60}$/.test(code) ? code : 'unknown', message: operation === 'load' ? 'No se pudieron consultar los exámenes. Vuelve a intentarlo.' : operation === 'save' ? 'No se pudo publicar la evaluación. Tu contenido sigue en el editor.' : 'No se pudo eliminar la evaluación.' }
}
