# Plan de mejoras de la plataforma

**Fecha de creación:** 18 de noviembre de 2026.  
**Estado:** etapa 1 iniciada; primera muestra visual en revisión. Las demás propuestas siguen pendientes de discutir.
**Propósito:** acordar e implementar mejoras por pasos, conservando las funciones y el contenido existentes.

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
| 1 | Diseño común | Estilos y controles coherentes entre pantallas. | En desarrollo |
| 2 | Lectura académica | Lectura cómoda y preferencias personales. | Por discutir |
| 3 | Figuras, ecuaciones e impresión | Consultar, compartir e imprimir el material con mayor facilidad. | Por discutir |
| 4 | Editor y revisión | Guardar y publicar con información clara y posibilidades de recuperación. | Por discutir |
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
| 1.1 | Acordar colores, tipografía de interfaz, bordes, espaciados y nivel de contraste. | El usuario prefiere explorar un cambio visual más amplio; comparar las variantes antes de elegir. | Medio | En revisión |
| 1.2 | Preparar una muestra de botones, campos, etiquetas y estados de foco, carga y error. | Qué elementos se sienten claros y cómodos; cuánto deben destacar. | Medio | En revisión |
| 1.3 | Aplicar la muestra acordada en una pantalla piloto. | Qué pantalla conviene mejorar primero. | Medio | Por discutir |
| 1.4 | Extender los estilos aprobados a otras pantallas, por grupos. | Orden de las pantallas y ajustes que surjan en la prueba piloto. | Medio | Por discutir |
| 1.5 | Revisar el modo oscuro existente, incluidos controles y herramientas. | Seguir la preferencia del dispositivo, conservar selección manual y ajustar contrastes. | Medio | Por discutir |

**Comprobación:** controles legibles, resaltados coherentes, foco visible, iconos consistentes y ausencia de desbordamientos en las pantallas revisadas. Aprovechar la biblioteca de iconos existente antes de añadir otra.

**Decisión actual:** el usuario indicó empezar la etapa 1 y eligió explorar un cambio visual más amplio. Se prepara una muestra independiente con fondos neutros, dos variantes de color (tinta y granate), controles compartidos y vista oscura. La selección final de colores y su aplicación a una pantalla real están pendientes de revisión.

**Muestra local:** `/muestra-diseno`, disponible solo en desarrollo. Usa contenido de ejemplo y no modifica documentos del curso. Permite crear o renombrar capítulos de ejemplo, buscar, desplegar filas, alternar variantes y comprobar controles. Los cambios se pierden al recargar. El modo oscuro de esta muestra no cambia la preferencia guardada de la plataforma.

**Comprobaciones de esta muestra:** respuesta HTTP 200 en el servidor local, comprobación de tipos y compilación aprobadas. `npm run test:interface` comprueba contraste del texto en las cuatro combinaciones, contraste del borde de los campos, asociación de etiquetas y mensajes, y estados de botones ocupados. La revisión visual e interacción real en navegador quedan pendientes: la herramienta de revisión se detuvo al no poder verificar la dirección del navegador en Windows. No se afirma una comprobación visual completa ni conformidad integral de accesibilidad.

### Etapa 2. Mejorar la lectura académica

**Objetivo:** facilitar sesiones de estudio prolongadas y adaptar la lectura a las preferencias del estudiante.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 2.1 | Comparar muestras de tipografía, tamaño e interlineado en un tema con ecuaciones y figuras. | Mantener Times New Roman o evaluar otra opción académica. | Medio | Por discutir |
| 2.2 | Añadir preferencias de tamaño, interlineado y ancho de lectura. | Cuántas opciones ofrecer y dónde colocar sus controles. | Medio | Por discutir |
| 2.3 | Incorporar una vista de concentración para ocultar paneles laterales. | Cómo activarla y cómo recuperar la navegación. | Medio | Por discutir |

**Comprobación:** fórmulas e imágenes legibles con los tamaños elegidos, preferencias recuperables y controles utilizables en móvil. Inicialmente podrían guardarse en el navegador, sin crear cuentas de estudiantes.

### Etapa 3. Figuras, ecuaciones e impresión

**Objetivo:** facilitar la consulta detallada del material y su uso fuera de la pantalla habitual.

| Paso | Propuesta | Qué discutir | Esfuerzo | Estado |
| --- | --- | --- | --- | --- |
| 3.1 | Abrir figuras ampliadas y permitir acercamiento cuando sea útil. | Tipos de figuras y comportamiento en móvil. | Medio | Por discutir |
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
| 4.4 | Comparar un borrador con la versión publicada antes de aprobarlo. | Cómo mostrar cambios en texto y expresiones matemáticas. | Alto | Por discutir |
| 4.5 | Guardar versiones anteriores y permitir su recuperación. | Qué momentos generan versiones, cuántas conservar y quién puede restaurarlas. | Alto | Por discutir |

**Comprobación:** mantener Ctrl + Z, recuperar errores de guardado y respetar permisos. Restaurar una versión no debería publicar contenido sin una acción explícita. El consumo adicional de base de datos y la política de conservación deben definirse antes de implementar el historial.

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
