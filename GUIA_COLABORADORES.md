# Guía para Colaboradores — Resistencia de Materiales (MC361)

> **Nota importante:** No necesitas instalar ningún programa ni conocer Git, GitHub o programación. Todo el contenido se escribe directamente desde la plataforma en tu navegador web.

¡Bienvenido al equipo de redacción y desarrollo de contenido interactivo del curso **Resistencia de Materiales (MC361)** de la **Universidad Nacional de Ingeniería (UNI)**!

Esta guía rápida contiene todo lo necesario para redactar, estructurar y enviar temas teóricos, fórmulas y problemas resueltos en la plataforma.

---

## 1. Bienvenida

### ¿Qué es la plataforma?
Es un libro digital interactivo diseñado para los estudiantes de Resistencia de Materiales. Su propósito es brindar una experiencia de aprendizaje moderna y accesible que combine explicaciones claras, fórmulas matemáticas nítidas, figuras técnicas y ejercicios prácticos resueltos paso a paso.

### ¿Qué debe hacer el colaborador?
- Redactar y actualizar los temas teóricos de los capítulos asignados.
- Incorporar fórmulas matemáticas y figuras explicativas claras.
- Proponer ejemplos prácticos resueltos y preguntas de autoevaluación.
- Asegurar que la notación, unidades y rigor correspondan al estándar académico de la UNI.

---

## 2. Acceso y editor

1. **Cómo entrar:**
   - Ingresa a la plataforma e inicia sesión con el correo y contraseña que te fueron asignados.
2. **Cómo abrir un capítulo:**
   - Una vez que inicies sesión, verás la lista de capítulos del curso.
   - Haz clic sobre el capítulo o subtema que deseas editar para ingresar al editor.
3. **Cómo escribir:**
   - En el lado izquierdo tienes el **Editor**, donde escribirás tu texto con formato Markdown.
   - En la parte superior dispones de una barra de herramientas con botones de acceso rápido para títulos, negrita, cursiva, fórmulas matemáticas y bloques del libro.
4. **Vista previa:**
   - En el lado derecho verás la **Vista Previa en tiempo real**. Todo lo que escribas se reflejará al instante tal como lo verá el estudiante en la página final.
5. **Guardar:**
   - Haz clic en el botón **"Guardar"** en la barra superior del editor para respaldar tu avance en cualquier momento.
6. **Enviar a revisión:**
   - Cuando hayas concluido el tema y verificado que todo se ve correctamente en la vista previa, pulsa **"Enviar a revisión"**. El equipo docente o administrador revisará tu contenido para publicarlo en la web del curso.

---

## 3. Markdown básico

El editor utiliza un formato muy simple para estructurar el texto:

| Elemento | Cómo se escribe | Ejemplo / Uso |
| :--- | :--- | :--- |
| **Título principal** | `# Título` | `# 1.1 Esfuerzo Axial` |
| **Subtítulo** | `## Subtítulo` | `## Fundamento Teórico` |
| **Sección menor** | `### Sección` | `### Hipótesis de cálculo` |
| **Negrita** | `**texto en negrita**` | **texto en negrita** |
| **Cursiva** | `*texto en cursiva*` | *texto en cursiva* |
| **Lista numerada** | `1. Paso uno`<br>`2. Paso dos` | Pasos ordenados de un cálculo |
| **Lista con viñetas** | `- Punto A`<br>`- Punto B` | Características o propiedades |
| **Enlaces** | `[Texto del enlace](https://...)` | Enlace a una referencia |
| **Separador** | `---` | Línea horizontal divisoria |

> **Consejo:** Deja siempre un renglón en blanco entre párrafos y entre bloques para que el texto respire y se visualice ordenado.

---

## 4. Matemáticas con LaTeX

Para escribir fórmulas y símbolos matemáticos se utiliza una notación estándar muy fácil de aprender.

### Fórmulas en línea vs. en bloque
- **En línea** (dentro de una oración): enciérrala entre signos de dólar simples `$ ... $`.
  ```markdown
  El esfuerzo de fluencia del material es $\sigma_y = 250\text{ MPa}$.
  ```
- **En bloque** (centrada en su propia línea): enciérrala entre signos de dólar dobles `$$ ... $$`.
  ```markdown
  $$
  \sigma = \frac{P}{A}
  $$
  ```

### Operaciones y expresiones frecuentes
- **Fracciones:** `\frac{numerador}{denominador}` $\rightarrow \frac{a}{b}$
- **Subíndices y potencias:** `\sigma_{adm}`, `I_{xx}`, `x^2`, `L_0`
- **Raíz cuadrada:** `\sqrt{x}` o raíz enésima `\sqrt[3]{V}`
- **Multiplicación:** `\cdot` $\rightarrow \cdot$
- **Aproximación:** `\approx` $\rightarrow \approx$
- **Grados:** `45^\circ` $\rightarrow 45^\circ$

### Símbolos frecuentes en Resistencia de Materiales
- Esfuerzo normal: `\sigma` ($\sigma$)
- Esfuerzo cortante: `\tau` ($\tau$)
- Deformación unitaria normal: `\varepsilon` ($\varepsilon$)
- Deformación angular (cortante): `\gamma` ($\gamma$)
- Módulo de elasticidad (Young): `$E$`
- Módulo de corte: `$G$`
- Coeficiente de Poisson: `\nu` ($\nu$)
- Alargamiento / desplazamiento: `\delta` ($\delta$)

### Ejemplos aplicados al curso
- **Ley de Hooke:**
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
- **Fórmula de flexión (Navier):**
  ```markdown
  $$
  \sigma = -\frac{M \cdot y}{I}
  $$
  ```
- **Esfuerzo cortante en vigas:**
  ```markdown
  $$
  \tau = \frac{V \cdot Q}{I \cdot t}
  $$
  ```
- **Torsión en ejes circulares:**
  ```markdown
  $$
  \tau = \frac{T \cdot \rho}{J}
  $$
  ```

---

## 5. Componentes del libro

Para hacer el libro interactivo y visualmente atractivo, dispones de componentes especiales. Se escriben siempre con la **primera letra en mayúscula**.

### 1. `<Definition>`
Recuadro destacado para conceptos fundamentales, hipótesis o definiciones formales.
```markdown
<Definition title="Esfuerzo Normal">
El esfuerzo normal $\sigma$ representa la intensidad de las fuerzas internas que actúan perpendicularmente a la sección transversal por unidad de área.
</Definition>
```

### 2. `<Formula>`
Bloque central destacado para resaltar la ecuación más importante del tema.
```markdown
<Formula label="Ecuación de Deformación Axial">
$$
\delta = \frac{P \cdot L}{E \cdot A}
$$
</Formula>
```

### 3. `<Example>`
Bloque para presentar un ejercicio resuelto completo.
```markdown
<Example number={1} title="Barra sometida a tracción">
Una varilla de acero de $20\text{ mm}$ de diámetro y $2\text{ m}$ de longitud soporta una carga axial de $40\text{ kN}$. Si $E = 200\text{ GPa}$, calcule el esfuerzo normal y el alargamiento.

<Solution>
1. **Área transversal:**
   $$
   A = \frac{\pi}{4}(0.02)^2 = 3.1416 \times 10^{-4}\text{ m}^2
   $$

2. **Esfuerzo normal:**
   $$
   \sigma = \frac{40 \times 10^3\text{ N}}{3.1416 \times 10^{-4}\text{ m}^2} = 127.32\text{ MPa}
   $$

3. **Alargamiento total:**
   $$
   \delta = \frac{(40 \times 10^3)(2)}{(200 \times 10^9)(3.1416 \times 10^{-4})} = 1.27\text{ mm}
   $$
</Solution>
</Example>
```

### 4. `<Problem>`
Recuadro con borde punteado para proponer problemas de práctica al estudiante.
```markdown
<Problem number={1} title="Diseño por cortante">
Un pasador de acero debe resistir una fuerza cortante de $30\text{ kN}$. Si el esfuerzo cortante admisible es $\tau_{adm} = 90\text{ MPa}$, determine el diámetro mínimo requerido.

<Solution>
Aplicando la condición $\tau \le \tau_{adm}$:
$$
A \ge \frac{V}{\tau_{adm}} \implies d \ge \sqrt{\frac{4 \cdot V}{\pi \cdot \tau_{adm}}} = 20.6\text{ mm}
$$
Se adopta un diámetro comercial de $22\text{ mm}$.
</Solution>
</Problem>
```

### 5. `<Solution>`
**Aclaración clave:** Se utiliza **dentro** de `<Example>` o `<Problem>` para mostrar el desarrollo de la solución. Genera un botón interactivo desplegable (*"Mostrar Solución"*) para que el estudiante piense el problema antes de ver la respuesta.
```markdown
<Solution>
1. Dibujar el diagrama de cuerpo libre (DCL).
2. Aplicar las ecuaciones de equilibrio estático $\sum F_y = 0$.
3. Despejar la incógnita y verificar las unidades.
</Solution>
```

### 6. `<Summary>`
Recuadro de cierre al final de la lección para resumir los puntos o fórmulas aprendidas.
```markdown
<Summary title="Resumen de la Lección">
- La fórmula $\sigma = P/A$ presupone una carga centrada y un material homogéneo.
- La deformación unitaria $\varepsilon$ es una cantidad adimensional.
- En el rango elástico lineal rige la Ley de Hooke.
</Summary>
```

### 7. `<Image>`
Inserta una imagen técnica con pie de foto estilizado y ajuste automático.
```markdown
<Image 
  src="https://..." 
  alt="Diagrama de cuerpo libre de la barra" 
  caption="Figura 1.1: Diagrama de cuerpo libre y reacciones en los apoyos."
/>
```

### 8. `<ImageGrid>`
Permite colocar dos o más imágenes lado a lado en columnas para comparar esquemas.
```markdown
<ImageGrid columns={2}>
  <Image 
    src="https://..." 
    alt="Distribución de cargas" 
    caption="Figura 1.2a: Viga con carga distribuida" 
  />
  <Image 
    src="https://..." 
    alt="Diagrama de momentos flectores" 
    caption="Figura 1.2b: Diagrama de momento flector" 
  />
</ImageGrid>
```

### 9. `<Quiz>`
Crea una pregunta interactiva de autoevaluación rápida con respuesta oculta.
```markdown
<Quiz question="¿Por qué la fórmula \sigma = P/A no es exacta en los puntos de aplicación de la carga?">
Por el principio de Saint-Venant: cerca de cargas concentradas se generan concentraciones de esfuerzo locales que distorsionan la distribución uniforme.
</Quiz>
```

---

## 6. Imágenes

1. **Cómo utilizar el botón de imagen del editor:**
   - Coloca el cursor en el editor en la línea donde deseas que aparezca la figura.
   - Haz clic en el botón con ícono de **Imagen** en la barra superior.
2. **Cómo insertar la imagen:**
   - Selecciona el archivo gráfico desde tu computadora (`.png`, `.jpg`, `.svg`).
   - La plataforma subirá automáticamente la imagen a la nube e insertará la etiqueta lista en la posición de tu cursor.
3. **Atributos disponibles:**
   - **`alt`**: Breve descripción técnica de lo que se ve en la imagen (para accesibilidad).
   - **`caption`**: Leyenda que se mostrará debajo de la figura (ejemplo: *Figura 2.1: Diagrama de esfuerzos cortantes*).
   - **`width`**: Controla el ancho máximo de la imagen (ejemplos: `width="400px"`, `width="60%"`).
   - **`height`**: Limita la altura máxima sin deformar la imagen (ejemplo: `height="300px"`).
   - **`size`**: Tamaños predeterminados: `"small"` (384px), `"medium"` (672px), `"large"` (896px), o `"full"` (100% de ancho).
   - **`align`**: Alineación horizontal: `"center"` (por defecto), `"left"` o `"right"`.

   *Ejemplo con dimensiones y alineación:*
   ```markdown
   <Image 
     src="https://..." 
     alt="Diagrama de esfuerzo" 
     caption="Figura 1.2: Distribución de esfuerzos en el centro de la barra."
     width="450px"
     align="center"
   />
   ```

---

## 7. Plantilla para crear un tema

Puedes copiar este bloque y comenzar a rellenarlo en el editor:

```markdown
# 1.1 Título del Subtema

Escribe aquí una breve introducción conceptual del tema y su importancia en la ingeniería.

<Definition title="Concepto Principal">
Escribe aquí la definición formal del concepto estudiado.
</Definition>

## Fundamento Teórico

Desarrolla aquí la teoría, hipótesis o deducción matemática.

<Formula label="Ecuación Principal">
$$
\sigma = \frac{P}{A}
$$
</Formula>

Donde:
- $\sigma$ es el esfuerzo normal ($\text{MPa}$).
- $P$ es la fuerza interna normal ($\text{N}$).
- $A$ es el área transversal ($\text{m}^2$).

<Image 
  src="https://..." 
  alt="Esquema del elemento estructural" 
  caption="Figura 1.1: Esquema representativo del elemento bajo carga."
/>

## Ejemplo Resuelto

<Example number={1} title="Nombre del Ejemplo">
Enunciado claro del problema con datos numéricos en el Sistema Internacional.

<Solution>
1. **Planteamiento:**
   Detalle del primer paso o diagrama de cuerpo libre.

2. **Cálculo:**
   $$
   \sigma = \frac{50 \times 10^3}{2.5 \times 10^{-4}} = 200\text{ MPa}
   $$

3. **Conclusión:**
   Interpretación física del resultado obtenido.
</Solution>
</Example>

## Ejercicio de Autoevaluación

<Quiz question="¿Pregunta conceptual rápida para el estudiante?">
Explicación concisa de la respuesta correcta.
</Quiz>

<Summary title="Resumen">
- Conclusión o regla práctica número uno.
- Conclusión o regla práctica número dos.
</Summary>
```

---

## 8. Qué evitar

- 🚫 **No cambiar los nombres de los componentes:** Escríbelos exactamente como se indican (`<Definition>`, `<Formula>`, `<Example>`, etc.).
- 🚫 **No usar rutas locales para imágenes:** Nunca pegues rutas de tu computadora como `C:\Users\mi-carpeta\imagen.png`. Usa siempre el botón de subir imagen de la plataforma.
- 🚫 **No dejar componentes sin cerrar:** Si abres `<Definition>`, debes cerrarlo con `</Definition>`.
- 🚫 **No enviar sin revisar la vista previa:** Siempre asegúrate de que el contenido en el panel derecho se vea exactamente como deseas antes de enviar.

---

## 9. Errores frecuentes

1. **Escribir componentes con minúscula:**
   - ❌ `<definition>` o `<example>`
   - ✅ `<Definition>` o `<Example>` (Siempre con mayúscula inicial).
2. **Olvidar cerrar etiquetas:**
   - ❌ `<Example> ...` sin cerrar.
   - ✅ `<Example> ... </Example>`
3. **No dejar renglones en blanco:**
   - Deja siempre un espacio en blanco entre el texto regular y las etiquetas de componentes `<...>` para evitar fallos de lectura visual.
4. **Fórmulas de bloque sin doble signo:**
   - ❌ `$\sigma = P/A$` en una línea suelta.
   - ✅ `$$\sigma = \frac{P}{A}$$`

---

## 10. Reglas de contenido

- **Escribir de forma clara:** Utiliza un lenguaje didáctico, ordenado y directo, acorde al nivel universitario.
- **Usar unidades correctamente:** Utiliza siempre el Sistema Internacional (SI):
  - Fuerzas en $\text{N}$ o $\text{kN}$.
  - Dimensiones en $\text{m}$ o $\text{mm}$.
  - Esfuerzos en $\text{Pa}$, $\text{MPa}$ o $\text{GPa}$ ($1\text{ MPa} = 1\text{ N/mm}^2$).
  - Momentos en $\text{N}\cdot\text{m}$ o $\text{kN}\cdot\text{m}$.
- **Explicar los pasos de los problemas:** No saltes pasos algebraicos clave; indica el DCL, las ecuaciones de equilibrio y la sustitución de valores.
- **No llenar de enlaces innecesarios:** Mantén el contenido autocontenido para que el estudiante aprenda sin distracciones.
- **Revisar la vista previa antes de enviar:** Comprueba que todas las fórmulas e imágenes carguen sin errores.

---

## ✅ Checklist antes de enviar a revisión

Antes de pulsar el botón de envío, verifica estos 5 puntos:

- [ ] **1. Revisé la vista previa:** El diseño se ve ordenado y sin bloques rotos.
- [ ] **2. Las fórmulas funcionan:** Todas las expresiones matemáticas en KaTeX se leen claramente.
- [ ] **3. Las imágenes se ven:** Todas las figuras cargan correctamente con su pie de foto.
- [ ] **4. No hay errores de escritura:** Ortografía, redacción y unidades correctas.
- [ ] **5. El contenido está listo para revisión:** La explicación y ejemplos están completos.

---

### ¿Terminaste? Guarda el contenido y envíalo a revisión.
