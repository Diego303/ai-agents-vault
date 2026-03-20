
# Design System: Academic Vault

Especificación técnica de UI/UX para la web de documentación del Segundo Cerebro IA. Este documento es la fuente de verdad para la implementación en Astro.

---

## 1. Filosofía de Diseño

Fusión de tres paradigmas optimizada para lectura prolongada de documentación técnica densa:

- **Notion** — Estructura y limpieza: bloques, menús laterales colapsables, jerarquía por sangrías, cards con bordes de bajo contraste
- **Obsidian** — Conectividad: visualización de frontmatter, callouts semánticos, wikilinks bidireccionales, backlinks
- **Paper Académico** — Legibilidad profunda: tipografía serif para lectura, ancho de línea controlado (~70 caracteres), márgenes amplios, esquema de color que simula papel (Light) o terminal atenuada (Dark)

---

## 2. Sistema Tipográfico

Tres familias tipográficas. Cargar desde Google Fonts o auto-alojadas.

### 2.1 Familias y Asignaciones

|Uso Semántico|Familia|Pesos|Justificación|
|---|---|---|---|
|**Títulos (H1, H2)**|Playfair Display (Serif Display)|600, 700|Carácter de publicación académica. Solo para headings grandes donde el trazo display brilla|
|**Lectura principal (Body, H3+)**|Literata (Serif Text)|400, 500, 600, 700|Diseñada específicamente para lectura prolongada en pantalla. Remates suaves que reducen fatiga visual. Alternativas válidas: Source Serif 4, Charter|
|**Interfaz de Usuario (UI & Nav)**|Inter (Sans-Serif)|400, 500, 600, 700|Legible a tamaños pequeños (10-14px). Sidebar, ToC, frontmatter, breadcrumbs, badges|
|**Código y datos técnicos**|Fira Code (Monospace)|400, 500|Bloques de código, variables inline, rutas, block-refs. Ligaduras habilitadas|

### 2.2 Escala Tipográfica (rem-based)

|Elemento|Tamaño|Peso|Line-height|Familia|Notas|
|---|---|---|---|---|---|
|H1|2.25rem (36px)|700|1.15|Playfair Display|Margin-bottom generoso|
|H2|1.5rem (24px)|700|1.2|Playfair Display|Margin-top alto para separar secciones|
|H3|1.25rem (20px)|600|1.3|Literata||
|H4|1.1rem (17.6px)|600|1.4|Literata||
|Body (párrafos)|1.05rem (16.8px)|400|1.8|Literata|Line-height alto para lectura académica|
|UI text (sidebar, nav)|0.875rem (14px)|400-500|1.5|Inter||
|Microcopy (tags, badges)|0.75rem (12px)|500|1.4|Inter|Uppercase, letter-spacing: 0.05em|
|Código inline|0.9rem (14.4px)|400|inherit|Fira Code|Background tint sutil|

---

## 3. Paleta de Colores y Theming

El modo oscuro NO usa negro puro (#000000) ni blanco puro (#FFFFFF) para evitar el efecto halo y el cansancio visual.

### 3.1 Colores Estructurales

|Token CSS|Light Mode|Dark Mode|Aplicación|
|---|---|---|---|
|`--bg-main`|#faf9f8|#0d0d0d|Fondo principal del área de lectura|
|`--bg-sidebar`|#f2f1ec|#161616|Fondo sidebars izquierdo y derecho|
|`--bg-surface`|#ffffff|#1c1c1c|Elementos elevados: frontmatter box, ToC, inputs, cards|
|`--border-color`|#e5e3db|#2a2a2a|Separadores, bordes de tablas, bordes de cards|
|`--text-main`|#1a1a1a|#e5e5e5|Texto de párrafos y títulos|
|`--text-muted`|#6b7280|#9ca3af|Breadcrumbs, placeholders, metadatos secundarios|

### 3.2 Enlaces y Highlights

**Wikilinks ([[Enlace]]):**

|Propiedad|Light|Dark|
|---|---|---|
|Texto|#4338ca (Indigo 700)|#a5b4fc (Indigo 300)|
|Fondo|rgba(67, 56, 202, 0.05)|rgba(99, 102, 241, 0.1)|
|Borde|rgba(67, 56, 202, 0.15)|rgba(99, 102, 241, 0.25)|
|Hover|Fondo opacity +0.05|Fondo opacity +0.05|

**Highlights (==Texto==):**

|Propiedad|Light|Dark|
|---|---|---|
|Fondo|rgba(250, 204, 21, 0.3)|rgba(250, 204, 21, 0.15)|
|Texto|inherit|#fef08a|

**Links rotos (wikilink-broken):**

|Propiedad|Light|Dark|
|---|---|---|
|Texto|#9ca3af|#6b7280|
|Decoración|dashed underline|dashed underline|
|Cursor|help|help|

### 3.3 Sistema de Callouts (11 tipos independientes)

Cada tipo tiene su propia identidad visual. En dark mode, los fondos usan desaturación extrema (tintes casi negros con toque de color) para mantener contraste WCAG AA.

Anatomía compartida: `padding: 1rem 1.25rem`, `border-radius: 0 0.5rem 0.5rem 0`, `border-left: 4px solid [color]`.

|Tipo|Icono (SVG)|Borde/Acento|Fondo Light|Fondo Dark|Texto título Light|Texto título Dark|
|---|---|---|---|---|---|---|
|**abstract**|clipboard-list|#7a9e9f|#f4f7f6|#111a19|#4a6b6c|#82a8a4|
|**info**|info-circle|#4a90e2|#f0f4f8|#0f1621|#2c5c92|#719ecc|
|**tip**|lightbulb|#4caf50|#f2f9f1|#111a11|#2e7d32|#81c784|
|**success**|check-circle|#2e7d32|#f1f8f1|#101a10|#1b5e20|#66bb6a|
|**question**|help-circle|#e5a03e|#fdf8f0|#1f170b|#b37317|#d4a563|
|**warning**|alert-triangle|#e67e22|#fdf5ed|#1f150b|#c45100|#e09850|
|**failure**|x-circle|#d9534f|#fcf3f3|#211212|#a94442|#cf6d6b|
|**danger**|zap|#c62828|#fdf2f2|#210f0f|#b71c1c|#ef5350|
|**bug**|bug|#ad1457|#fdf2f4|#210f12|#880e4f|#e91e90|
|**example**|beaker|#8e44ad|#f5f0fa|#18111f|#6a1b9a|#ba68c8|
|**quote**|quote|#9e9e9e|#f5f5f5|#1a1a1a|#616161|#b0b0b0|

**Iconos**: SVG inline de 16x16, stroke-width 1.5-2, sin fill (solo stroke). No usar FontAwesome ni ninguna icon library. Los SVGs se definen como componente Astro reutilizable.

**Callouts plegables**: Usan `<details>` + `<summary>`. Flecha chevron (SVG) animada con `transform: rotate(90deg)` en estado `[open]`. Transición del contenido con `grid-template-rows: 0fr → 1fr` (300ms ease).

### 3.4 Badges del Ecosistema (Pills)

|Herramienta|Light bg|Light text|Dark bg|Dark text|Dark border|
|---|---|---|---|---|---|
|**architect**|#dbeafe|#1d4ed8|rgba(30,64,175,0.3)|#60a5fa|rgba(30,64,175,0.5)|
|**vigil**|#fee2e2|#b91c1c|rgba(185,28,28,0.3)|#f87171|rgba(185,28,28,0.5)|
|**licit**|#dcfce7|#15803d|rgba(21,128,61,0.3)|#4ade80|rgba(21,128,61,0.5)|
|**intake**|#f3e8ff|#7e22ce|rgba(126,34,206,0.3)|#c084fc|rgba(126,34,206,0.5)|

Forma: `border-radius: 9999px`, `padding: 2px 10px`, `font-size: 0.75rem`, `font-weight: 500`, Inter.

### 3.5 Badges de Status y Difficulty

**Status:**

|Valor|Color|Icono|
|---|---|---|
|`complete` / `completo` / `evergreen`|Verde (#15803d / #4ade80)|● punto|
|`current`|Azul (#1d4ed8 / #60a5fa)|● punto|
|`volatile`|Naranja (#c45100 / #fb923c)|● punto|
|`outdated` / `obsoleto`|Rojo (#b91c1c / #f87171)|● punto|
|`draft`|Gris (#6b7280 / #9ca3af)|○ punto vacío|

**Difficulty:**

|Valor|Color|
|---|---|
|`beginner`|Verde|
|`intermediate`|Azul|
|`advanced`|Naranja|
|`expert`|Rojo|

---

## 4. Layout y Arquitectura Espacial

Estructura de 3 columnas con Flexbox.

### 4.1 Sidebar Izquierdo (256px / w-64)

- **Mobile**: Oculto, accesible via hamburger → drawer desde izquierda
- **Desktop**: Visible desde breakpoint `md` (768px)
- Contenido: Buscador (atajo ⌘K), Árbol de carpetas colapsable
- Comportamiento: `height: 100vh`, `overflow-y: auto`, `position: fixed`
- Borde derecho: `1px solid var(--border-color)`
- Fondo: `var(--bg-sidebar)`

### 4.2 Contenido Central (flex-1)

- **Ancho de lectura**: El contenedor interior del texto limitado a `max-width: 768px` (~65-75 caracteres por línea)
- **Centrado**: `margin: 0 auto`
- **Spacing**: `padding: 2.5rem 1.5rem` (mobile) → `padding: 4rem 2rem` (desktop)
- Fondo: `var(--bg-main)`

### 4.3 Sidebar Derecho / Table of Contents (256px / w-64)

- **Mobile y tablet**: Oculto
- **Desktop grande**: Visible desde breakpoint `xl` (1280px)
- Comportamiento: `position: sticky`, `top: 2rem`
- Scroll spy: heading activo con `border-left: 2px solid var(--callout-info)` (Indigo)
- Contenido: ToC + separador + Backlinks
- Fondo: transparente (usa `var(--bg-main)`)

---

## 5. Componentes Markdown

### 5.1 Frontmatter como Dashboard de Documento

No se renderiza como código. Se muestra como grid al inicio del artículo.

- **Layout**: Grid de 2-4 columnas responsive
- **Labels**: Uppercase, 10px, Inter, `var(--text-muted)`, `letter-spacing: 0.05em`
- **Valores**: Texto normal. Tags como pills clickables. Status con punto de color (semáforo)
- **Fondo**: `var(--bg-surface)`, `border: 1px solid var(--border-color)`, `border-radius: 0.5rem`
- **Padding**: `1rem 1.5rem`
- **Campo title**: Si existe en frontmatter, usarlo. Si no, extraer del primer H1. Si tampoco hay H1, usar el nombre del archivo

### 5.2 Bloques de Código (`<pre><code>`)

El código SIEMPRE se mantiene en dark theme, independientemente del modo de la web.

|Propiedad|Valor (en light mode global)|Valor (en dark mode global)|
|---|---|---|
|Fondo|#1e1e1e|#111111 (más oscuro que bg-main)|
|Tipografía|Fira Code, 0.875rem (14px)|Igual|
|Border-radius|0.5rem|Igual|
|Padding|1rem 1.25rem|Igual|
|Overflow|`overflow-x: auto`|Igual|
|Copy button|Esquina superior derecha, aparece en hover|Igual|
|Syntax theme|Shiki tema oscuro (ej: github-dark, one-dark-pro)|Igual|

### 5.3 Código Inline (`<code>`)

|Propiedad|Light|Dark|
|---|---|---|
|Fondo|#f3f4f6|#2a2a2a|
|Texto|#c7254e|#e06c75|
|Padding|0.15em 0.4em|Igual|
|Border-radius|0.25rem|Igual|
|Font|Fira Code, 0.9em|Igual|

### 5.4 Elementos Plegables (`<details>/<summary>`)

Para callouts plegables y contenido extenso.

- **Contenedor** (`details`): `border: 1px solid var(--border-color)`, `border-radius: 0.5rem`
- **Cabecera** (`summary`): `background: var(--bg-sidebar)`, `cursor: pointer`, `padding: 0.75rem 1rem`
- **Flecha**: Quitar flecha nativa del browser. Usar SVG chevron que rota 90° con CSS `transition: transform 0.2s ease`
- **Contenido**: Transición con grid-template-rows (0fr → 1fr, 300ms ease)

### 5.5 Tablas

|Propiedad|Valor|
|---|---|
|Width|100%, `overflow-x: auto` wrapper para mobile|
|Border-collapse|collapse|
|Celdas (th, td)|`padding: 0.75rem 1rem`, `border: 1px solid var(--border-color)`|
|Cabecera (th)|Fondo: #fbfbfb (light) / #212121 (dark). `font-weight: 600`, Inter|
|Zebra striping|Opcional: filas pares con fondo `var(--bg-surface)`|
|Highlights|`<mark>` dentro de celdas debe funcionar correctamente|

### 5.6 LaTeX / Math (KaTeX)

El vault usa notación LaTeX inline (`$...$`) y display (`$$...$$`).

- Renderizar con **KaTeX** (no MathJax — KaTeX es más rápido)
- Dark mode: el texto math debe usar `var(--text-main)`, no negro hardcodeado
- Cargar CSS de KaTeX. Override del color en dark mode:

```css
html.dark .katex { color: var(--text-main); }
```

### 5.7 Mermaid (Diagramas)

Renderizar bloques ```mermaid con Mermaid.js. Lazy load (solo cuando entra en viewport).

**IMPORTANTE**: El vault tiene diagramas con directivas `style` inline (ej: `style P1 fill:#d9534f`). Los overrides CSS de dark mode deben aplicarse solo a nodos SIN estilos inline. Selectores sugeridos:

```css
/* Solo aplicar a nodos sin estilos inline */
html.dark .mermaid .node rect:not([style*="fill"]),
html.dark .mermaid .node circle:not([style*="fill"]),
html.dark .mermaid .node polygon:not([style*="fill"]) {
    stroke: #4b5563 !important;
    fill: #1c1c1c !important;
}
html.dark .mermaid .node text { fill: #f3f4f6 !important; }
html.dark .mermaid .edgeLabel { background-color: #1c1c1c !important; color: #f3f4f6 !important; }
html.dark .mermaid .edgePath path { stroke: #6b7280 !important; }
html.dark .mermaid marker path { fill: #6b7280 !important; stroke: none !important; }
```

---

## 6. Búsqueda

El input de búsqueda (⌘K) dispara un modal centrado:

|Propiedad|Valor|
|---|---|
|Backdrop|`backdrop-filter: blur(4px)`, `background: rgba(0,0,0,0.5)`|
|Modal|`var(--bg-surface)`, `border-radius: 0.75rem`, `max-width: 640px`|
|Input|Foco automático, `font-size: 1rem`, placeholder "Buscar notas..."|
|Resultados|Highlight del match en amarillo, contexto truncado, tags como pills|
|Teclado|↑↓ para navegar, Enter para abrir, Esc para cerrar|

---

## 7. Accesibilidad y Microinteracciones

### Transiciones de Tema

`transition: background-color 200ms ease, color 200ms ease` en `body` y contenedores principales. Evita el destello al cambiar de tema.

### Scrollbars

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #d1d0c9; /* Light */
}
html.dark ::-webkit-scrollbar-thumb {
    background: #4b5563; /* Dark */
}
```

### Gestión del Tema

1. Leer `localStorage.getItem('theme')`
2. Fallback a `window.matchMedia('(prefers-color-scheme: dark)').matches`
3. Alternar clase `.dark` en `<html>`
4. Persistir elección en `localStorage`

### Hovers e Interacciones

- Todo elemento interactivo: `cursor: pointer` + cambio sutil de background en `:hover`
- Wikilinks: fondo opacity aumenta en hover
- Sidebar items: background `var(--bg-surface)` en hover
- Code copy button: aparece solo en hover del bloque de código
- Focus visible: `outline: 2px solid var(--callout-info)`, `outline-offset: 2px` para keyboard navigation

### Contraste

Mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande). Verificar especialmente:

- `--text-muted` sobre `--bg-main` en ambos modos
- Texto de callouts sobre fondo de callouts en dark mode
- Badges sobre sus fondos