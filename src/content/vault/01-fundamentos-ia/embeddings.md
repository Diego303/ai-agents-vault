---
tags:
  - concepto
  - fundamentos
  - embeddings
  - rag
aliases:
  - embedding
  - embeddings vectoriales
  - representaciones vectoriales
  - vector embeddings
created: 2025-06-01
updated: 2025-06-01
category: fundamentos-ia
status: evergreen
difficulty: intermediate
related:
  - "[[tokenizacion]]"
  - "[[transformer-architecture]]"
  - "[[vector-databases]]"
  - "[[chunking-strategies]]"
  - "[[pattern-rag]]"
  - "[[metricas-evaluacion-ia]]"
  - "[[transfer-learning]]"
up: "[[moc-fundamentos]]"
---

# Embeddings

> [!abstract] Resumen
> Los *embeddings* son representaciones vectoriales densas que capturan el significado semántico de texto, imágenes u otros datos en un espacio de alta dimensionalidad. ==Son la piedra angular de los sistemas RAG modernos, la búsqueda semántica y la recuperación de información==. Desde *Word2Vec* hasta los modelos de embedding actuales como `text-embedding-3-large` de OpenAI o `bge-m3` de BAAI, esta tecnología ha evolucionado desde representaciones estáticas por palabra hasta embeddings contextuales que capturan matices semánticos complejos. ^resumen

## Qué es y por qué importa

Un **embedding** es una función que mapea datos discretos (palabras, oraciones, documentos, imágenes) a vectores continuos de dimensión fija en un espacio donde ==la proximidad geométrica refleja similitud semántica==.

Formalmente: $f: \text{Input} \rightarrow \mathbb{R}^d$ donde $d$ es la dimensionalidad del embedding.

El problema que resuelve: las computadoras no entienden el significado de las palabras. "rey" y "monarca" son cadenas de caracteres completamente distintas, pero un buen modelo de embeddings las colocará cerca en el espacio vectorial.

> [!tip] Cuándo usar embeddings
> - **Usar cuando**: búsqueda semántica, [[pattern-rag|RAG]], clasificación de texto, clustering, detección de duplicados, sistemas de recomendación
> - **No usar cuando**: búsqueda exacta de keywords, matching de patrones regulares, datos altamente estructurados donde SQL es suficiente
> - Ver [[vector-databases]] para almacenar y consultar embeddings a escala

---

## Evolución histórica

### Era 1: Embeddings estáticos (2013-2017)

#### Word2Vec (2013)

*Word2Vec* (Mikolov et al., 2013)[^1] demostró que redes neuronales simples podían aprender representaciones semánticas ricas. Dos arquitecturas:

- **CBOW** (*Continuous Bag of Words*): predice una palabra dado su contexto
- **Skip-gram**: predice el contexto dada una palabra

==El hallazgo revolucionario==: las relaciones semánticas se codifican como operaciones vectoriales.

`vector("rey") - vector("hombre") + vector("mujer") ≈ vector("reina")` ^analogia-word2vec

> [!example]- Ver diagrama de arquitecturas Word2Vec
> ```mermaid
> flowchart LR
>     subgraph CBOW["CBOW"]
>         direction TB
>         C1["word(t-2)"] --> P1["Proyección"]
>         C2["word(t-1)"] --> P1
>         C3["word(t+1)"] --> P1
>         C4["word(t+2)"] --> P1
>         P1 --> O1["word(t)"]
>     end
>
>     subgraph SG["Skip-gram"]
>         direction TB
>         I["word(t)"] --> P2["Proyección"]
>         P2 --> O2["word(t-2)"]
>         P2 --> O3["word(t-1)"]
>         P2 --> O4["word(t+1)"]
>         P2 --> O5["word(t+2)"]
>     end
> ```

**Limitación fundamental**: ==cada palabra tiene un único vector sin importar el contexto==. "banco" (financiero) y "banco" (para sentarse) tienen la misma representación.

#### GloVe (2014)

*GloVe* (*Global Vectors for Word Representation*, Pennington et al., 2014)[^2] combina las estadísticas globales de co-ocurrencia del corpus con el aprendizaje local de Word2Vec. Construye una matriz de co-ocurrencia palabra-palabra y factoriza para obtener los vectores.

| Aspecto | Word2Vec | GloVe |
|---|---|---|
| Enfoque | Predictivo (red neuronal) | Estadístico (factorización) |
| Información | Contexto local (ventana) | Co-ocurrencia global |
| Entrenamiento | Online (batch por batch) | Sobre matriz completa |
| Rendimiento | Similar | Similar (ligera ventaja en analogías) |
| Velocidad | Más rápido en corpus pequeños | Más rápido en corpus grandes |

### Era 2: Embeddings contextuales (2018-2021)

La llegada de [[transformer-architecture|los Transformers]] cambió el paradigma radicalmente. En lugar de un vector fijo por palabra, ==cada ocurrencia de una palabra recibe un vector diferente según su contexto==.

#### ELMo (2018)

*ELMo* (*Embeddings from Language Models*)[^3] fue el puente entre las eras. Usaba LSTMs bidireccionales para generar embeddings contextuales, pero no tenía la capacidad de atención de los Transformers.

#### BERT (2018)

*BERT* (*Bidirectional Encoder Representations from Transformers*)[^4] introdujo embeddings contextuales basados en Transformers. ==El token `[CLS]` se convirtió en la primera aproximación popular a embeddings de oración==, aunque no fue diseñado específicamente para esta tarea.

#### Sentence-BERT (2019)

*Sentence-BERT* (Reimers & Gurevych, 2019)[^5] resolvió la limitación de BERT para comparar oraciones. Usando redes siamesas con BERT, produjo ==embeddings de oración que podían compararse directamente con similitud coseno, siendo 65x más rápido que BERT para búsqueda de similitud==.

### Era 3: Modelos de embedding especializados (2022-presente)

> [!example]- Ver evolución temporal
> ```mermaid
> timeline
>     title Evolución de los Embeddings
>     2013 : Word2Vec
>          : GloVe
>     2018 : ELMo
>          : BERT
>     2019 : Sentence-BERT
>     2022 : text-embedding-ada-002 (OpenAI)
>          : Instructor
>     2023 : bge (BAAI)
>          : e5-mistral
>          : Jina v2
>          : Voyage AI
>          : Nomic Embed
>     2024 : text-embedding-3 (OpenAI)
>          : Cohere Embed v3
>          : bge-m3 (multilingüe)
>          : Jina v3
>          : Voyage 3
>     2025 : Modelos Matryoshka
>          : Late interaction masivo
> ```

---

## Modelos de embedding modernos

### Comparativa de modelos actuales

| Modelo | Proveedor | Dims | Max tokens | MTEB Avg | Multilingüe | Coste/1M tokens |
|---|---|---|---|---|---|---|
| `text-embedding-3-large` | OpenAI | 3072 | 8,191 | 64.6 | Parcial | $0.13 |
| `text-embedding-3-small` | OpenAI | 1536 | 8,191 | 62.3 | Parcial | $0.02 |
| `embed-v4` | Cohere | 1024 | 512 | 66.3 | ==100+ idiomas== | $0.10 |
| `voyage-3-large` | Voyage AI | 1024 | 32,000 | 67.2 | Sí | $0.18 |
| `voyage-3-lite` | Voyage AI | 512 | 32,000 | 62.5 | Sí | $0.02 |
| `jina-embeddings-v3` | Jina AI | 1024 | 8,192 | 65.5 | 89 idiomas | $0.02 |
| `bge-m3` | BAAI | 1024 | 8,192 | 66.1 | ==100+ idiomas== | Gratis (OSS) |
| `nomic-embed-text-v1.5` | Nomic | 768 | 8,192 | 62.2 | Inglés | Gratis (OSS) |
| `mxbai-embed-large-v1` | Mixedbread | 1024 | 512 | 64.7 | Inglés | Gratis (OSS) |
| `gte-Qwen2-7B-instruct` | Alibaba | 3584 | 131,072 | 70.2 | Multilingüe | Gratis (OSS) |

^tabla-modelos-embedding

> [!warning] Los benchmarks no cuentan toda la historia
> ==El rendimiento en MTEB no siempre se traduce directamente a tu caso de uso específico==. Un modelo con menor puntuación promedio puede superar al líder en tu dominio concreto. Siempre evalúa con datos propios. Ver [[metricas-evaluacion-ia]] para frameworks de evaluación.

### Detalles de modelos clave

> [!info] OpenAI text-embedding-3
> La familia `text-embedding-3` introdujo ==*Matryoshka Representation Learning* (MRL)==: los embeddings se pueden truncar a dimensiones menores (256, 512, 1024) sin reentrenar, con degradación gradual del rendimiento. Esto permite ajustar el trade-off entre calidad y coste de almacenamiento dinámicamente.

> [!info] BGE-M3: el modelo open-source multilingüe
> `bge-m3` de BAAI soporta tres modos de retrieval en un solo modelo:
> 1. **Dense retrieval**: embeddings densos clásicos
> 2. **Sparse retrieval**: similar a BM25 aprendido
> 3. **Multi-vector retrieval**: ColBERT-style late interaction
>
> ==Soporta 100+ idiomas con contextos de hasta 8,192 tokens, completamente gratuito y open-source==.

---

## MTEB Benchmark: cómo elegir un modelo

El *Massive Text Embedding Benchmark* (MTEB)[^6] es el estándar de facto para evaluar modelos de embedding. Evalúa en múltiples tareas:

| Tarea MTEB | Qué mide | Relevancia para RAG |
|---|---|---|
| **Retrieval** | Búsqueda de documentos relevantes | ==Directamente aplicable== |
| **STS** (*Semantic Textual Similarity*) | Similitud entre pares de oraciones | Alta |
| **Classification** | Clasificación de texto | Media |
| **Clustering** | Agrupación semántica | Media-Alta |
| **Reranking** | Reordenamiento de resultados | Alta |
| **Pair Classification** | Detección de paráfrasis, entailment | Baja |
| **Summarization** | Evaluación de resúmenes | Baja |

> [!tip] Criterios prácticos de selección
> Para elegir un modelo de embedding para [[pattern-rag|RAG]], prioriza en este orden:
> 1. **Rendimiento en Retrieval** en MTEB (no el promedio general)
> 2. **Soporte de idioma**: si necesitas español, evalúa en datos en español
> 3. **Longitud de contexto**: ¿tus chunks superan 512 tokens? Necesitas modelos con contexto largo
> 4. **Latencia y coste**: ¿cuántas queries/segundo necesitas?
> 5. **Privacidad**: ¿puedes enviar datos a una API externa? Si no, usa modelos open-source

---

## Métricas de similitud

Las tres métricas principales para comparar embeddings:

### Similitud coseno

$$\text{cosine}(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}| \cdot |\mathbf{b}|}$$

- Rango: [-1, 1] (1 = idénticos, 0 = ortogonales, -1 = opuestos)
- ==La más utilizada para embeddings de texto==
- Invariante a la magnitud del vector (solo mide dirección)

### Producto punto (*dot product*)

$$\text{dot}(\mathbf{a}, \mathbf{b}) = \mathbf{a} \cdot \mathbf{b} = \sum_{i=1}^{d} a_i \cdot b_i$$

- Rango: $(-\infty, +\infty)$
- Sensible a la magnitud (vectores más largos = puntuación más alta)
- Usado cuando la magnitud del vector codifica información relevante (e.g., importancia)
- ==Más rápido de calcular que coseno== (no requiere normalización)

### Distancia euclidiana

$$\text{euclidean}(\mathbf{a}, \mathbf{b}) = \sqrt{\sum_{i=1}^{d} (a_i - b_i)^2}$$

- Rango: $[0, +\infty)$ (0 = idénticos)
- Sensible a la magnitud
- Menos común para embeddings de texto, más usado en visión

> [!warning] Compatibilidad métrica-modelo
> ==Cada modelo de embedding está entrenado con una métrica específica==. Usar la métrica incorrecta puede degradar severamente el rendimiento:
> - OpenAI `text-embedding-3-*`: coseno (los vectores se normalizan)
> - Cohere Embed v3: dot product
> - BGE-M3: coseno para dense, producto punto para sparse
>
> Verifica siempre la documentación del modelo antes de configurar tu [[vector-databases|base de datos vectorial]].

---

## Dimensionalidad: impacto y trade-offs

| Dimensiones | Almacenamiento/vector | Pros | Contras |
|---|---|---|---|
| 256 | 1 KB | Muy rápido, bajo coste | Puede perder matices |
| 512 | 2 KB | Buen balance | Estándar mínimo actual |
| 768 | 3 KB | Balance óptimo para muchas tareas | — |
| 1024 | 4 KB | Buen detalle semántico | — |
| 1536 | 6 KB | Alto detalle (OpenAI small) | Coste de almacenamiento |
| 3072 | 12 KB | Máximo detalle (OpenAI large) | ==3x almacenamiento vs 1024== |

> [!tip] Regla práctica para dimensionalidad
> Para la mayoría de aplicaciones RAG con menos de 10M documentos, ==768-1024 dimensiones son suficientes==. La diferencia entre 1024 y 3072 dimensiones raramente justifica el triplicar los costes de almacenamiento e indexación.

---

## Uso en pipelines RAG

> [!example]- Ver diagrama de embedding en pipeline RAG
> ```mermaid
> flowchart TD
>     subgraph Indexación["Fase de Indexación"]
>         D["Documentos"] --> CH["Chunking<br/>[[chunking-strategies]]"]
>         CH --> E["Modelo de<br/>Embedding"]
>         E --> V["Vectores<br/>(dim=1024)"]
>         V --> DB["Vector DB<br/>[[vector-databases]]"]
>     end
>
>     subgraph Query["Fase de Query"]
>         Q["Pregunta<br/>del usuario"] --> EQ["Mismo modelo<br/>de Embedding"]
>         EQ --> QV["Vector query"]
>         QV --> S["Búsqueda ANN<br/>(coseno/dot)"]
>         DB --> S
>         S --> R["Top-K chunks<br/>relevantes"]
>         R --> LLM["LLM genera<br/>respuesta"]
>         Q --> LLM
>     end
>
>     style E fill:#2d5,stroke:#333,stroke-width:2px
>     style EQ fill:#2d5,stroke:#333,stroke-width:2px
> ```

**Puntos críticos en el pipeline de embeddings para RAG:**

1. **Consistencia de modelo**: ==el mismo modelo debe usarse para indexar y para queries==. Mezclar modelos produce resultados incoherentes.
2. **Calidad del chunking**: embeddings de chunks mal segmentados degradan la retrieval. Ver [[chunking-strategies]].
3. **Query vs. documento**: algunos modelos (e.g., `e5-mistral`, `bge-m3`) usan prefijos diferentes para queries y documentos (`query:` vs `passage:`). Ignorar esto degrada significativamente el rendimiento.
4. **Normalización**: si usas coseno como métrica, normaliza los vectores al indexar para usar dot product (más rápido) en tiempo de query. ^rag-embeddings-tips

---

## Implementación práctica

> [!example]- Ver código: generar y comparar embeddings
> ```python
> # pip install openai numpy scipy
> import numpy as np
> from openai import OpenAI
> from scipy.spatial.distance import cosine
>
> client = OpenAI()
>
> def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
>     """Genera embedding para un texto usando la API de OpenAI."""
>     response = client.embeddings.create(
>         input=text,
>         model=model,
>     )
>     return response.data[0].embedding
>
> # Generar embeddings
> textos = [
>     "El gato duerme en el sofá",
>     "El felino descansa sobre el sillón",
>     "Python es un lenguaje de programación",
>     "La bolsa de valores cayó un 5% hoy",
> ]
>
> embeddings = [get_embedding(t) for t in textos]
>
> # Matriz de similitud
> print("Similitud coseno entre pares:")
> for i in range(len(textos)):
>     for j in range(i + 1, len(textos)):
>         sim = 1 - cosine(embeddings[i], embeddings[j])
>         print(f"  [{i}] vs [{j}]: {sim:.4f}")
>         print(f"    '{textos[i][:40]}...' vs '{textos[j][:40]}...'")
>
> # Resultado esperado: los textos 0 y 1 (gato/felino) tendrán
> # similitud alta (~0.85+), mientras que 0 vs 2 o 0 vs 3
> # tendrán similitud baja (~0.15-0.30)
> ```

> [!example]- Ver código: embeddings con modelo open-source local
> ```python
> # pip install sentence-transformers
> from sentence_transformers import SentenceTransformer
> import numpy as np
>
> # Cargar modelo open-source (descarga automática ~400MB)
> model = SentenceTransformer("BAAI/bge-m3")
>
> # Generar embeddings (ejecución local, sin API)
> sentences = [
>     "query: ¿Cómo funciona la tokenización en LLMs?",
>     "passage: La tokenización es el proceso de dividir texto en tokens",
>     "passage: Los transformers usan mecanismos de atención",
>     "passage: El café colombiano es reconocido mundialmente",
> ]
>
> embeddings = model.encode(sentences, normalize_embeddings=True)
>
> # Calcular similitudes de la query contra cada passage
> query_emb = embeddings[0]
> for i in range(1, len(sentences)):
>     # Con vectores normalizados, dot product = coseno
>     sim = np.dot(query_emb, embeddings[i])
>     print(f"Similitud con passage {i}: {sim:.4f}")
>     print(f"  {sentences[i][:60]}")
>
> # Dimensionalidad adaptativa (Matryoshka)
> embeddings_256 = model.encode(sentences, normalize_embeddings=True)
> # Truncar a 256 dimensiones
> embeddings_256_truncated = embeddings_256[:, :256]
> # Renormalizar después de truncar
> norms = np.linalg.norm(embeddings_256_truncated, axis=1, keepdims=True)
> embeddings_256_truncated = embeddings_256_truncated / norms
>
> print(f"\nDimensiones originales: {embeddings.shape[1]}")
> print(f"Dimensiones truncadas: {embeddings_256_truncated.shape[1]}")
> ```

---

## Ventajas y limitaciones

> [!success] Fortalezas
> - Capturan semántica: "automóvil" y "coche" quedan cerca en el espacio vectorial
> - Transferibles: embeddings pre-entrenados funcionan bien en dominios nuevos
> - Eficientes: una vez generados, las comparaciones son operaciones vectoriales rápidas
> - Multimodales: existen modelos que alinean texto e imágenes en el mismo espacio (CLIP)

> [!failure] Limitaciones
> - **Pérdida de información**: comprimir un párrafo en 1024 números inevitablemente pierde matices
> - **Sesgo heredado**: reflejan los sesgos presentes en los datos de entrenamiento
> - **Sensibilidad a la longitud**: la calidad degrada significativamente con textos muy largos (>512 tokens en muchos modelos)
> - **No composicionales**: el embedding de "no es bueno" no se comporta intuitivamente como la negación de "es bueno"
> - **Dominio específico**: ==embeddings entrenados en texto general pueden fallar en dominios técnicos especializados== (medicina, derecho, código)

> [!danger] Riesgo en producción
> Los embeddings pueden exponer información sensible. Técnicas de *embedding inversion* pueden reconstruir parcialmente el texto original a partir de su vector[^7]. No asumas que los embeddings son una forma de anonimización.

---

## Estado del arte (2025-2026)

> [!question] Debates abiertos
> **¿Embeddings densos vs. sparse vs. híbridos?**
> - **Dense only**: más simple, funciona bien en la mayoría de casos — defendida por OpenAI
> - **Hybrid (dense + sparse)**: mejor recall, especialmente para términos técnicos — defendida por Cohere, Pinecone
> - **Late interaction (ColBERT)**: mejor calidad pero mayor coste de almacenamiento — defendida por academia
> Mi valoración: ==para producción con datos en español, los modelos híbridos como bge-m3 ofrecen el mejor balance entre calidad y practicidad==.

Tendencias clave:
1. **Matryoshka embeddings**: dimensionalidad adaptativa como estándar
2. **Embeddings instruccionales**: modelos que ajustan su representación según la instrucción ("busca documentos sobre..." vs "clasifica este texto como...")
3. **Convergencia multimodal**: modelos que producen embeddings para texto, imagen, audio y código en el mismo espacio
4. **Quantización de embeddings**: reducir de float32 a int8 o binary con pérdida mínima, reduciendo 4-32x el almacenamiento

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake usa embeddings para la indexación semántica de documentos ingeridos, requiere selección cuidadosa del modelo de embedding según el idioma y dominio
> - **[[architect-overview|architect]]**: architect puede generar código para pipelines de embeddings, incluyendo configuración de modelos y bases vectoriales
> - **[[vigil-overview|vigil]]**: vigil debe monitorizar la calidad de los embeddings en producción (drift semántico, degradación por cambios de modelo)
> - **[[licit-overview|licit]]**: licit evalúa si los modelos de embedding usados cumplen con licencias y regulaciones de datos, especialmente relevante para modelos entrenados con datos protegidos

---

## Enlaces y referencias

**Notas relacionadas:**
- [[tokenizacion]] — Paso previo a la generación de embeddings
- [[vector-databases]] — Almacenamiento y consulta de embeddings a escala
- [[chunking-strategies]] — La calidad del chunking afecta directamente la calidad de los embeddings
- [[pattern-rag]] — Los embeddings son el corazón del patrón RAG
- [[transfer-learning]] — Los embeddings son una forma de transfer learning
- [[metricas-evaluacion-ia#benchmarks-embedding|métricas de evaluación]] — MTEB y otros benchmarks

> [!quote]- Referencias bibliográficas
> - Mikolov, T. et al. "Efficient Estimation of Word Representations in Vector Space", arXiv 2013
> - Pennington, J. et al. "GloVe: Global Vectors for Word Representation", EMNLP 2014
> - Peters, M. et al. "Deep contextualized word representations" (ELMo), NAACL 2018
> - Devlin, J. et al. "BERT: Pre-training of Deep Bidirectional Transformers", NAACL 2019
> - Reimers, N. & Gurevych, I. "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks", EMNLP 2019
> - Muennighoff, N. et al. "MTEB: Massive Text Embedding Benchmark", EACL 2023
> - OpenAI. "New embedding models and API updates", Blog 2024
> - Chen, J. et al. "BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity", arXiv 2024

[^1]: Mikolov et al., "Efficient Estimation of Word Representations in Vector Space", 2013. Paper fundacional de Word2Vec.
[^2]: Pennington et al., "GloVe: Global Vectors for Word Representation", EMNLP 2014.
[^3]: Peters et al., "Deep contextualized word representations", NAACL 2018. Introdujo ELMo.
[^4]: Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers", 2019. Revolucionó NLP con embeddings contextuales.
[^5]: Reimers & Gurevych, "Sentence-BERT", EMNLP 2019. Hizo prácticos los embeddings de oración.
[^6]: Muennighoff et al., "MTEB: Massive Text Embedding Benchmark", EACL 2023. Benchmark estándar de la industria.
[^7]: Morris et al., "Text Embeddings Reveal (Almost) As Much As Text", EMNLP 2023. Demostró riesgos de privacidad en embeddings.
