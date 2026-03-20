---
tags:
  - concepto
  - fundamentos
  - llm
aliases:
  - datasets de entrenamiento
  - training data
  - datos de entrenamiento
  - corpus de entrenamiento
created: 2025-06-01
updated: 2025-06-01
category: fundamentos-ia
status: current
difficulty: intermediate
related:
  - "[[tokenizacion]]"
  - "[[transfer-learning]]"
  - "[[metricas-evaluacion-ia]]"
  - "[[embeddings]]"
  - "[[datasets-entrenamiento]]"
  - "[[bias-en-llms]]"
  - "[[impacto-ambiental-ia]]"
  - "[[eu-ai-act-completo]]"
up: "[[moc-fundamentos]]"
---

# Datasets de Entrenamiento

> [!abstract] Resumen
> Los datasets de entrenamiento son el combustible que alimenta los modelos de IA modernos. ==La calidad de un LLM está determinada en un 80% por sus datos de entrenamiento y solo un 20% por su arquitectura==, según el consenso creciente en la comunidad de investigación. Desde *Common Crawl* (petabytes de web cruda) hasta datasets curados como *FineWeb* y *DCLM*, la industria ha pasado de "más datos es mejor" a "mejores datos es mejor". Este documento cubre los principales datasets, técnicas de curación, debates legales y éticos, y la escala de datos que consumen los modelos actuales. ^resumen

## Qué es y por qué importa

Los **datasets de entrenamiento** (*training datasets*) son las colecciones masivas de datos que se usan para entrenar modelos de IA durante la fase de [[transfer-learning#pre-training|pre-entrenamiento]]. Para los LLMs, esto consiste principalmente en texto: páginas web, libros, código, artículos científicos, conversaciones y más.

El problema fundamental: ==un modelo solo puede aprender lo que está en sus datos==. Datos de baja calidad producen modelos de baja calidad, sin importar cuánta computación se use. Esto se conoce como *"garbage in, garbage out"* a escala de terabytes.

> [!tip] Por qué deberías entender los datos de entrenamiento
> - **Sesgo**: los sesgos en los datos se transfieren directamente al modelo. Ver [[bias-en-llms]]
> - **Capacidad**: el conocimiento del modelo está limitado por lo que vio durante el entrenamiento
> - **Legalidad**: el uso de datos protegidos por copyright tiene implicaciones legales crecientes. Ver [[eu-ai-act-completo]]
> - **Evaluación**: conocer los datos ayuda a entender las fortalezas y debilidades del modelo
> - **Contaminación**: si los datos de evaluación están en el entrenamiento, las métricas son inválidas. Ver [[metricas-evaluacion-ia]]

---

## Principales datasets

### Common Crawl

*Common Crawl* es la fuente de datos más importante para LLMs. Es un archivo público de la web mantenido desde 2007.

| Aspecto | Detalle |
|---|---|
| **Tamaño** | ==~250 mil millones de páginas web, ~petabytes de datos brutos== |
| **Actualización** | Mensual (un nuevo crawl cada mes) |
| **Formato** | WARC (Web ARChive), WET (texto extraído), WAT (metadatos) |
| **Coste** | Gratuito, alojado en AWS Open Data |
| **Problema principal** | Calidad muy variable: spam, contenido duplicado, texto tóxico, datos personales |

> [!warning] Common Crawl no se usa directamente
> ==Ningún modelo moderno entrena directamente sobre Common Crawl crudo==. Todos aplican pipelines extensos de filtrado y curación. La diferencia entre modelos frecuentemente está en la calidad de este pipeline, no en la arquitectura del modelo. ^cc-no-directo

### The Pile

*The Pile* (Gao et al., 2020)[^1] fue creado por EleutherAI como un dataset diverso y curado de 825GB.

**Composición:**

| Componente | Tamaño | Contenido |
|---|---|---|
| Pile-CC | 227GB | Common Crawl filtrado |
| PubMed Central | 90GB | Artículos biomédicos |
| Books3 | 101GB | Libros (==controversial por copyright==) |
| OpenWebText2 | 62GB | Reddit links con upvotes |
| ArXiv | 56GB | Papers científicos |
| GitHub | 95GB | Código fuente |
| FreeLaw | 51GB | Documentos legales |
| Stack Exchange | 32GB | Preguntas y respuestas |
| Wikipedia | 16GB | Enciclopedia |
| USPTO | 22GB | Patentes |
| Otros (13 fuentes) | 73GB | Diversas |

> [!info] Impacto de The Pile
> The Pile estableció el estándar de documentar públicamente la composición de datasets. Modelos como GPT-NeoX, Pythia y la familia EleutherAI se entrenaron con él. Sin embargo, ==la inclusión de Books3 generó demandas legales que llevaron a su retiro parcial==.

### RedPajama

*RedPajama* (Together AI, 2023) fue un esfuerzo por replicar el dataset de entrenamiento de LLaMA de forma abierta.

| Versión | Tamaño | Tokens | Nota |
|---|---|---|---|
| RedPajama v1 | 5TB | ~1.2T tokens | Réplica del mix de LLaMA |
| RedPajama v2 | 30TB | ~30T tokens | Dataset masivo con señales de calidad |

RedPajama v2 no es un dataset pre-filtrado sino un ==dataset crudo con anotaciones de calidad que permiten al usuario aplicar sus propios filtros==.

### ROOTS

*ROOTS* (Responsible Open-science Open-collaboration Text Sources) fue creado por BigScience para entrenar BLOOM[^2].

- **Tamaño**: 1.6TB de texto
- **Idiomas**: ==46 idiomas naturales y 13 lenguajes de programación==
- **Diferenciador**: ==fuerte énfasis en diversidad lingüística y consentimiento de los creadores de datos==
- **Gobernanza**: proceso participativo con cientos de investigadores de todo el mundo
- **Limitación**: el proceso participativo hizo que el dataset fuera más pequeño y menos optimizado que alternativas

### FineWeb

*FineWeb* (HuggingFace, 2024)[^3] representa el estado del arte en curación de datos web.

| Aspecto | Detalle |
|---|---|
| **Tamaño** | ==15 billones (trillion) de tokens== |
| **Fuente** | 96 dumps de Common Crawl (2013-2024) |
| **Calidad** | Pipeline de filtrado agresivo y documentado |
| **Variante** | FineWeb-Edu: 1.3T tokens de contenido educativo |
| **Impacto** | Modelos entrenados en FineWeb superan a los entrenados en The Pile o C4 |

> [!success] FineWeb-Edu: la calidad sobre la cantidad
> FineWeb-Edu es un subconjunto de ~1.3T tokens clasificados como "educativos" por un modelo de scoring. ==Modelos entrenados solo en FineWeb-Edu (1.3T) superan en benchmarks a modelos entrenados en FineWeb completo (15T)==, demostrando que la calidad importa más que la cantidad. ^fineweb-edu-insight

### DCLM (DataComp for Language Models)

*DCLM* (2024)[^4] tomó un enfoque competitivo: proporcionar un pool crudo de datos y dejar que los participantes compitan para crear el mejor pipeline de filtrado.

- **Pool**: 240T tokens de Common Crawl
- **Resultado**: DCLM-Baseline (3.8T tokens filtrados) que produce modelos superiores a los de RedPajama y The Pile
- **Innovación**: ==demostró formalmente que el pipeline de filtrado es más importante que la fuente de datos==

---

## Comparativa de datasets principales

| Dataset | Tokens | Abierto | Multilingüe | Curación | Uso principal |
|---|---|---|---|---|---|
| Common Crawl (crudo) | ~1,000T+ | Si | Sí | Ninguna | Fuente base |
| The Pile | ~300B | Sí* | Principalmente inglés | Media | GPT-NeoX, Pythia |
| RedPajama v1 | ~1.2T | Sí | Principalmente inglés | Media | Open LLaMA |
| RedPajama v2 | ~30T | Sí | Multilingüe | Con señales | Flexible |
| ROOTS | ~340B | Sí | ==46 idiomas== | Alta (participativa) | BLOOM |
| FineWeb | ==15T== | Sí | Principalmente inglés | Muy alta | Estado del arte |
| FineWeb-Edu | 1.3T | Sí | Principalmente inglés | ==Máxima== | Mejor calidad/token |
| DCLM-Baseline | 3.8T | Sí | Principalmente inglés | Muy alta | Benchmark de datos |
| Dolma | 3T | Sí | Principalmente inglés | Alta | OLMo |
| StarCoder Data | ~250B | Sí | N/A (código) | Alta | Modelos de código |

^tabla-datasets

> [!warning] Datasets propietarios
> Los modelos más capaces (GPT-4, Claude, Gemini) ==usan datasets propietarios que no están documentados públicamente==. Se estima que incluyen datos licenciados de editores, bases de datos académicas, y posiblemente datos generados sintéticamente. Esta opacidad dificulta la evaluación de sesgos y la verificación de cumplimiento legal.

---

## Calidad vs. cantidad: el gran debate

### La era del "más es mejor" (2020-2023)

Las *scaling laws* de Kaplan et al. (2020)[^5] y las leyes de Chinchilla (Hoffmann et al., 2022)[^6] establecieron relaciones matemáticas entre tamaño de modelo, cantidad de datos y rendimiento:

- **Kaplan**: para un presupuesto de computación fijo, escalar el modelo es más eficiente que escalar los datos
- **Chinchilla**: ==para un presupuesto fijo, modelo y datos deben escalarse proporcionalmente== (un modelo de 70B parámetros necesita ~1.4T tokens)

> [!example]- Ver escala de datos por modelo
> ```mermaid
> flowchart LR
>     subgraph 2020["2020"]
>         GPT3["GPT-3<br/>175B params<br/>300B tokens"]
>     end
>
>     subgraph 2022["2022"]
>         CH["Chinchilla<br/>70B params<br/>1.4T tokens"]
>         LL1["LLaMA 1<br/>65B params<br/>1.4T tokens"]
>     end
>
>     subgraph 2023["2023"]
>         LL2["LLaMA 2<br/>70B params<br/>2T tokens"]
>         MI["Mistral 7B<br/>7B params<br/>~8T tokens"]
>     end
>
>     subgraph 2024["2024"]
>         LL3["LLaMA 3<br/>70B params<br/>15T tokens"]
>         DS["DeepSeek V3<br/>671B MoE<br/>14.8T tokens"]
>     end
>
>     GPT3 --> CH --> LL2 --> LL3
>     CH --> LL1 --> MI --> DS
> ```

### La era de "mejor es mejor" (2024-presente)

Investigaciones recientes han demostrado que ==la calidad de los datos puede compensar la cantidad==:

| Hallazgo | Implicación |
|---|---|
| FineWeb-Edu (1.3T) supera a FineWeb (15T) | La curación agresiva vale más que 10x más datos |
| Phi-1.5 (1.3B params) con datos sintéticos compite con modelos 10x más grandes | Datos sintéticos de alta calidad son transformadores |
| DCLM muestra que el pipeline de filtrado es más importante que la fuente | Invertir en curación es más rentable que recoger más datos |
| LLaMA 3 entrena modelos pequeños (8B) con 15T tokens (180x chinchilla-optimal) | ==Sobre-entrenar modelos pequeños con datos de calidad es viable== |

> [!question] Debate abierto: ¿estamos llegando al "data wall"?
> - **Posición A (sí hay muro)**: ya hemos usado la mayoría de texto de calidad disponible en internet. Escalar más datos requiere datos sintéticos — defendida por Epoch AI, Villalobos et al.
> - **Posición B (no hay muro)**: los datos multimodales (video, audio, imágenes), datos sintéticos, y nuevas fuentes de datos permiten seguir escalando — defendida por Meta, Google
> - **Posición C (el muro es irrelevante)**: la mejora en calidad de datos compensa la falta de datos nuevos — defendida por HuggingFace, Microsoft (Phi)
> Mi valoración: ==el data wall para texto en inglés es real (~300T tokens únicos de alta calidad estimados disponibles), pero los datos sintéticos y multimodales lo mitigan significativamente==. ^data-wall

---

## Generación de datos sintéticos

*Synthetic data* es texto generado por modelos de IA para entrenar otros modelos. Se ha convertido en una técnica fundamental:

### Técnicas principales

| Técnica | Descripción | Ejemplo |
|---|---|---|
| **Self-instruct** | Un LLM genera pares instrucción-respuesta | Alpaca, WizardLM |
| **Evol-Instruct** | Evolucionar instrucciones simples a complejas iterativamente | WizardLM, WizardCoder |
| **Distillation** | Un modelo fuerte genera datos para entrenar uno más pequeño | ==Orca, Phi, Alpaca== |
| **Back-translation** | Generar preguntas a partir de respuestas/documentos | RAG fine-tuning |
| **Constitutional AI** | El modelo genera y auto-critica sus respuestas | Claude (Anthropic) |
| **Rejection sampling** | Generar muchas respuestas, quedarse con las mejores | DeepSeek, LLaMA 3 |

> [!danger] Riesgos de datos sintéticos
> - **Model collapse**: ==entrenar recursivamente con datos sintéticos degrada la calidad generación tras generación==[^7]. Las distribuciones se estrechan y las colas (datos raros pero importantes) desaparecen.
> - **Amplificación de sesgos**: los sesgos del modelo generador se amplifican en el modelo entrenado
> - **Homogeneización**: todos los modelos empiezan a "sonar igual" si se entrenan con datos del mismo modelo
> - **Alucinaciones heredadas**: errores factuales del generador se fosilizan en el modelo entrenado

> [!tip] Buenas prácticas para datos sintéticos
> 1. Mezclar datos sintéticos con datos reales (proporción típica: 20-50% sintéticos)
> 2. Usar múltiples modelos generadores para diversidad
> 3. Verificar factualmente una muestra de los datos generados
> 4. Monitorizar métricas de diversidad en el dataset resultante
> 5. Nunca entrenar recursivamente con datos del mismo modelo

---

## Pipelines de curación de datos

Un pipeline de curación moderno para datos web incluye las siguientes etapas:

> [!example]- Ver diagrama de pipeline de curación
> ```mermaid
> flowchart TD
>     A["Common Crawl<br/>(petabytes)"] --> B["Extracción de texto<br/>(trafilatura, resiliparse)"]
>     B --> C["Filtrado de idioma<br/>(fasttext, CLD3)"]
>     C --> D["Deduplicación<br/>(MinHash, exact)"]
>     D --> E["Filtrado de calidad<br/>(heurísticas + clasificador)"]
>     E --> F["Filtrado de contenido<br/>(tóxico, NSFW, PII)"]
>     F --> G["Decontaminación<br/>(contra benchmarks)"]
>     G --> H["Mezcla de dominios<br/>(web, libro, código, ciencia)"]
>     H --> I["Dataset final<br/>(tokens)"]
>
>     style D fill:#f90,stroke:#333
>     style E fill:#f90,stroke:#333
>     style G fill:#f90,stroke:#333
>
>     J["Etapas críticas<br/>(mayor impacto)"] -.-> D
>     J -.-> E
>     J -.-> G
> ```

### Etapas en detalle

#### 1. Extracción de texto

Convertir HTML crudo en texto limpio. Herramientas como `trafilatura` y `resiliparse` extraen el contenido principal eliminando menús, headers, ads, y boilerplate.

#### 2. Filtrado de idioma

Clasificar el idioma de cada documento. Modelos como `fasttext-lid` detectan idiomas con >98% accuracy. Se aplican umbrales de confianza para eliminar textos mixtos o mal clasificados.

#### 3. Deduplicación

==La deduplicación es una de las etapas con mayor impacto en la calidad del modelo==. Tipos:

| Tipo | Método | Qué elimina |
|---|---|---|
| **Exacta** | Hashing (SHA-256) | Documentos idénticos |
| **Near-duplicate** | MinHash + LSH | Documentos casi idénticos (>80% similitud) |
| **Línea/párrafo** | Hashing por línea | Texto repetitivo dentro de documentos |
| **URL-level** | Dedup por URL normalizada | Misma página crawleada múltiples veces |

> [!info] Impacto cuantitativo de la deduplicación
> Lee et al. (2022)[^8] mostraron que ==la deduplicación puede eliminar 40-60% del dataset pero mejora la perplejidad del modelo entrenado==. Además, reduce significativamente la memorización de textos específicos (relevante para privacidad).

#### 4. Filtrado de calidad

Heurísticas comunes:
- Proporción de caracteres alfanuméricos (>80%)
- Longitud mínima del documento (>100 palabras)
- Proporción de líneas que terminan en puntuación (>50%)
- Densidad de stopwords (indicador de texto natural vs. generado)
- ==Clasificador de calidad entrenado en texto de alta calidad== (Wikipedia, libros editados) vs. baja calidad (spam, texto auto-generado)

#### 5. Filtrado de contenido

- Detección de contenido tóxico (clasificadores de toxicidad)
- Detección de contenido NSFW
- Detección y remoción de PII (*Personally Identifiable Information*): emails, teléfonos, direcciones, números de identificación
- Detección de contenido generado por IA (cada vez más relevante)

#### 6. Decontaminación (*decontamination*)

==Eliminar del dataset de entrenamiento cualquier texto que aparezca en benchmarks de evaluación== ([[metricas-evaluacion-ia]]). Si un modelo ha "visto" las preguntas de MMLU durante el entrenamiento, su puntuación en MMLU no refleja capacidad real.

Técnicas:
- N-gram overlap con datasets de evaluación
- Matching exacto y fuzzy de preguntas y respuestas
- Timestamp filtering (excluir datos posteriores a la creación del benchmark)

---

## Escala: cuántos datos usan los LLMs modernos

| Modelo | Tokens de entrenamiento | Estimación en texto equivalente |
|---|---|---|
| GPT-2 (2019) | 10B | ~40GB de texto |
| GPT-3 (2020) | 300B | ~570GB de texto |
| Chinchilla (2022) | 1.4T | ~2.7TB de texto |
| LLaMA 1 (2023) | 1.4T | ~2.7TB de texto |
| LLaMA 2 (2023) | 2T | ~3.8TB de texto |
| Mistral 7B (2023) | ~8T (estimado) | ~15TB de texto |
| LLaMA 3 (2024) | ==15T== | ~28TB de texto |
| GPT-4 (2023) | ==~13T (estimado)== | ~25TB de texto |
| DeepSeek V3 (2024) | 14.8T | ~28TB de texto |
| Gemini 1.5 (2024) | No publicado | Estimado >15T |

^escala-datos

> [!info] Perspectiva de escala
> ==15 billones (trillion) de tokens equivalen aproximadamente a 11 millones de libros o leer toda Wikipedia 200 veces==. Para contextualizar, una persona promedio lee ~1,000 libros en toda su vida. Un LLM moderno consume el equivalente a 11,000 vidas de lectura durante su entrenamiento.

---

## Cuestiones legales y éticas

### El debate del copyright

> [!danger] Litigios activos
> Múltiples demandas activas que podrían redefinir el uso de datos:
>
> | Caso | Demandante | Demandado | Estado (2025) |
> |---|---|---|---|
> | Getty Images v. Stability AI | Getty Images | Stability AI | En proceso |
> | NYT v. OpenAI | The New York Times | OpenAI, Microsoft | ==Caso emblemático, en proceso== |
> | Authors Guild v. OpenAI | Miles de autores | OpenAI | En proceso |
> | Concord Music v. Anthropic | Editores musicales | Anthropic | En proceso |
> | ANI v. OpenAI | Agencia de noticias india | OpenAI | En proceso |

### Posiciones en el debate

> [!question] Debate abierto: ¿el entrenamiento de IA es fair use?
> - **Posición A (fair use)**: el entrenamiento es transformativo y no sustituye el mercado de las obras originales — defendida por OpenAI, Google, Meta
> - **Posición B (infracción)**: los modelos memorizan y regurgitan contenido protegido, y los datos de entrenamiento son una necesidad comercial que debe licenciarse — defendida por NYT, Authors Guild, editores
> - **Posición C (nuevo marco legal)**: el copyright fue diseñado para la era pre-IA y necesita legislación nueva específica — defendida por varios académicos y la UE con el AI Act
> Mi valoración: ==es probable que los tribunales establezcan un marco intermedio: entrenamiento general como fair use pero con obligaciones de atribución y compensación para uso extensivo de fuentes específicas==.

### Impacto del EU AI Act

La [[eu-ai-act-completo|Ley de IA de la UE]] establece requisitos específicos para datos de entrenamiento:

- **Transparencia**: obligación de documentar los datos de entrenamiento usados
- **Copyright**: respetar las reservas de derechos de los titulares de contenido (opt-out de text and data mining)
- **Datos personales**: cumplimiento con GDPR para PII en datos de entrenamiento
- **Sesgo**: evaluación y mitigación de sesgos en los datos

### Cuestiones éticas

> [!warning] Problemas éticos documentados
> - **Labor exploitation**: ==el etiquetado de datos para RLHF frecuentemente se realiza por trabajadores en países en desarrollo por menos de $2/hora==[^9]
> - **Representación desigual**: internet está dominada por contenido en inglés y perspectivas occidentales, creando sesgos sistémicos
> - **Consentimiento**: la mayoría de creadores de contenido no consintieron que su trabajo se usara para entrenamiento de IA
> - **Impacto ambiental**: el entrenamiento consume enormes cantidades de energía. Ver [[impacto-ambiental-ia]]

---

## Ventajas y limitaciones

> [!success] Avances positivos en el ecosistema de datos
> - Datasets abiertos y documentados (FineWeb, DCLM, Dolma) democratizan la investigación
> - Técnicas de curación cada vez más sofisticadas y reproducibles
> - Mayor conciencia sobre calidad vs. cantidad
> - Herramientas open-source para procesamiento de datos (datatrove, dolma-toolkit)
> - Datos sintéticos como multiplicador de datos escasos

> [!failure] Limitaciones persistentes
> - ==Los datasets más grandes y de mayor calidad siguen siendo propietarios==
> - La evaluación de calidad de datos a escala sigue siendo un problema abierto
> - La decontaminación perfecta es técnicamente imposible (reformulaciones, traducciones)
> - El sesgo lingüístico favorece enormemente al inglés
> - La brecha entre datasets abiertos y propietarios puede estar creciendo

---

## Estado del arte (2025-2026)

Tendencias clave:

1. **Data curation as the moat**: la curación de datos se está convirtiendo en la ventaja competitiva principal de los labs de IA
2. **Datos multimodales**: expansión masiva hacia video, audio, imágenes alineadas con texto
3. **Datos sintéticos de segunda generación**: técnicas sofisticadas que evitan model collapse
4. **Licensing deals**: acuerdos multimillonarios entre labs de IA y editores (OpenAI-AP, Google-Reddit)
5. **Datos especializados**: curación de datos específicos por dominio (código, ciencia, medicina, legal)
6. **Annotation at scale**: plataformas como Scale AI y Surge AI profesionalizan el etiquetado

> [!info] El futuro de los datos
> ==La tendencia más clara es que los datos se están convirtiendo en el recurso más valioso de la industria de IA, superando incluso a la computación==. Organizaciones que construyen y mantienen datasets de alta calidad tendrán ventaja competitiva duradera.

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake debe considerar la calidad de los datos que procesa; los mismos principios de curación aplican a los documentos ingeridos para RAG (filtrado, deduplicación, scoring de calidad)
> - **[[architect-overview|architect]]**: architect puede generar código entrenado en datasets de código (StarCoder Data, The Stack); comprender la composición de estos datasets ayuda a entender las fortalezas y limitaciones del código generado
> - **[[vigil-overview|vigil]]**: vigil debe auditar que los datos usados para entrenar o fine-tunear modelos no contengan contenido tóxico, PII o datos contaminados; los pipelines de curación son referencia para las verificaciones de vigil
> - **[[licit-overview|licit]]**: licit necesita verificar las licencias de los datasets usados, especialmente la conformidad con el EU AI Act y los requisitos de transparencia sobre datos de entrenamiento

---

## Enlaces y referencias

**Notas relacionadas:**
- [[tokenizacion]] — Los datos se procesan a través del tokenizador antes del entrenamiento
- [[transfer-learning]] — Los datos alimentan la fase de pre-training
- [[metricas-evaluacion-ia]] — La decontaminación de benchmarks es crítica
- [[bias-en-llms]] — Los sesgos en datos producen sesgos en modelos
- [[eu-ai-act-completo]] — Regulación sobre transparencia de datos de entrenamiento
- [[impacto-ambiental-ia]] — Coste ambiental del procesamiento masivo de datos
- [[embeddings]] — La calidad de los embeddings depende de la calidad de los datos de pre-training

> [!quote]- Referencias bibliográficas
> - Gao, L. et al. "The Pile: An 800GB Dataset of Diverse Text for Language Modeling", arXiv 2020
> - Laurençon, H. et al. "The BigScience ROOTS Corpus", NeurIPS Datasets 2022
> - Penedo, G. et al. "The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale", HuggingFace 2024
> - Li, R. et al. "DataComp-LM: In search of the next generation of training data for language models", arXiv 2024
> - Kaplan, J. et al. "Scaling Laws for Neural Language Models", arXiv 2020
> - Hoffmann, J. et al. "Training Compute-Optimal Large Language Models" (Chinchilla), arXiv 2022
> - Shumailov, I. et al. "The Curse of Recursion: Training on Generated Data Makes Models Forget", arXiv 2023
> - Lee, K. et al. "Deduplicating Training Data Makes Language Models Better", ACL 2022
> - Perrigo, B. "OpenAI Used Kenyan Workers on Less Than $2 Per Hour", TIME 2023
> - New York Times v. Microsoft Corp. & OpenAI, U.S. District Court SDNY, 2023

[^1]: Gao et al., "The Pile: An 800GB Dataset of Diverse Text for Language Modeling", 2020. Dataset fundacional open-source.
[^2]: Laurençon et al., "The BigScience ROOTS Corpus", NeurIPS 2022. Dataset multilingüe participativo para BLOOM.
[^3]: Penedo et al., "The FineWeb Datasets", HuggingFace 2024. Estado del arte en curación de datos web.
[^4]: Li et al., "DataComp-LM", 2024. Benchmark competitivo para pipelines de datos.
[^5]: Kaplan et al., "Scaling Laws for Neural Language Models", 2020. Primeras scaling laws.
[^6]: Hoffmann et al., "Training Compute-Optimal Large Language Models", 2022. Leyes de Chinchilla.
[^7]: Shumailov et al., "The Curse of Recursion: Training on Generated Data Makes Models Forget", 2023. Demostró model collapse con datos sintéticos recursivos.
[^8]: Lee et al., "Deduplicating Training Data Makes Language Models Better", ACL 2022. Impacto de la deduplicación.
[^9]: Perrigo, B., "OpenAI Used Kenyan Workers on Less Than $2 Per Hour", TIME Magazine, Jan 2023. Expuso las condiciones de los etiquetadores de datos.
