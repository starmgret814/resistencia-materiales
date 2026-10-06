# Guía para Colaboradores — Resistencia de Materiales (MC361)

¡Bienvenido al equipo de redacción y desarrollo de contenido interactivo del curso **Resistencia de Materiales (MC361)** de la **Universidad Nacional de Ingeniería (UNI)**!

Esta guía rápida contiene todo lo necesario para redactar, estructurar y publicar temas teóricos, fórmulas y problemas resueltos en la plataforma.

---

## 1. Bienvenida

### ¿Qué es la plataforma?
Es un libro de texto digital interactivo diseñado específicamente para los estudiantes del curso de Resistencia de Materiales. Combina explicaciones conceptuales claras, fórmulas matemáticas en alta calidad, simulaciones visuales y ejercicios prácticos con soluciones paso a paso.

### ¿Qué debe hacer el colaborador?
- Redactar y actualizar los temas teóricos de los capítulos asignados.
- Incorporar diagramas, fórmulas con LaTeX y figuras claras.
- Proponer ejemplos resueltos detallados y problemas de autoevaluación.
- Asegurar que la notación y las unidades sigan el estándar académico de la UNI.

---

## 2. Acceso y Editor

1. **Cómo entrar:**
   - Ingresa a la ruta `/login` desde tu navegador.
   - Inicia sesión con tus credenciales asignadas (correo y contraseña).
2. **Cómo abrir un capítulo:**
   - Una vez autenticado, serás dirigido al panel de capítulos (`/workspace-mc361`).
   - Haz clic sobre el subtema que deseas editar para abrir el entorno de trabajo.
3. **Cómo escribir:**
   - El panel izquierdo contiene el **Editor** (basado en Monaco Editor / VS Code) con resaltado de sintaxis Markdown y MDX.
   - Dispones de una barra de herramientas superior con botones de acceso rápido para dar formato, insertar ecuaciones y añadir bloques pedagógicos.
4. **Vista previa:**
   - El panel derecho muestra la **Vista Previa en tiempo real**. Todo cambio que escribas se reflejará instantáneamente con los estilos finales del libro.
5. **Guardar borrador:**
   - Haz clic en el botón **"Guardar"** en la barra superior. Tus cambios se almacenarán de forma segura en la base de datos sin alterar la versión pública visible para los alumnos.
6. **Enviar a revisión:**
   - Cuando hayas concluido tu redacción y verificado la vista previa, pulsa el botón **"Enviar a revisión"**. Tu aporte quedará en cola para que un administrador lo valide y lo publique en la web principal.

---

## 3. Markdown Básico

| Elemento | Sintaxis | Ejemplo / Resultado |
| :--- | :--- | :--- |
| **Encabezado 1** | `# Título Principal` | Solo para el título de la página (uno por tema). |
| **Encabezado 2** | `## Subtítulo de Sección` | Divide las grandes partes de la lección. |
| **Encabezado 3** | `### Subsección` | Para apartados específicos. |
| **Negrita** | `**texto en negrita**` | **texto en negrita** |
| **Cursiva** | `*texto en cursiva*` | *texto en cursiva* |
| **Lista numerada** | `1. Primer paso`<br>`2. Segundo paso` | Pasos ordenados de un método. |
| **Lista de viñetas** | `- Hipótesis 1`<br>`- Hipótesis 2` | Elementos sin orden estricto. |
| **Enlace** | `[Texto del enlace](https://...)` | Vínculos a recursos o referencias. |
| **Separador** | `---` | Línea divisoria horizontal entre bloques. |

> **Nota:** Deja siempre una línea en blanco entre párrafos y entre bloques para que el renderizado sea fluido.

---

## 4. Matemáticas con LaTeX

La plataforma utiliza **KaTeX** para renderizar matemáticas con tipografía vectorial nítida.

### Fórmulas en línea vs. en bloque
- **En línea** (dentro del texto): encierra la fórmula entre signos de dólar simples `$ ... $`.
  ```markdown
  El esfuerzo axial promedio se define como $\sigma = P / A$ en la sección transversal.
  ```
- **En bloque** (centrada e independiente): encierra la expresión entre signos dobles `$$ ... $$`.
  ```markdown
  $$
  \sigma = \frac{P}{A}
  $$
  ```

### Sintaxis matemática frecuente

| Operación / Símbolo | Sintaxis LaTeX | Resultado |
| :--- | :--- | :--- |
| **Fracción** | `\frac{numerador}{denominador}` | $\frac{a}{b}$ |
| **Subíndices / Superíndices** | `\sigma_{adm}`, `I_{xx}`, `L^2` | $\sigma_{adm}$, $I_{xx}$, $L^2$ |
| **Raíces** | `\sqrt{x}`, `\sqrt[3]{V}` | $\sqrt{x}$, $\sqrt[3]{V}$ |
| **Multiplicación / Punto** | `\cdot`, `\times` | $\cdot$, $\times$ |
| **Aproximación / Desigualdad** | `\approx`, `\le`, `\ge`, `\neq` | $\approx$, $\le$, $\ge$, $\neq$ |
| **Ángulos y grados** | `\theta`, `\phi`, `45^\circ` | $\theta$, $\phi$, $45^\circ$ |
| **Sumatorias e Integrales** | `\sum_{i=1}^n`, `\int_0^L` | $\sum_{i=1}^n$, $\int_0^L$ |

### Símbolos clave de Resistencia de Materiales

| Símbolo | Comando | Significado usual |
| :--- | :--- | :--- |
| $\sigma$ | `\sigma` | Esfuerzo normal |
| $\tau$ | `\tau` | Esfuerzo cortante |
| $\varepsilon$ | `\varepsilon` | Deformación unitaria normal |
| $\gamma$ | `\gamma` | Deformación angular (cortante) |
| $\nu$ | `\nu` | Coeficiente de Poisson |
| $\delta$ | `\delta` | Desplazamiento / alargamiento axial |

### Ejemplos aplicados de fórmulas

- **Ley de Hooke unidimensional:**
  ```markdown
  $$
  \sigma = E \cdot \varepsilon
  $$
  ```

- **Deformación axial en barras:**
  ```markdown
  $$
  \delta = \frac{P \cdot L}{E \cdot A}
  $$
  ```

- **Fórmula de flexión elástica (Navier):**
  ```markdown
  $$
  \sigma = -\frac{M \cdot y}{I}
  $$
  ```

- **Fórmula del esfuerzo cortante transversal:**
  ```markdown
  $$
  \tau = \frac{V \cdot Q}{I \cdot t}
  $$
  ```

- **Torsión en ejes circulares:**
  ```markdown
  $$
  \tau_{max} = \frac{T \cdot c}{J}
  $$
  ```

---

## 5. Componentes del Libro

Puedes utilizar componentes especiales diseñados para enriquecer pedagógicamente el libro. Todos los componentes se escriben con la primera letra en mayúscula.

### 1. `<Definition>`
Resalta axiomas, conceptos fundamentales o definiciones formales.
```markdown
<Definition title="Esfuerzo Normal">
El esfuerzo normal $\sigma$ representa la intensidad de las fuerzas internas perpendiculares al plano de corte por unidad de área.
</Definition>
```

### 2. `<Formula>`
Enfatiza una ecuación estelar del tema en un bloque central con etiqueta.
```markdown
<Formula label="Ley de Hooke Uniaxial">
$$
\sigma = E \cdot \varepsilon
$$
</Formula>
```

### 3. `<Example>`
Estructura un ejercicio práctico resuelto paso a paso.
```markdown
<Example number={1} title="Barra sometida a tracción">
Una varilla de acero estructural con diámetro de $20\text{ mm}$ y longitud de $2\text{ m}$ soporta una carga axial de $50\text{ kN}$. Si $E = 200\text{ GPa}$, determine el esfuerzo normal y el alargamiento total.

<Solution>
1. **Cálculo del área transversal:**
   $$
   A = \frac{\pi}{4}(0.02\text{ m})^2 = 3.1416 \times 10^{-4}\text{ m}^2
   $$

2. **Cálculo del esfuerzo:**
   $$
   \sigma = \frac{50 \times 10^3\text{ N}}{3.1416 \times 10^{-4}\text{ m}^2} = 159.15\text{ MPa}
   $$

3. **Cálculo del alargamiento:**
   $$
   \delta = \frac{P \cdot L}{E \cdot A} = \frac{(50\times 10^3)(2)}{(200\times 10^9)(3.1416\times 10^{-4})} = 1.59\text{ mm}
   $$
</Solution>
</Example>
```

### 4. `<Problem>`
Presenta un problema propuesto para el estudiante con borde delimitador.
```markdown
<Problem number={1} title="Esfuerzo cortante en pasador">
Determine el diámetro mínimo necesario de un pasador de acero con esfuerzo cortante admisible $\tau_{adm} = 80\text{ MPa}$ sometido a una fuerza cortante simple de $25\text{ kN}$.

<Solution>
Aplicando la condición de diseño $\tau \le \tau_{adm}$:
$$
A \ge \frac{V}{\tau_{adm}} \implies d \ge \sqrt{\frac{4 \cdot V}{\pi \cdot \tau_{adm}}} = 19.95\text{ mm}
$$
Se recomienda un diámetro comercial de $20\text{ mm}$.
</Solution>
</Problem>
```

### 5. `<Solution>`
Se coloca dentro de un `<Example>` o `<Problem>`. Genera un desplegable interactivo (**"Mostrar Solución"**) que no satura la lectura visual inicial del estudiante.
```markdown
<Solution>
Paso 1: Dibujar el diagrama de cuerpo libre (DCL).
Paso 2: Aplicar las ecuaciones de equilibrio estático $\sum F_y = 0$.
</Solution>
```

### 6. `<Summary>`
Recuadro de cierre al final de la lección para sintetizar las conclusiones y fórmulas clave.
```markdown
<Summary title="Resumen del Capítulo">
- El esfuerzo normal $\sigma = P/A$ es uniforme solo si la carga pasa por el centroide.
- El principio de Saint-Venant garantiza validez lejos de las discontinuidades.
- Verifica siempre la coherencia dimensional de las unidades antes de calcular.
</Summary>
```

### 7. `<Image>`
Inserta una ilustración técnica con pie de foto y ajuste responsivo.
```markdown
<Image 
  src="https://res.cloudinary.com/.../dcl-viga.png" 
  alt="Diagrama de cuerpo libre de viga simplemente apoyada" 
  caption="Figura 1.1: Diagrama de cuerpo libre y reacciones en los apoyos."
/>
```

### 8. `<ImageGrid>`
Permite colocar dos o más imágenes alineadas en columnas para comparar diagramas.
```markdown
<ImageGrid columns={2}>
  <Image 
    src="https://res.cloudinary.com/.../viga-cargas.png" 
    alt="Distribución de cargas" 
    caption="Figura 2a: Viga con carga distribuida" 
  />
  <Image 
    src="https://res.cloudinary.com/.../diagrama-cortante.png" 
    alt="Diagrama de fuerza cortante" 
    caption="Figura 2b: Diagrama de fuerza cortante (V)" 
  />
</ImageGrid>
```

### 9. `<Quiz>`
Crea una pregunta conceptual interactiva de autoevaluación.
```markdown
<Quiz question="¿Qué ocurre con la deformación lateral cuando un elemento elástico se estira longitudinalmente?">
El elemento experimenta una contracción lateral proporcional regida por el coeficiente de Poisson: $\varepsilon_{lat} = -\nu \cdot \varepsilon_{long}$.
</Quiz>
```

---

## 6. Imágenes

1. **Cómo subir una imagen con el botón del editor:**
   - Ubica el cursor en la línea donde deseas que aparezca la imagen.
   - Haz clic en el botón de **Imagen** en la barra superior del editor.
   - Selecciona el archivo gráfico (`.png`, `.jpg`, `.svg`) desde tu computadora.
   - El sistema subirá automáticamente la imagen a la nube y generará la etiqueta `<Image ... />` en el editor.
2. **Atributos obligatorios:**
   - **`alt`**: Descripción técnica breve de la figura (esencial para accesibilidad).
   - **`caption`**: Leyenda numerada visible debajo de la imagen (ejemplo: *Figura 3.2: Deformación angular bajo momento torsor*).

---

## 7. Plantilla para Crear un Tema

Copia y pega la siguiente estructura base cuando comiences un nuevo subtema:

```markdown
# 1.1 Concepto de Esfuerzo Normal

El concepto de esfuerzo es fundamental en la mecánica de materiales para cuantificar la intensidad de las fuerzas internas distribuidas que surgen en un cuerpo deformable.

<Definition title="Esfuerzo Normal Promedio">
Intensidad de fuerza normal interna que actúa por unidad de área transversal en un elemento prismático sometido a carga axial centrada.
</Definition>

## Fundamento Teórico

Consideremos una barra prismática de sección transversal constante $A$ sometida a una fuerza axial $P$ que pasa a través del centroide de la sección.

<Formula label="Ecuación del Esfuerzo Axial">
$$
\sigma = \frac{P}{A}
$$
</Formula>

Donde:
- $\sigma$ es el esfuerzo normal en pascales ($\text{Pa}$) o megapascales ($\text{MPa}$).
- $P$ es la carga axial interna resultante en newtons ($\text{N}$).
- $A$ es el área de la sección transversal en metros cuadrados ($\text{m}^2$).

<Image 
  src="https://res.cloudinary.com/.../barra-axial.png" 
  alt="Distribución uniforme de esfuerzo normal en barra axial" 
  caption="Figura 1.1: Distribución uniforme de esfuerzos en una sección transversal alejada de los apoyos."
/>

## Ejemplo Práctico

<Example number={1} title="Verificación de esfuerzo en tirante">
Un tirante circular de aluminio con diámetro $d = 25\text{ mm}$ soporta una carga de tracción $P = 40\text{ kN}$. Determine si el esfuerzo de trabajo supera el esfuerzo admisible $\sigma_{adm} = 90\text{ MPa}$.

<Solution>
1. **Área transversal:**
   $$
   A = \frac{\pi}{4}(0.025)^2 \approx 4.909 \times 10^{-4}\text{ m}^2
   $$

2. **Esfuerzo actuante:**
   $$
   \sigma = \frac{40 \times 10^3\text{ N}}{4.909 \times 10^{-4}\text{ m}^2} = 81.48\text{ MPa}
   $$

3. **Conclusión:**
   Como $\sigma = 81.48\text{ MPa} \le 90\text{ MPa}$, el tirante **cumple** con el criterio de resistencia admisible.
</Solution>
</Example>

## Ejercicio de Autoevaluación

<Quiz question="¿Bajo qué condición la distribución del esfuerzo normal deja de ser uniforme?">
La distribución deja de ser uniforme cerca de los puntos de aplicación de cargas concentradas o ante cambios bruscos de sección (concentración de esfuerzos), según el principio de Saint-Venant.
</Quiz>

<Summary title="Puntos Clave">
- La fórmula $\sigma = P/A$ es aplicable en barras prismáticas homogéneas cargadas axialmente.
- Las unidades típicas son: $1\text{ MPa} = 10^6\text{ N/m}^2 = 1\text{ N/mm}^2$.
- Las cargas deben pasar por el centroide para evitar flexión adicional.
</Summary>
```

---

## 8. Errores Frecuentes

1. **No cerrar las etiquetas de los componentes:**
   - ❌ `<Definition> Texto sin cerrar`
   - ✅ `<Definition> Texto </Definition>`
2. **Escribir componentes con minúscula:**
   - ❌ `<definition>` o `<example>`
   - ✅ `<Definition>` o `<Example>`
3. **No dejar saltos de línea entre bloques:**
   - Si pegas un bloque JSX inmediatamente después de un párrafo sin dejar un renglón en blanco, el analizador de Markdown puede no reconocerlo correctamente.
4. **Fórmulas de bloque sin los dobles signos `$$`:**
   - ❌ `$\sigma = \frac{P}{A}$` en renglón solitario sin centrar.
   - ✅ `$$\sigma = \frac{P}{A}$$`
5. **Rutas de imagen locales:**
   - ❌ `C:\MisDocumentos\foto.png`
   - ✅ Utiliza siempre el botón de subir imagen para que se genere un enlace web accesible en la nube.

---

## 9. Reglas de Contenido

- **Claridad y rigor:** Escribe en un tono pedagógico, directo y académicamente riguroso acorde al nivel de la Facultad de Ingeniería Mecánica de la UNI.
- **Uso estricto del Sistema Internacional (SI):**
  - Fuerza en $\text{N}$ o $\text{kN}$.
  - Longitud en $\text{m}$ o $\text{mm}$.
  - Esfuerzo y presión en $\text{Pa}$, $\text{kPa}$, $\text{MPa}$ o $\text{GPa}$ (recuerda que $1\text{ MPa} = 1\text{ N/mm}^2$).
  - Momentos en $\text{N}\cdot\text{m}$ o $\text{kN}\cdot\text{m}$.
- **Desarrollo paso a paso:** En los problemas resueltos, no omitas el planteamiento estático (DCL), las fórmulas base y la sustitución numérica con unidades.
- **Sin enlaces innecesarios:** Evita colocar enlaces externos que puedan quedar rotos con el tiempo.
- **Revisión previa:** Revisa minuciosamente el panel derecho (Vista Previa) para corroborar que ninguna fórmula o bloque quede cortado o con errores tipográficos.

---

### ¿Terminaste? Guarda el contenido y envíalo a revisión.
