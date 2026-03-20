---
tags:
  - concepto
  - llm
aliases:
  - LLM
  - Large Language Model
  - modelo de lenguaje grande
created: 2025-06-01
updated: 2025-06-01
category: modelos-llm
status: evergreen
difficulty: intermediate
related:
  - "[[arquitecturas-llm]]"
  - "[[landscape-modelos]]"
  - "[[modelos-open-source]]"
  - "[[modelos-propietarios]]"
  - "[[attention-is-all-you-need]]"
  - "[[transformer-architecture]]"
  - "[[context-engineering-overview]]"
up: "[[moc-llms]]"
---

# Qué son los LLMs

> [!abstract] Resumen
> Un *Large Language Model* (LLM) es una red neuronal con miles de millones de parámetros entrenada sobre cantidades masivas de texto para predecir el siguiente token en una secuencia. ==La generación de texto se reduce a un loop autoregresivo: tokenizar, embeber, forward pass, samplear, detokenizar==. A pesar de su aparente "inteligencia", los LLMs son fundamentalmente máquinas de distribución de probabilidad sobre vocabularios finitos. ^resumen

## Qué es y por qué importa

Un **Large Language Model** (*modelo de lenguaje grande*) es una red neuronal profunda — típicamente basada en la arquitectura [[transformer-architecture|Transformer]] — que ha sido entrenada con el objetivo de modelar la distribución de probabilidad del lenguaje natural. En términos formales, dado un contexto de tokens $t_1, t_2, \ldots, t_{n-1}$, el modelo aprende a estimar $P(t_n | t_1, \ldots, t_{n-1})$.

La escala es lo que convierte un "modelo de lenguaje" en un *Large* Language Model. Hablamos de:

- **Parámetros**: desde ~1B (mil millones) hasta >1T (trillón). GPT-4 se estima en ~1.8T de parámetros distribuidos en una [[arquitecturas-llm#Mixture of Experts|arquitectura MoE]][^1].
- **Datos de entrenamiento**: entre 1T y 15T+ tokens de texto. Llama 3 fue entrenado con 15T tokens[^2].
- **Compute**: decenas de miles de GPUs durante semanas o meses. El entrenamiento de GPT-4 costó estimadamente >$100M en compute.

> [!tip] Cuándo importa entender esto
> - **Usar este conocimiento cuando**: necesitas entender por qué un LLM genera ciertas respuestas, debugging de outputs inesperados, o decisiones de arquitectura en [[architect-overview|architect]].
> - **No es necesario cuando**: simplemente consumes una API y no necesitas optimizar el comportamiento fino del modelo.
> - Ver [[context-engineering-overview]] para el diseño del input que alimenta al modelo.

---

## Cómo funciona internamente: el pipeline de inferencia

El proceso por el cual un LLM genera texto se puede descomponer en cinco etapas fundamentales que se ejecutan en cada paso de generación. ==Entender este pipeline es clave para diagnosticar problemas de latencia, calidad y coste==. ^pipeline-inferencia

> [!example]- Ver diagrama completo del pipeline de inferencia
> ```mermaid
> flowchart LR
>     A["Texto de\nentrada"] --> B["1. Tokenización\n(texto → IDs)"]
>     B --> C["2. Embedding\n(IDs → vectores)"]
>     C --> D["3. Forward Pass\n(N capas Transformer)"]
>     D --> E["4. Sampling\n(logits → token ID)"]
>     E --> F["5. Detokenización\n(ID → texto)"]
>     F --> G{"¿Token\nEOS?"}
>     G -->|No| C
>     G -->|Sí| H["Texto\ncompleto"]
>
>     style D fill:#f9a825,stroke:#333,stroke-width:2px
>     style E fill:#66bb6a,stroke:#333,stroke-width:2px
> ```

### 1. Tokenización (texto a IDs)

La *tokenization* convierte texto crudo en una secuencia de enteros que el modelo puede procesar. Los LLMs modernos utilizan mayoritariamente *Byte-Pair Encoding* (BPE) o variantes como *SentencePiece*.

| Tokenizador | Usado por | Tamaño de vocabulario | Notas |
|---|---|---|---|
| `tiktoken` (BPE) | GPT-4, GPT-4o | ~100K tokens | Optimizado para código y multilingüe |
| SentencePiece | Llama, Mistral | 32K-128K tokens | Basado en unigram/BPE |
| WordPiece | BERT, T5 | 30K-32K tokens | Principalmente encoder models |
| Tekken | Mistral (Nemo+) | 128K tokens | Mejor cobertura multilingüe |

> [!warning] Implicación práctica
> ==Un token no es una palabra==. En inglés, 1 token ≈ 0.75 palabras. En español, la ratio es peor: 1 token ≈ 0.55-0.65 palabras dependiendo del tokenizador. Esto afecta directamente el coste por consulta y el uso efectivo de la [[context-engineering-overview|ventana de contexto]].

### 2. Embedding (IDs a vectores)

Cada token ID se mapea a un vector denso de dimensión $d_{model}$ mediante una *embedding matrix* de tamaño $|V| \times d_{model}$. Para GPT-4, $d_{model}$ se estima en 12,288 o superior.

Además del *token embedding*, se suma un *positional encoding* — en modelos modernos, casi universalmente *Rotary Position Embeddings* (RoPE)[^3] — que codifica la posición del token en la secuencia. Sin esta información posicional, el Transformer no podría distinguir "el gato persigue al ratón" de "el ratón persigue al gato".

### 3. Forward Pass (la computación central)

El corazón del LLM: la secuencia de vectores pasa por $N$ capas de Transformer, donde cada capa contiene:

1. **Multi-Head Attention** (*atención multi-cabeza*): permite a cada token "atender" a todos los tokens previos en la secuencia. La complejidad es $O(n^2 \cdot d)$ donde $n$ es la longitud de la secuencia.
2. **Feed-Forward Network** (FFN): dos capas densas con una activación no-lineal (típicamente *SwiGLU* en modelos modernos). Aquí es donde se almacena la mayoría del "conocimiento factual" del modelo[^4].
3. **Layer Normalization**: estabiliza el entrenamiento. *RMSNorm* es el estándar actual.

> [!info] Dimensiones típicas
> | Modelo | Capas ($N$) | $d_{model}$ | Heads | Parámetros |
> |---|---|---|---|---|
> | Llama 3.1 8B | 32 | 4,096 | 32 | 8.03B |
> | Llama 3.1 70B | 80 | 8,192 | 64 | 70.6B |
> | Llama 3.1 405B | 126 | 16,384 | 128 | 405B |
> | Mistral Large 2 | ~80 | ~8,192 | 64 | 123B |

Durante la inferencia, se utiliza *KV-cache* (*key-value cache*) para evitar recalcular la atención de tokens previos. ==El KV-cache es el principal consumidor de memoria VRAM durante la generación y el factor limitante del batch size en serving==. ^kv-cache

### 4. Sampling (logits a token)

La salida del forward pass es un vector de *logits* de tamaño $|V|$ (vocabulario completo). Convertir estos logits en un token seleccionado es donde entran las **estrategias de sampling**.

> [!example]- Ver diagrama del proceso de sampling
> ```mermaid
> flowchart TD
>     A["Logits\n(vector de |V| floats)"] --> B["Aplicar temperature\nlogits / T"]
>     B --> C["Softmax\n→ probabilidades"]
>     C --> D{"¿Método?"}
>     D -->|top-k| E["Quedarse con\nlos k tokens\nmás probables"]
>     D -->|top-p| F["Quedarse con tokens\nhasta acumular\nprobabilidad p"]
>     D -->|greedy| G["Tomar el\ntoken con max\nprobabilidad"]
>     E --> H["Re-normalizar\ny samplear"]
>     F --> H
>     G --> I["Token\nseleccionado"]
>     H --> I
> ```

#### Temperature

El parámetro *temperature* ($T$) controla la "creatividad" del modelo. Matemáticamente, divide los logits antes del softmax:

$$P(t_i) = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$

| Temperature | Efecto | Caso de uso |
|---|---|---|
| $T = 0$ | Determinístico (greedy) | Código, datos estructurados, clasificación |
| $T = 0.1 - 0.3$ | Muy conservador | Summarización, extracción |
| $T = 0.5 - 0.7$ | Balanceado | Uso general, chat |
| $T = 0.8 - 1.0$ | Creativo | Escritura creativa, brainstorming |
| $T > 1.0$ | Caótico | Generalmente inútil, texto incoherente |

#### Top-p (Nucleus Sampling)

*Top-p sampling*[^5] selecciona el conjunto mínimo de tokens cuya probabilidad acumulada supera $p$. ==Es generalmente preferible a top-k porque se adapta dinámicamente a la distribución de probabilidad==. ^top-p-sampling

- $p = 0.9$: descarta tokens del 10% menos probable
- $p = 0.1$: muy conservador, similar a greedy
- Los proveedores suelen recomendar ajustar temperature **o** top-p, no ambos simultáneamente

#### Top-k

*Top-k* simplemente retiene los $k$ tokens más probables y descarta el resto. Es más simple pero menos adaptativo que top-p. En distribuciones donde un token tiene probabilidad 0.95, top-k=50 retendría 49 tokens casi irrelevantes.

### 5. Detokenización (ID a texto)

El token ID seleccionado se convierte de vuelta a texto mediante el tokenizador inverso. Este proceso es trivial computacionalmente pero tiene sutilezas:

- Los tokens de subpalabra deben recombinarse correctamente
- Caracteres especiales de control (`<|endoftext|>`, `<|im_start|>`) se filtran
- El *streaming* permite enviar cada token al usuario inmediatamente, creando el efecto de "escritura en tiempo real"

---

## Generación autoregresiva

El mecanismo fundamental de generación en los LLMs decoder-only es la **generación autoregresiva** (*autoregressive generation*): el modelo genera un token a la vez, y cada token generado se añade al contexto para generar el siguiente.

> [!warning] Implicación clave de la autoregresividad
> ==El modelo no puede "volver atrás" ni revisar lo que ya generó==. Una vez que un token se ha emitido, es definitivo (salvo que se descarte la generación completa). Esto explica por qué técnicas como [[chain-of-thought|Chain of Thought]] son tan efectivas: fuerzan al modelo a "pensar paso a paso" en lugar de comprometerse con una respuesta prematura.

Esto tiene consecuencias profundas:

1. **Latencia proporcional a la longitud de salida**: generar 1000 tokens toma ~1000 forward passes (uno por token). El *time-to-first-token* (TTFT) depende del prefill, mientras que los tokens subsiguientes dependen de la latencia de decodificación.
2. **Error acumulativo**: pequeños errores en tokens tempranos pueden desviar completamente la generación posterior.
3. **No hay "planificación global"**: el modelo no puede "ver" el final de su respuesta antes de empezar a escribirla.

> [!example]- Pseudocódigo de generación autoregresiva
> ```python
> def generate(model, prompt_tokens, max_new_tokens, temperature=0.7, top_p=0.9):
>     """Loop autoregresivo fundamental de un LLM."""
>     tokens = list(prompt_tokens)
>     kv_cache = None
>
>     for _ in range(max_new_tokens):
>         # Forward pass (usa KV-cache para eficiencia)
>         logits, kv_cache = model.forward(tokens[-1:], kv_cache=kv_cache)
>
>         # Aplicar temperature
>         logits = logits / temperature
>
>         # Top-p filtering
>         sorted_logits, sorted_indices = torch.sort(logits, descending=True)
>         cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
>         mask = cumulative_probs - F.softmax(sorted_logits, dim=-1) >= top_p
>         sorted_logits[mask] = float('-inf')
>
>         # Samplear
>         probs = F.softmax(sorted_logits, dim=-1)
>         next_token = sorted_indices[torch.multinomial(probs, 1)]
>
>         tokens.append(next_token.item())
>
>         # Parar si es token de fin
>         if next_token == model.eos_token_id:
>             break
>
>     return tokens
> ```

---

## Por qué los LLMs "funcionan": la efectividad irrazonable

Uno de los fenómenos más fascinantes de los LLMs es lo que algunos investigadores llaman la "efectividad irrazonable" del preentrenamiento de lenguaje. ==Un modelo entrenado simplemente para predecir el siguiente token desarrolla capacidades emergentes que van mucho más allá de la predicción de texto==: razonamiento, aritmética básica, traducción, programación, e incluso formas rudimentarias de planificación. ^efectividad-irrazonable

Las hipótesis principales sobre por qué funciona son:

### 1. Compresión como comprensión

El argumento de Ilya Sutskever (cofounder de OpenAI): para predecir bien el siguiente token en un corpus suficientemente grande y diverso, el modelo *necesita* construir representaciones internas del mundo. Predecir el siguiente movimiento en una partida de ajedrez descrita en texto requiere, en cierto sentido, "entender" ajedrez[^6].

### 2. Scaling Laws

Los *scaling laws* de Kaplan et al. (2020) y Chinchilla (Hoffmann et al., 2022) demostraron que ==la pérdida del modelo sigue una ley de potencias respecto a tres variables: parámetros, datos y compute==.[^7] Esto implica que simplemente escalar produce mejoras predecibles, lo que justificó inversiones masivas.

> [!example]- Ley de escalado (Chinchilla-optimal)
> ```
> Para un presupuesto de compute C:
> - Parámetros óptimos N ∝ C^0.5
> - Tokens óptimos D ∝ C^0.5
>
> Regla práctica Chinchilla:
> - D ≈ 20 × N (tokens ≈ 20× parámetros)
>
> Ejemplo:
> - Modelo de 7B → necesita ~140B tokens para Chinchilla-optimal
> - Llama 3 8B fue entrenado con 15T tokens (>>Chinchilla),
>   demostrando que over-training funciona para modelos de inferencia
> ```

### 3. Capacidades emergentes

Ciertas capacidades solo aparecen a partir de una escala determinada — aunque hay debate sobre si esto es un artefacto de métricas discretas o un fenómeno genuino[^8]. Ejemplos observados:

- *Few-shot learning*: aparece alrededor de ~10B parámetros
- Razonamiento aritmético multi-paso: ~100B parámetros
- *Theory of mind* rudimentaria: debatido, pero reportado en modelos >100B

### 4. In-context learning

Los LLMs pueden aprender tareas nuevas simplemente a partir de ejemplos en el contexto (*in-context learning* o ICL), sin modificar sus parámetros. Este fenómeno, descubierto en GPT-3[^9], sigue sin estar completamente explicado teóricamente, aunque trabajos recientes sugieren que los Transformers implementan internamente un tipo de descenso de gradiente implícito.

---

## Limitaciones fundamentales

> [!danger] No son inteligencias generales
> A pesar de su capacidad impresionante, los LLMs tienen limitaciones estructurales que no se resuelven simplemente escalando. Ignorar estas limitaciones lleva a sistemas frágiles y peligrosos.

### El debate de los "loros estocásticos"

El término *stochastic parrot* fue acuñado por Bender et al. (2021)[^10] para argumentar que los LLMs son fundamentalmente sistemas que "recombinan patrones estadísticos sin comprensión genuina". Las posiciones del debate:

> [!question] ¿Entienden o solo imitan?
> - **Posición A (funcionalista)**: si un sistema produce outputs indistinguibles de la comprensión, la distinción es irrelevante para aplicaciones prácticas — defendida por investigadores como Yann LeCun parcialmente, y la línea pragmática de la industria.
> - **Posición B (escéptica)**: la falta de grounding (conexión con el mundo real), la incapacidad de verificar sus outputs, y los modos de fallo absurdos demuestran que no hay comprensión — defendida por Bender, Gebru, Gary Marcus.
> - **Mi valoración**: para ingeniería de sistemas, la posición funcionalista es más útil, pero las limitaciones son reales y deben diseñarse defensivamente. Ver [[vigil-overview|vigil]] para guardrails.

### Limitaciones concretas

| Limitación | Descripción | Mitigación |
|---|---|---|
| **Alucinaciones** | Genera información falsa con alta confianza | [[pattern-rag\|RAG]], verification chains, [[vigil-overview\|guardrails]] |
| **No-razonamiento real** | Falla en lógica formal, matemáticas complejas | Chain of Thought, herramientas externas, modelos de razonamiento (o1/o3) |
| **Ventana de contexto finita** | No puede procesar información infinita | [[context-engineering-overview\|Context engineering]], [[chunking-strategies\|chunking]] |
| **Conocimiento estático** | Entrenado hasta una fecha de corte | RAG con fuentes actualizadas |
| **Sensibilidad al prompt** | Pequeños cambios en el input → grandes cambios en output | [[prompt-engineering\|Prompt engineering]], few-shot |
| **Sesgos** | Reproduce y amplifica sesgos del training data | [[bias-en-llms\|Detección de bias]], evaluación, fine-tuning |
| **Costes de energía** | Entrenamiento e inferencia intensivos | [[impacto-ambiental-ia\|Consideraciones ambientales]], modelos más pequeños |

> [!failure] Modos de fallo más peligrosos
> - **Sycophancy** (*adulación*): el modelo tiende a estar de acuerdo con el usuario incluso cuando este está equivocado
> - **Confabulación segura**: genera texto con formato y tono de experto sobre temas que desconoce completamente
> - **Prompt injection**: un atacante puede secuestrar el comportamiento del modelo mediante instrucciones inyectadas — ver [[prompt-injection-seguridad]]
> - **Data leakage**: puede revelar información de su training data en ciertas condiciones

---

## Estado del arte (2025-2026)

El estado actual del campo se caracteriza por varias tendencias simultáneas:

1. **Modelos de razonamiento**: La familia o1/o3 de OpenAI y sus equivalentes (Claude con *extended thinking*, Gemini 2.0 Flash Thinking) representan un salto cualitativo al dedicar más compute en inferencia al "pensar" antes de responder.

2. **Eficiencia sobre tamaño**: La tendencia post-2024 es conseguir más con menos. Modelos como Phi-4 (14B) o Gemma 2 (27B) rivalizan con modelos mucho más grandes en tareas específicas.

3. **Multimodalidad nativa**: GPT-4o, Gemini, y Claude 3.5+ procesan texto, imagen, audio y video nativamente, difuminando la línea entre "modelo de lenguaje" y "modelo fundacional".

4. **Ventanas de contexto masivas**: ==De 4K tokens en GPT-3.5 (2023) a 1M+ en Gemini 1.5 Pro y 200K en Claude==, con implicaciones enormes para [[context-engineering-overview|context engineering]].

> [!success] Lo que funciona bien hoy
> - Generación de código: los LLMs actuales son programadores competentes en la mayoría de lenguajes
> - Summarización y análisis de texto: calidad cercana a humana para textos bien definidos
> - Traducción: casi a nivel profesional para idiomas de alto recurso
> - Asistencia en escritura: desde emails hasta artículos técnicos
> - Razonamiento guiado: con técnicas de prompting adecuadas, resuelven problemas complejos

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: Consume LLMs como backend para generar documentación a partir de código fuente. La calidad de la documentación depende directamente de la calidad del modelo y del [[context-engineering-overview|context engineering]] aplicado.
> - **[[architect-overview|architect]]**: El LLM es el motor central del agente architect. Entender sus limitaciones es crucial para diseñar el [[architect-overview#Ralph Loop|Ralph Loop]] de forma defensiva.
> - **[[vigil-overview|vigil]]**: Escanea outputs de LLMs buscando problemas de seguridad, alucinaciones y violaciones de políticas. Mitiga directamente las limitaciones descritas en esta nota.
> - **[[licit-overview|licit]]**: Evalúa compliance regulatorio. Los LLMs usados en sistemas de alto riesgo según el [[eu-ai-act-completo|EU AI Act]] requieren documentación extensiva de su comportamiento.

---

## Enlaces y referencias

**Notas relacionadas:**
- [[arquitecturas-llm]] — Las distintas arquitecturas de los LLMs modernos
- [[landscape-modelos]] — Comparativa actualizada de modelos disponibles
- [[modelos-open-source]] — Ecosistema de modelos abiertos
- [[modelos-propietarios]] — APIs comerciales y sus características
- [[transformer-architecture]] — La arquitectura fundacional detrás de los LLMs
- [[attention-is-all-you-need]] — El paper seminal de Vaswani et al.
- [[context-engineering-overview]] — Diseño y gestión del contexto de entrada
- [[chain-of-thought]] — Técnica de prompting que explota la autoregresividad
- [[inference-optimization]] — Optimizaciones de inferencia: quantization, speculative decoding, etc.

> [!quote]- Referencias bibliográficas
> - Vaswani et al., "Attention Is All You Need", NeurIPS 2017
> - Brown et al., "Language Models are Few-Shot Learners" (GPT-3), NeurIPS 2020
> - Kaplan et al., "Scaling Laws for Neural Language Models", arXiv 2020
> - Hoffmann et al., "Training Compute-Optimal Large Language Models" (Chinchilla), arXiv 2022
> - Holtzman et al., "The Curious Case of Neural Text Degeneration" (Nucleus Sampling), ICLR 2020
> - Bender et al., "On the Dangers of Stochastic Parrots", FAccT 2021
> - Touvron et al., "Llama 2: Open Foundation and Fine-Tuned Chat Models", arXiv 2023
> - Meta AI, "The Llama 3 Herd of Models", arXiv 2024

[^1]: Estimaciones basadas en reportes no oficiales y análisis de infraestructura. OpenAI no ha confirmado la arquitectura de GPT-4 públicamente.
[^2]: Meta AI, "The Llama 3 Herd of Models", arXiv 2024.
[^3]: Su et al., "RoFormer: Enhanced Transformer with Rotary Position Embedding", arXiv 2021.
[^4]: Meng et al., "Locating and Editing Factual Associations in GPT", NeurIPS 2022.
[^5]: Holtzman et al., "The Curious Case of Neural Text Degeneration", ICLR 2020.
[^6]: Esta posición fue articulada por Ilya Sutskever en múltiples entrevistas durante 2023.
[^7]: Kaplan et al., "Scaling Laws for Neural Language Models", arXiv 2020.
[^8]: Schaeffer et al., "Are Emergent Abilities of Large Language Models a Mirage?", NeurIPS 2023.
[^9]: Brown et al., "Language Models are Few-Shot Learners" (GPT-3), NeurIPS 2020.
[^10]: Bender et al., "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?", FAccT 2021.
