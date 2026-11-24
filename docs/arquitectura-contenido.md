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
| `lib/content-review.ts` | Identidad de revisión, comparación de bases y validación del resultado. |
| `src/pages/api/content-review.ts` | Base de comparación sin caché, exclusiva de administradores. |
| `lib/content-publication.ts` | Guardado que conserva la publicación y aprobación transaccional de una revisión. |
| `components/content-review.tsx` | Diferencias de fuente y vista antes/después; confirmación y recarga ante conflictos. |
| `lib/content-review-editor.ts` | Opciones compartidas de ancho, tipografía, ajuste de líneas y desplazamiento de ambos paneles. |
| `components/review-source-pane.tsx` | Modelos de solo lectura con desplazamiento independiente y resaltado de cambios. |
| `lib/markdown-editor-theme.ts` | Tema compartido entre el editor y el comparador Monaco. |

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
npm run test:content-review
npm run test:dashboard
npm run test:exams
npm run test:rules
npm run build
```

Las pruebas de reglas requieren Java y ejecutan un proyecto de demostración local, sin modificar producción. Comprueban permisos con 40 capítulos y el rechazo de cambios fuera del capítulo asignado.

El catálogo continúa sujeto a los límites de tamaño de un documento de Firestore. Para un futuro producto con varios cursos o grandes catálogos, la evolución sería almacenar capítulos como documentos independientes; esta actualización mantiene la compatibilidad con los datos actuales.

## Comparación antes de aprobar

La revisión se realiza por sección. El endpoint obtiene el catálogo y documento desde el servidor y utiliza la misma resolución de contenido aprobado que la ruta pública, incluido el puente de revisiones antiguas hacia su MDX efectivo. No toma el borrador pendiente como base publicada. Un error de lectura devuelve 503 y bloquea la confirmación; solo una ausencia comprobada se representa como contenido nuevo.

La propuesta se fija al abrir la revisión. Es una vista del espacio de trabajo a todo el ancho, sin overlay, diálogo modal ni límite de 1600 px. El editor original se oculta mediante CSS y permanece montado, para conservar su modelo y Deshacer. Al volver se recupera el foco en «Revisar cambios» y se recalcula el tamaño del editor.

El comparador Monaco utiliza modelos independientes y de solo lectura, con identidades distintas del modelo editable. Ambos paneles tienen opciones idénticas de tipografía y ajuste. Se establece `diffWordWrap` además de `wordWrap` y sus overrides: configurar solo `wordWrap` había dejado un panel sin ajuste. La opción «Ajustar líneas» controla ambos paneles y conserva también la elección si cambia antes de terminar la carga de Monaco. Sin ajuste, ambos admiten scroll horizontal. En escritorio la separación es 50/50; en pantallas estrechas se usa la vista unificada. Referencia: [opciones oficiales de Monaco DiffEditor](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IDiffEditorOptions.html).

La vista académica usa el renderizador existente, el slug de la sección para imágenes relativas y la numeración actual del curso.

### Desplazamiento de la comparación de fuente

«Cambios resaltados» conserva por defecto el comparador sincronizado de Monaco. En dos columnas puede desactivarse «Sincronizar desplazamiento». Como la API pública del comparador no ofrece una opción de desplazamiento independiente, se utilizan dos editores de solo lectura con modelos separados; no se modifican propiedades privadas ni se intenta contrarrestar sus eventos de scroll.

El comparador sigue montado, con su tamaño real pero invisible y sin interacción, para calcular las diferencias. Sus APIs públicas [`getLineChanges` y `onDidUpdateDiff`](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor_editor_api.editor.IDiffEditor.html) proporcionan los rangos de líneas y caracteres para las decoraciones de los paneles independientes. Se respetan los marcadores de inserción o eliminación sin contenido en uno de los lados. Las suscripciones y modelos se liberan al desmontar sus vistas.

Se capturan la primera línea visible y el desplazamiento horizontal de cada lado al separar los paneles. Sus eventos solo actualizan su propia posición; no hay escritura de scroll en el otro editor. Al sincronizar de nuevo se recupera la ubicación del último lado desplazado y Monaco vuelve a alinear la comparación. «Ajustar líneas» sigue aplicándose a ambos. En pantallas estrechas se mantiene la vista unificada y no se ofrece un control de sincronización sin dos columnas. Esta opción pertenece a la comparación de fuente; no modifica el desplazamiento de «Vista de la página» ni el texto editable o su historial.

La base contiene una huella SHA-256 de los campos de borrador y publicación; no incluye correos de colaboradores. Antes de publicar se vuelve a consultar la base pública y se comprueba también el título y la numeración vigentes. Dentro de la transacción se compara de nuevo la huella del documento. Un cambio entre lectura y escritura provoca rechazo, incluso cuando Firestore reintenta la transacción.

El editor ofrece dos acciones independientes: «Revisar cambios» y «Publicar». La segunda no abre la comparación: obtiene una base reciente y utiliza la misma transacción protegida. La publicación desde la revisión también exige que la base recién obtenida coincida con la que se mostró al administrador. Ambas rutas comparten un bloqueo de solicitudes simultáneas; un error permite reintentar y se muestra en la revisión o en el editor según la ruta utilizada.

Actualizar una base cuyo documento cambió no autoriza a sobrescribir la nueva edición con una propuesta antigua. El administrador debe cargar expresamente el borrador actual. Esa carga utiliza los mecanismos de reemplazo que conservan el historial del editor. Los fallos de publicación permanecen visibles en la ventana y requieren actualizar la comparación para reintentar.

El guardado de borradores separa la copia pública de aprobaciones antiguas antes de cambiar su estado. Los campos que se escriben se seleccionan explícitamente: un objeto cargado de Firestore puede contener metadatos de publicación antiguos, que no deben regresar al servidor al guardar un borrador. Se preserva el autor original cuando un administrador colabora sobre un documento existente.

No hay nueva colección ni historial de versiones. Las lecturas ocurren al abrir, actualizar y confirmar, más las necesarias para la numeración; no en cada edición. La sincronización secundaria con GitHub sigue siendo la existente y ocurre después de la publicación, nunca por abrir una comparación. El control de acceso del endpoint se comprueba en el middleware y en la ruta; las escrituras siguen sujetas a las reglas de Firestore existentes.

## Dependencias del servidor de desarrollo

`astro.config.mjs` separa la caché de dependencias de Vite por comando de Astro (`dev`, `sync`, `build` y `preview`). Las comprobaciones de Astro crean servidores temporales: si comparten caché con el servidor de desarrollo, pueden invalidar los archivos que este ya está sirviendo. Esto produjo respuestas HTTP 504 del módulo de Firestore y dejó el panel con el texto de carga y los controles sin activar.

React y las entradas compartidas de Firebase se preparan al inicio para reducir cambios de optimización al navegar entre pantallas. No se eliminan documentos ni se modifican reglas de acceso para corregir esta incidencia.

Con el servidor de desarrollo activo, ejecutar `npm run test:dev-dependencies` comprueba las cachés independientes y las respuestas de los módulos del panel. Debe pasar también después de ejecutar `npm run build` sin detener ese servidor. Puede usarse `MC361_DEV_URL` para indicar otro puerto local. Esta comprobación de módulos no sustituye una prueba de interacción con una cuenta real en el navegador.

## Guías según el rol

La ruta pública prerenderizada `/guia-colaboradores` y `GUIA_COLABORADORES.md` contienen instrucciones y novedades para redactar, dar formato, recuperar avances, organizar subtemas asignados y solicitar revisión. Los ejemplos académicos continúan disponibles para todos los colaboradores. Al añadir novedades, actualizar ambas versiones sin incluir instrucciones exclusivas de administración.

`GUIA_ADMINISTRADORES.md` es la fuente de la ruta SSR `/workspace-mc361/management/guide`. Se importa únicamente desde el servidor y no se copia a `public/` ni se prerenderiza. Reúne novedades, comparación y publicación, capítulos, cuentas autorizadas, exámenes y mantenimiento. La ruta pertenece al grupo administrativo del middleware, que verifica el token y consulta el rol vigente. La página comprueba además la sesión y el rol antes de renderizar; responde con `Cache-Control: private, no-store` y `X-Robots-Tag: noindex, nofollow`.

`lib/workspace-guides.ts` elige el enlace del encabezado y del editor según el rol. El enlace no sustituye la autorización del servidor: una cuenta editora que escriba la dirección privada es redirigida al panel. La guía administrativa enlaza la guía pública para consultar el formato común. Las instrucciones de permisos de exámenes apuntan al apartado privado correspondiente.

No se añade una colección ni se modifican reglas de Firestore por esta separación. `npm run test:guides` comprueba la separación de contenido, los enlaces por rol y los destinos internos; `npm run test:auth` comprueba acceso anónimo, rol editor, administrador, sesiones inválidas y fallo cerrado. Con el servidor local activo, `npm run test:guides -- --http` comprueba la salida pública y el rechazo anónimo en la ruta privada. Después de compilar, `npm run test:guides -- --build` verifica que la página privada no se prerenderice ni se incluya su contenido en los archivos estáticos públicos.

## Imágenes en tablas nativas

Las tablas siguen siendo tablas GFM renderizadas como `table`, `thead`, `th` y `td`; no se convierten en imágenes. `MarkdownCell` proporciona un contexto de celda y `MarkdownImage` selecciona la variante compacta de `Image`, que conserva resolución de rutas relativas, texto alternativo y carga diferida. Fuera de las celdas se mantiene la figura existente. Las fórmulas usan el mismo recorrido Markdown → KaTeX que el resto del contenido.

`Table` admite `imageWidth`, `imageHeight` y `minWidth` además de sus opciones anteriores. Los tamaños aceptan valores numéricos o longitudes CSS simples; los valores no válidos se ignoran. El ancho se limita a la celda y la altura es un máximo, con `object-fit: contain`. Un `Image` en una fila puede indicar `width`, `height` y `caption` propios. El normalizador lo transforma en una directiva de texto `cellimage`, en vez de una directiva de bloque que rompería la tabla. Sus atributos se escapan para no introducir columnas por barras verticales dentro del texto alternativo o la leyenda. No se habilitan HTML libre, JavaScript ni MDX ejecutable.

El desplazamiento se limita al contenedor enfocable de la tabla; `minWidth` es opcional. La alineación de la columna tiene prioridad sobre la de la tabla, y las cabeceras tienen `scope="col"`. El título y las cabeceras conservan las mayúsculas y minúsculas del contenido; no se aplica transformación automática. Los contextos se mantienen separados entre tablas de `TableGrid`.

La tabla, sus cabeceras, su título y las leyendas de las imágenes heredan el tamaño y la familia tipográfica del contenido académico. No tienen tamaños menores fijos ni usan la fuente de interfaz para el título. La familia académica actual es `STIX Two Text` con `Times New Roman` como respaldo; esta corrección conserva esa configuración y las fuentes matemáticas propias de KaTeX.

La plantilla compartida está en `lib/table-snippets.ts`, disponible en los editores de capítulos y exámenes, y en los ejemplos de la guía web. El ejemplo utiliza la imagen de Cloudinary proporcionada por el usuario. El SVG anterior de `public/ejemplos/` se conserva para que funcionen las plantillas ya copiadas. No se modifican contenidos académicos existentes ni publicaciones. Las capturas de tablas anteriores requieren adaptación manual de sus filas, texto, ecuaciones y dibujos; no hay extracción automática de imágenes.

`npm run test:tables` verifica el HTML real generado: celdas mixtas, LaTeX, imágenes en cabeceras, dimensiones individuales, leyendas, rutas relativas, alineación, opciones independientes y conservación de las figuras y ejemplos de código.

## Subida de imágenes e inserción de enlaces

`lib/image-upload.ts` concentra la subida de imágenes de los capítulos con el endpoint y preset de Cloudinary que ya utilizaba el editor. Valida archivos vacíos o no gráficos, respuestas HTTP, JSON y una URL HTTPS de resultado. No añade servicios ni cambia las reglas de Firestore. Las pruebas sustituyen las peticiones externas por respuestas locales.

`ContentEditor` fija el modo al abrir el selector: insertar el bloque de imagen existente o insertar la URL sola. Para el segundo modo, conserva el rango exacto del editor que estaba activo al abrir el selector y lo usa para insertar la URL como texto Markdown plano. El editor queda temporalmente en solo lectura durante la subida, de modo que la posición no cambie; antes de aplicar la edición se desbloquea Monaco y se sincroniza expresamente el texto actualizado con el documento. La inserción pasa por el historial de Deshacer; no se muestra un panel de copia. Un bloqueo por referencia evita subidas simultáneas y el selector se limpia al finalizar para poder elegir el mismo archivo. Cancelar la selección no inicia una subida. La subida y la inserción no guardan ni publican el documento.

Si el servicio falla, el documento permanece intacto y se notifica el error. Si la subida termina pero ya no existe una selección válida para insertar, se informa que el enlace no pudo insertarse.

`npm run test:image-upload` comprueba la subida, validación y errores con servicios simulados. `npm run test:content-review` incluye el flujo de los dos botones: cancelación, bloqueo de eventos simultáneos, inserción de la URL en la selección, ausencia de panel de copia, errores sin modificar el documento y conservación de la inserción deshacible.

## Muestra de lectura de la etapa 2

`/muestra-lectura` es una ruta de desarrollo que responde 404 fuera de ese modo. Usa una copia de solo lectura del MDX local de «Concepto de esfuerzo», con el renderizador y contexto de imágenes del curso. `ReadingPreview` controla fuente, tamaño e interlineado mediante variables CSS limitadas a `.reading-preview-sample`; alternar con el formato actual elimina todas las variables de propuesta y conserva las opciones elegidas. El tamaño inicial sigue las reglas responsivas del contenido académico. Se mantienen los estilos matemáticos propios de KaTeX.

La muestra no consulta ni escribe Firestore y no guarda preferencias. Al recargar se reinicia su estado. No modifica `TextbookLayout`, el editor, los documentos académicos ni los estilos generales de lectura. Los controles persistentes y la vista de concentración siguen pendientes de discusión. `npm run test:reading-preview` comprueba las opciones, la comparación, la restauración de ajustes y la identidad del documento original con servicios aislados.
