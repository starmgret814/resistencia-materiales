# Guía de administración

Instrucciones y novedades para las cuentas administradoras de MC361. Para escribir fórmulas, problemas, tablas y otros bloques, consulta la [guía de formato de contenidos](/guia-colaboradores). Esta guía no cambia los permisos de ninguna cuenta.

<a id="novedades"></a>

## Novedades de administración

### 22 de noviembre de 2026 · Revisión y documentación por rol

- **Novedades de contenido para todo el equipo:** subida de imágenes para obtener solo su enlace, imágenes sin borde y títulos de tablas que conservan las mayúsculas y minúsculas escritas. Sus instrucciones están en [Novedades para colaboradores](/guia-colaboradores#novedades).
- **Revisión antes de aprobar:** compara la publicación con la propuesta en una vista de ancho completo, con cambios resaltados y vista de la página. [Cómo revisar](#guia-revision-cambios).
- **Desplazamiento y líneas:** los dos paneles pueden desplazarse juntos o por separado; «Ajustar líneas» se aplica a ambos. Los controles se pueden utilizar con teclado.
- **Publicación independiente:** puedes publicar desde la comparación o directamente desde el editor. Abrir la revisión no guarda ni publica. Si alguien modifica el documento, actualiza la comparación antes de aprobar.
- **Guías separadas:** la guía de colaboradores reúne las instrucciones de redacción y envío a revisión. Las novedades de aprobación, gestión y exámenes están aquí, con acceso de administrador.

### 18 de noviembre de 2026 · Capítulos administrables

- Puedes crear, renombrar, ordenar, archivar y restaurar capítulos sin limitarte a los 13 iniciales. Las asignaciones y las direcciones existentes se conservan. [Gestionar capítulos](#guia-gestion-capitulos).
- Las operaciones de estructura se aplican sobre el catálogo actual para conservar cambios de otras personas; si fallan, se conserva el estado anterior.

### 15 de noviembre de 2026 · Editor de exámenes

- Las evaluaciones se redactan como páginas web, con importación de Markdown, componentes, vista previa, respaldo local y descarga de una copia. [Publicar evaluaciones](#guia-examenes).

<a id="guia-revision-cambios"></a>

## Revisar cambios antes de publicar

1. Abre una solicitud de revisión o entra al subtema y pulsa **Revisar cambios**. La comparación sustituye la vista de edición y ocupa todo su ancho, sin ventana flotante. Si hay una copia local pendiente, primero decide si recuperarla o descartarla.
2. En **Cambios resaltados**, compara **Publicado · antes** con **Propuesta · después**. Rojo indica texto eliminado y verde texto añadido. **Ajustar líneas** actúa sobre ambos lados: activado, ambos adaptan las líneas a su columna; desactivado, ambos permiten desplazamiento horizontal. En dos columnas, **Sincronizar desplazamiento** está activado por defecto; desactívalo para mover cada panel por separado conservando los resaltados. Al activarlo de nuevo, se retoma la zona del último panel desplazado. En pantallas estrechas se utiliza una vista unificada, sin este control de sincronización.
3. Abre **Vista de la página** para comprobar cómo se presentan las fórmulas, figuras y bloques en cada versión. Si antes no había publicación, el lado anterior lo indica y toda la propuesta es nueva.
4. Para corregir la propuesta, pulsa **Volver al editor**. Entrar o salir de la comparación no guarda en la plataforma ni publica; el editor conserva su historial de Deshacer.
5. Cuando estés conforme, pulsa **Aprobar y publicar** dentro de la revisión. Se publica el texto de la propuesta revisada, incluidos los cambios aún no guardados que tuviera el editor al abrirla.
6. Si aparece un aviso de otra edición, pulsa **Actualizar comparación**. Cuando corresponda, utiliza **Cargar borrador actual** y vuelve a revisarlo. Esta acción reemplaza el texto abierto por el actual del servidor; el anterior se puede recuperar con **Deshacer**. Un documento eliminado debe comprobarse desde el panel.

Esta función compara cada sección con su publicación actual. No es un historial de versiones anteriores ni una aprobación de todo el capítulo a la vez. Los cambios de archivos de imagen que mantienen la misma dirección no tienen comparación visual histórica.

Si no necesitas comparar, el administrador puede pulsar **Publicar** directamente en el editor. Publica el texto abierto sin entrar a la revisión, conservando la comprobación de permisos y de la versión actual antes de la escritura.

<a id="guia-gestion-capitulos"></a>

## Gestionar los capítulos del curso

Los administradores encuentran **Nuevo capítulo** en el panel de contenido. Al crear uno, escribe su título; el identificador se asigna automáticamente. Junto a cada encabezado puedes renombrar y ordenar los capítulos. Los identificadores, las asignaciones de los colaboradores y las direcciones existentes se conservan.

**Archivar** retira el capítulo de la navegación pública y conserva sus secciones, borradores y publicaciones. Usa **Ver archivados → Restaurar** para recuperarlo. Los editores gestionan las secciones de sus capítulos asignados; eliminar una sección publicada requiere un administrador.

La estructura se guarda en Firestore. No necesitas editar el catálogo inicial ni volver a desplegar la web cada vez que cambias los capítulos. Los menús y las opciones de asignación consultan esa misma lista.

**Configuración inicial:** publica el archivo `firestore.rules` actualizado para habilitar la validación de estructuras de tamaño variable. El despliegue del código web no publica las reglas automáticamente.

Ctrl + Z revierte texto en el editor. Las publicaciones y los cambios guardados en la estructura son operaciones independientes. El historial se conserva mientras la instancia del editor permanezca abierta.

<a id="guia-colaboradores-acceso"></a>

## Gestionar colaboradores y accesos

En la pestaña **Colaboradores** puedes registrar cuentas autorizadas, cambiar su rol y asignarles capítulos. El rol **editor** permite trabajar en los capítulos asignados y solicitar revisión; el rol **admin** permite además aprobar y publicar, gestionar la estructura, las evaluaciones y las cuentas autorizadas.

Comprueba el correo y las asignaciones antes de guardar. Las cuentas editoras no necesitan acceso al repositorio ni permisos de administración de Firebase para redactar. Los cambios de permisos se verifican con la sesión vigente; no basta con modificar la interfaz o conocer la dirección de una pantalla.

<a id="guia-examenes"></a>

## Publicar exámenes como páginas web

El editor está en `/workspace-mc361/management/exams`, en la pestaña **Exámenes** del panel administrativo. Si tienes una sesión de administrador activa, también aparece **Editor de exámenes** en `/examenes`. La gestión y publicación están reservadas a administradores.

1. Pulsa **Nueva evaluación** y completa el periodo (`2026-1`, `2026-2`, etc.), tipo y título.
2. Escribe el contenido o usa **Importar Markdown** para cargar un archivo `.md`, `.mdx` o `.markdown`. La importación reemplaza únicamente el contenido, pide confirmación y se puede deshacer con Ctrl + Z. No publica el archivo automáticamente.
3. Usa **Insertar** para añadir problemas con soluciones, fórmulas, imágenes o tablas. Son los mismos componentes de los capítulos. Las imágenes necesitan una URL o una ruta de `public/`, por ejemplo `/imagenes/figura.png`.
4. Revisa **Vista previa** y pulsa **Publicar evaluación**. Aparecerá en el archivo público bajo su periodo y tipo. Para modificarla, selecciónala en la lista de evaluaciones publicadas.

**Descargar copia** guarda el contenido como Markdown en un archivo independiente, incluso antes de publicarlo. El respaldo automático solo permanece en el mismo navegador; descargarlo permite conservarlo aunque borres sus datos. El límite es de 200 000 caracteres por evaluación.

<a id="guia-examenes-permisos"></a>

### Si Firestore rechaza el acceso a los exámenes

El código `permission-denied` indica un rechazo de permisos. Tener `firestore.rules` en el proyecto no publica sus reglas en Firebase. Un administrador del proyecto Firebase debe revisar la colección `exams` en **Firestore Database → Reglas**.

Para publicar las reglas del proyecto desde la terminal, usa una cuenta con permisos en Firebase:

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project resistencia-materiales
```

Este despliegue reemplaza las reglas publicadas por el archivo local: revisa sus diferencias si también se editaron desde la consola. No habilites escrituras públicas. El archivo del proyecto permite consultar los exámenes y reserva su publicación y eliminación a administradores registrados. Vuelve al editor y pulsa **Reintentar carga** tras aplicar las reglas.

<a id="guia-mantenimiento"></a>

## Mantenimiento y presentación del proyecto

La página pública es `/acerca-de`. Sus textos y el equipo se configuran en `lib/project-info.ts`. Los créditos distinguen la **Autoría del material académico**, el **Desarrollo de la plataforma** y la **Adaptación de contenidos a la web**. Las presentaciones originales son del **Ing. Eden Angel Molina Capcha**; el equipo adapta ese material al formato web. Esta presentación no concede acceso al editor: los permisos se administran en el panel privado. El proyecto no se presenta como código abierto ni se enlaza su repositorio desde la página pública. Añade un objeto a `projectMembers` por persona:

```ts
{
  name: 'Nombre completo',
  role: 'Desarrollo frontend',
  area: 'development',
  description: 'Contribuciones de esta persona.',
}
```

`area` acepta `development` (desarrollo), `content` (adaptación a la web) o `academic` (autoría del material académico). `description` y `url` son opcionales. Para vincular contribuciones a capítulos, usa `chapterIds: ['01']`: el título se obtiene del catálogo actual y refleja sus cambios de nombre. Una persona puede aparecer en más de un área si tiene varias contribuciones. Añade solo nombres y enlaces que deban mostrarse públicamente; no se exponen las cuentas ni los correos del panel de colaboradores.

### Diferencia entre administrar contenidos y mantener la plataforma

Las funciones del panel actúan sobre contenidos, estructura y accesos. Modificar el diseño, añadir una herramienta o cambiar la configuración técnica requiere trabajar en el código del proyecto. El rol de administrador de la web no concede por sí mismo permisos en GitHub o Firebase. Los cambios de reglas deben publicarse desde una cuenta autorizada en Firebase; guardar este documento o desplegar la web no los publica automáticamente.

La autoría del material académico original corresponde al **Ing. Eden Angel Molina Capcha**. La adaptación de los contenidos a la web y el desarrollo de la plataforma son contribuciones diferentes.
