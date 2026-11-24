# Plan de mejoras de la plataforma

**Fecha de creación:** 18 de noviembre de 2026.  
**Estado:** implementación de la etapa 1 terminada dentro del alcance acordado sobre el diseño existente. Compilación y comprobaciones automáticas aprobadas; pendiente la revisión visual del usuario en navegador. Cambios locales, sin publicación en producción. El modo oscuro se mantiene en las páginas de estudio y no se añade al panel ni al editor.
**Propósito:** acordar e implementar mejoras por pasos, conservando las funciones y el contenido existentes.

**Trabajo actual:** etapa 2 completada. Iniciada la etapa 3 con el paso 3.1: visor ampliado de figuras implementado y comprobado automáticamente; pendiente revisión visual del usuario. Los pasos 3.2, 3.3 y 3.4 continúan por discutir. Pendiente publicación cuando el usuario decida subir los cambios.

**Prioridad antes de la etapa 2:** comparación del contenido antes de aprobar, paso 4.4, solicitada el 22/11/2026. Implementación, pruebas automáticas y compilación terminadas; revisión visual con una cuenta real pendiente. Se adelanta este paso concreto; los demás pasos de la etapa 4 no quedan aprobados por ello.

Este archivo es un plan de trabajo, no un informe de funciones terminadas. Las ideas se decidirán una por una; incluir una propuesta aquí no significa que esté aprobada ni que vaya a implementarse automáticamente.

## 1. Cómo trabajaremos

1. Elegir un paso del plan y revisar el problema que busca resolver.
2. Discutir si se acepta, se ajusta, se pospone o se descarta. Cuando sea una decisión visual, utilizar una muestra concreta para poder evaluarla.
3. Registrar el alcance acordado: qué cambiará, qué parte se hará primero y cómo comprobaremos el resultado.
4. Implementar un cambio acotado y comprobar las funciones afectadas. Los detalles rutinarios se resuelven dentro del alcance acordado, sin pedir confirmación para cada línea de código.
5. Presentar el resultado para recibir comentarios y ajustar lo necesario antes de ampliar la mejora a otras pantallas.
6. Pasar al siguiente paso cuando corresponda. El orden puede cambiar según las necesidades del proyecto.
7. Preparar un informe de la etapa en `docs/informes/` cuando el usuario lo solicite.

Crear este plan no autoriza a publicar código, modificar reglas de producción ni contratar servicios. Esas acciones se gestionarán según las instrucciones que se den para cada trabajo.

## 2. Reglas generales de las mejoras

- Conservar la información académica y su autoría. Los cambios visuales no deben alterar ecuaciones, unidades, enunciados ni soluciones.
- Aprovechar Astro, React y las herramientas existentes. Un cambio de framework no forma parte de este plan.
- Revisar qué existe antes de desarrollar algo similar. Ya hay buscador, modo oscuro, recuperación local de borradores, controles de capítulos, formatos académicos y simuladores.
- Separar las reglas de funcionamiento, el acceso a datos y los controles de pantalla cuando facilite su mantenimiento.
- Centralizar estilos y configuración compartidos para reducir valores repetidos. Los datos del curso que deban administrarse no deben depender de listas fijas en varias pantallas.
- Evaluar móvil, teclado, contraste y estados de error en cada paso, no únicamente al final.
- Considerar las consultas y el almacenamiento adicionales antes de incorporar funciones que utilicen la base de datos. No asumir capacidad ilimitada ni coste cero para cualquier uso.
- Evitar cambios generales de apariencia sin probar antes una muestra pequeña.
- Registrar por separado lo propuesto, lo implementado, lo comprobado y lo publicado.

## 3. Estados de las decisiones

| Estado | Significado |
| --- | --- |
| Por discutir | Idea registrada, todavía sin decisión. |
| Aprobado | Se acordó su alcance y puede implementarse dentro de ese alcance. |
| En desarrollo | Se está trabajando en el paso aprobado. |
| En revisión | Existe un resultado que debemos evaluar. |
| Completado | Cumple el alcance y las comprobaciones acordadas. La publicación se registra aparte. |
| Pospuesto | Interesa, pero se deja para otra etapa. |
| Descartado | Se decidió no hacerlo; se conserva el motivo. |

Los esfuerzos indicados son orientativos: **pequeño**, **medio** o **alto**. No son estimaciones de horas ni de presupuesto. Se revisarán al definir cada alcance.

## 4. Mapa de etapas propuesto

| Etapa | Tema | Resultado buscado | Estado |
| --- | --- | --- | --- |
| 0 | Revisión inicial | Identificar problemas concretos y establecer una referencia. | Por discutir |
| 1 | Diseño común | Estilos y controles coherentes entre pantallas. | Desarrollo terminado; revisión visual pendiente |
| 2 | Lectura académica | Lectura cómoda y preferencias personales. | Paso 2.1 en revisión; los demás por discutir |
| 3 | Figuras, ecuaciones e impresión | Consultar, compartir e imprimir el material con mayor facilidad. | Paso 3.1 implementado; revisión visual pendiente |
| 4 | Editor y revisión | Guardar y publicar con información clara y posibilidades de recuperación. | Paso 4.4 priorizado; los demás por discutir |
| 5 | Secciones administrables | Permitir al administrador editar más partes de la web. | Por discutir |
| 6 | Búsqueda en el contenido | Encontrar conceptos dentro de los temas publicados. | Por discutir |
| 7 | Organización personal del estudio | Retomar temas y guardar pendientes o favoritos. | Por discutir |
| 8 | Herramientas y práctica | Ampliar las posibilidades de explorar y practicar conceptos. | Por discutir |
| 9 | Rendimiento y comprobación integral | Medir y corregir problemas de carga, interacción y accesibilidad. | Por discutir |

La revisión de rendimiento y accesibilidad también se aplica durante las etapas anteriores. La etapa 9 permite consolidar y ampliar esas comprobaciones.

## 5. Pasos de cada etapa

### Etapa 0. Revisar antes de cambiar

**Objetivo:** partir de problemas observables y conservar una referencia de lo que funciona.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 0.1 | Elegir pantallas de referencia: inicio, tema académico, panel de capítulos, editor y exámenes. | Cuál molesta más y qué tareas son prioritarias. | Pequeño | Por discutir |
| 0.2 | Revisar esas pantallas en escritorio, móvil y con teclado; registrar ejemplos de problemas. | Dispositivos y situaciones que necesitamos cubrir primero. | Medio | Por discutir |
| 0.3 | Registrar una medición inicial de carga e interacción para compararla posteriormente. | Entorno disponible y páginas a medir. | Medio | Por discutir |

**Resultado esperado:** lista breve de problemas priorizados y una referencia visual o de funcionamiento. Una medición local no se presentará como medición de la web pública.

### Etapa 1. Unificar el diseño

**Objetivo:** establecer una identidad visual coherente y reducir estilos repetidos.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 1.1 | Acordar colores, tipografía de interfaz, bordes, espaciados y nivel de contraste. | Conservar la identidad existente, la tipografía de interfaz y la separación del texto académico; descartado el rediseño de la muestra. | Medio | Decisión completada |
| 1.2 | Revisar botones, campos, etiquetas y estados mediante cambios pequeños sobre la interfaz actual. | Controles reutilizables, foco, estados y tamaños coherentes; validación de títulos. | Medio | Desarrollo terminado; revisión visual pendiente |
| 1.3 | Aplicar el ajuste acordado en una pantalla piloto. | Panel de capítulos, acciones y ventanas de crear y renombrar. | Medio | Desarrollo terminado; revisión visual pendiente |
| 1.4 | Extender los estilos aprobados a otras pantallas, por grupos. | Controles principales del panel, editor, colaboradores, exámenes, solicitudes, acceso y navegación pública. | Medio | Desarrollo terminado; revisión visual pendiente |
| 1.5 | Revisar el modo oscuro existente, incluidos controles y herramientas. | Revisados estilos de controles, herramientas y navegación pública. Panel y editor conservan modo claro. | Medio | Revisión de código y contraste aprobada; revisión visual pendiente |

**Comprobación:** controles legibles, resaltados coherentes, foco visible, iconos consistentes y ausencia de desbordamientos en las pantallas revisadas. Aprovechar la biblioteca de iconos existente antes de añadir otra.

**Decisión actual (22/11/2026):** el usuario descartó la propuesta visual completa y eligió mejorar el diseño actual poco a poco. Trabajar sobre la interfaz existente con ajustes acotados y evaluar cada resultado antes de extenderlo. No trasladar las paletas, los controles ni la distribución de la muestra rechazada a las pantallas reales. El código de muestra no se elimina por esta decisión; cualquier limpieza deberá preservar el trabajo ajeno y las funciones útiles independientes de su apariencia.

**Primer ajuste aprobado (22/11/2026):** revisar los botones del panel de capítulos: destacar «Nuevo capítulo» como acción principal, hacer consistentes los tamaños de los controles principales y mejorar la identificación de renombrar, ordenar y archivar. Mantener los colores y la distribución actuales. El alcance incluye los controles de capítulo y sus ventanas; los controles compactos de las filas de subtemas, otras pantallas y otras propuestas de la etapa 1 quedan para una decisión posterior.

**Resultado del ajuste:** «Nuevo capítulo» usa el granate existente como acción principal; los controles principales comparten una altura mínima de 44 px y las acciones con iconos disponen de etiquetas accesibles y títulos descriptivos. Se reutilizan estilos del espacio de trabajo en `lib/workspace-controls.ts`, independientes de la muestra descartada. Las pruebas del panel y de operaciones de estructura están aprobadas. La comprobación de tipos terminó sin errores. El usuario indicó «está bien», aprobando esta entrega; esto no acredita por sí solo una revisión completa de teclado o dispositivos.

**Segundo ajuste aprobado (22/11/2026):** mejorar los campos y mensajes de las ventanas de crear y renombrar capítulos: tamaños y espaciados coherentes, foco visible y errores claros junto al campo correspondiente. Mantener la apariencia actual y limitar el trabajo a esas ventanas antes de extenderlo a otros formularios.

**Resultado del segundo ajuste:** campos con altura mínima de 44 px y estilos compartidos de foco, etiquetas asociadas e indicación de obligatoriedad y límite de caracteres. La validación utiliza las mismas reglas de título que las operaciones de estructura y devuelve el foco al campo inválido. A petición del usuario, el mensaje de título vacío se presenta dentro del campo como indicación de ejemplo en granate, sin convertirse en su valor; la descripción accesible se conserva. Los otros errores siguen debajo para no cubrir texto escrito. Los fallos al guardar conservan el texto, no marcan un título válido como incorrecto y permiten reintentar. Se evita el envío duplicado mientras hay una solicitud pendiente. La ubicación dentro del campo está pendiente de revisión visual del usuario.

**Tercer grupo implementado (22/11/2026):** estilos compartidos de botones y campos aplicados a las acciones de subtemas, formularios de colaboradores, editor de evaluaciones, reintentos de solicitudes y accesos de la cabecera. Las acciones de subtemas tienen nombres accesibles, tamaño táctil y controles de orden visibles; sus filas se distribuyen verticalmente en pantallas pequeñas para dejar espacio al texto. Los estados tienen una letra más legible. Se añaden foco visible a las opciones de rol y asignación y navegación con teclado a las ventanas de colaboradores y confirmación de eliminación de subtemas, reutilizando el control de foco existente. No se modifican los cálculos, el contenido académico, las reglas de producción ni los permisos de las cuentas.

**Extensión a editor y acceso:** los botones de importar, guardar, enviar a revisión, publicar, exportar y ampliar la vista previa comparten tamaños y estados de foco y deshabilitado. Publicar conserva el verde que ya utilizaba. Tras la revisión del usuario, los botones de la barra de edición utilizan un formato compacto de 36 px en escritorio y 44 px en dispositivos con puntero táctil, conservando foco visible. El botón «Continuar con Google» reutiliza el estilo común. Este ajuste visual no cambia los procesos de autenticación, guardado o publicación ni el historial de deshacer.

**Verificación del tercer grupo:** pruebas del panel, formularios de capítulo, edición de evaluaciones, acceso, historial del editor y utilidades de búsqueda y foco aprobadas; comprobación de tipos y compilación aprobadas. Los módulos del panel siguen disponibles en el servidor local después de compilar. Estas pruebas no son una revisión visual completa ni una prueba manual con cuentas reales. La revisión del grupo por el usuario sigue pendiente. Solo se han extendido los controles indicados: no se presenta una migración completa del editor, la página de acceso ni las páginas públicas. Los cambios siguen locales, sin publicación en producción.

**Cierre de la implementación (22/11/2026):** el usuario solicita terminar la etapa 1 y entregar una lista de comprobaciones. Se completa la extensión de controles principales y la revisión del tema público dentro de la identidad actual. Se conserva la tipografía académica; no se incluyen las preferencias de lectura de la etapa 2. Tampoco se convierten todos los enlaces dentro del texto en botones ni se cambia la apariencia de los gráficos.

El cierre añade:

- Controles compartidos de estudio con los colores claros y oscuros ya existentes, tamaño de interacción mínimo de 44 px, foco visible y estados seleccionados. Se utilizan en la cabecera pública, archivo de exámenes, acceso al editor de evaluaciones, calculadoras y controles de Mohr.
- Campos de herramientas con colores de texto, fondo y borde definidos para ambos temas; las operaciones y gráficos se conservan.
- Búsqueda con botón de cierre de 44 px, campo con área más cómoda y texto de resultados vacíos legible en oscuro. Se mantiene la letra compacta y no se recupera la línea de enfoque que el usuario había rechazado.
- Navegación lateral con filas de sección de 44 px y títulos que pueden ocupar varias líneas; guía rápida y selector de secciones con áreas de interacción más cómodas.
- Números y resaltados del listado de capítulos del inicio adaptados al modo oscuro.
- Menú «Insertar componente» con foco al abrir, desplazamiento entre opciones mediante flechas, Home y End, cierre con Escape y al salir del menú; Tab conserva su comportamiento normal. Opciones de 44 px en un desplegable de 256 px, limitado por el ancho de la pantalla. El botón muestra el texto completo «Insertar componente», a la derecha de la barra, que permanece en una fila; si falta espacio, solo el grupo de formato se desplaza horizontalmente.
- Controles restantes del editor: cambio de nombre, reintento de carga, recuperación de copia local y reintento de vista previa. La cabecera de la vista previa permite envolver controles y mensajes largos.
- Filas de capítulo que separan título y acciones en pantallas pequeñas; nombres de subtema y correos largos que pueden ajustarse al espacio disponible. Solicitudes y colaboradores se reorganizan antes de que sus columnas compriman el contenido.
- Ajustes de tamaño en navegación de administración, ventana de archivado y formulario de acceso; foco compartido en el espacio de trabajo y respeto de la preferencia de reducir movimiento también en ese espacio.

**Comprobaciones del cierre:**

- `npm run build`: aprobado; Astro revisó 78 archivos sin errores ni advertencias de diagnóstico, con tres indicaciones previas del proyecto. La compilación conserva avisos existentes sobre tamaño de paquetes y entorno Node del adaptador; no forman parte de este ajuste visual.
- Aprobadas las pruebas `test:chapter-forms`, `test:dashboard`, `test:login`, `test:exams`, `test:ux`, `test:editor-history`, `test:local-draft`, `test:tools`, `test:math`, `test:structure` y `test:dev-dependencies`. Las funciones anteriores de cálculo, fórmulas, permisos e historial se comprobaron como regresión; no se presentan como funciones nuevas.
- Comprobación aislada del componente real de inserción: foco, flechas, Home/End, Tab, Escape, salida del menú y selección de un bloque. No se realizaron escrituras en la base de datos.
- Contraste calculado del texto de los controles compartidos de estudio: al menos 4,5:1 en claro, oscuro, selección y hover; foco respecto a su fondo de al menos 3:1. Esto no constituye una auditoría de accesibilidad de toda la web.
- Respuestas HTML 200 en localhost para inicio, exámenes, acerca del proyecto y acceso. Estilos nuevos presentes en la salida compilada; 17 módulos del panel disponibles después de compilar.
- Revisión visual e interacción real en navegador pendientes: la herramienta de ordenador se detuvo al no poder verificar la dirección del navegador en Windows. No se afirma que ya se hayan comprobado manualmente móvil, ampliación, cuentas reales o todas las combinaciones visuales.
- Publicación: no realizada. Las comprobaciones corresponden al código y al servidor locales.

**Lista para comprobar con el usuario:**

| Dónde | Qué hacer | Resultado que se espera |
| --- | --- | --- |
| Panel de capítulos | Abrir «Nuevo capítulo», pulsar Guardar vacío, escribir un título y cancelar. Abrir renombrar y cancelar. | Error dentro del campo vacío, foco visible y tamaños coherentes; no se crea ni modifica contenido al cancelar. |
| Panel de capítulos | Pasar el cursor por la cabecera y desplegar capítulos. Estrechar la ventana. | Resaltado de toda la cabecera, título legible y acciones que se distribuyen sin comprimirlo. |
| Subtemas | Revisar botones de renombrar, ordenar y abrir; activar Tab para recorrerlos. | Acciones identificadas, área cómoda y foco visible. No hace falta ejecutar cambios para comprobar su aspecto. |
| Editor | Revisar acciones principales y abrir «Insertar componente». Recorrer con flechas, Home/End y cerrar con Escape. | Opciones visibles, foco al abrir y retorno al botón al cerrar con Escape. Tab permite continuar fuera del menú. |
| Editor, documento de prueba | Insertar un bloque y usar Ctrl + Z y Ctrl + Shift + Z. Alternar edición y vista previa. | Deshacer y rehacer siguen funcionando; la vista previa no elimina el historial. No publicar la prueba. |
| Colaboradores | Abrir «Agregar usuario», recorrer campos con Tab y cerrar con Escape. Repetir en editar sin guardar. | Foco dentro de la ventana, etiquetas claras y regreso al control de origen. No modificar accesos para esta comprobación. |
| Exámenes, administración | Abrir una evaluación nueva, revisar campos, pestañas, importación y vista previa sin publicar. | Controles coherentes, foco visible y distribución que se adapta al ancho. |
| Solicitudes | Revisar una lista existente en ventana ancha y estrecha. | Títulos, autor, fecha y estado pueden distribuirse sin superponerse. Si la lista está vacía, comprobar el mensaje correspondiente. |
| Inicio y tema académico | Cambiar entre claro y oscuro; revisar capítulos, buscador, navegación y selector de secciones. | Texto legible y foco visible en ambos temas. El panel y el editor permanecen en claro. |
| Buscador | Abrir con Ctrl + K, buscar algo inexistente, usar flechas y cerrar con Escape. | Campo compacto sin la línea rechazada, mensaje legible y cierre accesible. |
| Archivo de exámenes | Buscar, cambiar tipo y periodo y limpiar filtros. | Filtros cómodos, selección distinguible y estados de carga o ausencia de resultados legibles. |
| Tema con herramientas | Probar valores en calculadora y Mohr, claro y oscuro. | Campos y controles legibles; resultados y comportamiento matemático conservados. |
| Pantallas principales | Revisar en móvil o ventana de 375 px y con ampliación del navegador. | Títulos y acciones legibles; sin desplazamiento horizontal de toda la página. Tablas, fórmulas o gráficos anchos pueden conservar su desplazamiento interno. |

El cierre de desarrollo no sustituye esta aceptación visual. Cualquier defecto encontrado en estos controles se corrige dentro de la etapa 1; las nuevas funciones de otras etapas siguen por discutir.

**Muestra descartada:** `/muestra-diseno`, disponible solo en desarrollo. Se conserva como referencia histórica de la propuesta rechazada, no como trabajo pendiente de aprobación. Usa contenido de ejemplo y no modifica documentos del curso.

**Comprobaciones de esta muestra:** respuesta HTTP 200 en el servidor local, comprobación de tipos y compilación aprobadas. `npm run test:interface` comprueba contraste del texto en las cuatro combinaciones, contraste del borde de los campos, asociación de etiquetas y mensajes, y estados de botones ocupados. La revisión visual e interacción real en navegador quedan pendientes: la herramienta de revisión se detuvo al no poder verificar la dirección del navegador en Windows. No se afirma una comprobación visual completa ni conformidad integral de accesibilidad.

### Etapa 2. Mejorar la lectura académica

**Objetivo:** facilitar sesiones de estudio prolongadas y adaptar la lectura a las preferencias del estudiante.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 2.1 | Comparar muestras de tipografía, tamaño e interlineado en un tema con ecuaciones y figuras. | Comparar la fuente actual (STIX Two Text, con Times New Roman de respaldo) con Times New Roman, y evaluar tamaño e interlineado antes de aplicarlos al curso. | Medio | Implementado: formato elegido aplicado al contenido; revisión visual final pendiente |
| 2.2 | Añadir preferencias de tamaño, interlineado y ancho de lectura. | Cuántas opciones ofrecer y dónde colocar sus controles. | Medio | Implementado: deslizantes con límites seguros, guardados en el navegador |
| 2.3 | Incorporar una vista de concentración para ocultar paneles laterales. | Cómo activarla y cómo recuperar la navegación. | Medio | Implementado: botón reversible y salida con Escape |

**Comprobación:** fórmulas e imágenes legibles con los tamaños elegidos, preferencias recuperables y controles utilizables en móvil. Inicialmente podrían guardarse en el navegador, sin crear cuentas de estudiantes.

**Primera entrega del paso 2.1:** muestra solo en desarrollo en `/muestra-lectura`, con el texto local de «Concepto de esfuerzo». Conserva el contenido académico completo, su autoría, ecuaciones, tablas y figuras. Permite comparar fuente, tamaño e interlineado con el formato actual al mismo ancho. Los ajustes son temporales, sin guardado ni cambios en páginas del curso. Los controles persistentes de lectura (2.2) y la vista de concentración (2.3) se discutirán después de revisar esta muestra.

### Etapa 3. Figuras, ecuaciones e impresión

**Objetivo:** facilitar la consulta detallada del material y su uso fuera de la pantalla habitual.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 3.1 | Abrir figuras ampliadas y permitir acercamiento cuando sea útil. | Primera entrega acordada: figuras académicas completas, sin alterar las imágenes compactas dentro de tablas. | Medio | Implementado y comprobado automáticamente; revisión visual pendiente |
| 3.2 | Copiar el código LaTeX de una ecuación. | Ubicación de la opción sin recargar visualmente el contenido. | Medio | Por discutir |
| 3.3 | Copiar enlaces directos a ecuaciones, figuras y problemas, aprovechando identificadores existentes. | Qué elementos necesitan enlaces estables. | Medio | Por discutir |
| 3.4 | Preparar estilos de impresión y guardado como PDF desde el navegador. | Incluir soluciones, encabezados y numeración; tratamiento de figuras y tablas. | Medio | Por discutir |

**Comprobación:** cerrar ampliaciones con teclado y recuperar el foco; enlaces que lleguen al elemento correcto; páginas impresas sin recortes en los ejemplos revisados. La primera propuesta de PDF utiliza la impresión del navegador, no un servicio externo.

### Etapa 4. Mejorar el editor y la revisión del contenido

**Objetivo:** hacer más claro el estado del trabajo y facilitar su recuperación y revisión.

Ya existen guardado manual, recuperación local e historial de deshacer. Esta etapa debe ampliar o mejorar esas capacidades, sin duplicarlas.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 4.1 | Distinguir cambios pendientes, guardando, guardado y error de guardado. Revisar avisos al abandonar una página con trabajo pendiente. | Dónde mostrar los estados y en qué acciones conviene advertir. | Medio | Por discutir |
| 4.2 | Mejorar la biblioteca de bloques insertables con ejemplos y previsualización. | Qué bloques se utilizan más y qué opciones necesitan. | Medio | Por discutir |
| 4.3 | Detectar problemas de formato, referencias e imágenes cuando sea posible. | Qué observaciones deben avisar y cuáles impedirían publicar. | Alto | Por discutir |
| 4.4 | Comparar un borrador con la versión publicada antes de aprobarlo. | Aprobado: diferencias resaltadas y vista de la página antes/después, incluido contenido nuevo; aprobación explícita y control de cambios concurrentes. | Alto | Implementado y comprobado automáticamente; revisión visual pendiente |
| 4.5 | Guardar versiones anteriores y permitir su recuperación. | Qué momentos generan versiones, cuántas conservar y quién puede restaurarlas. | Alto | Por discutir |

**Comprobación:** mantener Ctrl + Z, recuperar errores de guardado y respetar permisos. Restaurar una versión no debería publicar contenido sin una acción explícita. El consumo adicional de base de datos y la política de conservación deben definirse antes de implementar el historial.

**Alcance del paso 4.4:** la unidad de revisión es cada sección o subtema, que es también la unidad actual de edición y publicación de los capítulos. El administrador ve la publicación efectiva de esa sección frente al texto abierto en el editor. No se crea un historial permanente de versiones ni una aprobación masiva de todo el capítulo.

**Implementación actual:** «Revisar cambios» abre una propuesta fijada en una vista que ocupa todo el ancho del editor, sin ventana flotante. «Vista de la página» es la comparación inicial y muestra ambas versiones con el renderizador y el fondo académico existentes; sus paneles permiten desplazamiento sincronizado o independiente. «Cambios resaltados» utiliza el comparador de Monaco ya disponible. «Ajustar líneas» controla ambos lados del código por igual; desactivarlo habilita desplazamiento horizontal en ambos. La ausencia real de publicación se distingue de un fallo de lectura. Las solicitudes abren la revisión al entrar, después de resolver cualquier copia local pendiente. Se puede aprobar desde esa vista o utilizar la acción independiente «Publicar» del editor, según la corrección solicitada por el usuario.

**Desplazamiento opcional:** en «Cambios resaltados» con dos columnas se incorpora «Sincronizar desplazamiento», activado por defecto. Desactivarlo permite recorrer cada lado por separado sin perder los resaltados; volver a activarlo retoma la zona del último lado desplazado. Los paneles independientes usan modelos de solo lectura, sin modificar el editor principal. En la vista unificada de pantallas pequeñas no se muestra esta opción. No se amplía este control a la vista académica antes/después en esta entrega.

**Acabado de controles:** a petición del usuario, «Ajustar líneas» y «Sincronizar desplazamiento» utilizan interruptores reutilizables con etiqueta pulsable, foco visible y estado deshabilitado. Conservan un input nativo y su manejo con teclado. Se centraliza el cursor de mano para controles clicables habilitados, incluido el selector y los controles de selección; los campos de escritura mantienen cursor de texto y las acciones deshabilitadas se distinguen con cursor de no disponible. La regla se aplica a la interfaz general, sin convertir el contenido de texto en zonas clicables.

**Verificación del acabado:** pruebas de comparación y formularios de capítulo aprobadas; compilación y comprobación de 87 archivos sin errores. Las pruebas de comparación utilizan el interruptor real y conservan los recorridos de ajuste y sincronización. La revisión visual de su apariencia y cursores en navegador sigue pendiente; los cambios permanecen locales.

**Verificación del desplazamiento:** compilación aprobada y 86 archivos comprobados por Astro sin errores. Las pruebas ejercitan los paneles reales con instancias de editor simuladas: desplazar un lado no escribe en el otro, actualizar resaltados no reinicia su posición y al desmontar se retiran las suscripciones. También comprueban rangos de inserción y eliminación, recuperación de la ubicación al sincronizar y las regresiones de publicación e historial. La interacción visual con una cuenta real sigue pendiente; no se publicaron documentos reales ni se desplegó el código para estas pruebas.

La comparación se vuelve a consultar al confirmar y la escritura comprueba la revisión del documento dentro de una transacción. Si llega otra edición, se bloquea la aprobación y se requiere actualizar y cargar expresamente el borrador actual. Esa carga conserva la posibilidad de Deshacer en el editor. El guardado de borradores conserva también las publicaciones antiguas que aún utilizaban `contentMarkdown` sin una copia `publishedContent` separada; no se copian de vuelta metadatos de publicación obsoletos incluidos en un documento cargado.

El endpoint de comparación exige administrador y no usa caché. Se utilizan los documentos existentes y consultas al abrir, actualizar y confirmar; no se consulta en cada pulsación ni se contratan servicios. No se han publicado cambios de código ni modificado reglas de producción.

**Límites:** el resaltado compara Markdown y LaTeX. La vista de la página permite evaluar su presentación, pero no superpone marcas de color sobre las fórmulas renderizadas. Se comparan referencias a imágenes, no versiones binarias de una imagen reemplazada manteniendo la misma dirección. Tampoco se comparan cambios del código general de los componentes o de los estados que un estudiante haya seleccionado en un simulador.

**Verificación del paso 4.4:** compilación aprobada y 85 archivos revisados por Astro sin errores tras la corrección de presentación. Pruebas de comparación, autorización, panel, estructura, historial del editor, respaldo local, revisiones antiguas, matemáticas y foco aprobadas. La prueba de comparación ejercita los manejadores reales del editor: abrir una solicitud no publica, una base obsoleta no escribe ni inicia el respaldo en GitHub, y la confirmación conserva exactamente el texto revisado. La ampliación de pruebas comprueba opciones idénticas para ambos paneles, ajuste y desplazamiento horizontal, elección de ajuste antes de terminar la carga de Monaco, revisión integrada en vez de modal, permanencia del modelo editable y publicación directa sin abrir la comparación, incluidos errores y doble clic. Las escrituras de estas pruebas son simuladas y no modifican producción. Los nuevos módulos y la dependencia de Monaco DiffEditor responden en localhost; el endpoint rechaza peticiones anónimas con HTTP 401 y la guía incluye las instrucciones. La comprobación del servidor de desarrollo pasó después de compilar.

**Pendiente de aceptación visual:** entrar como administrador, abrir una solicitud, recorrer las dos vistas y volver al editor sin aprobar. Repetir con una sección que todavía no tenga publicación. La herramienta de navegador no ha proporcionado una sesión verificable para una revisión manual; no se afirma haber completado esa comprobación con una cuenta real. No se realizó publicación de código ni se aprobaron documentos reales durante este desarrollo.

Las operaciones sobre el catálogo —renombrar, ordenar o archivar entradas— conservan su flujo independiente. Este paso no añade aprobación previa de cambios estructurales del curso.

### Etapa 5. Administrar otras secciones de la web

**Objetivo:** permitir al profesor y otros administradores modificar apartados como Presentación, Objetivos o Recursos desde el navegador.

Los capítulos ya tienen controles de administración. Esta propuesta se refiere a otros apartados de la web.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 5.1 | Definir qué apartados deben ser editables y dónde aparecerán. | Apartados de la página principal o páginas independientes. | Medio | Por discutir |
| 5.2 | Elegir bloques permitidos: texto, imagen, enlaces o destacados. | Qué libertad necesita el administrador sin complicar el editor. | Medio | Por discutir |
| 5.3 | Implementar un primer apartado con edición, vista previa y publicación. | Quién puede editarlo y quién publica. | Alto | Por discutir |
| 5.4 | Añadir orden y visibilidad de los apartados si la primera versión cumple lo esperado. | Ocultar temporalmente, archivar o eliminar; necesidad de restauración. | Alto | Por discutir |

**Comprobación:** cambios visibles solo después de publicar, conservación del contenido anterior ante errores y controles de acceso comprobados. La primera versión se limitaría a los bloques acordados; nuevas capacidades no previstas podrían requerir desarrollo posterior.

### Etapa 6. Ampliar el buscador existente

**Objetivo:** encontrar conceptos dentro del material publicado, además de buscar títulos y números de sección.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 6.1 | Definir qué contenido será buscable y construir un índice de búsqueda. | Incluir teoría, problemas, evaluaciones o una primera selección. | Alto | Por discutir |
| 6.2 | Mostrar fragmentos de resultados y filtros por capítulo o tipo de contenido. | Qué filtros ayudan y cómo ordenar los resultados. | Medio | Por discutir |
| 6.3 | Evaluar sinónimos, términos relacionados y consultas matemáticas. | Qué casos reales no resuelve la primera versión. | Alto | Por discutir |

**Comprobación:** buscar solo contenido que corresponda publicar, actualizar el índice cuando cambie el material y evitar consultar todos los documentos en cada búsqueda. El tratamiento de fórmulas requiere definir casos concretos; no se presupone un buscador matemático completo.

### Etapa 7. Ayudar a organizar el estudio

**Objetivo:** que el estudiante pueda retomar su trabajo y organizar temas de interés.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 7.1 | Continuar en el último tema visitado. | Mostrar el acceso en el inicio y si se recuerda la posición de lectura. | Pequeño | Por discutir |
| 7.2 | Guardar favoritos y problemas pendientes. | Cómo marcarlos y dónde consultar la lista. | Medio | Por discutir |
| 7.3 | Marcar manualmente secciones como revisadas. | Si aporta valor y cómo mostrar el progreso sin confundirlo con aprendizaje evaluado. | Medio | Por discutir |
| 7.4 | Evaluar exportación o sincronización de preferencias y listas. | Si hace falta cambiar de dispositivo y si compensa añadir cuentas o almacenamiento remoto. | Alto | Por discutir |

**Comprobación:** distinguir datos de cada navegador, permitir retirar marcas y tratar fallos de almacenamiento. La propuesta inicial es local: las marcas no se sincronizarían entre dispositivos ni representarían calificaciones.

### Etapa 8. Ampliar herramientas y práctica

**Objetivo:** incorporar herramientas académicas útiles con hipótesis y resultados comprobables. No se desarrollarán todas simultáneamente.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 8.1 | Comparar dos casos en los simuladores existentes. | Variables que se comparan y cómo presentar las diferencias. | Medio | Por discutir |
| 8.2 | Convertidor de unidades frecuentes del curso. | Magnitudes, unidades y precisión necesarias. | Medio | Por discutir |
| 8.3 | Cálculo de área, centroide y momentos de inercia. | Secciones permitidas en la primera versión y convención de ejes. | Alto | Por discutir |
| 8.4 | Diagramas de reacciones, cortante y momento en vigas. | Apoyos, cargas, restricciones y convención de signos de una primera versión. | Alto | Por discutir |
| 8.5 | Visualización de la curva esfuerzo–deformación. | Modelo, parámetros y fenómenos que se desean explicar. | Alto | Por discutir |
| 8.6 | Problemas con pistas progresivas antes de mostrar la solución. | Cómo redactar las pistas y si se incluirán en temas, evaluaciones o ambos. | Medio | Por discutir |

**Comprobación:** casos de referencia, unidades, signos, datos inválidos, estados especiales y legibilidad en móvil. Acordar la revisión académica necesaria antes de publicar cada herramienta. No se presupone generación automática de problemas ni evaluación automática de cualquier respuesta.

### Etapa 9. Medir rendimiento y revisar la experiencia completa

**Objetivo:** comprobar la experiencia real y corregir problemas identificados por mediciones y uso.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 9.1 | Comparar carga, respuesta y estabilidad visual con la referencia inicial. | Páginas, dispositivos y conexión de referencia. | Medio | Por discutir |
| 9.2 | Optimizar imágenes, fuentes y carga de herramientas cuando las mediciones lo justifiquen. | Qué problema tiene mayor impacto y qué comportamiento debe conservarse. | Medio o alto | Por discutir |
| 9.3 | Revisar teclado, contraste, ampliación de texto y controles táctiles en las pantallas seleccionadas. | Alcance de la revisión y problemas prioritarios. | Medio | Por discutir |
| 9.4 | Recorrer tareas completas de estudiante, editor y administrador. | Casos necesarios antes de publicar una etapa. | Medio | Por discutir |

**Comprobación:** registrar resultados antes y después, diferenciar pruebas locales de producción y conservar las comprobaciones útiles para futuras actualizaciones. No afirmar cumplimiento integral de accesibilidad a partir de una revisión parcial.

## 6. Registro de decisiones

El orden general sigue siendo una propuesta. Se ha autorizado empezar la etapa 1; la elección final del diseño y el alcance de su aplicación se discutirán a partir de la muestra.

| Fecha | Paso | Decisión | Alcance o motivo | Siguiente acción |
| --- | --- | --- | --- | --- |
| 18/11/2026 | Plan general | El usuario solicita planificar por pasos y discutir qué se hará. | Crear el plan; todavía no hay una etapa de implementación aprobada. | Discutir el primer paso. |
| 18/11/2026 | 1.1–1.2 | El usuario solicita empezar la etapa 1 y elige explorar un cambio visual más amplio. | Preparar una propuesta visual y controles reutilizables en una muestra local. No se ha elegido una paleta definitiva ni una pantalla piloto. | Comprobar la muestra y revisarla con el usuario. |
| 18/11/2026 | 1.1–1.2 | Muestra preparada para revisión. | Variantes tinta y granate, modo claro y oscuro, controles compartidos y ejemplos interactivos locales. Compilación y pruebas automáticas aprobadas; revisión visual pendiente. | El usuario revisa `/muestra-diseno` y decide qué conservar o ajustar antes del paso 1.3. |
| 22/11/2026 | 1.1 | Descartadas las paletas nuevas de la muestra. | El usuario indica que no le gustan los colores propuestos. No extenderlos a la web; controles y distribución siguen pendientes de decisión. | Acordar qué conservar del paso 1.2 y elegir una pantalla piloto antes de implementar el paso 1.3. |
| 22/11/2026 | 1.1–1.2 | El usuario aclara que descarta la muestra completa. | No le gustaron tampoco los controles ni la distribución. Esta decisión amplía y sustituye el rechazo parcial registrado en la fila anterior. | Acordar otra dirección o un cambio acotado sobre el diseño actual antes de programar una nueva propuesta. |
| 22/11/2026 | 1.1 | El usuario elige mejorar el diseño actual poco a poco. | Mantener la interfaz existente como base y discutir ajustes pequeños. No preparar otro rediseño general como siguiente entrega. | Acordar el primer ajuste concreto y comprobarlo en una sola pantalla. |
| 22/11/2026 | 1.2–1.3 | El usuario aprueba el primer ajuste de botones del panel de capítulos. | Destacar «Nuevo capítulo», unificar tamaños y mejorar la identificación de las acciones, manteniendo colores y distribución. | Implementar y comprobar el cambio acotado para su revisión. |
| 22/11/2026 | 1.2–1.3 | Primer ajuste implementado para revisión. | Estilos compartidos con la paleta existente, controles principales de 44 px y acciones de capítulo identificadas. Pruebas automáticas del panel y la estructura, y comprobación de tipos aprobadas. | Revisar el panel real antes de extender el ajuste a otros controles o pantallas. |
| 22/11/2026 | 1.2–1.3 | El usuario aprueba el resultado del ajuste de botones. | Indica «está bien» y pregunta por el siguiente paso. La aprobación corresponde a esta entrega, no a otras propuestas del plan. | Discutir el ajuste de campos y mensajes de crear y renombrar capítulos. |
| 22/11/2026 | 1.2–1.3 | El usuario aprueba el ajuste de campos y mensajes de crear y renombrar capítulos. | Tamaños y espaciados coherentes, foco visible y errores junto al campo. Mantener la apariencia actual y limitar la entrega a esas dos ventanas. | Implementar y comprobar el ajuste para su revisión. |
| 22/11/2026 | 1.2–1.3 | Ajuste de campos y mensajes implementado para revisión. | Validación compartida, errores junto al campo, foco al corregir y conservación del texto ante fallos. Pruebas automáticas y comprobación de tipos aprobadas. | El usuario revisa las ventanas de crear y renombrar antes de extender el ajuste. |
| 22/11/2026 | 1.2–1.3 | El usuario confirma que aparece el error al guardar vacío y solicita mostrarlo dentro del campo. | Ajuste implementado como indicación dentro del input vacío, conservando la descripción accesible y sin introducir el mensaje como valor. Pruebas de formularios y panel, y comprobación de tipos aprobadas. | El usuario revisa la nueva ubicación del mensaje. |
| 22/11/2026 | 1.2–1.4 | El usuario solicita continuar con las mejoras pendientes. | Continuar la etapa 1 extendiendo los controles ya aprobados y mejoras de teclado y pantallas pequeñas, manteniendo el diseño actual. Las funciones nuevas con decisiones abiertas seguirán definiéndose por pasos. | Comprobar el siguiente grupo de pantallas y actualizar su estado. |
| 22/11/2026 | 1.5 | El usuario elige mantener el modo oscuro solo en las páginas de estudio, como actualmente. | El panel de administración y el editor continúan en claro. No se autoriza una ampliación del tema oscuro a esas pantallas. | Conservar ese alcance al completar la etapa 1. |
| 22/11/2026 | 1.2–1.4 | Primer grupo de extensión implementado para revisión. | Controles comunes, acciones de subtemas más cómodas, etiquetas y navegación de ventanas por teclado. Pruebas automáticas y compilación aprobadas; sin publicación de producción ni revisión visual completa. | Revisar este grupo y acordar el siguiente alcance del plan. |
| 22/11/2026 | 1.1–1.5 | El usuario solicita terminar la etapa 1 y explicar cómo comprobarla. | Implementación terminada sobre la identidad existente: controles del espacio de trabajo y de estudio, adaptación de filas, teclado y revisión de estilos públicos en oscuro. Pruebas y compilación aprobadas; revisión visual y publicación registradas por separado. | El usuario recorre la lista de comprobaciones; corregir defectos de este alcance antes de ampliar funciones. |
| 22/11/2026 | 1.4 | El usuario señala que «Insertar componente» queda extraño en una segunda fila. | Barra compacta en una fila, botón corto «Insertar» a la derecha y grupo de formato desplazable si no cabe. Controles compactos en escritorio y más amplios con puntero táctil; se conserva la navegación del menú por teclado. | Comprobar el ajuste en el editor real. |
| 22/11/2026 | 1.4 | El usuario aprueba la posición y pide conservar el texto completo del botón. | Se muestra «Insertar componente» manteniendo la barra compacta en una fila y el botón a la derecha. | Revisar la etiqueta completa en el editor. |
| 22/11/2026 | 4.4 | El usuario prioriza la comparación antes de la etapa 2. | Comparación de publicación frente a propuesta, creación de contenido nuevo, dos vistas y aprobación desde la revisión. Se incorpora protección ante ediciones concurrentes. | Completar las comprobaciones automáticas y revisar el flujo real con el administrador. |
| 22/11/2026 | 4.4 | Implementación y comprobaciones automáticas terminadas. | Flujo real del editor comprobado con servicios simulados; compilación, regresiones y disponibilidad de módulos locales aprobadas. Guías y arquitectura actualizadas. Sin escrituras de prueba en producción ni despliegue. | Revisar visualmente con una sesión de administrador y corregir observaciones dentro de este alcance. |
| 22/11/2026 | 4.4 | El usuario señala ajuste de líneas diferente entre paneles y solicita revisar y publicar como acciones independientes. | Se corrige la configuración de ambos editores y se añade «Ajustar líneas». La revisión pasa a una vista de ancho completo; el editor queda oculto y montado. «Publicar» omite la comparación visual y conserva las comprobaciones y transacción. Esta decisión sustituye la obligación anterior de entrar a la comparación para publicar. | Comprobar ambas rutas y revisar el resultado visual. |
| 22/11/2026 | 4.4 | El usuario plantea disponer de desplazamiento independiente. | Se incorpora una opción en la comparación de fuente de dos columnas, conservando sincronización por defecto, resaltados y recuperación de la ubicación al volver a sincronizar. No cambia la publicación ni la vista académica. | Verificar el comportamiento y revisar la interacción en navegador. |
| 22/11/2026 | 1.2 y 4.4 | El usuario solicita mejorar el acabado de las casillas y mostrar la mano sobre los elementos clicables. | Interruptores reutilizables para las dos opciones de revisión y cursor coherente en controles habilitados; se conservan teclado, escritura y estados deshabilitados. | Comprobar el aspecto y los estados en el navegador. |
| 22/11/2026 | Guías por rol | El usuario solicita excluir funciones exclusivas de administración de la guía de colaboradores y disponer de novedades privadas. | Separación implementada: guía pública para redacción y envío a revisión; guía SSR de administración con novedades, aprobación, capítulos, accesos y exámenes. El servidor exige rol administrador y los enlaces del panel se adaptan al rol. Compilación y pruebas automáticas de permisos, contenido, artefactos públicos, revisión y exámenes aprobadas; servidor local comprobado después de compilar. | Revisión visual con sesión real pendiente. Sin publicación en producción. |
| 22/11/2026 | Tablas académicas | El usuario solicita tablas nativas con imágenes para evitar capturas de tablas completas. | Extensión implementada: dibujos, texto y LaTeX en celdas; dimensiones por tabla o imagen, ancho mínimo opcional y plantilla compartida en capítulos y exámenes. Novedades e instrucciones en la guía de colaboradores. Pruebas de tablas, ecuaciones, encabezados, historial, revisión y exámenes aprobadas; compilación sin errores. No se reescriben tablas publicadas ni se interpreta automáticamente una captura. | Revisar visualmente la plantilla antes de adaptar tablas reales. Sin publicación en producción. |
| 22/11/2026 | Figuras académicas | El usuario solicita poder quitar el borde de imágenes transparentes. | Opción por imagen `border="false"` y por figura lateral de problema `imageBorder="false"`, conservando el borde habitual por defecto. Instrucciones y novedad en la guía de colaboradores. | Renderizado y tipos comprobados automáticamente. Revisión visual pendiente; sin publicación en producción. |
| 22/11/2026 | Novedades y tablas | El usuario solicita que la opción de quitar bordes destaque en Novedades y que los títulos de tablas respeten su escritura. | Entrada propia al principio de la guía, abierta por defecto, con enlace desde las novedades de administración. Eliminadas las mayúsculas forzadas del título y de las cabeceras de las tablas. | Compilación, pruebas de tablas y guías y primera novedad abierta comprobadas. Servidor local verificado después de compilar; sin publicación en producción. |
| 22/11/2026 | Tipografía de tablas | El usuario solicita el mismo tamaño y fuente académica en las tablas y sus títulos. | Se eliminan los tamaños reducidos y la fuente de interfaz del título. Celdas, cabeceras, título y leyendas de imágenes heredan la tipografía del capítulo. Se conserva la familia académica configurada: STIX Two Text con Times New Roman de respaldo. | Pruebas de tablas y guías aprobadas; estilos y novedad disponibles en localhost. Revisión visual pendiente; sin publicación en producción. |
| 22/11/2026 | 2.1 | El usuario solicita retomar la etapa 2 y confirmar el estado del trabajo. | Muestra preparada sobre contenido real, comparando la tipografía actual con Times New Roman y varios tamaños e interlineados. Compilación y pruebas de controles aprobadas; respuesta HTTP 200 con texto, tablas y fórmulas renderizados. No se aplica un cambio general ni se implementan todavía preferencias persistentes o concentración. | Revisar visualmente con el usuario antes de decidir los ajustes definitivos; sin publicación en producción. |
| 22/11/2026 | Subida de imágenes | El usuario solicita otra opción en la barra del editor para subir una imagen y obtener solo el enlace. | Acción separada al lado de Imagen, resultado con URL seleccionable y copia explícita. Se reutiliza Cloudinary, se conserva la inserción habitual y no se modifica ni publica el documento al obtener un enlace. Novedades e instrucciones en la guía. | Subida, copia, fallos, inserción e historial comprobados con servicios simulados. Compilación aprobada. Guía local y módulos comprobados; subida real en sesión del usuario y revisión visual pendientes. Sin publicación en producción. |
| 22/11/2026 | Subida de imágenes (ajuste) | El usuario prefiere que la URL se inserte donde estaba el cursor, sin panel ni acción de copia. | Se reemplaza la entrega del enlace en un panel por la inserción de la URL sola en la selección del editor. El editor queda temporalmente en solo lectura durante la subida para conservar la posición. Se mantiene la opción de insertar el bloque completo. | Pruebas simuladas de subida, selección, errores e historial aprobadas; comprobación Astro con 0 errores y compilación completada. Pendiente de revisión visual y prueba de carga en sesión del usuario. Sin publicación en producción. |
| 23/11/2026 | 2.1 · Ecuaciones | El usuario aprueba en principio la propuesta de lectura, rechaza añadir otra superficie de resaltado y solicita reproducir el estilo de su referencia LaTeX. | Se conserva el diseño de fórmulas existente. La propuesta «LaTeX técnico» mantiene en cursiva los símbolos griegos como σ y τ, y muestra rectas las letras latinas como N y A. Además permite comparar peso normal o negrita y tamaño equilibrado o grande. Las órdenes tipográficas explícitas del autor se conservan. | Pruebas de clasificación de símbolos y controles aprobadas; muestra local con respuesta HTTP 200. La revisión visual automatizada no estuvo disponible y queda pendiente con el usuario; ningún cambio aplicado a los capítulos ni publicado en producción. |
| 23/11/2026 | 2.1 · Aplicación | El usuario elige STIX Two Text, 20 px, interlineado 1,8, LaTeX técnico, peso normal y tamaño equilibrado para el contenido académico; solicita conservar y ampliar la muestra. | La combinación se aplica a todos los contenidos renderizados, sin cambiar la fuente de la interfaz. La clasificación griega/latina se genera en el HTML inicial. La muestra se conserva y agrega color actual/negro, cuatro tamaños y cuatro pesos de ecuación. | Pruebas de muestra y renderizado matemático aprobadas en 51 secciones; respuesta local HTTP 200 con clases del formato aprobado. Revisión visual final pendiente; sin publicación en producción. |
| 23/11/2026 | 2.2 y 2.3 | El usuario decide implementar preferencias personales y modo concentración para mejorar la experiencia de estudio. | Las páginas de capítulo ofrecen tres tamaños, tres interlineados y tres anchos. La selección se valida y guarda en el navegador. El modo concentración oculta navegación lateral e índice, conserva el contenido centrado y se revierte con el botón o Escape. No requiere cuenta ni base de datos. | Pruebas de valores, validación, persistencia, controles y experiencia de búsqueda aprobadas; comprobación Astro con 0 errores y respuesta HTTP 200 en el puerto 4322. Revisión visual e interacción manual pendientes; sin publicación en producción. |
| 23/11/2026 | 2.2 y 2.3 · Refinamiento | El usuario solicita alinear los controles con «Secciones», centrar realmente el modo concentración, cerrar el panel al pulsar fuera y ofrecer valores más precisos. | Los controles comparten fila, altura y estilo con el selector de secciones. El modo concentración deja de renderizar los dos paneles laterales para eliminar su espacio. El panel se cierra al pulsar fuera o con Escape. Tamaño, interlineado y ancho usan deslizantes limitados y migran las preferencias anteriores. | Pruebas de límites, migración y persistencia aprobadas; comprobación Astro con 0 errores y respuesta HTTP 200 en el puerto 4322. Revisión visual final pendiente; sin publicación en producción. |
| 23/11/2026 | 2 · Cierre | El usuario aprueba la disposición y solicita que las transiciones de la experiencia de estudio se sientan más fluidas. | Se unifican transiciones breves para enlaces, botones y menús; el panel de lectura entra suavemente y el contenido se recentra con una transición discreta. La preferencia del sistema para reducir movimiento continúa desactivando estas animaciones. | Etapa 2 completada en desarrollo y revisada visualmente por el usuario. Pendiente de publicación; no se afirma despliegue en producción. |
| 23/11/2026 | 3.1 · Figuras ampliadas | El usuario solicita comenzar la etapa 3 después del cierre de la etapa 2. | Las figuras académicas se pueden abrir en un visor sobre la página, ampliar entre 75 % y 300 %, restablecer y desplazar cuando superan el área visible. El visor se cierra con su botón, Escape o el fondo; encierra el foco del teclado, bloquea el desplazamiento de la página y devuelve el foco a la figura. Las imágenes compactas de tablas conservan su comportamiento para no convertir cada celda en una ventana. | Prueba del renderizado de las 51 secciones y comprobación Astro aprobadas sin errores de tipos. Revisión visual e interacción manual pendientes; sin publicación en producción. |
| 23/11/2026 | 4.4 · Refinamiento de revisión | Antes de continuar la etapa 3, el usuario solicita que la comparación abra primero la página renderizada, conserve el fondo académico y permita sincronizar ambas páginas. Tras revisar una variante angular, prefiere conservar el interruptor anterior con mejor definición visual. | «Vista de la página» pasa a ser la opción inicial. Las dos versiones tienen paneles desplazables cuya posición se sincroniza proporcionalmente, aunque sus alturas difieran. El control puede desactivar la sincronización. Los interruptores conservan su forma anterior, con bordes, contraste y foco más definidos. La sincronización ignora solamente el evento reflejado en la otra columna, sin descartar movimientos sucesivos del usuario. | Prueba integral de revisión y protección de publicación aprobada. Revisión visual final pendiente. Sin publicación en producción. |
| 23/11/2026 | Bienvenida del curso | El usuario solicita ampliar la presentación con datos generales del curso y su ubicación académica, usando el sílabo sin incorporar el tema de estudio ni una lista de docentes. | Se identifica MC361 como curso obligatorio del cuarto ciclo de la Facultad de Ingeniería Mecánica de la Universidad Nacional de Ingeniería. Se indican cinco créditos y sesiones intersemanales de teoría y práctica, se conserva la atribución académica al Ing. Eden Angel Molina Capcha y no se muestran unidades ni nombres adicionales del sílabo. | Texto aplicado a la página de bienvenida. Pendiente validación automática y revisión visual; sin publicación en producción. |

Para cada decisión posterior, añadir una fila con el identificador del paso. Si cambia una decisión previa, registrar el cambio y actualizar su estado en la tabla correspondiente.

## 7. Ficha breve antes de implementar un paso

- **Paso e identificador:**
- **Necesidad concreta:**
- **Decisión del usuario:**
- **Alcance de la primera entrega:**
- **Muestra o ejemplo acordado, si corresponde:**
- **Pantallas y funciones afectadas:**
- **Comprobaciones necesarias:**
- **Datos, permisos o servicios adicionales:**
- **Pendientes para otra etapa:**
- **Estado del desarrollo:**
- **Estado de revisión:**
- **Estado de publicación:**

## 8. Referencias del proyecto

- [Arquitectura del contenido y del editor](arquitectura-contenido.md).
- [Informe de mejoras del 18 de noviembre de 2026](informes/2026-11-18-mejoras-plataforma.md).
- [Plantilla de documentación de una mejora](plantilla-mejora.md).
- [Guía de colaboradores](../GUIA_COLABORADORES.md).
