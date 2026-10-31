# Archivo de exámenes

Los exámenes se publican como páginas web en `/examenes`, con el mismo renderizador Markdown y KaTeX del curso. No requieren PDF.

## Agregar una evaluación

1. Inicia sesión como administrador.
2. Abre **Panel de gestión → Exámenes** (`/workspace-mc361/management/exams`).
3. Selecciona **Nueva evaluación**, indica el periodo (por ejemplo, `2026-1`), el tipo y el título.
4. Escribe el contenido y revisa la vista previa. Puedes usar `Problem`, `Solution`, fórmulas, imágenes con rutas públicas o URL completas, tablas y `TableGrid`.
5. Pulsa **Publicar evaluación**. La página queda disponible inmediatamente en el archivo público. Para modificarla, selecciónala y pulsa **Publicar cambios**.

Se permiten varias prácticas o evaluaciones del mismo tipo y periodo. Los periodos nuevos aparecen automáticamente al publicar su primera evaluación. Los periodos 2026-2, 2026-1, 2025-2 y 2025-1 se muestran inicialmente como referencia; no incluyen exámenes de ejemplo publicados.

## Configuración de Firestore

Los datos se guardan en la colección `exams`: `period`, `type`, `title` y `contentMarkdown`. El identificador de Firestore forma la URL permanente de cada evaluación.

Antes de usar el archivo en producción, hay que desplegar las reglas incluidas en `firestore.rules`. Permiten lectura pública y reservan la creación, modificación y eliminación a administradores registrados con correo verificado. Desde el proyecto y con la cuenta correspondiente:

```sh
firebase deploy --only firestore:rules --project resistencia-materiales
```

Este cambio no despliega reglas ni publica contenido por sí solo. Las comprobaciones de permisos del emulador están en `scripts/test-firestore.mjs` y se ejecutan con `npm run test:rules` (requiere Java).
