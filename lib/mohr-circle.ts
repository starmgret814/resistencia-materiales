export type MohrMode = 'stress' | 'strain'
export interface MohrInput { x: number; y: number; shear: number; theta: number }
export interface MohrState {
  average: number
  radius: number
  principal1: number
  principal2: number
  principalAngle: number | null
  principalAngle2: number | null
  rotatedX: number
  rotatedY: number
  rotatedShear: number
  tensorShear: number
  rotatedTensorShear: number
  maxShear: number
}

/** Engineering shear strain gamma is twice the tensor component epsilon_xy. */
export function transformMohr(input: MohrInput, mode: MohrMode): MohrState {
  if (![input.x, input.y, input.shear, input.theta].every(Number.isFinite)) throw new Error('Datos no válidos')
  const factor = mode === 'strain' ? 2 : 1
  const tensorShear = input.shear / factor
  const average = input.x / 2 + input.y / 2
  const difference = input.x / 2 - input.y / 2
  const radius = Math.hypot(difference, tensorShear)
  const angle = (input.theta % 180) * Math.PI / 180
  const cos = Math.cos(2 * angle)
  const sin = Math.sin(2 * angle)
  const rotatedTensorShear = -difference * sin + tensorShear * cos
  // Remove floating-point cancellation noise without erasing genuinely small inputs.
  const normalTolerance = Math.max(Math.abs(average), Math.abs(difference), Math.abs(tensorShear)) * Number.EPSILON * 8
  const shearTolerance = Math.max(Math.abs(difference), Math.abs(tensorShear)) * Number.EPSILON * 8
  const clean = (value: number, tolerance: number) => Math.abs(value) <= tolerance ? 0 : value
  const cleanShear = clean(rotatedTensorShear, shearTolerance)
  const principalAngle = radius > 0 ? 0.5 * Math.atan2(tensorShear, difference) * 180 / Math.PI : null
  return {
    average, radius, tensorShear,
    principal1: average + radius,
    principal2: average - radius,
    principalAngle,
    principalAngle2: principalAngle === null ? null : principalAngle >= 0 ? principalAngle - 90 : principalAngle + 90,
    rotatedX: clean(average + difference * cos + tensorShear * sin, normalTolerance),
    rotatedY: clean(average - difference * cos - tensorShear * sin, normalTolerance),
    rotatedTensorShear: cleanShear,
    rotatedShear: factor * cleanShear,
    maxShear: factor * radius,
  }
}

export type MohrValues = Record<keyof MohrInput, string>

/** Expand the visual range without clamping or changing the physical value. */
export function expandMohrRange(range: number, value: number): number {
  const magnitude = Math.abs(value)
  if (!Number.isFinite(magnitude) || magnitude <= range) return range
  const decade = 10 ** Math.floor(Math.log10(magnitude))
  return Math.min(Number.MAX_VALUE, Math.ceil(magnitude / decade) * decade * 2)
}

export interface ElementArrow {
  key: string
  kind: 'normal' | 'shear'
  from: [number, number]
  to: [number, number]
}

/**
 * Traction directions on opposite faces, in local SVG coordinates (y points down).
 * These are an explanatory drawing, so component magnitude is mapped to a bounded
 * visual length: tiny non-zero components stay visible and very large ones do not
 * crowd the element.
 */
export function elementArrows(state: MohrState, reference: number): ElementArrow[] {
  const scale = Math.max(reference, Math.abs(state.principal1), Math.abs(state.principal2), Math.abs(state.rotatedShear), Number.MIN_VALUE)
  const visualLength = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, Math.abs(value) / scale * maximum))
  const arrows: ElementArrow[] = []
  for (const side of [-1, 1]) {
    for (const axis of ['x', 'y'] as const) {
      const value = axis === 'x' ? state.rotatedX : state.rotatedY
      if (!value) continue
      const length = visualLength(value, 17, 56)
      const inner: [number, number] = axis === 'x' ? [side * 53, 0] : [0, -side * 53]
      const outer: [number, number] = axis === 'x' ? [side * (53 + length), 0] : [0, -side * (53 + length)]
      arrows.push({ key: `${axis}-${side}`, kind: 'normal', from: value > 0 ? inner : outer, to: value > 0 ? outer : inner })
    }
    if (state.rotatedShear) {
      // The green segment has two halves. Its total length uses exactly the
      // same visual map as a normal arrow, preserving equal magnitudes.
      const half = visualLength(state.rotatedShear, 17, 56) / 2
      const sign = Math.sign(state.rotatedShear) * side
      arrows.push({ key: `shear-x-${side}`, kind: 'shear', from: [side * 53, sign * half], to: [side * 53, -sign * half] })
      arrows.push({ key: `shear-y-${side}`, kind: 'shear', from: [-sign * half, -side * 53], to: [sign * half, -side * 53] })
    }
  }
  return arrows
}

/** Accept decimal commas, signed values and scientific notation without imposing slider limits. */
export function parseMohrValues(values: MohrValues, mode: MohrMode): { input?: MohrInput; errors: Partial<Record<keyof MohrInput | 'result', string>> } {
  const input = {} as MohrInput
  const errors: Partial<Record<keyof MohrInput | 'result', string>> = {}
  for (const key of ['x', 'y', 'shear', 'theta'] as const) {
    const text = values[key].trim()
    const value = Number(text.replace(',', '.'))
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value)) errors[key] = 'Escribe un número válido.'
    else input[key] = value
  }
  if (Object.keys(errors).length) return { errors }
  const state = transformMohr(input, mode)
  if (Object.values(state).some(value => value !== null && !Number.isFinite(value)) || !Number.isFinite(state.radius * 2) || (state.radius > 0 && !Number.isFinite(1 / state.radius))) {
    return { errors: { result: 'Estos valores exceden la precisión de cálculo. Usa una escala menor.' } }
  }
  return { input, errors }
}

export const mohrTools = [
  { id: 'mohr-esfuerzos', mode: 'stress', title: 'Círculo de Mohr · Esfuerzos', description: 'Transformación de esfuerzos en el plano xy.', initial: { x: 120, y: -40, shear: 50, theta: 30 } },
  { id: 'mohr-deformaciones', mode: 'strain', title: 'Círculo de Mohr · Deformaciones', description: 'Transformación de deformaciones con cortante ingenieril γxy.', initial: { x: 800, y: -300, shear: 600, theta: 25 } },
] as const
