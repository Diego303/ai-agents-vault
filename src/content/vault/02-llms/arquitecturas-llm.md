---
tags:
  - concepto
  - llm
  - arquitectura
aliases:
  - arquitecturas de LLM
  - LLM architectures
  - decoder-only
  - encoder-decoder
  - MoE
created: 2025-06-01
updated: 2025-06-01
category: modelos-llm
status: evergreen
difficulty: advanced
related:
  - "[[que-son-llms]]"
  - "[[transformer-architecture]]"
  - "[[attention-is-all-you-need]]"
  - "[[landscape-modelos]]"
  - "[[inference-optimization]]"
  - "[[modelos-open-source]]"
up: "[[moc-llms]]"
---

# Arquitecturas de LLMs

> [!abstract] Resumen
> Las arquitecturas de los LLMs modernos se clasifican en cuatro familias principales: ==decoder-only (GPT, Llama, Mistral)==, encoder-decoder (T5, BART), ==Mixture of Experts (Mixtral, DeepSeek V3)==, y modelos de espacio de estados (Mamba, Jamba). La arquitectura decoder-only ha dominado la generación de texto desde 2020, mientras que MoE se ha convertido en la estrategia dominante para escalar más allá de los 100B parámetros activos sin explotar los costes de inferencia. ^resumen

## Qué es y por qué importa

La **arquitectura** de un LLM determina sus capacidades fundamentales, eficiencia computacional, y modos de uso. ==Elegir la arquitectura correcta no es un detalle de implementación — es la decisión que define el ceiling de rendimiento de todo el sistema==.

Históricamente, la arquitectura [[transformer-architecture|Transformer]] original de Vaswani et al. (2017)[^1] contenía tanto un *encoder* como un *decoder*. A partir de ahí, la comunidad exploró tres ramas:

1. **Encoder-only** (BERT): para tareas de comprensión, no generación
2. **Encoder-decoder** (T5, BART): para tareas secuencia-a-secuencia
3. **Decoder-only** (GPT): para generación autoregresiva

> [!tip] Regla práctica
> - **Si necesitas generar texto**: decoder-only (o MoE decoder-only)
> - **Si necesitas traducción o transformación texto-a-texto**: encoder-decoder puede ser más eficiente
> - **Si necesitas clasificación o embeddings**: encoder-only o el encoder de un encoder-decoder
> - **Si necesitas escala masiva con eficiencia**: MoE
> - Ver [[decision-modelo-llm]] para un árbol de decisión completo

---

## Decoder-Only (la arquitectura dominante)

La arquitectura *decoder-only* utiliza exclusivamente la mitad decodificadora del Transformer original, con *causal attention* (cada token solo puede atender a tokens anteriores).

> [!example]- Diagrama de arquitectura Decoder-Only
> ```mermaid
> flowchart TD
>     subgraph Input
>         A["Tokens de entrada"] --> B["Token Embeddings\n+ Positional Encoding (RoPE)"]
>     end
>
>     subgraph DecoderBlock["Decoder Block × N"]
>         C["RMSNorm"] --> D["Causal Multi-Head\nSelf-Attention\n(masked)"]
>         D --> E["Residual Connection"]
>         E --> F["RMSNorm"]
>         F --> G["Feed-Forward\n(SwiGLU)"]
>         G --> H["Residual Connection"]
>     end
>
>     B --> C
>     H --> I["RMSNorm Final"]
>     I --> J["Linear Head\n(→ logits sobre vocabulario)"]
>     J --> K["Sampling"]
>
>     style DecoderBlock fill:#e3f2fd,stroke:#1565c0
> ```

### Modelos representativos

| Modelo | Organización | Parámetros | Contexto | Innovaciones clave |
|---|---|---|---|---|
| GPT-2 | OpenAI | 1.5B | 1K | Demostró *zero-shot* viable |
| GPT-3 | OpenAI | 175B | 4K | *In-context learning*, few-shot |
| GPT-4o | OpenAI | ~200B activos (MoE) | 128K | Multimodal nativo |
| Llama 2 | Meta | 7B/13B/70B | 4K | Abierto, RLHF incluido |
| ==Llama 3.1== | Meta | 8B/70B/405B | 128K | ==15T tokens training, SOTA open== |
| Llama 4 | Meta | Variable (MoE) | 1M+ | MoE nativo, ultra-largo contexto |
| Mistral 7B | Mistral | 7B | 32K | GQA, Sliding Window Attention |
| Mistral Large 2 | Mistral | 123B | 128K | Función calling nativo |
| Qwen 2.5 | Alibaba | 0.5B-72B | 128K | Mejor modelo abierto multilingüe |
| Phi-4 | Microsoft | 14B | 16K | Datos sintéticos de calidad |
| Gemma 2 | Google | 2B/9B/27B | 8K | Destilación de Gemini |
| Claude 3.5 Sonnet | Anthropic | No revelado | 200K | Constitutional AI |
| Claude 4 Opus | Anthropic | No revelado | 200K | Razonamiento extendido |

### Por qué decoder-only ganó para generación

> [!question] ¿Por qué no encoder-decoder para todo?
> La respuesta tiene múltiples dimensiones:
> - **Simplicidad**: una sola pila de capas es más fácil de escalar, optimizar y paralelizar
> - **Eficiencia en autoregresión**: no se necesita un encoder separado cuando el contexto completo está en el mismo stream
> - **Scaling laws más limpios**: los decoder-only siguen leyes de escalado más predecibles[^2]
> - **Unificación**: un decoder-only puede hacer todas las tareas que hace un encoder-decoder reformulándolas como generación de texto, pero no viceversa
> - **Infraestructura**: la industria ha optimizado masivamente kernels, frameworks y hardware para decoder-only

La evidencia empírica es contundente: ==todos los modelos frontier de 2024-2025 (GPT-4o, Claude 3.5+, Gemini 1.5+, Llama 3+) son decoder-only o MoE decoder-only==.

### Innovaciones arquitectónicas dentro de decoder-only

No todos los decoder-only son iguales. Las innovaciones clave en la familia incluyen:

1. **Grouped Query Attention (GQA)**: reduce el tamaño del [[que-son-llms#^kv-cache|KV-cache]] agrupando queries que comparten las mismas keys/values. Usado por Llama 2 70B, Llama 3, Mistral.

2. **Sliding Window Attention (SWA)**: limita la atención a una ventana local de $W$ tokens en algunas capas, reduciendo la complejidad. Introducido por Mistral 7B.

3. **RoPE (Rotary Position Embeddings)**: codificación posicional rotacional que permite extender el contexto más allá del largo de entrenamiento. Estándar de facto en modelos post-2023[^3].

4. **SwiGLU Activation**: reemplazó a ReLU/GELU en la FFN. Mejora la calidad sin coste adicional significativo. Propuesto por Shazeer (2020)[^4].

5. **RMSNorm**: normalización simplificada que elimina el centrado de media, más eficiente que LayerNorm.

6. **Flash Attention**: no es una innovación arquitectónica per se, sino una implementación eficiente de atención que reduce el uso de memoria de $O(n^2)$ a $O(n)$ sin cambiar los resultados[^5]. Crítico para contextos largos.

---

## Encoder-Decoder

La arquitectura *encoder-decoder* mantiene ambas mitades del Transformer original. El encoder procesa la entrada completa con atención bidireccional, y el decoder genera la salida autoregresivamente, atendiendo tanto a sus propios tokens previos como a las representaciones del encoder.

> [!example]- Diagrama de arquitectura Encoder-Decoder
> ```mermaid
> flowchart LR
>     subgraph Encoder["Encoder (bidireccional)"]
>         A["Input tokens"] --> B["Embeddings"]
>         B --> C["Self-Attention\n(full, no mask)"]
>         C --> D["FFN"]
>         D --> E["Encoder\nrepresentations"]
>     end
>
>     subgraph Decoder["Decoder (causal)"]
>         F["Output tokens\n(shifted right)"] --> G["Embeddings"]
>         G --> H["Masked\nSelf-Attention"]
>         H --> I["Cross-Attention\n(attends to encoder)"]
>         I --> J["FFN"]
>         J --> K["Output\nprobabilities"]
>     end
>
>     E -->|"cross-attention\nkeys & values"| I
>
>     style Encoder fill:#e8f5e9,stroke:#2e7d32
>     style Decoder fill:#fff3e0,stroke:#e65100
> ```

### Modelos representativos

| Modelo | Organización | Parámetros | Notas |
|---|---|---|---|
| T5 | Google | 60M - 11B | "Text-to-Text Transfer Transformer" |
| BART | Meta/Facebook | 140M - 400M | Preentrenado con denoising |
| Flan-T5 | Google | Hasta 11B | T5 con instruction tuning |
| UL2 | Google | 20B | Unificó objetivos de preentrenamiento |
| mBART | Meta | 680M | Multilingüe |

> [!info] ¿Dónde siguen siendo relevantes?
> Aunque los decoder-only dominan, los encoder-decoder aún tienen nichos:
> - **Traducción automática**: la arquitectura fue literalmente diseñada para esto
> - **Summarización abstractiva**: el encoder procesa el documento completo bidireccionalmente
> - **Modelos small/edge**: para dispositivos con restricciones, un T5-small puede ser más eficiente que un decoder-only equivalente
> - **Speech-to-text**: Whisper de OpenAI usa encoder-decoder

> [!failure] Por qué no escaló para LLMs frontier
> - El cross-attention añade complejidad y latencia
> - La división encoder/decoder complica el KV-cache
> - Escalar ambas mitades requiere decisiones de diseño adicionales (ratio encoder:decoder)
> - Los beneficios de la atención bidireccional del encoder se pueden aproximar con técnicas de [[context-engineering-overview|context engineering]] en decoder-only

---

## Mixture of Experts (MoE)

*Mixture of Experts* es una técnica que ==permite escalar masivamente el número total de parámetros de un modelo mientras mantiene constante el coste computacional de cada forward pass==. En lugar de una sola FFN por capa, hay $E$ FFNs "expertos", y un *router* selecciona los top-$k$ expertos para cada token. ^moe-overview

> [!example]- Diagrama del mecanismo MoE
> ```mermaid
> flowchart TD
>     A["Token\nrepresentation"] --> B["Router\n(linear + softmax)"]
>     B -->|"peso w₁"| C["Expert 1\n(FFN)"]
>     B -->|"peso w₂"| D["Expert 2\n(FFN)"]
>     B -.->|"no activado"| E["Expert 3\n(FFN)"]
>     B -.->|"no activado"| F["Expert 4\n(FFN)"]
>     B -.->|"no activado"| G["Expert N\n(FFN)"]
>     C --> H["Weighted Sum\nw₁·E₁ + w₂·E₂"]
>     D --> H
>     H --> I["Output"]
>
>     style C fill:#a5d6a7,stroke:#333
>     style D fill:#a5d6a7,stroke:#333
>     style E fill:#eeeeee,stroke:#999,stroke-dasharray: 5 5
>     style F fill:#eeeeee,stroke:#999,stroke-dasharray: 5 5
>     style G fill:#eeeeee,stroke:#999,stroke-dasharray: 5 5
> ```

### Cómo funciona el routing

El *router* (también llamado *gating network*) es una capa lineal que toma la representación del token $x$ y produce scores para cada experto:

$$g(x) = \text{softmax}(\text{TopK}(W_g \cdot x, k))$$

Donde $W_g$ es la matriz de pesos del router y *TopK* selecciona los $k$ expertos con mayor score, poniendo el resto a $-\infty$ antes del softmax.

> [!warning] Problemas de balance en el routing
> El routing presenta desafíos técnicos significativos:
> - **Expert collapse**: sin regularización, el router puede enviar todos los tokens al mismo experto, anulando el beneficio de MoE
> - **Load balancing loss**: se añade un término auxiliar a la función de pérdida que penaliza distribuciones desiguales de tokens entre expertos. ==Este balance es crítico: demasiado poco y los expertos colapsan, demasiado y se degrada la calidad==
> - **Token dropping**: en entrenamiento, si un experto recibe más tokens de los que su buffer permite, los excedentes se descartan
> - **Expert parallelism**: los expertos pueden distribuirse en diferentes GPUs, requiriendo comunicación *all-to-all* que es un cuello de botella

### Modelos MoE representativos

| Modelo | Expertos totales | Expertos activos | Parámetros totales | Parámetros activos | Contexto |
|---|---|---|---|---|---|
| Mixtral 8x7B | 8 | 2 | 46.7B | ~12.9B | 32K |
| Mixtral 8x22B | 8 | 2 | 141B | ~39B | 64K |
| GPT-4 (estimado) | 16 | 2 | ~1.8T | ~200B | 128K |
| ==DeepSeek V3== | 257 | 8 | ==671B== | ==37B== | 128K |
| DeepSeek R1 | 257 | 8 | 671B | 37B | 128K |
| Grok-1 | 8 | 2 | 314B | ~86B | 8K |
| Llama 4 Maverick | 128 | Dinámico | ~400B | Variable | 1M |
| DBRX | 16 | 4 | 132B | ~36B | 32K |
| Qwen 2.5-MoE | 64 | 8 | ~57B | ~14B | 128K |

> [!success] Ventajas de MoE
> - **Eficiencia en inferencia**: solo se computan los expertos activos, reduciendo FLOPs ~$E/k$ veces respecto a un modelo denso equivalente
> - **Escala de conocimiento**: más parámetros totales = más capacidad de almacenar conocimiento
> - **Especialización**: diferentes expertos pueden especializarse en diferentes dominios o tipos de tokens (aunque esto no siempre emerge claramente)
> - **Coste de entrenamiento**: más eficiente en FLOPs que un modelo denso del mismo rendimiento

> [!failure] Limitaciones de MoE
> - **Memoria**: todos los parámetros deben estar en memoria aunque solo se usen $k/E$ por forward pass. DeepSeek V3 con 671B parámetros necesita decenas de GPUs solo para cargar los pesos
> - **Comunicación inter-GPU**: el routing all-to-all es un cuello de botella en inferencia distribuida
> - **Inestabilidad de entrenamiento**: el load balancing es difícil de ajustar
> - **Quantización más difícil**: cuantizar expertos poco activados pierde más información

### DeepSeek V3: el estado del arte en MoE

DeepSeek V3 merece mención especial por sus innovaciones en routing:

1. **Auxiliary-loss-free load balancing**: elimina la pérdida auxiliar usando un mecanismo de sesgo dinámico por experto, evitando la degradación de calidad del load balancing loss tradicional[^6].
2. **Multi-Token Prediction (MTP)**: predice múltiples tokens futuros simultáneamente como objetivo de entrenamiento auxiliar.
3. **FP8 training**: entrenado completamente en precisión FP8, reduciendo el coste de entrenamiento a ==~$5.5M== (comparado con >$100M estimados para GPT-4).

---

## State-Space Models (SSMs)

Los *State-Space Models* representan una alternativa fundamentalmente diferente al mecanismo de atención. En lugar de calcular relaciones token-a-token explícitas (complejidad $O(n^2)$), los SSMs procesan secuencias en $O(n)$ usando una formulación de espacio de estados inspirada en teoría de control.

> [!example]- Diagrama conceptual de SSM vs Attention
> ```mermaid
> flowchart LR
>     subgraph Attention["Transformer Attention O(n²)"]
>         A1["t₁"] <--> A2["t₂"]
>         A1 <--> A3["t₃"]
>         A1 <--> A4["t₄"]
>         A2 <--> A3
>         A2 <--> A4
>         A3 <--> A4
>     end
>
>     subgraph SSM["State-Space Model O(n)"]
>         B1["t₁"] --> S1["state"]
>         S1 --> B2["t₂"]
>         B2 --> S2["state"]
>         S2 --> B3["t₃"]
>         B3 --> S3["state"]
>         S3 --> B4["t₄"]
>     end
>
>     style Attention fill:#ffcdd2,stroke:#c62828
>     style SSM fill:#c8e6c9,stroke:#2e7d32
> ```

### Mamba: el SSM selectivo

Mamba (Gu & Dao, 2023)[^7] introduce el *selective state-space model*, donde los parámetros del SSM dependen del input (son *data-dependent*), a diferencia de los SSM lineales anteriores (S4) donde eran fijos.

La ecuación fundamental es:
$$h_t = \bar{A} h_{t-1} + \bar{B} x_t$$
$$y_t = C h_t$$

Donde $\bar{A}$ y $\bar{B}$ se discretizan a partir de parámetros continuos, y crucialmente, $B$, $C$ y $\Delta$ (el paso de discretización) dependen del input $x_t$.

| Aspecto | Transformer | Mamba/SSM |
|---|---|---|
| Complejidad de secuencia | $O(n^2)$ | $O(n)$ |
| Complejidad KV-cache | $O(n)$ creciente | $O(1)$ estado fijo |
| Paralelismo en entrenamiento | Alto (atención paralela) | Alto (conv scan paralelo) |
| Calidad en tareas de lenguaje | ==SOTA== | Competitivo, ligeramente inferior |
| Throughput en secuencias largas | Bajo (cuadrático) | ==Alto (lineal)== |
| Recall de hechos en contexto largo | Excelente | Más débil |

### Jamba: el modelo híbrido

AI21 Labs lanzó Jamba como un modelo híbrido que alterna capas de Transformer y Mamba, con MoE encima. Esta combinación busca lo mejor de ambos mundos:

- **Capas Mamba**: eficiencia en secuencias largas, throughput alto
- **Capas Transformer**: retrieval preciso de hechos, in-context learning fuerte
- **MoE**: escala de parámetros eficiente

> [!info] Estado actual de los SSMs (2025)
> Los SSMs puros no han logrado desbancar a los Transformers en benchmarks de lenguaje generales, pero la tendencia hacia ==modelos híbridos (Transformer + SSM)== es clara. Nvidia (con Hymba), Zyphra (Zamba), y el propio Jamba 1.5 de AI21 muestran que la combinación es prometedora, especialmente para:
> - Inferencia en dispositivos edge con restricciones de memoria
> - Aplicaciones que necesitan contextos extremadamente largos (>1M tokens)
> - Escenarios donde el throughput es más importante que la calidad marginal

---

## Comparativa general de arquitecturas

| Criterio | Decoder-Only | Encoder-Decoder | MoE | SSM (Mamba) | Híbrido |
|---|---|---|---|---|---|
| **Generación de texto** | ==Excelente== | Bueno | ==Excelente== | Bueno | Muy bueno |
| **Comprensión** | Muy bueno | ==Excelente== | Muy bueno | Bueno | Muy bueno |
| **Escalabilidad** | Buena | Moderada | ==Excelente== | Muy buena | Muy buena |
| **Eficiencia VRAM** | Moderada | Moderada | Baja (más parámetros) | ==Excelente== | Buena |
| **Contexto largo** | Buena (con RoPE ext.) | Limitada | Buena | ==Excelente== | ==Excelente== |
| **Throughput inferencia** | Moderado | Moderado | Alto | ==Muy alto== | Alto |
| **Madurez ecosistema** | ==Máxima== | Buena | Buena | Emergente | Emergente |
| **Modelos frontier** | GPT-4o, Claude, Gemini | — | DeepSeek V3, Mixtral | Mamba-2 | Jamba 1.5 |

---

## Árbol de decisión de arquitectura

> [!example]- Ver árbol de decisión
> ```mermaid
> flowchart TD
>     A{"¿Tarea principal?"} -->|Generación abierta\nchat, código| B{"¿Presupuesto\nde compute?"}
>     A -->|Traducción,\nsummarización| C["Encoder-Decoder\n(T5, BART)"]
>     A -->|Clasificación,\nembeddings| D["Encoder-only\n(BERT, ModernBERT)"]
>
>     B -->|Ilimitado\n(cloud API)| E["Decoder-only denso\no MoE frontier\n(GPT-4o, Claude 4)"]
>     B -->|Limitado\n(self-hosting)| F{"¿Parámetros\ndisponibles?"}
>
>     F -->|< 15B| G["Decoder-only denso\n(Llama 3.1 8B,\nPhi-4, Qwen 2.5 7B)"]
>     F -->|15B - 100B| H{"¿VRAM\ndisponible?"}
>     F -->|> 100B| I["MoE\n(DeepSeek V3,\nMixtral 8x22B)"]
>
>     H -->|Abundante\n(8+ GPUs)| J["Decoder-only denso\n(Llama 3.1 70B)"]
>     H -->|Limitada\n(1-2 GPUs)| K["MoE con\nquantización\n(Mixtral Q4)"]
>
>     style E fill:#a5d6a7,stroke:#333
>     style G fill:#a5d6a7,stroke:#333
> ```

---

## Estado del arte (2025-2026)

Las tendencias arquitectónicas clave en el período actual:

1. **MoE como estándar en frontier**: GPT-4o, Llama 4, DeepSeek V3/R1, y probablemente Gemini usan MoE. ==MoE ya no es experimental — es el estándar para modelos >100B de parámetros activos==.

2. **Híbridos SSM-Transformer**: la investigación se mueve hacia combinar la eficiencia de SSMs con la calidad de Transformers.

3. **Linear attention**: variantes de atención con complejidad lineal (RetNet, RWKV-6, GLA) son una alternativa a los SSMs puros.

4. **Multi-head Latent Attention (MLA)**: innovación de DeepSeek V2/V3 que comprime las KV-cache usando proyecciones de baja dimensión, logrando mejor calidad con menos memoria[^8].

5. **Diferenciación por tarea**: modelos de razonamiento (o1/o3, R1) usan la misma arquitectura base pero con entrenamiento RL para dedicar más tokens a "pensar".

> [!question] Debate abierto: ¿Llegamos al límite del Transformer?
> - **Posición A (evolucionistas)**: El Transformer seguirá dominando con mejoras incrementales (MoE, MLA, Flash Attention, etc.) — la mayoría de labs líderes
> - **Posición B (revolucionarios)**: Necesitamos arquitecturas fundamentalmente nuevas para superar las limitaciones de atención cuadrática — Gu (Mamba), RWKV team
> - **Mi valoración**: ==Los híbridos probablemente ganen a medio plazo==. La atención cuadrática es un problema real para contextos >1M, pero la calidad del Transformer puro aún no se ha igualado para tareas complejas de razonamiento.

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: La elección de arquitectura del modelo backend afecta directamente la calidad de documentación generada. Los modelos MoE tienden a ser más rápidos para procesamiento batch de ficheros.
> - **[[architect-overview|architect]]**: El agent loop de architect necesita modelos con buen function calling. Los decoder-only con instruction tuning son los más confiables para esto. La [[architect-overview#Ralph Loop|Ralph Loop]] se beneficia de modelos con ventanas de contexto largas.
> - **[[vigil-overview|vigil]]**: Los guardrails deben adaptarse a la arquitectura: modelos MoE pueden tener patrones de alucinación diferentes a modelos densos. Las diferencias en sampling entre arquitecturas afectan la calibración de vigil.
> - **[[licit-overview|licit]]**: Documentar la arquitectura del modelo usado es parte de los requisitos del [[eu-ai-act-completo|EU AI Act]] Annex IV para sistemas de alto riesgo.

---

## Enlaces y referencias

**Notas relacionadas:**
- [[que-son-llms]] — Fundamentos de qué es un LLM y cómo genera texto
- [[landscape-modelos]] — Comparativa actualizada de modelos por proveedor
- [[transformer-architecture]] — Deep dive en la arquitectura Transformer original
- [[attention-is-all-you-need]] — Análisis del paper seminal
- [[inference-optimization]] — Optimizaciones que dependen de la arquitectura: quantization, speculative decoding
- [[modelos-open-source]] — Modelos abiertos y sus arquitecturas
- [[context-engineering-overview]] — Diseño de contexto, afectado por la arquitectura

> [!quote]- Referencias bibliográficas
> - Vaswani et al., "Attention Is All You Need", NeurIPS 2017
> - Radford et al., "Language Models are Unsupervised Multitask Learners" (GPT-2), 2019
> - Raffel et al., "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer" (T5), JMLR 2020
> - Shazeer et al., "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer", ICLR 2017
> - Jiang et al., "Mixtral of Experts", arXiv 2024
> - DeepSeek AI, "DeepSeek-V3 Technical Report", arXiv 2024
> - Gu & Dao, "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", arXiv 2023
> - Lieber et al., "Jamba: A Hybrid Transformer-Mamba Language Model", arXiv 2024
> - Su et al., "RoFormer: Enhanced Transformer with Rotary Position Embedding", arXiv 2021
> - Dao et al., "FlashAttention: Fast and Memory-Efficient Exact Attention", NeurIPS 2022

[^1]: Vaswani et al., "Attention Is All You Need", NeurIPS 2017. La arquitectura original tenía 6 capas encoder + 6 capas decoder con 512 dimensiones.
[^2]: Kaplan et al., "Scaling Laws for Neural Language Models", arXiv 2020. Los scaling laws se demostraron primariamente en decoder-only.
[^3]: Su et al., "RoFormer: Enhanced Transformer with Rotary Position Embedding", arXiv 2021.
[^4]: Shazeer, "GLU Variants Improve Transformer", arXiv 2020.
[^5]: Dao et al., "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", NeurIPS 2022.
[^6]: DeepSeek AI, "DeepSeek-V3 Technical Report", arXiv 2024.
[^7]: Gu & Dao, "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", arXiv 2023.
[^8]: DeepSeek AI, "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model", arXiv 2024.
