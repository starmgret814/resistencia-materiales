# Estructura editable del curso e historial del editor

Este documento contiene el detalle técnico. La explicación destinada al profesor y el registro de mejoras están en [Informe funcional](informe-funcional.md). Para documentar próximas funciones, utiliza la [plantilla de mejora](plantilla-mejora.md).

La estructura activa está en `course/chapters` de Firestore. `lib/chapters.json` se conserva como catálogo inicial y respaldo de lectura cuando la conexión falla. Crear capítulos desde el panel no exige editar archivos ni desplegar código.

## Responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `lib/course-data.ts` | Tipos, validación de forma y catálogo inicial. |
| `lib/course-structure.ts` | Operaciones puras: crear, renombrar, ordenar, archivar y restaurar; identidades y direcciones estables. |
| `lib/course-structure-store.ts` | Transacciones sobre la estructura actual y los documentos de contenido. |
| `components/course-structure-controls.tsx` | Controles y diálogos de gestión para administradores. |
| `components/dashboard.tsx` | Presentación del catálogo, estados de publicación y coordinación de acciones. |
| `lib/course-service.ts` | Lectura pública de los capítulos activos. |
| `components/markdown-editor.tsx` | Instancia y modelo de Monaco, independientes del diseño de la vista previa. |
| `lib/editor-history.ts` | Inserciones y reemplazos que conservan el historial de deshacer/rehacer. |

## Gestión y permisos

- Administradores: crear, renombrar y ordenar capítulos; archivar y restaurar sus entradas públicas.
- Editores: gestionar las secciones de los capítulos activos que tienen asignados. No pueden renombrar ni reorganizar capítulos completos.
- Archivar conserva todos los documentos; restaurar recupera su entrada en la navegación.
- Los identificadores de capítulo y los slugs no cambian al renombrar o reordenar. Se conservan las direcciones y asignaciones existentes.
- Los números de sección se recalculan por posición. Las direcciones del contenido permanecen estables.
- Los títulos de sección repetidos reciben slugs distintos. Un documento previo en la dirección de destino bloquea la creación para evitar sobrescribirlo.
- Estructura y contenido de una sección se modifican en una misma transacción. Una escritura rechazada conserva el estado anterior completo.
- El panel usa la estructura más reciente dentro de la transacción, en lugar de escribir una copia antigua de toda la lista.

Las reglas de `firestore.rules` comprueban una única entrada modificada por el editor y exigen que todas las demás entradas y su orden permanezcan idénticos. No enumeran posiciones ni dependen del número inicial de capítulos. Deben publicarse en Firebase junto con esta actualización del cliente.

`/api/subchapters` era una sincronización opcional al JSON local. El cliente actual usa el servicio transaccional. El endpoint antiguo devuelve 410 tras comprobar permisos para que los clientes antiguos recarguen; ya no sobrescribe archivos del repositorio.

## Deshacer y rehacer

El editor permanece montado al ampliar o reducir la vista previa. React refleja su texto, pero las actualizaciones externas se aplican mediante `executeEdits`, con límites explícitos de historial. No se usa `setValue` para sincronizar texto, porque reinicia el historial. Guardar una evaluación nueva tampoco cambia la identidad de su modelo.

La importación, recuperación y modificación de encabezados son cambios de texto deshacibles. Las publicaciones, renombrados de metadatos o eliminaciones en la base de datos son operaciones independientes: Ctrl + Z no revierte una publicación ni una eliminación del servidor.

## Verificación

```powershell
npm run test:structure
npm run test:editor-history
npm run test:dashboard
npm run test:exams
npm run test:rules
npm run build
```

Las pruebas de reglas requieren Java y ejecutan un proyecto de demostración local, sin modificar producción. Comprueban permisos con 40 capítulos y el rechazo de cambios fuera del capítulo asignado.

El catálogo continúa sujeto a los límites de tamaño de un documento de Firestore. Para un futuro producto con varios cursos o grandes catálogos, la evolución sería almacenar capítulos como documentos independientes; esta actualización mantiene la compatibilidad con los datos actuales.

## Dependencias del servidor de desarrollo

`astro.config.mjs` separa la caché de dependencias de Vite por comando de Astro (`dev`, `sync`, `build` y `preview`). Las comprobaciones de Astro crean servidores temporales: si comparten caché con el servidor de desarrollo, pueden invalidar los archivos que este ya está sirviendo. Esto produjo respuestas HTTP 504 del módulo de Firestore y dejó el panel con el texto de carga y los controles sin activar.

React y las entradas compartidas de Firebase se preparan al inicio para reducir cambios de optimización al navegar entre pantallas. No se eliminan documentos ni se modifican reglas de acceso para corregir esta incidencia.

Con el servidor de desarrollo activo, ejecutar `npm run test:dev-dependencies` comprueba las cachés independientes y las respuestas de los módulos del panel. Debe pasar también después de ejecutar `npm run build` sin detener ese servidor. Puede usarse `MC361_DEV_URL` para indicar otro puerto local. Esta comprobación de módulos no sustituye una prueba de interacción con una cuenta real en el navegador.
