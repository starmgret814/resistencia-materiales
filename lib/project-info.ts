export interface ProjectMember {
  name: string
  role: string
  area: 'development' | 'content' | 'academic'
  description?: string
  url?: string
}

// Presentación pública del equipo, independiente de sus cuentas y permisos.
// Los nombres se basan en la lista facilitada por el equipo; se pueden completar
// aquí sin exponer correos ni consultar el directorio privado de colaboradores.
export const projectMembers: ProjectMember[] = [
  { name: 'Ing. Eden Angel Molina Capcha', role: 'Profesor y autor del material original', area: 'academic', description: 'Autor de las presentaciones de clase que se adaptan a esta plataforma.' },
  { name: 'Neils Ilizarbe', role: 'Desarrollo de la plataforma', area: 'development' },
  { name: 'Joel Palacios', role: 'Desarrollo de la plataforma', area: 'development' },
  { name: 'Neils Ilizarbe', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 1 · Esfuerzos, falla y factor de seguridad.' },
  { name: 'Renzo Flores', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 2 · Deformaciones y ley de Hooke.' },
  { name: 'Adrián Hildebrandt', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 3 · Cambio de temperatura y problemas hiperestáticos.' },
  { name: 'Renzo Rengifo', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 4 · Transformación de esfuerzos y deformaciones.' },
  { name: 'Joel Palacios', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 5 · Recipientes delgados sujetos a presión.' },
  { name: 'Piero Alva', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 6 · Torsión en ejes circulares.' },
  { name: 'Andrey Barrionuevo', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 7 · Flexión y cortante en vigas.' },
  { name: 'Cristian Muñoz', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 8 · Flexión asimétrica.' },
  { name: 'Anderson Escobar', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 9 · Deflexión por integración directa en vigas.' },
  { name: 'Josué Cruz', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 10 · Funciones de discontinuidad y área momento.' },
  { name: 'Kervin Surichaqui', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 11 · Vigas hiperestáticas.' },
  { name: 'Emilia Rojas', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 12 · Columnas.' },
  { name: 'Raúl Peralta', role: 'Adaptación a la web', area: 'content', description: 'Capítulo 13 · Fórmula de la secante y diseño de columnas.' },
]

export const projectAreas = [
  { id: 'academic', title: 'Autoría del material académico', description: 'Las presentaciones de clase que sirven de base a los capítulos son de autoría del profesor.' },
  { id: 'development', title: 'Desarrollo de la plataforma', description: 'Diseño de la experiencia, programación y mantenimiento de la página y sus herramientas interactivas.' },
  { id: 'content', title: 'Adaptación de contenidos a la web', description: 'Equipo encargado de trasladar y organizar las presentaciones del profesor en el formato de la plataforma, conservando la autoría del material original.' },
] as const

export const projectInfo = {
  title: 'Un espacio para entender, explorar y practicar.',
  description: 'Este proyecto reúne recursos de Resistencia de Materiales para acompañar el estudio de MC361 en la Universidad Nacional de Ingeniería. Combina explicaciones, problemas y herramientas interactivas en una misma plataforma.',
}
