---
tags:
  - concepto
  - llm
  - paper
aliases:
  - Leyes de escalado
  - Scaling laws
  - Chinchilla scaling
  - Leyes de Kaplan
created: 2025-06-01
updated: 2025-06-01
category: modelos-llm
status: evergreen
difficulty: expert
related:
  - "[[chinchilla-paper]]"
  - "[[transformer-architecture]]"
  - "[[inference-optimization]]"
  - "[[emergent-abilities]]"
  - "[[compute-optimal-training]]"
  - "[[llm-como-juez]]"
  - "[[model-evaluation-practice]]"
up: "[[moc-llms]]"
---

# Leyes de escalado (Scaling Laws)

> [!abstract] Resumen
> Las *scaling laws* describen relaciones matemáticas predecibles entre el rendimiento de un modelo de lenguaje y tres variables: ==tamaño del modelo (parámetros N), tamaño del dataset (tokens D) y compute total (FLOPs C)==. Kaplan et al. (2020) descubrieron las relaciones power-law originales; Hoffmann et al. (2022) las refinaron con Chinchilla, demostrando que la mayoría de modelos estaban sobreentrenados en parámetros y subentrenados en datos. Estas leyes son la base teórica para decisiones de inversión de miles de millones de dólares en entrenamiento de modelos. ^resumen

## Qué es y por qué importa

Las **leyes de escalado** (*scaling laws*) son relaciones empíricas que muestran cómo la *loss* de un modelo de lenguaje decrece de forma predecible (como ley de potencias) al aumentar compute, datos o parámetros. Son fundamentales porque permiten ==predecir el rendimiento de un modelo antes de entrenarlo==, lo que transforma decisiones de ingeniería en decisiones económicas calculables.

Antes de estas leyes, el entrenamiento de modelos era en gran parte empírico: se entrenaba, se evaluaba, se iteraba. Las scaling laws convirtieron este proceso en una ciencia cuantitativa donde se puede estimar con precisión razonable cuánto compute se necesita para alcanzar un nivel de rendimiento objetivo.

> [!tip] Cuándo usar esto
> - **Usar cuando**: Se planifica el entrenamiento de un modelo desde cero, se presupuesta compute, se decide entre modelo grande con pocos datos vs modelo pequeño con muchos datos
> - **No usar cuando**: Se trabaja exclusivamente con modelos pre-entrenados (fine-tuning tiene sus propias dinámicas), tareas muy específicas donde las leyes generales pueden no aplicar
> - Ver [[compute-optimal-training]] para la aplicación práctica de asignación de compute
> - Ver [[inference-optimization]] para cómo las scaling laws afectan las decisiones de despliegue

---

## Kaplan et al. (2020): Las leyes originales

El paper de Kaplan et al.[^1] de OpenAI estableció las tres relaciones fundamentales:

### Las tres power laws

La *cross-entropy loss* L de un modelo *Transformer* sigue leyes de potencias al escalar cada variable independientemente:

1. **Loss vs Parámetros** (datos infinitos): `L(N) ≈ (Nc/N)^αN` donde αN ≈ 0.076
2. **Loss vs Datos** (modelo infinito): `L(D) ≈ (Dc/D)^αD` donde αD ≈ 0.095
3. **Loss vs Compute**: `L(C) ≈ (Cc/C)^αC` donde αC ≈ 0.050

> [!example]- Ver diagrama de las relaciones power-law
> ```mermaid
> graph LR
>     subgraph "Kaplan Scaling Laws (2020)"
>         direction TB
>         C[Compute C FLOPs] --> L[Loss L]
>         N[Parámetros N] --> L
>         D[Datos D tokens] --> L
>     end
>     subgraph "Relación funcional"
>         direction TB
>         L2["L(N,D) = [(Nc/N)^αN/αD + (Dc/D)]^αD"]
>     end
>     subgraph "Hallazgo clave"
>         direction TB
>         H["Para compute fijo C:<br/>Asignar más a N que a D<br/>N ∝ C^0.73<br/>D ∝ C^0.27"]
>     end
> ```

### Hallazgo clave de Kaplan

==Para un presupuesto de compute fijo, Kaplan recomendaba asignar la mayoría del compute a modelos más grandes (más parámetros) entrenados con relativamente menos datos==. Su recomendación era escalar N proporcionalmente a C^0.73 y D solo a C^0.27. Esto significaba que al aumentar compute 10x, el modelo debía crecer ~5x pero los datos solo ~2x.

Esta recomendación influyó directamente en el desarrollo de GPT-3 (175B parámetros, 300B tokens) y otros modelos de la era 2020-2021.

> [!warning] Esta recomendación fue corregida
> Chinchilla (2022) demostró que los ratios de Kaplan eran subóptimos. Los modelos entrenados siguiendo las recomendaciones de Kaplan estaban ==significativamente subentrenados en datos==, desperdiciando compute en parámetros excesivos.

---

## Chinchilla Scaling Laws (Hoffmann et al., 2022)

El equipo de DeepMind publicó "Training Compute-Optimal Large Language Models"[^2], conocido como el "paper de Chinchilla", que transformó la industria.

### Metodología

Entrenaron ==más de 400 modelos== de entre 70M y 16B parámetros con diferentes cantidades de datos (5B a 500B tokens) para mapear empíricamente la superficie de loss en función de N y D para presupuestos de compute fijos.

### El resultado Chinchilla

==Para entrenamiento compute-optimal, el número de parámetros N y tokens de entrenamiento D deben escalarse proporcionalmente==:

```
N_opt ∝ C^0.50    (parámetros)
D_opt ∝ C^0.50    (tokens)
```

La regla práctica resultante: **por cada parámetro, se necesitan ~20 tokens de entrenamiento**. Un modelo de 70B parámetros requiere ~1.4T tokens para ser compute-optimal.

| Modelo | Parámetros | Tokens entrenamiento | Ratio D/N | ¿Compute-optimal? |
|---|---|---|---|---|
| GPT-3 | 175B | 300B | 1.7 | ==No (muy bajo)== |
| Gopher | 280B | 300B | 1.1 | ==No (muy bajo)== |
| **Chinchilla** | **70B** | **1.4T** | **20** | **Sí** |
| LLaMA 1 (65B) | 65B | 1.4T | 21.5 | Sí |
| LLaMA 2 (70B) | 70B | 2T | 28.6 | Sobre-entrenado (deliberado) |
| LLaMA 3 (70B) | 70B | 15T | ==214== | Muy sobre-entrenado (deliberado) |

> [!success] Impacto de Chinchilla
> Chinchilla con 70B parámetros superó a Gopher con 280B parámetros en todos los benchmarks, usando el mismo presupuesto de compute. ==Demostró que se estaban desperdiciando miles de millones de dólares entrenando modelos demasiado grandes con datos insuficientes==.

### El cambio de paradigma post-Chinchilla

Después de Chinchilla, la industria pivotó:

1. **Modelos más pequeños, mejor entrenados**: LLaMA 1 (Meta) fue diseñado explícitamente siguiendo los ratios de Chinchilla
2. **Inversión masiva en datos**: La carrera pasó de "quién tiene más GPUs" a "quién tiene más datos de calidad"
3. **Sobreentrenamiento deliberado**: LLaMA 2 y 3 se entrenaron con muchos más tokens de lo compute-optimal porque ==en inference-time, un modelo más pequeño pero mejor entrenado es más barato de servir==

> [!info] Sobreentrenamiento para eficiencia en inferencia
> La regla Chinchilla optimiza el coste de entrenamiento. Pero para despliegue, lo que importa es el coste de inferencia, que depende del tamaño del modelo, no de cuánto se entrenó. Por eso tiene sentido económico "sobreentrenar" un modelo 7B con 15T tokens: el entrenamiento cuesta más de lo optimal, pero se obtiene un modelo 7B que rinde como uno de 30B, y es ==4x más barato de servir==. Ver [[inference-optimization]].

---

## Data scaling vs Parameter scaling

> [!question] ¿Qué importa más, datos o parámetros?
> La respuesta depende del régimen de compute y del objetivo:
> - **Posición "parámetros primero"**: Modelos más grandes son más sample-efficient; emergen capacidades nuevas con escala — defendida por OpenAI (era GPT-3/4)
> - **Posición "datos primero"**: Con datos suficientes y de calidad, modelos más pequeños igualan o superan modelos grandes — defendida por DeepMind (Chinchilla) y Meta (LLaMA)
> - Mi valoración: ==Ambos son necesarios, pero la calidad de datos se ha revelado como el factor más subestimado. Post-2023, la curación de datos es la inversión de mayor ROI==

### La crisis de datos

Un problema creciente identificado por Villalobos et al.[^3] es que ==el stock de texto de alta calidad en internet se agotará entre 2026 y 2032==. Las scaling laws predicen mejoras continuando escalando datos, pero si no hay más datos disponibles, la trayectoria se trunca.

Respuestas de la industria:
- **Datos sintéticos**: Usar LLMs para generar datos de entrenamiento (con riesgo de *model collapse*)
- **Datos multimodales**: Video, audio, imágenes como fuente de señal de entrenamiento adicional
- **Eficiencia de datos**: Curricula de entrenamiento, deduplicación agresiva, calidad sobre cantidad

---

## El debate sobre habilidades emergentes

### La posición original: emergencia es real

Wei et al. (2022)[^4] documentaron que ciertas capacidades (aritmética multi-dígito, *chain-of-thought*, traducción) aparecen abruptamente al cruzar umbrales de escala. ==Un modelo de 10B no muestra la capacidad, pero uno de 100B sí, sin transición gradual==. Esto sugería que escalar es suficiente para obtener capacidades cualitativamente nuevas.

### La contra-posición: emergencia es un artefacto de medición

Schaeffer et al. (2023)[^5] argumentaron que las habilidades emergentes son un ==artefacto de las métricas discontinuas== usadas para medirlas. Cuando se usan métricas continuas (log-likelihood en vez de exact-match accuracy), las mejoras son graduales y predecibles con scaling laws estándar.

> [!example]- Ver diagrama del debate sobre emergencia
> ```mermaid
> graph TD
>     subgraph "Posición: Emergencia es real"
>         A1[Modelo 1B] -->|No puede| T1[Aritmética 4 dígitos]
>         A2[Modelo 10B] -->|No puede| T1
>         A3[Modelo 100B] -->|¡Puede!| T1
>         style A3 fill:#4CAF50
>     end
>     subgraph "Posición: Artefacto de medición"
>         B1[Modelo 1B] -->|0.01 logprob| T2[Aritmética 4 dígitos]
>         B2[Modelo 10B] -->|0.15 logprob| T2
>         B3[Modelo 100B] -->|0.85 logprob| T2
>         style B3 fill:#4CAF50
>         N1["Mejora GRADUAL<br/>La métrica exact-match<br/>oculta el progreso"]
>     end
> ```

### Implicación práctica

==Para planificación de producto, asumir que las mejoras son graduales es más seguro==. No se puede apostar a que "el siguiente modelo 10x más grande resolverá mágicamente" un problema que los modelos actuales no pueden resolver en absoluto. Es más prudente evaluar el progreso con métricas continuas y estimar cuánta escala adicional se necesita.

---

## Inference-time scaling

Una dirección de investigación que ha ganado enorme tracción desde 2024 es el *inference-time scaling*: ==en lugar de invertir más compute en entrenamiento, invertir más compute en el momento de la inferencia==.

### Mecanismos de inference-time scaling

| Mecanismo | Descripción | Ejemplo |
|---|---|---|
| *Chain-of-thought* | Generar pasos de razonamiento intermedios | [[chain-of-thought]] |
| *Self-consistency* | Generar múltiples respuestas y votar por la más común | Wang et al. (2022) |
| *Tree-of-thought* | Explorar múltiples caminos de razonamiento | Yao et al. (2023) |
| *Best-of-N* | Generar N respuestas y seleccionar la mejor (con verifier) | OpenAI o1/o3 |
| *Iterative refinement* | El modelo revisa y mejora su propia respuesta | Madaan et al. (2023) |
| *Monte Carlo Tree Search* | Búsqueda guiada en el espacio de razonamiento | AlphaProof (2024) |

> [!tip] OpenAI o1/o3 y el nuevo paradigma
> Los modelos o1 y o3 de OpenAI representan el ejemplo más visible de inference-time scaling. ==Usan cadenas de razonamiento largas (a veces miles de tokens internos) para problemas complejos, intercambiando coste de inferencia por calidad de respuesta==. Esto extiende las scaling laws al eje del compute de inferencia, abriendo una nueva dimensión de mejora.

### Nueva scaling law para inferencia

Snell et al. (2024)[^6] propusieron una scaling law para inference-time compute:

```
Performance ∝ (compute_inferencia)^α
```

Donde α depende de la tarea y el método de escalado. ==Para tareas de razonamiento matemático, α ≈ 0.3-0.5, lo que significa que duplicar el compute de inferencia mejora el rendimiento significativamente==.

> [!example]- Diagrama de las dos dimensiones de scaling
> ```mermaid
> graph LR
>     subgraph "Scaling tradicional (Train-time)"
>         direction TB
>         T1[Más parámetros] --> TL[Menor loss]
>         T2[Más datos] --> TL
>         T3[Más FLOPs training] --> TL
>     end
>     subgraph "Inference-time scaling"
>         direction TB
>         I1[Chain-of-thought] --> IL[Mejor respuesta]
>         I2[Best-of-N sampling] --> IL
>         I3[Tree search] --> IL
>         I4[Iterative refinement] --> IL
>     end
>     TL --> FINAL[Rendimiento total]
>     IL --> FINAL
>     style FINAL fill:#FF9800
> ```

---

## Rendimientos decrecientes y fronteras de eficiencia

### La realidad de los rendimientos decrecientes

Las power laws implican rendimientos decrecientes inherentes. ==Reducir la loss a la mitad requiere ~100x más compute==. En la práctica, esto significa:

- GPT-3 a GPT-4: ~100x más compute, mejora sustancial pero no 100x mejor
- GPT-4 a GPT-5 (proyectado): ~100x más compute, mejora menor proporcionalmente
- Cada generación es más cara y produce mejoras marginalmente menores

> [!danger] Implicación económica
> Si las scaling laws se mantienen, el coste de entrenamiento de modelos frontier sigue una trayectoria exponencial. ==GPT-4 costó ~$100M en compute; modelos de 2026 se proyectan en $1-10B==. En algún punto, el coste-beneficio de simplemente escalar deja de ser viable, forzando innovaciones en eficiencia, arquitectura o datos.

### Fronteras de eficiencia

La investigación busca "doblar" la curva de scaling hacia mayor eficiencia:

| Enfoque | Mecanismo | Ganancia típica |
|---|---|---|
| *Mixture of Experts* (MoE) | Activar solo un subconjunto de parámetros | ==2-4x menos compute por token== |
| Destilación | Transferir conocimiento de modelo grande a pequeño | 5-10x compresión con ~80-90% rendimiento |
| Cuantización | Reducir precisión de pesos (FP16→INT4) | 4x menos memoria, ~95% rendimiento |
| [[lora-paper\|LoRA]] / PEFT | Fine-tuning eficiente de subconjuntos de parámetros | 100x menos compute que full fine-tuning |
| Arquitecturas eficientes | Mamba, RWKV, linear attention | Complejidad O(n) vs O(n²) en secuencia |

---

## Implicaciones para estrategia de desarrollo de modelos

> [!success] Insights accionables de las scaling laws
> 1. **Predictibilidad**: Se puede estimar el rendimiento de un modelo antes de invertir meses y millones en entrenamiento
> 2. **Trade-offs cuantificables**: La decisión "modelo grande barato de servir" vs "modelo pequeño caro de entrenar" se puede calcular
> 3. **Inversión en datos**: La calidad y cantidad de datos es al menos tan importante como el tamaño del modelo
> 4. **Planificación a largo plazo**: Las scaling laws permiten road maps de 2-3 años con estimaciones razonables

> [!failure] Lo que las scaling laws NO predicen
> - Capacidades específicas (¿podrá este modelo hacer X?)
> - Comportamiento en tareas fuera de distribución
> - Propiedades de seguridad y alineamiento
> - Rendimiento después de fine-tuning o RLHF
> - Comportamiento en dominios con datos escasos

---

## Estado del arte (2025-2026)

Las tendencias actuales en scaling laws incluyen:

1. **Scaling laws para datos sintéticos**: ¿Se mantienen las mismas leyes cuando parte de los datos son generados por LLMs?
2. **Scaling laws multi-modales**: Relaciones para modelos que procesan texto, imagen, audio y video simultáneamente
3. **Scaling laws post-entrenamiento**: Cómo escala el rendimiento con RLHF, DPO y otros métodos de alineamiento
4. **Scaling laws de agentes**: ==¿Cómo escala el rendimiento de un agente al escalar las herramientas, la memoria o el planning?== Esta es una pregunta abierta crucial para [[moc-agentes|el campo de agentes]]

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: Las scaling laws informan la elección del modelo backend de intake — un modelo 7B sobreentrenado puede ser suficiente para extracción de documentación, ahorrando costes significativos vs un modelo frontier
> - **[[architect-overview|architect]]**: architect debe seleccionar modelos según la complejidad de la tarea de código; las scaling laws ayudan a predecir qué tamaño de modelo necesita para cada tipo de tarea (bug fix simple vs diseño de arquitectura compleja)
> - **[[vigil-overview|vigil]]**: Para análisis de seguridad, las scaling laws sugieren que modelos más grandes son mejores detectando vulnerabilidades sutiles; el presupuesto de compute de vigil debe balancear profundidad de análisis con coste por escaneo
> - **[[licit-overview|licit]]**: El análisis de compliance requiere comprensión profunda de textos legales; las scaling laws predicen que modelos frontier tendrán ventaja significativa en este dominio especializado, justificando el coste mayor

---

## Enlaces y referencias

**Notas relacionadas:**
- [[transformer-architecture]] — La arquitectura base sobre la que se establecieron las scaling laws
- [[chinchilla-paper]] — El paper que redefinió los ratios óptimos de entrenamiento
- [[inference-optimization]] — Optimización en inferencia, la otra cara de la moneda
- [[emergent-abilities]] — El debate sobre capacidades emergentes vs artefactos de medición
- [[compute-optimal-training]] — Aplicación práctica de los ratios de Chinchilla
- [[chain-of-thought]] — Técnica clave de inference-time scaling
- [[llm-como-juez]] — Evaluación necesaria para verificar predicciones de scaling
- [[pricing-llm-apis]] — Impacto económico directo de las decisiones de escala

> [!quote]- Referencias bibliográficas
> - Kaplan, J. et al., "Scaling Laws for Neural Language Models", OpenAI, 2020
> - Hoffmann, J. et al., "Training Compute-Optimal Large Language Models" (Chinchilla), DeepMind, 2022
> - Wei, J. et al., "Emergent Abilities of Large Language Models", TMLR 2022
> - Schaeffer, R. et al., "Are Emergent Abilities of Large Language Models a Mirage?", NeurIPS 2023
> - Villalobos, P. et al., "Will we run out of data? An analysis of the limits of scaling datasets in Machine Learning", 2022
> - Snell, C. et al., "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters", 2024

[^1]: Kaplan, J. et al. "Scaling Laws for Neural Language Models." OpenAI, 2020. Primer paper en establecer relaciones power-law cuantitativas para transformers, con más de 5000 citaciones.
[^2]: Hoffmann, J. et al. "Training Compute-Optimal Large Language Models." DeepMind, 2022. El paper de Chinchilla que redefinió la industria demostrando que los modelos estaban subentrenados en datos.
[^3]: Villalobos, P. et al. "Will we run out of data?" Epoch AI, 2022. Análisis que estima el agotamiento de datos de alta calidad en internet entre 2026 y 2032.
[^4]: Wei, J. et al. "Emergent Abilities of Large Language Models." TMLR, 2022. Documentaron más de 100 tareas donde las capacidades aparecen abruptamente al escalar.
[^5]: Schaeffer, R. et al. "Are Emergent Abilities of Large Language Models a Mirage?" NeurIPS 2023. Argumentaron que la emergencia es un artefacto de métricas discontinuas, no un fenómeno real.
[^6]: Snell, C. et al. "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters." 2024. Formalizaron las scaling laws para inference-time compute.
