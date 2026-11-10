export interface ToolField {
  key: string
  label: string
  unit: string
  initial: string
  positive?: boolean
}

export interface ToolResult { label: string; value: number; unit: string }
export interface ToolDefinition {
  id: string
  title: string
  description: string
  formula: string
  assumptions: string
  fields: ToolField[]
  calculate: (values: Record<string, number>) => ToolResult[]
}

const force: ToolField = { key: 'force', label: 'Fuerza axial P', unit: 'kN', initial: '20' }
const area: ToolField = { key: 'area', label: 'Área A', unit: 'mm²', initial: '100', positive: true }

/** Register new tools here; Markdown selects an identifier, never executable code. */
export const interactiveTools: ToolDefinition[] = [
  {
    id: 'esfuerzo-normal', title: 'Esfuerzo normal',
    description: 'Cambia la carga o el área y observa cómo varía el esfuerzo promedio.',
    formula: '\\sigma = \\frac{P}{A}',
    assumptions: 'Carga axial centrada y sección uniforme. Resultado promedio, lejos de concentraciones de esfuerzo.',
    fields: [force, area],
    calculate: ({ force, area }) => [{ label: 'Esfuerzo normal σ', value: force * 1000 / area, unit: 'MPa' }],
  },
  {
    id: 'deformacion-axial', title: 'Deformación axial',
    description: 'Explora cómo la carga, la longitud, el área y el material afectan a una barra.',
    formula: '\\delta = \\frac{PL}{AE} \\qquad \\varepsilon = \\frac{\\delta}{L}',
    assumptions: 'Barra uniforme, comportamiento elástico lineal y pequeñas deformaciones; P, A y E constantes. No incluye pandeo.',
    fields: [force, area, { key: 'length', label: 'Longitud L', unit: 'mm', initial: '1000', positive: true }, { key: 'modulus', label: 'Módulo de Young E', unit: 'GPa', initial: '200', positive: true }],
    calculate: ({ force, area, length, modulus }) => {
      const stress = force * 1000 / area
      const strain = stress / (modulus * 1000)
      return [{ label: 'Deformación δ', value: strain * length, unit: 'mm' }, { label: 'Deformación unitaria ε', value: strain, unit: 'mm/mm' }, { label: 'Esfuerzo normal σ', value: stress, unit: 'MPa' }]
    },
  },
]

export function getInteractiveTool(id: string) {
  return interactiveTools.find(tool => tool.id === id)
}

export function evaluateTool(tool: ToolDefinition, inputs: Record<string, string>): { results: ToolResult[]; errors: Record<string, string> } {
  const values: Record<string, number> = {}
  const errors: Record<string, string> = {}
  for (const field of tool.fields) {
    const text = (inputs[field.key] || '').trim()
    const value = Number(text.replace(',', '.'))
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value)) errors[field.key] = 'Ingresa un número válido.'
    else if (field.positive && value <= 0) errors[field.key] = 'Debe ser mayor que cero.'
    else values[field.key] = value
  }
  if (Object.keys(errors).length) return { results: [], errors }
  const results = tool.calculate(values)
  return results.every(result => Number.isFinite(result.value))
    ? { results, errors }
    : { results: [], errors: { result: 'Los valores son demasiado grandes o pequeños. Revisa los datos.' } }
}
