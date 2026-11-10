import { useId } from 'react'
import { elementArrows, type MohrInput, type MohrMode, type MohrState } from '@/lib/mohr-circle'

export const originalColor = 'var(--mohr-original)'
export const rotatedColor = 'var(--mohr-rotated)'
export function mohrNumber(value: number, digits = 2) {
  if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e6)) return value.toExponential(2)
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits }).format(Object.is(value, -0) ? 0 : value)
}

/** Frame the circle itself, instead of shrinking it to include a distant zero. */
export function MohrPlot({ input, state, mode }: { input: MohrInput; state: MohrState; mode: MohrMode }) {
  const id = useId().replace(/:/g, '')
  const { average: center, radius } = state
  const span = radius || Math.max(Math.abs(center) * 0.15, 1)
  const cx = 255, cy = 184
  const point = (x: number, y: number) => ({ x: cx + ((x - center) / span) * 140, y: cy + (y / span) * 140 })
  const rawStep = span / 2.5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= rawStep) || rawStep
  const ticks = [-3, -2, -1, 0, 1, 2, 3].map(value => value * step).filter(value => Math.abs(value / span) <= 1.32)
  const x = point(input.x, state.tensorShear), y = point(input.y, -state.tensorShear)
  const xr = point(state.rotatedX, state.rotatedTensorShear), yr = point(state.rotatedY, -state.rotatedTensorShear)
  const zeroVisible = Math.abs(center / span) < 1.35
  const zeroX = zeroVisible ? point(0, 0).x : 40
  const phi = Math.atan2(state.tensorShear, input.x - center)
  const turn = (input.theta % 180) * Math.PI / 180
  const arcRadius = radius ? 43 : 0
  const arc = Array.from({ length: 91 }, (_, i) => {
    const angle = phi - 2 * turn * i / 90
    return `${i ? 'L' : 'M'}${cx + arcRadius * Math.cos(angle)},${cy + arcRadius * Math.sin(angle)}`
  }).join(' ')
  const vertical = mode === 'stress' ? 'τ (MPa)' : 'γ/2 (µε)'
  const normalSymbol = mode === 'stress' ? 'σ' : 'ε'
  const shearSymbol = mode === 'stress' ? 'τxy' : 'γxy/2'
  const principalArc = Array.from({ length: 61 }, (_, i) => {
    const angle = phi * i / 60
    return `L${cx + 58 * Math.cos(angle)},${cy + 58 * Math.sin(angle)}`
  }).join(' ')
  const coincidentPoints = Math.abs(turn) < 1e-12
  const annotations = coincidentPoints
    ? [
      { p: x, label: 'A = A′', color: originalColor, offset: -18 },
      { p: y, label: 'B = B′', color: originalColor, offset: 18 },
    ]
    : [
      { p: x, label: 'A', color: originalColor, offset: -18 },
      { p: y, label: 'B', color: originalColor, offset: 18 },
      { p: xr, label: 'A′', color: rotatedColor, offset: 18 },
      { p: yr, label: 'B′', color: rotatedColor, offset: -18 },
    ]
  // Put the label just outside the circle along the radius. This keeps it close
  // to its point without drawing over the curve or requiring leader lines.
  const placedLabels = annotations.map(item => {
    const dx = item.p.x - cx, dy = item.p.y - cy
    const distance = Math.hypot(dx, dy) || 1
    const horizontal = Math.abs(dx) >= Math.abs(dy)
    // Near either vertical edge, an outward label would collide with the axis
    // title or numerical x-axis. Put it beside the point instead.
    if (Math.abs(dy) > 88) {
      const right = dx >= 0
      return {
        ...item,
        x: item.p.x + (right ? 20 : -20),
        // Keeping top labels below the point also clears the vertical-axis title.
        y: item.p.y + (dy > 0 ? 4 : 16),
        anchor: right ? 'start' as const : 'end' as const,
      }
    }
    return {
      ...item,
      x: item.p.x + dx / distance * 16,
      y: item.p.y + dy / distance * 16 + (horizontal ? item.offset * 0.18 : item.offset),
      anchor: dx >= 0 ? 'start' as const : 'end' as const,
    }
  })
  return <div className="mohr-plot">
    <svg viewBox="0 0 510 380" className="block w-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{`Círculo de Mohr de ${mode === 'stress' ? 'esfuerzos' : 'deformaciones'}`}</title>
      <desc id={`${id}-desc`}>Centro {mohrNumber(center)}, radio {mohrNumber(radius)}. Escala igual en ambos ejes y eje vertical positivo hacia abajo. Estado girado {mohrNumber(input.theta)} grados. {zeroVisible ? '' : 'El cero horizontal queda fuera de la vista ampliada.'}</desc>
      <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke={rotatedColor} strokeWidth="1.2" /></marker></defs>
      <g className="mohr-grid" strokeWidth="0.7">{ticks.map(tick => <g key={tick}><line x1={cx + tick / span * 140} y1="34" x2={cx + tick / span * 140} y2="334" /><line x1="63" y1={cy + tick / span * 140} x2="447" y2={cy + tick / span * 140} /></g>)}</g>
      <g stroke="currentColor" opacity="0.35" fill="none"><path d={`M55,${cy} H457 l-6,-4 m6,4 l-6,4`} />{zeroVisible && <path d={`M${zeroX},30 V340 l-4,-6 m4,6 l4,-6`} />}</g>
      <g fill="currentColor" fontSize="13" opacity="0.8">{ticks.map(tick => <g key={tick}><text x={cx + tick / span * 140} y="353" textAnchor="middle">{mohrNumber(center + tick)}</text><text x="55" y={cy + tick / span * 140 + 4} textAnchor="end">{mohrNumber(tick)}</text></g>)}</g>
      <g fill="currentColor" fontSize="15"><text x="447" y="375" textAnchor="end">{mode === 'stress' ? 'σ (MPa)' : 'ε (µε)'}</text><text x="63" y="20">{vertical} · positivo ↓</text></g>
      <circle cx={cx} cy={cy} r={radius / span * 140} fill="none" className="mohr-circle-line" strokeWidth="2.2" />
      {radius > 0 && <>
        <line x1="63" y1={cy + 140} x2="447" y2={cy + 140} stroke={originalColor} strokeDasharray="5 4" strokeWidth="1.4" />
        <text x="445" y={cy + 132} textAnchor="end" fill={originalColor} fontSize="14">{mode === 'stress' ? 'τmáx = R' : 'γmáx/2 = R'}</text>
        {Math.abs(phi) > 1e-12 && <><path d={`M${cx},${cy} L${cx + 58},${cy} ${principalArc} Z`} className="mohr-principal-sector" strokeWidth="1" /><text x={cx + 84 * Math.cos(phi / 2)} y={cy + 84 * Math.sin(phi / 2)} textAnchor="middle" className="mohr-principal-text" fontSize="15" fontWeight="600">2θp₁</text></>}
      </>}
      <line x1={x.x} y1={x.y} x2={y.x} y2={y.y} stroke={originalColor} strokeWidth="1.8" strokeDasharray="5 4" />
      <line x1={xr.x} y1={xr.y} x2={yr.x} y2={yr.y} stroke={rotatedColor} strokeWidth="2.2" />
      {radius > 0 && Math.abs(turn) > 1e-12 && <><path d={arc} fill="none" stroke={rotatedColor} strokeWidth="1.4" markerEnd={`url(#${id}-arrow)`} /><text x={cx + 57} y={cy - 53} fill={rotatedColor} fontSize="14" fontWeight="600">2θ = {mohrNumber((input.theta % 180) * 2)}°</text></>}
      {[{ p: x, color: originalColor }, { p: y, color: originalColor }, { p: xr, color: rotatedColor }, { p: yr, color: rotatedColor }].map(({ p, color }, index) => <circle key={index} cx={p.x} cy={p.y} r="4.5" fill={color} stroke="var(--mohr-point-outline)" strokeWidth="1.5" />)}
      {placedLabels.map(({ label, color, x, y, anchor }) => <text key={label} x={x} y={y + 5} textAnchor={anchor} fontSize="17" fontWeight="600" fill={color}>{label}</text>)}
      <circle cx={cx} cy={cy} r="3" fill="currentColor" /><text x={cx + 8} y={cy - 12} fill="currentColor" fontSize="15" fontWeight="600">C · {normalSymbol}prom</text>
      {radius > 0 && [state.principal1, state.principal2].map((value, index) => { const p = point(value, 0); const right = index === 0; return <g key={index}><circle cx={p.x} cy={cy} r="3" fill="currentColor" /><text x={p.x + (right ? 11 : -11)} y={cy - 12} textAnchor={right ? 'start' : 'end'} fill="currentColor" fontSize="16" fontWeight="600">{mode === 'stress' ? 'σ' : 'ε'}{index + 1}</text></g> })}
    </svg>
  </div>
}

export function RotatedElement({ angle, state, mode, scale }: { angle: number; state: MohrState; mode: MohrMode; scale: number }) {
  const id = useId().replace(/:/g, '')
  const rotation = -(angle % 360)
  const rad = rotation * Math.PI / 180
  const position = (x: number, y: number) => ({ x: x * Math.cos(rad) - y * Math.sin(rad), y: x * Math.sin(rad) + y * Math.cos(rad) })
  const reference = Math.max(scale, Math.abs(state.principal1), Math.abs(state.principal2), Math.abs(state.rotatedShear))
  const symbol = mode === 'stress' ? 'σ' : 'ε'
  const normal = 'var(--mohr-normal)', shear = 'var(--mohr-shear)'
  const arrows = elementArrows(state, scale)
  const arrow = (key: string) => arrows.find(item => item.key === key)
  type DiagramPoint = { x: number; y: number }
  const distanceToSegment = (point: DiagramPoint, from: DiagramPoint, to: DiagramPoint) => {
    const dx = to.x - from.x, dy = to.y - from.y
    const ratio = dx || dy ? Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy))) : 0
    return Math.hypot(point.x - (from.x + ratio * dx), point.y - (from.y + ratio * dy))
  }
  const arrowSegments = arrows.map(item => ({ from: position(item.from[0], item.from[1]), to: position(item.to[0], item.to[1]) }))
  const labels: { text: string; p: DiagramPoint; color: string }[] = []
  // Pick the safest of several local positions. Scoring occurs after rotation,
  // against every arrow, both fixed axes and labels already placed.
  const placeAtCandidates = (text: string, color: string, candidates: DiagramPoint[]) => {
    const score = (point: DiagramPoint) => Math.min(
      ...arrowSegments.map(segment => distanceToSegment(point, segment.from, segment.to) - 13),
      Math.abs(point.x) - 14,
      Math.abs(point.y) - 14,
      ...labels.map(label => Math.hypot(point.x - label.p.x, point.y - label.p.y) - 32),
    )
    const p = candidates.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best)
    labels.push({ text, p, color })
  }
  const placeLabel = (key: string, text: string, color: string, shifts: [number, number][]) => {
    const item = arrow(key)
    if (!item) return
    placeAtCandidates(text, color, shifts.map(([shiftX, shiftY]) => position(item.to[0] + shiftX, item.to[1] + shiftY)))
  }
  // Shear labels may only sit by an arrowhead or its tail—never beside the
  // middle of the green segment where they can cross a normal arrow.
  const placeShearLabel = (key: string, text: string) => {
    const item = arrow(key)
    if (!item) return
    const dx = item.to[0] - item.from[0], dy = item.to[1] - item.from[1]
    const length = Math.hypot(dx, dy) || 1
    const along: [number, number] = [dx / length, dy / length]
    const perpendicular: [number, number] = [-along[1], along[0]]
    const endpoint = (base: [number, number], alongOffset: number, sideOffset: number): [number, number] => [
      base[0] + along[0] * alongOffset + perpendicular[0] * sideOffset,
      base[1] + along[1] * alongOffset + perpendicular[1] * sideOffset,
    ]
    const localCandidates = [
      endpoint(item.to, 8, 12), endpoint(item.to, 8, -12),
      endpoint(item.from, -8, 12), endpoint(item.from, -8, -12),
    ].filter(point => Math.abs(point[0]) >= 63 || Math.abs(point[1]) >= 63)
    placeAtCandidates(text, shear, localCandidates.map(point => position(point[0], point[1])))
  }
  // Deliberately use three separate faces: normal-x, normal-y and shear-y.
  // Keep candidates close to the head, but always on the outside of its face.
  placeLabel('x-1', `${symbol}x′`, normal, [[12, -12], [12, 12], [16, 0]])
  placeLabel('y-1', `${symbol}y′`, normal, [[12, -12], [-12, -12], [0, -16]])
  // Under y′ compression, the bottom shear label can converge with the inward
  // normal arrow at small rotations. Use the opposite shear face instead.
  const shearText = mode === 'stress' ? 'τx′y′' : 'γx′y′'
  if (state.rotatedY < 0) placeShearLabel('shear-x--1', shearText)
  else placeShearLabel('shear-y--1', shearText)
  const thetaArcRadius = 28
  const arc = Array.from({ length: 46 }, (_, i) => { const a = rad * i / 45; return `${i ? 'L' : 'M'}${thetaArcRadius * Math.cos(a)},${thetaArcRadius * Math.sin(a)}` }).join(' ')
  const thetaLabel = { x: 32 * Math.cos(rad / 2), y: 32 * Math.sin(rad / 2) }
  return <div className="mohr-element min-w-0">
    <p className="text-center text-xs font-semibold">Elemento girado · θ = {mohrNumber(angle)}°</p>
    <svg viewBox="-130 -130 260 260" className="mx-auto block w-full max-w-[320px]" role="img" aria-labelledby={`${id}-element-title ${id}-element-desc`}>
      <title id={`${id}-element-title`}>{`Elemento girado ${mohrNumber(angle)} grados`}</title>
      <desc id={`${id}-element-desc`}>Las flechas normales y cortantes cambian de dirección y longitud con las componentes del estado girado. Componente x: {mohrNumber(state.rotatedX)}, componente y: {mohrNumber(state.rotatedY)}, cortante: {mohrNumber(state.rotatedShear)}.</desc>
      <defs>{[['normal', normal], ['shear', shear]].map(([name, color]) => <marker key={name} id={`${id}-${name}`} markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" fill={color} /></marker>)}</defs>
      <g stroke="currentColor" opacity="0.22"><line x1="-112" y1="0" x2="112" y2="0" /><line x1="0" y1="112" x2="0" y2="-112" /><rect x="-45" y="-45" width="90" height="90" fill="none" strokeDasharray="3 3" /></g>
      <g fill="currentColor" fontSize="14" opacity="0.7"><text x="114" y="13">x</text><text x="8" y="-114">y</text></g>
      <g transform={`rotate(${rotation})`}>
        <rect x="-45" y="-45" width="90" height="90" className="mohr-element-square" strokeWidth="1.8" />
        <g stroke="currentColor" strokeDasharray="3 2" opacity="0.5"><line x1="0" y1="0" x2="31" y2="0" /><line x1="0" y1="0" x2="0" y2="-31" /></g>
        {arrows.map(arrow => <line key={arrow.key} data-component={arrow.key} x1={arrow.from[0]} y1={arrow.from[1]} x2={arrow.to[0]} y2={arrow.to[1]} stroke={arrow.kind === 'normal' ? normal : shear} strokeWidth="2.15" strokeLinecap="round" markerEnd={`url(#${id}-${arrow.kind})`} />)}
      </g>
      {[{ text: 'x′', p: position(25, -5) }, { text: 'y′', p: position(6, -25) }].map(label => <text key={label.text} x={label.p.x} y={label.p.y} fontSize="13" fill="currentColor">{label.text}</text>)}
      {labels.map(label => <text key={label.text} x={label.p.x} y={label.p.y} textAnchor="middle" fontSize="13" fill={label.color}>{label.text}</text>)}
      {Math.abs(rad) > 1e-12 && <><line x1="0" y1="0" x2={thetaArcRadius + 7} y2="0" stroke="currentColor" strokeWidth="1.1" opacity="0.8" /><path d={arc} fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.85" /><text x={thetaLabel.x} y={thetaLabel.y} textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontSize="12">θ</text></>}
    </svg>
    <p className="text-center text-[10px] text-[#866b6b] dark:text-[#cbb0ae]">Escala visual: {mohrNumber(reference)} {mode === 'stress' ? 'MPa' : 'µε'}</p>
    {mode === 'strain' && <p className="text-center text-[10px] text-[#866b6b] dark:text-[#cbb0ae]">Flechas de deformación, no de fuerza.</p>}
  </div>
}
