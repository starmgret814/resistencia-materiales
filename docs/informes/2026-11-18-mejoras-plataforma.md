# Informe de mejoras de la plataforma de Resistencia de Materiales

**Fecha:** 18 de noviembre de 2026.  
**Elaborado por:** Neils Ilizarbe.  
**Tema:** Administración de contenidos, organización del proyecto y funcionamiento del editor.  
**Destinatario:** Ing. Eden Angel Molina Capcha.

## 1. Objetivo del trabajo de la jornada

Se trabajó en mejorar la organización interna de la plataforma y facilitar su crecimiento. El propósito principal fue permitir que la estructura del curso pueda modificarse desde la página web, reducir funciones repetidas y corregir problemas que afectaban a los colaboradores al editar.

Estas mejoras corresponden al desarrollo y mantenimiento de la plataforma. La autoría de las presentaciones académicas originales corresponde al **Ing. Eden Angel Molina Capcha**. Adaptar los contenidos de un capítulo y desarrollar las herramientas que utilizan todos los capítulos son contribuciones diferentes.

Este informe describe únicamente el trabajo de esta etapa. Cuando se mencionan funciones anteriores que fueron comprobadas, se distinguen de las mejoras incorporadas hoy.

## 2. Administración de capítulos desde la plataforma

### Situación anterior

La organización inicial estaba vinculada a los 13 capítulos originales. Ampliarla no debía exigir modificar el código del proyecto cada vez que se necesitara agregar un capítulo.

### Trabajo realizado

Se incorporaron controles para que los administradores puedan crear capítulos, modificar sus títulos, cambiar su orden, archivarlos y restaurarlos. Los capítulos nuevos reciben su identificador automáticamente y después pueden incorporar sus secciones.

### Ejemplo de uso y beneficio

Si posteriormente se necesita otro capítulo, el administrador puede pulsar «Nuevo capítulo», escribir su título y agregar sus temas desde el panel. Esto proporciona mayor autonomía para organizar el material y elimina la dependencia del número inicial de capítulos.

La mejora no implica capacidad ilimitada: el almacenamiento continúa sujeto a los límites del servicio utilizado.

## 3. Archivado de capítulos sin eliminar sus documentos

Se implementó una opción de archivado para retirar un capítulo de la navegación pública conservando sus secciones, borradores y publicaciones.

Un administrador puede recuperarlo mediante «Ver archivados» y la opción de restauración. Esto permite reorganizar temporalmente el material sin perder el trabajo anterior.

Archivar es una operación reversible y se diferencia de eliminar una sección. Esta distinción se explica en la interfaz para que el administrador conozca el efecto de su decisión.

## 4. Conservación de direcciones y asignaciones al reorganizar

Se ajustó la gestión de capítulos y secciones para conservar sus identificadores y direcciones al cambiar nombres o posiciones.

Esto es importante porque una sección puede tener enlaces existentes y pertenecer a un capítulo asignado a un colaborador. Cambiar su título no debe obligar a modificar su dirección de acceso.

Los identificadores de capítulo se mantienen al reordenar. Por ejemplo, un capítulo identificado como 04 conserva ese número aunque se cambie su posición en la lista. Los números de las secciones sí se ajustan a su orden dentro del capítulo.

También se incorporaron comprobaciones para que los títulos repetidos reciban direcciones distintas y para impedir que una sección nueva sobrescriba un documento anterior en la dirección de destino.

El beneficio es reducir errores durante una reorganización y conservar las relaciones entre contenidos, accesos y colaboradores.

## 5. Uso de un catálogo común en las diferentes pantallas

Se revisaron las pantallas que consultan la estructura del curso para que utilicen el catálogo actual, en lugar de mantener listas independientes que puedan quedar desactualizadas.

Este trabajo abarca la navegación pública, los paneles de administración, las opciones de asignación de capítulos, las solicitudes de revisión y los títulos de capítulos relacionados con las contribuciones del equipo.

Por ejemplo, un capítulo creado desde el panel debe poder aparecer entre las opciones disponibles para asignarlo a un colaborador. Al renombrarlo, las pantallas que consultan el catálogo pueden mostrar su título actualizado al cargarse de nuevo.

También se corrigieron situaciones en las que una ruta podía recuperar información del catálogo inicial aunque la estructura actual hubiera cambiado. Una lista vacía guardada intencionalmente tampoco debe sustituirse automáticamente por los capítulos originales.

Estos cambios mejoran la coherencia entre pantallas. No implican actualización instantánea de todas las pestañas abiertas. El catálogo inicial se conserva como respaldo de lectura ante determinados fallos de conexión.

## 6. Protección frente a cambios simultáneos

### Problema que se buscó prevenir

Dos personas pueden trabajar a partir de versiones distintas de la estructura del curso. Sin comprobaciones adicionales, una actualización podría sobrescribir cambios recientes de otro colaborador.

### Trabajo realizado

Las operaciones de organización consultan la información vigente antes de guardar. Cuando una acción afecta tanto al catálogo como al documento de una sección, ambos cambios se guardan de forma coordinada. Si la operación se rechaza, no debe quedar aplicada solamente una parte.

También se contemplan reintentos limitados cuando se identifica un conflicto causado por otra modificación del catálogo.

### Ejemplo y alcance

Un administrador puede cambiar el nombre de un capítulo mientras un editor agrega una sección en otro. El sistema comprueba la estructura actual para conservar las modificaciones compatibles.

Esta protección corresponde a la organización del curso. No constituye un editor de texto colaborativo en tiempo real: dos personas escribiendo simultáneamente en el mismo documento siguen siendo un caso diferente.

## 7. Corrección del historial de deshacer y rehacer

### Situación detectada

Se investigó el problema por el cual Ctrl + Z podía dejar de recuperar cambios anteriores. Algunas acciones reiniciaban el historial del editor, entre ellas ampliar la vista previa y determinadas formas de reemplazar el texto desde la interfaz.

### Trabajo realizado

- Se mantuvo activo el editor al ampliar o reducir la vista previa.
- Se modificó la forma de actualizar el texto para conservar su historial.
- Las inserciones, importaciones y recuperaciones de texto se incorporaron como operaciones deshacibles.
- Se evitó que guardar una evaluación nueva reinicie el historial por cambiar su identificación.
- La lógica de estas operaciones se comparte entre los editores de capítulos y evaluaciones.

### Beneficio y límites

El colaborador puede probar cambios y recuperar texto con mayor confianza durante su sesión de trabajo.

Ctrl + Z se aplica al texto mientras la instancia del editor permanece abierta. No revierte publicaciones, eliminaciones ni cambios de estructura guardados en la base de datos. Tampoco conserva el historial después de cerrar la página.

Las pruebas automáticas de estas operaciones fueron aprobadas. Queda pendiente una comprobación manual de la interacción completa en el navegador.

## 8. Adaptación de los permisos a una estructura ampliable

Las reglas anteriores comprobaban posiciones específicas y contenían un límite de 13 capítulos para determinadas modificaciones realizadas por editores.

Se prepararon reglas que comprueban el capítulo asignado sin depender de esas 13 posiciones. La separación de responsabilidades se mantiene:

- Los administradores gestionan la estructura general.
- Los editores gestionan las secciones de sus capítulos asignados.
- Una asignación no permite reorganizar ni renombrar los demás capítulos.
- Los editores no pueden modificar la estructura de un capítulo archivado.

Se entregó el contenido completo de las reglas actualizadas para copiarlo en Firebase. Su publicación debe confirmarse por separado: modificar el archivo del proyecto o publicar la web no actualiza automáticamente las reglas del servicio.

Publicar estas reglas modifica las autorizaciones de acceso; no elimina los documentos existentes.

## 9. Mejoras en los estados de carga y los mensajes de error

Se incorporaron mensajes y opciones de reintento para determinadas cargas del editor y de los paneles de gestión. El objetivo es que un problema de conexión no se confunda con un documento vacío o con la ausencia de solicitudes.

Por ejemplo, si un documento no puede cargarse, el editor muestra el problema y permite reintentar, en lugar de presentar un texto vacío listo para editar. En el panel de capítulos se mantiene una espera limitada y se informa cuando no es posible obtener los datos actuales para habilitar los cambios.

También se contempló la recuperación de la sesión del navegador antes de determinadas consultas que necesitan identificar al usuario.

Estas mejoras proporcionan información más clara al colaborador y reducen el riesgo de trabajar sobre una interpretación incorrecta del estado del contenido.

## 10. Separación de funciones y limpieza del código

Se reorganizó parte del código para separar responsabilidades:

| Responsabilidad | Para qué sirve separarla |
| --- | --- |
| Operaciones de capítulos y secciones | Aplicar las mismas reglas al crear, renombrar, ordenar o archivar. |
| Consulta y guardado de la estructura | Coordinar los cambios y trabajar sobre los datos actuales. |
| Controles de la interfaz | Presentar las opciones y sus estados sin repetir toda la lógica de guardado. |
| Historial del editor | Reutilizar las operaciones de texto en capítulos y evaluaciones. |

También se retiraron elementos sin uso de los componentes modificados y se deshabilitó una vía antigua de sincronización de la estructura que podía generar inconsistencias.

El beneficio es facilitar el mantenimiento: una corrección en una función compartida puede beneficiar a varias pantallas que la utilizan. También permite comprobar las operaciones de manera más independiente.

Esta es una primera etapa de mejora de la arquitectura. No significa que se haya eliminado toda configuración fija del proyecto ni que se haya completado toda su evolución futura.

## 11. Comprobaciones realizadas durante la jornada

Se ejecutaron pruebas automatizadas de la nueva estructura, los permisos, el historial del editor y las operaciones coordinadas.

Entre los casos examinados estuvieron:

- Un catálogo de 40 capítulos.
- Creación, cambio de nombre, orden, archivo y restauración de capítulos.
- Aceptación de cambios autorizados y rechazo de modificaciones fuera de la asignación.
- Conservación de direcciones y del contenido archivado.
- Modificaciones simultáneas de la estructura.
- Rechazo de operaciones que pudieran sobrescribir documentos anteriores.
- Operaciones de texto que deben conservar el historial.
- Estados de carga y recuperación ante errores.

También se comprobaron funciones anteriores, como autenticación, recuperación local de borradores, evaluaciones, numeración, fórmulas y herramientas interactivas. Estas funciones se revisaron para detectar posibles efectos de los cambios; no se presentan como funciones creadas hoy.

Las pruebas ejecutadas y la compilación del proyecto finalizaron correctamente. Compilar significa preparar una versión ejecutable y comprobar determinados errores del código.

Las comprobaciones de la base de datos se realizaron en un entorno local de demostración, sin modificar los datos de producción. Sus resultados acreditan los casos examinados, pero no sustituyen la revisión manual de uso ni una revisión académica de los contenidos.

## 12. Actualización de las instrucciones de uso

Se actualizaron las instrucciones de colaboradores para explicar la administración de capítulos, el archivado y la restauración, la conservación de direcciones y el alcance de deshacer y rehacer.

También se dejó una descripción técnica de las responsabilidades internas para facilitar el mantenimiento del proyecto. Este informe, en cambio, explica el trabajo de la jornada para una persona que no necesita conocer programación.

## 13. Estado del trabajo y pendientes

| Aspecto | Estado al elaborar el informe |
| --- | --- |
| Cambios de código descritos | Incorporados en el proyecto local. |
| Pruebas automatizadas y compilación | Aprobadas durante la etapa descrita. |
| Pruebas de permisos con 40 capítulos | Aprobadas en el entorno local de demostración. |
| Publicación de las reglas actualizadas en Firebase | Pendiente de confirmación. |
| Publicación de la versión actualizada de la web | Pendiente de confirmación. |
| Comprobación manual completa del historial del editor | Pendiente. |

Para completar la puesta en funcionamiento corresponde confirmar la publicación de las reglas y de la web, y comprobar manualmente deshacer y rehacer después de utilizar la vista previa, las inserciones y las importaciones.
