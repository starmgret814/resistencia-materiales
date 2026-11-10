# 📖 Resistencia de Materiales — UNI

Plataforma interactiva del curso de Resistencia de Materiales de la Universidad Nacional de Ingeniería (UNI). Visítala en vivo en **[webresis.github.io](https://webresis.github.io)**.

---

## 🚀 Primeros pasos (para alguien completamente nuevo)

### 1. Instala las herramientas necesarias

Antes de clonar el proyecto necesitas tener instalado:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Node.js** | 18 o superior | [nodejs.org](https://nodejs.org/) → descarga el instalador LTS |
| **Git** | Cualquiera | [git-scm.com](https://git-scm.com/downloads) |

> 💡 **¿Cómo verificar si ya los tienes?** Abre una terminal (PowerShell en Windows / Terminal en Mac o Linux) y ejecuta:
> ```bash
> node --version   # debe mostrar v18.x.x o superior
> git --version    # debe mostrar cualquier versión
> ```

Un editor de texto como [VS Code](https://code.visualstudio.com/) es altamente recomendado.

---

### 2. Clona el repositorio

```bash
git clone https://github.com/webresis/webresis.github.io.git
cd webresis.github.io
```

### 3. Instala las dependencias

```bash
npm install
```

Esto descargará todos los paquetes necesarios (puede tardar 1–2 minutos la primera vez).

### 4. Inicia el servidor de desarrollo

```bash
npm run dev
```

Abre **[http://localhost:4321](http://localhost:4321)** en tu navegador. ¡Ya puedes ver el curso corriendo localmente!

> ℹ️ El servidor se recarga automáticamente cada vez que guardas un archivo. No necesitas reiniciarlo.

---

## 📁 Estructura del proyecto

```
webresis.github.io/
├── components/                   ← Componentes de la UI (NO tocar)
├── lib/                          ← Utilidades y datos del curso
│   └── course-data.ts            ← 📌 Registrar secciones nuevas aquí
├── src/
│   ├── content/                  ← ⭐ TU CONTENIDO VA AQUÍ
│   │   └── resistencia/
│   │       ├── 01-esfuerzos-falla/
│   │       │   └── conceptos-principales/
│   │       │       └── index.mdx
│   │       ├── 02-deformaciones-ley-hooke/
│   │       │   └── conceptos-principales/
│   │       │       └── index.mdx
│   │       └── ...
│   ├── pages/                    ← Rutas de Astro (NO tocar)
│   └── layouts/                  ← Plantillas de página (NO tocar)
├── public/                       ← Archivos estáticos (favicon, etc.)
├── astro.config.mjs              ← Configuración de Astro (NO tocar)
├── package.json
└── README.md                     ← Esta guía
```

### Regla de oro

> **Solo necesitas editar archivos dentro de `src/content/resistencia/`.**
> No necesitas tocar `src/pages/`, `components/`, ni crear ninguna página.

---

## ✍️ ¿Cómo agregar o administrar contenido?

¡Olvídate de crear carpetas manualmente o tocar código de configuración! Hemos creado un **Panel de Administración** súper fácil de usar desde tu terminal.

### Paso 1 — Abre el Panel de Administración

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npm run gestor
```

### Paso 2 — Selecciona lo que quieres hacer

Aparecerá un menú interactivo a color. Usa las flechas de tu teclado (Arriba/Abajo) y la tecla **Enter** para elegir:

*   ✨ **Crear nuevo tema:** Elige el capítulo y ponle un título. ¡El sistema creará la carpeta, armará una plantilla base para ti, y lo enlazará al menú automáticamente!
*   ✏️ **Editar título de un tema:** Te permite cambiarle el nombre a cualquier tema existente de manera fácil.
*   🗑️ **Eliminar un tema:** Borra un tema viejo (te pedirá confirmación clara para no borrar nada por accidente).

### Paso 3 — Edita tu contenido

Si creaste un nuevo tema (ej. "Ley de Hooke"), el sistema te dirá dónde creó el archivo (ej. `src/content/resistencia/02-deformaciones/ley-de-hooke/index.mdx`). 
¡Solo abre ese archivo en tu editor y empieza a escribir usando los componentes de abajo!

---

## 🧩 Componentes Especiales (Cajas de diseño)

Para que tus clases se vean como un libro profesional, hemos creado "cajas" de diseño que puedes usar simplemente copiando y pegando unos textos especiales. No necesitas saber programar, solo copia el código y cambia el texto de adentro.

### 1. Definiciones (`<Definition>`)
Usa esto cuando quieras resaltar un concepto importante.

```mdx
<Definition title="¿Qué es el esfuerzo?">
El esfuerzo es la fuerza interna que se genera en un material cuando le aplicamos una carga externa.
</Definition>
```

### 2. Ecuaciones Destacadas (`<Formula>`)
Usa esto para poner una fórmula en una cajita especial para que resalte.

```mdx
<Formula label="Ley de Hooke">
  $$ \sigma = E \cdot \varepsilon $$
</Formula>
```

### 3. Ejemplos Resueltos (`<Example>`) y Soluciones (`<Solution>`)
Si quieres poner un ejemplo resuelto paso a paso. Recuerda usar `number={1}` para que se numere automáticamente. Lo que pongas dentro de `<Solution>` estará oculto hasta que el alumno haga clic.

```mdx
<Example number={1} title="Cálculo en un cable">
Un cable soporta 8 kN de peso. ¿Cuál es su esfuerzo?

<Solution>
Dividimos la fuerza entre el área para hallar el esfuerzo final.
</Solution>
</Example>
```

### 4. Problemas para Resolver (`<Problem>`)
Igual que el ejemplo, pero con un diseño punteado para ejercicios propuestos.

```mdx
<Problem number={1} title="Reto para el alumno">
Calcula el esfuerzo cortante de la siguiente figura.

<Solution>
La respuesta correcta es 15 MPa.
</Solution>
</Problem>
```

### 5. Resumen (`<Summary>`)
Ideal para colocar al final de la página para resumir la clase.

```mdx
<Summary>
En esta clase aprendimos que los materiales se deforman dependiendo de su módulo de elasticidad.
</Summary>
```

### 6. Imágenes (`<Image>`)
Guarda la imagen (por ejemplo `foto.png`) en la **misma carpeta** donde estás escribiendo tu texto y copia esto:

```mdx
<Image src="foto.png" alt="Descripción corta de la foto" caption="Figura 1: Aquí va el texto que aparece debajo de la imagen." />
```

---

## 🛠️ Herramientas Interactivas (Calculadoras)

Inserta una herramienta directamente en el Markdown del tema:

```mdx
<Tool id="mohr-esfuerzos" />

<Tool id="mohr-deformaciones" />
```

También están disponibles `esfuerzo-normal` y `deformacion-axial`. Las herramientas funcionan en la vista previa del editor y en el curso público. En **Insertar componente** encontrarás las plantillas. Consulta los detalles en [la guía de colaboradores](GUIA_COLABORADORES.md#herramientas-interactivas).

---

## 🔢 Escribiendo Matemáticas (Fórmulas)

No necesitas ser un experto en matemáticas de computadora. Para escribir fórmulas bonitas, usamos un sistema que convierte códigos de texto en símbolos matemáticos reales. 

**Regla de oro:** Siempre encierra tus fórmulas entre dos signos de dólar `$$` arriba y abajo.

Aquí tienes un "copia y pega" de las fórmulas que más usarás en el curso. Solo cópialas en tu archivo y cambia las letras que necesites:

```mdx
<!-- Fracciones básicas (P sobre A) -->
$$
\frac{P}{A}
$$

<!-- Esfuerzo normal -->
$$
\sigma = \frac{P}{A}
$$

<!-- Esfuerzo cortante -->
$$
\tau = \frac{V}{A}
$$

<!-- Deformación axial -->
$$
\delta = \frac{P \cdot L}{A \cdot E}
$$
```

### Diccionario rápido de símbolos:
Copia y pega estos "códigos" dentro de tus signos de dólar (`$$`) para generar el símbolo.

| Si quieres este símbolo | Copia este código |
|---|---|
| Esfuerzo (σ) | `\sigma` |
| Cortante (τ) | `\tau` |
| Deformación (ε) | `\varepsilon` |
| Pi (π) | `\pi` |
| Potencia (ej. x²) | `x^2` |
| Multiplicación (punto) | `\cdot` |
| Raíz Cuadrada (√) | `\sqrt{25}` |
| Fracción | `\frac{arriba}{abajo}` |

---

## 📝 Plantilla de tema completa

Copia esta plantilla para empezar un tema nuevo:

```mdx
{/*
  Título del tema — Capítulo XX
  Autor: Tu nombre
*/}

# Título del tema

Párrafo introductorio que explica de qué trata este tema
y por qué es importante en resistencia de materiales.

---

## Conceptos fundamentales

<Definition title="Nombre del concepto">
Definición formal incluyendo variables y su significado físico.
</Definition>

## Ecuación principal

$$
\sigma = \frac{P}{A}
$$

donde:
- **σ** — esfuerzo normal (MPa)
- **P** — fuerza aplicada (N)
- **A** — área de la sección transversal (mm²)

## Diagrama

<Image
  src="./diagrama-principal.png"
  alt="Descripción del diagrama"
  caption="Figura X.1 — Título del diagrama"
/>

<Note>
Observación importante sobre condiciones de aplicabilidad.
</Note>

## Ejemplo resuelto

<Example title="Problema X.1 — Título descriptivo">
Enunciado del problema con todos los datos.

**Datos:**
- Variable₁ = valor₁
- Variable₂ = valor₂

**Solución:**

$$
\text{Paso 1: } A = \frac{\pi d^2}{4}
$$

$$
\text{Paso 2: } \sigma = \frac{P}{A}
$$
</Example>

## Problema propuesto

<Problem>
Enunciado del ejercicio para que el estudiante resuelva.
Incluye todos los datos necesarios.
</Problem>

<Quiz
  question="¿Pregunta conceptual sobre el tema?"
  answer={<>Respuesta explicada claramente.</>}
/>
```

---

## ❓ Preguntas frecuentes

### ¿Necesito saber React o programación?
**No.** Solo necesitas saber Markdown (y opcionalmente LaTeX para ecuaciones). Los componentes como `<Definition>` y `<Example>` se usan como etiquetas HTML simples.

### ¿Necesito crear una página o ruta manualmente?
**No.** Solo crea tu archivo `index.mdx` y el sistema genera la página automáticamente.

### ¿Dónde pongo mis imágenes?
En la **misma carpeta** que tu `index.mdx`. Referencíalas con `<Image src="./mi-imagen.png" alt="..." />`.

### ¿Cómo veo mi contenido en el navegador?
Con `npm run dev` corriendo, navega a `http://localhost:4321/curso/<tu-slug>`.

Por ejemplo, si tu carpeta es `src/content/resistencia/02-deformaciones-ley-hooke/ley-de-hooke/`, la URL es:
```
http://localhost:4321/curso/02-deformaciones-ley-hooke/ley-de-hooke
```

### ¿Mi sección aparece como "Próximamente"?
Significa que el slug está en `lib/course-data.ts` pero el archivo `index.mdx` no existe todavía. ¡Créalo!

### ¿Cómo agrego un capítulo nuevo?
Edita `lib/course-data.ts` y agrega un nuevo objeto al array `chapters` con su número, título y secciones.

### ¿Puedo usar HTML normal en MDX?
Sí, pero para la mayoría de casos los componentes disponibles son suficientes y mantienen el estilo visual consistente.

### ¿Las ecuaciones se ven bien en el sitio publicado?
Sí, usamos KaTeX. Cualquier expresión LaTeX estándar funciona. Si algo no se renderiza, consulta la [documentación de KaTeX](https://katex.org/docs/supported).

---

## 🛠️ Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:4321` |
| `npm run build` | Genera el sitio estático en la carpeta `dist/` |
| `npm run preview` | Previsualiza el sitio construido localmente |

---

## 🧱 Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Astro 4](https://astro.build/) | Framework web estático |
| [React 18](https://react.dev/) | Componentes interactivos (Islands) |
| [TypeScript](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos |
| [MDX](https://mdxjs.com/) | Contenido del curso |
| [KaTeX](https://katex.org/) | Ecuaciones matemáticas |
| [Lucide](https://lucide.dev/) | Íconos |
| [GitHub Pages](https://pages.github.com/) | Hosting del sitio |

---

**¿Tienes dudas?** Abre un [issue en el repositorio](https://github.com/webresis/webresis.github.io/issues) o contacta al equipo del curso.
