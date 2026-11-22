# Plantilla de documentación de una mejora

Este formato sirve para registrar una función antes, durante y después de su implementación. Las explicaciones principales deben poder entenderse sin conocer programación. El detalle de archivos y comandos se conserva aparte en la documentación técnica.

## Ficha de mejora

**Identificador y título:** [Número o referencia y nombre comprensible].  
**Fecha de registro:** [Fecha real].  
**Última actualización:** [Fecha real].  
**Estado del desarrollo:** [Propuesta / Planificada / En desarrollo / Implementada].  
**Estado de verificación:** [Sin comprobar / Pruebas automáticas / Comprobación manual / Ambas; explicar el alcance].  
**Estado de publicación:** [No publicada / Pendiente de confirmación / Publicada con fecha confirmada].  
**Responsable:** [Completar únicamente si está confirmado].

### 1. Necesidad que se busca resolver

[Explicar la dificultad desde la perspectiva del estudiante, profesor, colaborador o equipo de desarrollo. Si existe un error, describir en qué situación aparece.]

### 2. Objetivo y alcance acordado

[Indicar qué se pretende permitir o corregir y quién podrá utilizarlo. Distinguir lo solicitado de las ideas todavía no aprobadas.]

### 3. Trabajo realizado

[Describir lo efectivamente implementado en lenguaje sencillo. Mientras no exista, indicar «Pendiente» y mantener la propuesta en el apartado anterior. Explicar también el trabajo interno cuando aporte un beneficio: coherencia de datos, reutilización o mantenimiento.]

### 4. Cómo se utiliza

1. [Dónde se encuentra la opción o cómo se activa.]
2. [Qué debe hacer la persona.]
3. [Qué resultado debe observar y si necesita guardar, enviar a revisión o publicar.]

[Si es una mejora interna sin controles nuevos, explicar cómo se manifiesta en el uso cotidiano.]

### 5. Ejemplo concreto

[Presentar un caso breve relacionado con el curso. Explicar la situación anterior y el comportamiento esperado después del cambio.]

### 6. Beneficio para el proyecto

[Señalar qué se facilita, qué trabajo repetido se reduce o qué problema se previene. No inventar porcentajes, ahorro de horas ni resultados educativos.]

### 7. Comprobaciones realizadas

| Caso revisado | Resultado observado | Entorno y fecha |
| --- | --- | --- |
| [Acción concreta] | [Resultado real o pendiente] | [Local / demostración / web publicada; fecha] |

[Distinguir las pruebas automáticas de la revisión manual. Si se usa una captura, debe corresponder a la versión descrita y no exponer datos privados. No afirmar que una prueba local confirma el estado de producción.]

### 8. Condiciones y límites

[Indicar permisos necesarios, dependencias de conexión o publicación, límites de recuperación y otros aspectos que cambien la forma de utilizar la función. Evitar promesas de capacidad ilimitada o funcionamiento garantizado.]

### 9. Pendientes y siguiente paso

[Separar lo necesario para terminar esta mejora de futuras ampliaciones opcionales. Si necesita publicar código, reglas o configuración, indicarlo expresamente.]

### 10. Referencia técnica opcional

[Enlace a la documentación técnica o a los archivos relacionados. Este apartado puede omitirse de la versión destinada al profesor.]

## Cómo incorporar la ficha al informe

- Cuando el usuario solicite el informe, guardar las fichas de esa jornada o etapa en un archivo de `docs/informes/`, con fecha y nombre descriptivo.
- Explicar el cambio de las funciones existentes dentro del informe de la etapa. Mantener separados los antecedentes y las mejoras nuevas.
- Mantener separados los estados de desarrollo, verificación y publicación.
- Al cerrar la mejora, registrar lo que efectivamente se hizo y conservar los pendientes reales.
- Si una propuesta se cancela o sustituye, dejar constancia; no presentarla como implementada.
