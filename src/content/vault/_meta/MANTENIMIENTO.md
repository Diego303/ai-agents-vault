---
tags:
  - concepto
aliases:
  - Guía de mantenimiento
created: 2025-06-01
updated: 2025-06-01
status: evergreen
---

# Guía de Mantenimiento del Vault

> [!abstract] Resumen
> Procedimientos, convenciones y buenas prácticas para mantener este vault actualizado, preciso y útil. ==Un segundo cerebro que no se mantiene, muere==. ^resumen

---

## Sistema de frescura del contenido

Cada nota tiene un campo `status` en su frontmatter que indica su volatilidad:

| Estado | Significado | Cadencia de revisión | Ejemplo |
|---|---|---|---|
| `evergreen` | Contenido atemporal | Anual | [[transformer-architecture]], [[rag-overview]] |
| `current` | Actual, necesita revisión periódica | Trimestral | [[landscape-modelos]], [[pricing-llm-apis]] |
| `volatile` | Cambia rápidamente | Mensual | [[tendencias-2025-2026]], [[landscape-agentes-codigo]] |
| `outdated` | Obsoleto, referencia histórica | No necesita | Notas marcadas con ~~tachado~~ |

### Cómo marcar contenido obsoleto

```markdown
> [!warning] Contenido desactualizado
> Esta información era precisa a fecha [YYYY-MM-DD]. Ver [[nota-actualizada]] para la versión actual.

~~Texto obsoleto que se mantiene como referencia histórica.~~
```

---

## Buenas prácticas de escritura técnica

### Progressive disclosure

Estructura cada nota para que sea útil a múltiples niveles de lectura:

1. **30 segundos**: El `> [!abstract]` da toda la idea
2. **3 minutos**: Los H2 y primer párrafo de cada sección dan visión completa
3. **Lectura profunda**: Callouts plegables, código, tablas dan todo el detalle

> [!tip] Regla de oro
> Un lector NUNCA debería tener que leer 300 líneas para entender la idea principal.

### Opinión informada, no Wikipedia

Esto NO es una enciclopedia neutral. Cada nota sobre herramientas o técnicas debe incluir:

- `> [!tip] Mi recomendación` con posición clara
- `> [!warning] Limitaciones reales` con problemas concretos
- Cuando sea técnica del ecosistema propio, posicionar honestamente frente a alternativas

### Honestidad sobre limitaciones

Cada nota de herramienta o técnica DEBE incluir un `> [!failure]` o `> [!warning]` con limitaciones reales.

### Conectividad

Si al escribir una nota mencionas un concepto que tiene (o debería tener) su propia nota, SIEMPRE crea el [[wikilink]], incluso si la nota destino aún no existe. Los links rotos en Obsidian sirven como TODO list.

---

## Manejo de contenido contradictorio

```markdown
> [!question] Debate abierto
> Existen posiciones encontradas sobre este tema:
> - **Posición A**: [argumento] — defendida por [quien]
> - **Posición B**: [argumento] — defendida por [quien]
> Mi valoración: [opinión informada con justificación]
```

---

## War stories / Lecciones aprendidas

```markdown
> [!example] Lección aprendida: [título corto]
> **Contexto**: Qué se intentaba hacer
> **Qué salió mal**: Descripción del fallo
> **Root cause**: Por qué falló realmente
> **Lección**: Qué hacer diferente la próxima vez
> **Conecta con**: [[notas-relevantes]]
```

---

## Comparativas actualizadas

Las tablas comparativas caducan rápido. Cada comparativa debe incluir:

```markdown
> [!warning] Última verificación: [YYYY-MM-DD]
> Los precios y features de esta comparativa se verificaron por última vez en [fecha].
> Las herramientas de IA evolucionan rápidamente — verifica antes de tomar decisiones.
```

---

## Checklist de calidad para nuevas notas

Antes de dar una nota por terminada, verifica:

- [ ] Tiene frontmatter completo (tags, aliases, status, difficulty, related, up)
- [ ] Tiene `> [!abstract]` con resumen de 2-3 líneas
- [ ] Tiene al menos 5 [[wikilinks]] a otras notas
- [ ] Código largo (>20 líneas) está en callouts plegables `> [!example]-`
- [ ] Datos clave tienen ==highlights==
- [ ] Tiene sección de "Limitaciones" o "Advertencias"
- [ ] Tiene sección de "Enlaces y referencias" al final
- [ ] Usa al menos 3 tipos diferentes de callouts
- [ ] Si es herramienta: tiene quick start, comparativa, pricing
- [ ] Si tiene datos con fecha de caducidad: incluye fecha de verificación

---

## Seguridad como tema transversal

La seguridad NO es solo la carpeta 08. Cada nota técnica debe incluir implicaciones de seguridad:

| Tipo de nota | Callout de seguridad |
|---|---|
| RAG | Riesgos de prompt injection via documentos |
| Tool use | Riesgos de ejecución de código arbitrario |
| Multi-agente | Riesgos de escalada de privilegios entre agentes |
| Embeddings | Riesgos de data poisoning en vector store |
| Fine-tuning | Riesgos de backdoors en modelos |
| CI/CD | Riesgos de supply chain y secrets exposure |

---

## Anti-patterns de contenido

Nunca escribir:

- ❌ Palabrería vacía: "RAG es una técnica muy popular que está revolucionando..."
- ❌ Listas de buzzwords sin explicación
- ❌ "Ventajas: es rápido, flexible y potente" sin datos ni contexto
- ❌ Notas que solo dicen "qué es" sin explicar "cómo funciona internamente"
- ❌ Comparativas sin criterios claros ni datos

Siempre escribir:

- ✅ Datos concretos: latencias, costes, benchmarks con fuente
- ✅ Ejemplos de código que realmente funcionan
- ✅ Diagramas que muestran flujo real, no cajas genéricas
- ✅ Trade-offs explícitos con contexto de cuándo importan

---

## Enlaces

- [[TAXONOMIA]] — Sistema de tags
- [[HOME]] — Dashboard principal
- [[como-usar-este-vault]] — Rutas de aprendizaje
