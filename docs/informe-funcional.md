# Informe funcional y registro de mejoras de la plataforma

El informe específico de la jornada se encuentra en [Mejoras del 18 de noviembre de 2026](informes/2026-11-18-mejoras-plataforma.md). Este documento general queda como referencia de contexto.

**Proyecto:** Plataforma académica de Resistencia de Materiales — MC361.  
**Institución:** Universidad Nacional de Ingeniería.  
**Destinatario:** Ing. Eden Angel Molina Capcha.  
**Preparado por:** Neils Ilizarbe.  
**Fecha de esta edición:** 18 de noviembre de 2026.  
**Versión documental:** 1.0 — documento de trabajo para revisión.

Este informe está dirigido a una persona que no necesita conocer programación. Describe para qué sirve la plataforma, qué trabajo requiere su desarrollo y qué mejoras se han realizado. Se conserva como referencia; los informes de cada jornada o etapa se prepararán cuando el usuario los solicite.

Para llevarlo a Word, copia el texto desde la vista previa de Markdown y aplica los estilos «Título», «Título 1» y «Título 2» según corresponda. Las referencias a archivos del proyecto se encuentran en la documentación técnica; no son necesarias para comprender este informe.

## 1. Propósito del proyecto

El proyecto organiza el material de Resistencia de Materiales en una plataforma común, en la que los estudiantes pueden consultar explicaciones, ecuaciones, figuras, problemas y herramientas interactivas. El equipo autorizado dispone de un espacio para preparar y revisar los contenidos antes de publicarlos.

La propuesta inicial consistía en elaborar páginas HTML por separado. Construir una plataforma compartida implica, además, resolver la navegación entre temas, mantener una presentación uniforme, controlar quién puede modificar cada contenido y facilitar su actualización desde un navegador.

Por ejemplo, si cada colaborador construyera una página independiente, cada uno tendría que resolver cómo presentar una ecuación o una solución. En esta plataforma se prepara una función común y los colaboradores la utilizan en sus respectivos temas. Una mejora en esa función puede beneficiar a los contenidos que la emplean.

## 2. Autoría académica y responsabilidades del equipo

Las presentaciones originales que sirven como base del material académico son de autoría del **Ing. Eden Angel Molina Capcha**. El desarrollo de la plataforma y la adaptación de las presentaciones al formato web son contribuciones distintas, que deben reconocerse de forma separada.

| Tipo de contribución | Trabajo que comprende |
| --- | --- |
| Autoría académica | Elaborar el material original, sus explicaciones, criterios y planteamientos académicos. |
| Adaptación del contenido | Trasladar el material al formato de la plataforma, organizar los textos, escribir las expresiones matemáticas y ubicar las figuras, conservando su significado. |
| Desarrollo de la plataforma | Programar las funciones, diseñar la navegación y el editor, implementar herramientas interactivas, gestionar permisos, corregir errores y comprobar el funcionamiento. |

Una persona puede colaborar en más de una de estas áreas. Adaptar un capítulo y desarrollar las funciones que utilizarán todos los capítulos son trabajos diferentes. Los cambios de presentación no acreditan por sí solos una revisión de la exactitud académica del contenido.

## 3. Diferencia entre editar contenido y desarrollar la plataforma

Existen dos espacios de trabajo que conviene distinguir.

**El editor dentro de la página web** permite realizar las acciones que ya han sido preparadas: escribir un tema, insertar una fórmula, revisar su presentación, guardar un avance o gestionar capítulos según los permisos de la cuenta. Para utilizar estas opciones no es necesario programar, aunque sí aprender las indicaciones de formato de la guía.

**El código del proyecto** contiene las instrucciones que construyen esas opciones. Se trabaja en herramientas de desarrollo, como Visual Studio Code u otros editores. Crear una nueva capacidad puede requerir modificar varios archivos, comprobar que funciona y publicar una nueva versión de la plataforma.

| Cambio que se desea realizar | Dónde se hace actualmente |
| --- | --- |
| Corregir el texto de un tema | En el editor web, con acceso autorizado. |
| Añadir una ecuación o un problema con los formatos disponibles | En el editor web, siguiendo la guía. |
| Crear o renombrar un capítulo | En el panel de capítulos, con una cuenta administradora y la actualización habilitada. |
| Publicar una evaluación | En el editor de exámenes, con una cuenta administradora. |
| Crear un simulador que aún no existe | En el código del proyecto. |
| Añadir una nueva clase de sección a la página principal | Requiere desarrollo si no existe un control específico para hacerlo. |
| Cambiar la presentación o el comportamiento de un componente común | En el código del proyecto. |

Tener acceso al repositorio de GitHub permite acceder al código y colaborar en su desarrollo. Ese acceso no crea automáticamente nuevos botones de edición en la web. Si se quiere que una nueva tarea pueda hacerse sin programar, también hay que construir su correspondiente herramienta de administración.

## 4. Personas que utilizan la plataforma

| Perfil | Uso principal |
| --- | --- |
| Visitante o estudiante | Consultar el contenido público, navegar entre los temas, utilizar las herramientas disponibles y revisar evaluaciones publicadas. |
| Editor autorizado | Preparar y modificar contenidos de los capítulos asignados, guardar avances y enviarlos a revisión. |
| Administrador | Gestionar colaboradores y capítulos, revisar y publicar contenidos y administrar las evaluaciones. |

Los permisos dependen de la cuenta registrada. Mostrar el nombre de una persona en los créditos no le concede acceso al editor. Del mismo modo, iniciar sesión con Google identifica a la persona, pero no sustituye la autorización para modificar el proyecto.

## 5. Funciones que componen la plataforma

Esta sección resume las capacidades presentes en el proyecto. Su inclusión no significa que todas hayan sido creadas en la última actualización ni que se hayan comprobado nuevamente en la web publicada durante esta edición del informe.

### 5.1. Organización y búsqueda del contenido

El material se organiza por capítulos y secciones. La navegación permite recorrer los temas y continuar hacia contenidos anteriores o siguientes. El buscador propio de la plataforma localiza destinos a partir de los títulos y números registrados en el catálogo; cumple una función distinta de buscar palabras dentro de la página abierta con el navegador.

### 5.2. Editor con vista previa

Los colaboradores escriben en un editor y consultan una vista previa para revisar la presentación antes de publicar. Disponen de botones y ejemplos para insertar formatos frecuentes. El contenido utiliza Markdown, un formato de texto con indicaciones para distinguir títulos, listas y otros elementos.

### 5.3. Presentación de textos y expresiones matemáticas

Los contenidos disponen de estilos académicos y de un sistema para representar ecuaciones con notación matemática. Las fórmulas pueden tener numeración, referencias y resaltado. La forma de escribir cada expresión sigue siendo importante: un error en la notación de entrada puede necesitar corrección por parte del autor del contenido.

### 5.4. Encabezados y numeración de problemas

Los encabezados de los temas pueden numerarse según su posición dentro del capítulo y de la sección. Los problemas utilizan una numeración por capítulo, con continuidad entre secciones a partir del contenido publicado. Esto reduce la necesidad de actualizar números manualmente al organizar el material.

### 5.5. Bloques didácticos y figuras

Existen formatos comunes para definiciones, notas, ejemplos, problemas, soluciones, resúmenes y preguntas de autoevaluación. Las figuras pueden acompañar los enunciados mediante distintas disposiciones. Los términos con explicación y las referencias permiten conectar conceptos, ecuaciones y figuras dentro del contenido.

### 5.6. Tablas personalizables

Las tablas disponen de opciones de alineación y ancho, incluidas configuraciones por columna. También es posible agrupar varias tablas en una fila, teniendo en cuenta el espacio disponible en la pantalla. Estas opciones sirven para presentar datos sin tener que construir una tabla distinta desde cero en cada tema.

### 5.7. Herramientas interactivas

La plataforma incluye calculadoras y visualizaciones relacionadas con esfuerzo normal, deformación axial y transformación de esfuerzos y deformaciones mediante el círculo de Mohr. El estudiante puede modificar datos y observar los resultados disponibles en la herramienta. Su finalidad es apoyar la interpretación de los conceptos; no implica que se haya implementado cualquier cálculo posible del curso.

### 5.8. Evaluaciones organizadas por periodo

Los exámenes pasados pueden presentarse como páginas web con texto, fórmulas, problemas, imágenes y soluciones. Se clasifican por periodo académico y tipo de evaluación: práctica calificada, parcial, final o sustitutorio. Su preparación y publicación se realiza desde un editor reservado a administradores.

### 5.9. Revisión y publicación del contenido

Guardar un avance y publicar son acciones distintas. El colaborador puede preparar un documento y enviarlo a revisión; una persona con permisos de administración puede aprobar su publicación. Esta separación permite trabajar sin que cada cambio del borrador se convierta inmediatamente en contenido público.

### 5.10. Recuperación local del trabajo

Los editores pueden conservar una copia del texto en el navegador y ofrecer su recuperación al volver al documento. Es una ayuda frente a interrupciones, pero no sustituye el guardado en la plataforma: la copia depende del navegador y dispositivo donde se escribió. También existen opciones para descargar el contenido como archivo de texto con formato Markdown.

### 5.11. Presentación del proyecto y guía de colaboradores

La página «Acerca de» presenta el propósito del proyecto y distingue la autoría académica, el desarrollo y la adaptación de contenidos. La guía de colaboradores reúne instrucciones y ejemplos; incluye novedades para que el equipo pueda consultar los cambios recientes sin releer toda la documentación.

## 6. Registro detallado de la etapa de mejora estructural

**Fecha de referencia:** 18 de noviembre de 2026.  
**Alcance:** flexibilizar la organización del curso, separar responsabilidades internas y corregir pérdidas del historial de edición.

En las fichas siguientes, «implementado» significa que el cambio está incorporado en el código local. La publicación de esa versión y de sus reglas de acceso en el servicio utilizado por la web debe confirmarse por separado.

### Mejora 01. Administración de capítulos desde la web

**Situación que se buscó resolver.** La estructura inicial estaba vinculada a un conjunto de 13 capítulos. Ampliarla o modificar sus nombres no debía exigir intervenir en el código cada vez.

**Trabajo realizado.** Se incorporaron opciones para crear, renombrar, ordenar, archivar y restaurar capítulos desde el panel de administración. Los nuevos capítulos reciben su identificador automáticamente.

**Uso y ejemplo.** Un administrador puede pulsar «Nuevo capítulo», escribir su título y después crear sus secciones. Si necesita retirar temporalmente un capítulo, puede archivarlo y recuperarlo desde «Ver archivados».

**Beneficio.** La organización puede acompañar futuras ampliaciones del material sin depender del número inicial de capítulos.

**Comprobación.** Las pruebas automatizadas incluyeron un catálogo de 40 capítulos y operaciones de creación, cambio de nombre, orden y archivo.

**Estado y alcance.** Implementado y comprobado automáticamente en el entorno local. Archivar conserva los textos; no es una eliminación definitiva. La prueba con 40 capítulos no significa capacidad ilimitada.

### Mejora 02. Conservación de enlaces y asignaciones

**Situación que se buscó resolver.** Cambiar el nombre o el orden de un tema puede provocar problemas si también se altera la dirección mediante la cual se accede a él o su relación con un colaborador.

**Trabajo realizado.** Se conservaron los identificadores de capítulo y las direcciones de las secciones al renombrar o reordenar. Los números de sección se ajustan a su posición dentro del capítulo. Se añadieron comprobaciones para que una nueva sección no sobrescriba un documento anterior en la misma dirección.

**Uso y ejemplo.** Si se cambia el título de una sección, se puede seguir accediendo a ella por su dirección existente. Al reordenar capítulos se mantiene su número identificador, aunque cambie su posición en la lista.

**Beneficio.** Se reduce el riesgo de perder accesos existentes o desasociar contenidos y permisos durante una reorganización.

**Comprobación.** Se verificaron direcciones estables, títulos repetidos y rechazo de operaciones que pudieran sustituir contenido existente.

**Estado y alcance.** Implementado y comprobado automáticamente. La numeración identificadora de los capítulos no se renumera por moverlos de posición.

### Mejora 03. Un mismo catálogo para las distintas pantallas

**Situación que se buscó resolver.** Si cada pantalla utiliza una lista independiente de capítulos, un cambio puede aparecer en un lugar y seguir desactualizado en otro.

**Trabajo realizado.** Se conectaron la navegación pública, los paneles de gestión, las asignaciones y otros títulos relacionados con el catálogo actual del curso. También se evitó que una estructura vacía guardada fuera sustituida automáticamente por el catálogo inicial.

**Uso y ejemplo.** Al renombrar un capítulo, las pantallas que consultan el catálogo actual pueden mostrar el nombre actualizado al cargarse de nuevo. Al crear un capítulo, este puede seleccionarse para asignarlo a un colaborador.

**Beneficio.** La información se mantiene más coherente y requiere menos modificaciones repetidas.

**Comprobación.** Se comprobó el uso de estructuras dinámicas y que las rutas no recuperen secciones retiradas desde la lista inicial.

**Estado y alcance.** Implementado. Esto no equivale a sincronizar instantáneamente todas las pestañas abiertas. El catálogo inicial se conserva como respaldo de lectura ante ciertos fallos de conexión.

### Mejora 04. Protección de la estructura durante cambios simultáneos

**Situación que se buscó resolver.** Dos colaboradores podrían modificar una estructura a partir de versiones distintas y hacer que una de las actualizaciones se perdiera.

**Trabajo realizado.** Las operaciones de organización consultan la estructura vigente antes de guardar. Cuando una acción afecta a una sección y a su entrada en el catálogo, se guardan de forma coordinada. Si la operación se rechaza, no se deja aplicada solo una parte del cambio.

**Uso y ejemplo.** Un administrador puede cambiar el nombre de un capítulo mientras un editor agrega una sección en otro. El sistema comprueba la información vigente y contempla reintentos limitados cuando detecta un conflicto de catálogo.

**Beneficio.** Se reduce el riesgo de sobrescribir cambios de organización hechos por otro colaborador.

**Comprobación.** Se ejecutaron pruebas locales con cambios simultáneos y con operaciones rechazadas por falta de permisos.

**Estado y alcance.** Implementado y comprobado en el simulador local de la base de datos. No es un editor de texto colaborativo en tiempo real: dos personas que escriban simultáneamente en el mismo documento siguen siendo un caso diferente.

### Mejora 05. Conservación del historial de deshacer y rehacer

**Situación que se buscó resolver.** Algunas acciones del editor podían reiniciar su historial, por lo que Ctrl + Z dejaba de recuperar cambios anteriores. Ampliar la vista previa era una de las situaciones detectadas.

**Trabajo realizado.** Se mantuvo el editor activo al cambiar la distribución de la vista previa y se modificó la manera de insertar o reemplazar texto para conservar el historial. La lógica se comparte entre los editores de capítulos y de evaluaciones.

**Uso y ejemplo.** Un colaborador puede insertar un bloque desde la barra de herramientas, ampliar la vista previa y volver a editar sin que esa ampliación reinicie el historial. Las importaciones y recuperaciones de texto se incorporan como cambios deshacibles.

**Beneficio.** Facilita corregir errores y probar modificaciones con mayor confianza mientras se trabaja.

**Comprobación.** Se comprobaron automáticamente los límites de las operaciones de texto, la conservación de la vista y la permanencia del editor al ampliar la vista previa. Queda pendiente una comprobación manual de la interacción completa en el navegador.

**Estado y alcance.** Corrección implementada con pruebas automáticas aprobadas. Ctrl + Z se aplica al texto mientras la instancia del editor permanece abierta; no deshace publicaciones, eliminaciones ni cambios de organización guardados en el servidor, ni recupera el historial después de cerrar la página.

### Mejora 06. Permisos que no dependen de los 13 capítulos iniciales

**Situación que se buscó resolver.** Ampliar los capítulos también exige que los controles de autorización funcionen con nuevas posiciones y asignaciones.

**Trabajo realizado.** Se adaptaron las reglas de acceso para permitir cambios de secciones en el capítulo asignado a cada editor, sin enumerar solamente las 13 posiciones originales. Los cambios de la estructura general se reservan a administradores.

**Uso y ejemplo.** Un editor asignado a un capítulo posterior a los iniciales puede gestionar sus secciones. No obtiene por ello permiso para reorganizar otros capítulos o cambiar sus nombres.

**Beneficio.** Permite ampliar el catálogo manteniendo la separación de responsabilidades.

**Comprobación.** En las pruebas con 40 capítulos se aceptaron cambios autorizados y se rechazaron modificaciones ajenas a la asignación, cambios de orden no permitidos y modificaciones de capítulos archivados por editores.

**Estado y alcance.** Reglas preparadas y comprobadas en un entorno local. Su publicación en Firebase está pendiente de confirmación. Publicar el código de la web no publica estas reglas automáticamente.

### Mejora 07. Manejo de errores y organización interna reutilizable

**Situación que se buscó resolver.** Una carga fallida podía confundirse con un documento vacío o una lista sin solicitudes. Además, repetir la misma operación en varios archivos dificulta mantenerla y corregirla.

**Trabajo realizado.** Se incorporaron mensajes y opciones de reintento en cargas del contenido y de los paneles. Se separaron las operaciones de capítulos, su guardado, los controles de pantalla y las operaciones del historial del editor en funciones comunes. Se retiró código que ya no se utilizaba en los componentes modificados.

**Uso y ejemplo.** Si el documento no puede cargarse, se muestra el problema y la opción de reintentar, en lugar de presentar un texto vacío listo para sobrescribir el anterior. Una corrección en la función común de inserción puede beneficiar a los dos editores que la utilizan.

**Beneficio.** El usuario recibe información más clara y el proyecto resulta más fácil de ampliar y mantener.

**Comprobación.** Se comprobaron estados de carga, reintentos, restricciones de asignación y conservación del contenido ante operaciones fallidas. La compilación del proyecto terminó sin errores.

**Estado y alcance.** Implementado. Separar funciones es una primera etapa de mejora de la arquitectura; no significa que se haya eliminado toda configuración fija de la plataforma.

## 7. Qué se ha comprobado y qué debe confirmarse

En la etapa descrita se ejecutaron pruebas automatizadas de estructura del curso, historial del editor, carga del panel, permisos, acceso, recuperación local, evaluaciones, numeración, expresiones matemáticas y herramientas interactivas. También se comprobó que el proyecto pudiera compilarse, es decir, prepararse como una versión ejecutable sin errores de código detectados por esa comprobación.

Las pruebas de la base de datos utilizaron un entorno local de demostración y no modificaron los datos de producción. Son evidencia de los casos examinados, no una garantía de que no pueda aparecer ningún otro error.

| Aspecto | Situación documentada |
| --- | --- |
| Código de la etapa estructural | Implementado en el proyecto local. |
| Pruebas automáticas y compilación | Aprobadas durante la etapa descrita. |
| Pruebas de permisos con 40 capítulos | Aprobadas en un entorno local. |
| Reglas actualizadas en Firebase de producción | Pendiente de confirmación. |
| Publicación de esta versión de la web | Pendiente de confirmación. |
| Comprobación manual completa del editor en el navegador | Pendiente. |
| Revisión académica de los contenidos | Corresponde al proceso docente; no queda acreditada por las pruebas de software. |

## 8. Alcance de la mejora de escalabilidad

En este proyecto, mejorar la escalabilidad significa permitir que aumenten los contenidos y las necesidades sin tener que rehacer las mismas funciones para cada capítulo. Esta etapa elimina la dependencia del número inicial de capítulos y reduce lógica repetida.

No significa capacidad ilimitada ni ausencia de mantenimiento. El catálogo sigue guardándose en una estructura compartida de la base de datos, sujeta a los límites del servicio. Si en el futuro se incorporan varios cursos o un catálogo mucho mayor, habrá que evaluar una organización diferente del almacenamiento.

La etapa descrita no incorporó un servicio de pago adicional. Esto no constituye una promesa de coste cero para cualquier volumen de uso futuro.

## 9. Trabajo necesario para mantener y ampliar la plataforma

El desarrollo comprende identificar una necesidad, definir cómo utilizará la función una persona, programarla, conectarla con los datos y permisos existentes, comprobar su funcionamiento y documentarla. Publicar los cambios y atender errores posteriores también forman parte del mantenimiento.

Por esa razón, añadir una herramienta para que el profesor o los colaboradores puedan realizar cambios sin programar requiere un trabajo previo de desarrollo. La facilidad de la pantalla final es el resultado de preparar y comprobar ese comportamiento.

La documentación permitirá mostrar ese trabajo mediante cambios concretos y verificaciones. No se asignarán horas, porcentajes de avance, responsables de una función específica ni resultados que no estén registrados.

## 10. Cómo se documentarán las próximas mejoras

Cuando el usuario solicite documentar una jornada o etapa, se guardará un informe en `docs/informes/` con fecha, necesidad, descripción del trabajo, instrucciones de uso, ejemplos, beneficios, comprobaciones, límites y estado. El archivo tendrá un formato fácil de copiar a Word; en el chat se entregará su enlace. El documento «Plantilla de documentación de una mejora» queda como referencia opcional.

Antes de desarrollar una función se puede registrar como **propuesta**. Cuando su alcance se acuerde, pasará a **planificada**. Durante su construcción estará **en desarrollo**. Se indicará **implementada** cuando exista en el código y **verificada** solo con el alcance de pruebas que realmente se haya realizado. La publicación en la web se registrará por separado cuando esté confirmada.

La creación o actualización de archivos de documentación funcional se hará cuando se solicite. Cada informe distinguirá las funciones nuevas o modificadas de las capacidades anteriores que únicamente se hayan comprobado durante la etapa.

Los pendientes concretos de esta etapa son confirmar la publicación de las reglas y del código, y completar la revisión manual del editor. Cualquier otra ampliación deberá identificarse como propuesta hasta que se acuerde su alcance.

## 11. Vocabulario breve

**Plataforma:** conjunto de páginas, herramientas y servicios que permiten consultar y administrar los contenidos.

**Componente:** una pieza reutilizable, como el formato de un problema o el editor de texto.

**Base de datos:** servicio donde se almacenan, entre otros datos, el catálogo y los documentos guardados. El proyecto utiliza Firestore, de Firebase.

**Repositorio:** lugar donde se conserva el código y su historial de cambios. En este proyecto se utiliza GitHub.

**Publicar contenido:** hacer visible para los estudiantes un documento aprobado o una evaluación.

**Publicar una versión de la plataforma:** poner en funcionamiento una actualización de su código. Es una operación distinta de publicar un tema desde el editor.

**Prueba automatizada:** comprobación que ejecuta el sistema para comparar un resultado con el comportamiento esperado en un caso definido.
