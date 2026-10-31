export const examTypes = [
  { id: 'practica', label: 'Práctica calificada' },
  { id: 'parcial', label: 'Examen parcial' },
  { id: 'final', label: 'Examen final' },
  { id: 'sustitutorio', label: 'Examen sustitutorio' },
] as const

export interface PastExam {
  id: string
  period: string
  type: typeof examTypes[number]['id']
  title: string
  contentMarkdown: string
}

export function validExam(value: unknown): value is Omit<PastExam, 'id'> {
  if (!value || typeof value !== 'object') return false
  const exam = value as PastExam
  if (!/^\d{4}-[12]$/.test(exam.period) || !examTypes.some(type => type.id === exam.type)) return false
  if (typeof exam.title !== 'string' || !exam.title.trim() || exam.title.length > 160) return false
  return typeof exam.contentMarkdown === 'string' && exam.contentMarkdown.trim().length > 0 && exam.contentMarkdown.length <= 200000
}

export function examPeriods(exams: PastExam[]) {
  return [...new Set(['2026-2', '2026-1', '2025-2', '2025-1', ...exams.map(exam => exam.period)])].sort().reverse()
}
