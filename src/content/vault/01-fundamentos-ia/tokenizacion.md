---
tags:
  - concepto
  - fundamentos
  - llm
aliases:
  - tokenización
  - tokenizer
  - tokenización LLM
  - BPE
created: 2025-06-01
updated: 2025-06-01
category: fundamentos-ia
status: evergreen
difficulty: intermediate
related:
  - "[[embeddings]]"
  - "[[transformer-architecture]]"
  - "[[context-window]]"
  - "[[pricing-llm-apis]]"
  - "[[inference-optimization]]"
  - "[[datasets-entrenamiento]]"
  - "[[metricas-evaluacion-ia]]"
up: "[[moc-fundamentos]]"
---

# Tokenización

> [!abstract] Resumen
> La tokenización es el proceso fundamental que convierte texto en unidades numéricas que los modelos de lenguaje pueden procesar. ==Cada token consumido o generado tiene un coste directo en las APIs de LLMs==, lo que convierte la comprensión de este proceso en una necesidad tanto técnica como económica. Los algoritmos principales — *BPE*, *WordPiece*, *SentencePiece* y *Unigram* — difieren en cómo construyen y optimizan sus vocabularios, con impactos medibles en rendimiento, coste y capacidad multilingüe. ^resumen

## Qué es y por qué importa

**Tokenización** (*tokenization*) es el proceso de segmentar texto en unidades discretas llamadas *tokens*, que pueden ser palabras completas, subpalabras, caracteres individuales o incluso bytes. Estos tokens se mapean a identificadores numéricos que alimentan las capas de [[embeddings]] de un modelo.

El problema fundamental: los modelos neuronales operan con vectores numéricos, no con texto. Se necesita una representación intermedia que sea:

1. **Finita**: un vocabulario manejable (típicamente 32K-256K tokens)
2. **Expresiva**: capaz de representar cualquier texto posible
3. **Eficiente**: minimizar el número de tokens por secuencia
4. **Consistente**: la misma entrada siempre produce la misma tokenización

> [!tip] Cuándo importa especialmente
> - **Optimización de costes**: en [[pricing-llm-apis]], cada token cuenta literalmente
> - **Context window**: un tokenizador más eficiente permite meter más información en la [[context-window]]
> - **Multilingüismo**: un tokenizador mal diseñado puede usar 3-5x más tokens para idiomas no ingleses
> - Ver [[inference-optimization]] para técnicas de optimización relacionadas

---

## Cómo funciona internamente

### Tokenización clásica vs. subword

La tokenización clásica (split por espacios y puntuación) tiene dos problemas fatales:

- **Vocabulario abierto**: palabras nuevas o raras generan tokens `<UNK>` (desconocidos)
- **Vocabulario explosivo**: millones de formas posibles en lenguajes con morfología rica

==La solución moderna son los algoritmos de *subword tokenization*==, que encuentran un equilibrio entre caracteres individuales (vocabulario mínimo, secuencias largas) y palabras completas (vocabulario enorme, secuencias cortas). ^subword-insight

> [!example]- Ver diagrama del espectro de tokenización
> ```mermaid
> flowchart LR
>     A["Caracteres<br/>Vocab: ~256<br/>Secuencias largas"] --> B["Subpalabras<br/>Vocab: 32K-256K<br/>Equilibrio óptimo"]
>     B --> C["Palabras completas<br/>Vocab: 500K+<br/>Secuencias cortas"]
>
>     style B fill:#2d5,stroke:#333,stroke-width:3px
>
>     D["Byte-level"] -.-> A
>     E["BPE / WordPiece<br/>Unigram / SP"] -.-> B
>     F["Word-level"] -.-> C
> ```

---

## Algoritmos principales

### 1. BPE — Byte-Pair Encoding

*Byte-Pair Encoding* fue originalmente un algoritmo de compresión de datos adaptado para NLP por Sennrich et al. (2016)[^1]. ==Es el algoritmo más usado en LLMs modernos== (GPT-2/3/4, LLaMA, Mistral).

**Proceso paso a paso:**

1. **Inicialización**: partir todo el corpus en caracteres individuales
2. **Conteo de pares**: contar la frecuencia de todos los pares adyacentes de tokens
3. **Merge del par más frecuente**: fusionar el par más frecuente en un nuevo token
4. **Repetir**: volver al paso 2 hasta alcanzar el tamaño de vocabulario deseado
5. **Resultado**: un vocabulario de merges ordenados por frecuencia

> [!example]- Ver ejemplo paso a paso de BPE
> Supongamos un corpus minimalista con las palabras: `low`, `lower`, `newest`, `widest`
>
> **Paso 0 — Inicialización con frecuencias:**
> ```
> l o w </w>      : 5
> l o w e r </w>  : 2
> n e w e s t </w>: 6
> w i d e s t </w>: 3
> ```
>
> **Paso 1 — Par más frecuente: (e, s) → es (frecuencia 9)**
> ```
> l o w </w>       : 5
> l o w e r </w>   : 2
> n e w es t </w>  : 6
> w i d es t </w>  : 3
> ```
>
> **Paso 2 — Par más frecuente: (es, t) → est (frecuencia 9)**
> ```
> l o w </w>       : 5
> l o w e r </w>   : 2
> n e w est </w>   : 6
> w i d est </w>   : 3
> ```
>
> **Paso 3 — Par más frecuente: (est, </w>) → est</w> (frecuencia 9)**
> Y así sucesivamente hasta el vocabulario deseado.

**Variante moderna — Byte-level BPE:**

GPT-2 introdujo una variante crucial: ==operar a nivel de bytes en lugar de caracteres Unicode==. Esto garantiza que cualquier texto puede ser tokenizado sin tokens `<UNK>`, usando un vocabulario base de solo 256 bytes. La familia GPT, [[landscape-modelos|LLaMA]], y Mistral usan esta variante.

### 2. WordPiece

*WordPiece* fue desarrollado por Google para el sistema de traducción de Google Translate y posteriormente adoptado para [[transformer-architecture|BERT]][^2]. La diferencia clave con BPE:

- **BPE**: selecciona el par más frecuente
- **WordPiece**: selecciona el par que ==maximiza la verosimilitud (*likelihood*) del corpus== al fusionarse

**Proceso paso a paso:**

1. **Inicialización**: vocabulario de caracteres individuales, con prefijo `##` para subpalabras que no inician palabra
2. **Evaluación**: para cada par candidato, calcular el cambio en log-likelihood del modelo de lenguaje
3. **Selección**: fusionar el par que más aumenta la likelihood
4. **Repetir**: hasta el tamaño de vocabulario objetivo

> [!info] Diferencia práctica con BPE
> WordPiece tiende a producir vocabularios que capturan mejor la semántica morfológica. Por ejemplo, `##ing`, `##tion`, `##ness` emergen naturalmente como tokens de alta utilidad. BERT usa un vocabulario WordPiece de 30,522 tokens.

### 3. Unigram Language Model

El modelo *Unigram* de Kudo (2018)[^3] toma el enfoque opuesto a BPE:

- **BPE**: empieza pequeño, va agregando (bottom-up)
- **Unigram**: ==empieza con un vocabulario grande y va eliminando== (top-down)

**Proceso paso a paso:**

1. **Inicialización**: crear un vocabulario semilla muy grande (todas las substrings frecuentes hasta cierta longitud)
2. **Estimación**: calcular la probabilidad de cada token en el vocabulario usando el algoritmo EM (*Expectation-Maximization*)
3. **Poda**: eliminar el 10-20% de tokens que menos reducen la likelihood total
4. **Repetir**: hasta el tamaño de vocabulario deseado

> [!tip] Ventaja única de Unigram
> A diferencia de BPE, Unigram puede generar ==múltiples segmentaciones posibles para un mismo texto==, cada una con su probabilidad. Esto permite *subword regularization*: usar segmentaciones diferentes durante el entrenamiento como forma de data augmentation, mejorando la robustez del modelo.

### 4. SentencePiece

*SentencePiece* (Kudo & Richardson, 2018)[^4] no es un algoritmo de tokenización en sí, sino un ==framework que implementa tanto BPE como Unigram== de forma independiente del idioma.

**Características clave:**

- **Trata el texto como una secuencia de bytes/caracteres Unicode** sin asumir espacios como separadores de palabras
- **Agnóstico al idioma**: funciona igual para inglés, japonés, árabe o cualquier script
- **Pre-tokenización innecesaria**: no necesita segmentación previa por espacios
- **Representación del espacio**: usa el carácter `▁` (U+2581) para representar espacios

> [!example]- Ver flujo de SentencePiece
> ```mermaid
> flowchart TD
>     A["Texto crudo<br/>'Hello world'"] --> B["Normalización Unicode<br/>NFKC"]
>     B --> C["Tratamiento como<br/>secuencia de caracteres<br/>'▁Hello▁world'"]
>     C --> D{"Algoritmo interno"}
>     D -->|BPE| E["Merge iterativo<br/>por frecuencia"]
>     D -->|Unigram| F["Poda iterativa<br/>por likelihood"]
>     E --> G["Vocabulario final<br/>+ modelo"]
>     F --> G
>     G --> H["Encode: texto → IDs<br/>Decode: IDs → texto"]
> ```

Modelos que usan SentencePiece: T5, LLaMA, Mistral, ALBERT, XLNet, mBART.

---

## Comparación de tokenizadores por modelo

| Modelo | Algoritmo | Tamaño vocab | Tipo | Nota clave |
|---|---|---|---|---|
| GPT-2 | Byte-level BPE | 50,257 | `tiktoken` | Primer byte-level BPE masivo |
| GPT-3.5/4 | Byte-level BPE | 100,256 | `tiktoken` (cl100k) | ==2x vocabulario vs GPT-2== |
| GPT-4o | Byte-level BPE | ~200,000 | `tiktoken` (o200k) | Optimizado multilingüe |
| BERT | WordPiece | 30,522 | `transformers` | Vocabulario relativamente pequeño |
| T5 | SentencePiece (Unigram) | 32,000 | `sentencepiece` | Diseñado text-to-text |
| LLaMA 1/2 | SentencePiece (BPE) | 32,000 | `sentencepiece` | Vocabulario conservador |
| LLaMA 3 | Byte-level BPE | 128,256 | `tiktoken` | ==4x vs LLaMA 2== |
| Mistral | SentencePiece (BPE) | 32,000 | `sentencepiece` | Similar a LLaMA 2 |
| Claude 3+ | BPE (variante) | ~100,000+ | Propietario | No documentado públicamente |
| Gemini | SentencePiece | 256,000 | `sentencepiece` | Vocabulario más grande del mercado |

^tabla-tokenizadores

---

## Impacto del tamaño de vocabulario en rendimiento

El tamaño del vocabulario es una decisión de diseño crítica con múltiples *trade-offs*:

| Vocabulario grande (100K+) | Vocabulario pequeño (32K) |
|---|---|
| Menos tokens por texto → secuencias más cortas | Más tokens por texto → secuencias más largas |
| Mejor para idiomas con morfología compleja | Puede penalizar idiomas no ingleses |
| Capa de embedding más grande (más parámetros) | Capa de embedding más compacta |
| Mejor eficiencia de inferencia (menos pasos) | Más generalización en subpalabras |
| Mayor coste de memoria para la embedding table | Menor coste de memoria |

> [!warning] La trampa del vocabulario
> ==Un vocabulario de 32K tokens puede usar 3-5x más tokens para texto en español, hindi o árabe comparado con inglés==. Esto tiene impacto directo en costes y en la utilización efectiva de la [[context-window]]. LLaMA 3 amplió su vocabulario a 128K tokens específicamente para mejorar la eficiencia multilingüe.

---

## Token-to-cost: la relación tokens-coste en APIs

Comprender la tokenización es fundamental para optimizar costes en [[pricing-llm-apis]].

**Reglas empíricas para inglés:**
- ==1 token ≈ 4 caracteres ≈ 0.75 palabras==
- 1 palabra promedio ≈ 1.3 tokens
- 1 página de texto ≈ 300-400 tokens

**Para español (con tokenizadores optimizados como GPT-4o):**
- 1 token ≈ 3-3.5 caracteres
- 1 palabra promedio ≈ 1.5-1.8 tokens
- ==El español es ~15-30% menos eficiente que el inglés en tokens/palabra== ^coste-español

> [!example]- Ver ejemplo de coste real
> **Texto**: "La inteligencia artificial está transformando la industria del software."
>
> | Tokenizador | Tokens | Coste (GPT-4o, input) |
> |---|---|---|
> | cl100k (GPT-4) | 14 | $0.000035 |
> | o200k (GPT-4o) | 11 | $0.0000275 |
> | LLaMA 2 (32K) | 18 | N/A (open-source) |
> | LLaMA 3 (128K) | 12 | N/A (open-source) |
>
> ==El tokenizador de GPT-4o es ~21% más eficiente que el de GPT-4 para español==, lo que se traduce directamente en ahorro de costes.

> [!danger] Riesgo económico real
> En pipelines de producción que procesan millones de documentos, una diferencia del 20% en eficiencia de tokenización puede significar miles de dólares mensuales. Antes de seleccionar un modelo, analizar la eficiencia del tokenizador para tu idioma y dominio específico.

---

## Desafíos de tokenización multilingüe

La tokenización multilingüe es uno de los problemas más persistentes en NLP moderno:

### El problema de la fertilidad (*fertility*)

La *fertility* de un tokenizador mide cuántos tokens necesita para representar una unidad de texto en un idioma dado. ==Un tokenizador "justo" debería tener fertilidad similar entre idiomas==.

| Idioma | Tokens/palabra (GPT-4) | Tokens/palabra (GPT-4o) | Mejora |
|---|---|---|---|
| Inglés | 1.3 | 1.2 | 8% |
| Español | 1.8 | 1.5 | 17% |
| Alemán | 2.1 | 1.6 | 24% |
| Japonés | 3.0 | 1.8 | 40% |
| Hindi | 4.2 | 2.1 | 50% |
| Birmano | 8.5 | 3.2 | 62% |

### Problemas específicos

> [!warning] Tokenización de código
> Los tokenizadores diseñados para texto natural a menudo tokeniza ineficientemente el código fuente. Espacios en blanco, indentación, y nombres de variables pueden generar más tokens de lo esperado. Algunos modelos como Codex y DeepSeek Coder usan vocabularios expandidos con tokens específicos para código.

> [!question] Debate abierto: ¿tokenización por bytes es el futuro?
> Existe un movimiento creciente hacia modelos *byte-level* que eliminan completamente el tokenizador:
> - **Posición A**: los modelos byte-level (como MegaByte de Meta) eliminan sesgos lingüísticos — defendida por investigadores de Meta y Google DeepMind
> - **Posición B**: la tokenización subword es necesaria para la eficiencia computacional — defendida por OpenAI y Anthropic
> Mi valoración: ==los modelos byte-level son prometedores pero actualmente 3-5x más costosos computacionalmente==. Probablemente coexistirán ambos enfoques en los próximos 2-3 años.

---

## Implementación práctica

> [!example]- Ver código: tokenización con diferentes modelos
> ```python
> # pip install tiktoken sentencepiece transformers
>
> import tiktoken
>
> # === GPT-4 (cl100k_base) ===
> enc_gpt4 = tiktoken.get_encoding("cl100k_base")
> texto = "La tokenización es fundamental para entender los costes de LLMs."
> tokens_gpt4 = enc_gpt4.encode(texto)
> print(f"GPT-4:  {len(tokens_gpt4)} tokens → {tokens_gpt4}")
> print(f"Decode: {[enc_gpt4.decode([t]) for t in tokens_gpt4]}")
>
> # === GPT-4o (o200k_base) ===
> enc_gpt4o = tiktoken.get_encoding("o200k_base")
> tokens_gpt4o = enc_gpt4o.encode(texto)
> print(f"GPT-4o: {len(tokens_gpt4o)} tokens → {tokens_gpt4o}")
> print(f"Decode: {[enc_gpt4o.decode([t]) for t in tokens_gpt4o]}")
>
> # === Comparación de eficiencia por idioma ===
> textos = {
>     "en": "Artificial intelligence is transforming the software industry today.",
>     "es": "La inteligencia artificial está transformando la industria del software.",
>     "de": "Künstliche Intelligenz transformiert die Softwareindustrie heute.",
>     "ja": "人工知能は今日のソフトウェア産業を変革しています。",
>     "hi": "कृत्रिम बुद्धिमत्ता आज सॉफ्टवेयर उद्योग को बदल रही है।",
> }
>
> print("\n--- Eficiencia multilingüe (o200k_base) ---")
> for lang, text in textos.items():
>     n_tokens = len(enc_gpt4o.encode(text))
>     n_chars = len(text)
>     print(f"{lang}: {n_tokens:3d} tokens | {n_chars:3d} chars | "
>           f"{n_chars/n_tokens:.1f} chars/token")
> ```

> [!example]- Ver código: entrenar tu propio tokenizador BPE
> ```python
> # pip install tokenizers
> from tokenizers import Tokenizer
> from tokenizers.models import BPE
> from tokenizers.trainers import BpeTrainer
> from tokenizers.pre_tokenizers import Whitespace
>
> # Inicializar tokenizador BPE
> tokenizer = Tokenizer(BPE(unk_token="<UNK>"))
> tokenizer.pre_tokenizer = Whitespace()
>
> # Configurar entrenamiento
> trainer = BpeTrainer(
>     vocab_size=8000,
>     min_frequency=2,
>     special_tokens=["<UNK>", "<PAD>", "<BOS>", "<EOS>"],
>     show_progress=True,
> )
>
> # Entrenar desde archivos de texto
> tokenizer.train(files=["corpus_es.txt", "corpus_en.txt"], trainer=trainer)
>
> # Guardar y usar
> tokenizer.save("mi_tokenizador.json")
>
> output = tokenizer.encode("La tokenización subword es el estándar moderno")
> print(f"Tokens: {output.tokens}")
> print(f"IDs:    {output.ids}")
> ```

---

## Ventajas y limitaciones

> [!success] Fortalezas de la tokenización subword moderna
> - Vocabulario abierto: puede representar cualquier texto sin tokens desconocidos
> - Balance óptimo entre longitud de secuencia y tamaño de vocabulario
> - Captura patrones morfológicos (prefijos, sufijos, raíces) de forma natural
> - Determinista: misma entrada → misma salida (excepto Unigram con sampling)

> [!failure] Limitaciones reales
> - **Sesgo lingüístico**: los tokenizadores entrenados mayoritariamente en inglés penalizan otros idiomas
> - **Aritmética rota**: números como `42381` se tokeniza como `[423, 81]`, rompiendo el razonamiento numérico
> - **Sensibilidad a formato**: un espacio adicional puede cambiar completamente la tokenización
> - **No semánticos**: los tokens no representan unidades de significado consistentes
> - **Irreversibilidad parcial**: algunos caracteres Unicode pueden perderse en el round-trip encode→decode

---

## Estado del arte (2025-2026)

Las tendencias principales en tokenización:

1. **Vocabularios más grandes y multilingües**: GPT-4o (200K), Gemini (256K), tendencia hacia vocabularios de 256K+
2. **Byte Latent Transformer (BLT)**: propuesta de Meta para eliminar la tokenización fija, usando *patches* dinámicos de bytes[^5]
3. **Tokenización adaptativa**: ajustar la granularidad según el dominio (código vs. texto vs. matemáticas)
4. **MegaByte y modelos byte-level**: procesamiento directo de bytes sin tokenización previa

> [!info] Impacto en la investigación actual
> La elección del tokenizador afecta directamente la capacidad de razonamiento del modelo. Investigaciones recientes muestran que ==tokenizadores con tokens de dígitos individuales mejoran significativamente el rendimiento aritmético==, lo que ha llevado a modelos como Llama 3 a incluir tokens de dígitos individuales en su vocabulario.

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: El procesamiento de documentos en intake debe considerar la eficiencia del tokenizador al calcular presupuestos de contexto para chunking
> - **[[architect-overview|architect]]**: La generación de código por architect consume tokens; optimizar los prompts considerando la tokenización reduce costes operativos
> - **[[vigil-overview|vigil]]**: El análisis de seguridad de vigil debe considerar ataques de *token smuggling* donde caracteres Unicode invisibles generan tokens inesperados
> - **[[licit-overview|licit]]**: Los costes de token son directamente relevantes para el análisis de compliance y presupuesto que licit debe monitorizar

---

## Enlaces y referencias

**Notas relacionadas:**
- [[embeddings]] — Los tokens se convierten en embeddings como siguiente paso
- [[transformer-architecture]] — La tokenización es el paso previo al transformer
- [[context-window]] — La eficiencia del tokenizador determina cuánta información cabe
- [[pricing-llm-apis]] — Cada token tiene un coste directo
- [[inference-optimization]] — Optimizar la tokenización mejora la inferencia
- [[datasets-entrenamiento]] — Los datos de entrenamiento determinan la calidad del vocabulario

> [!quote]- Referencias bibliográficas
> - Sennrich, R., Haddow, B., & Birch, A. "Neural Machine Translation of Rare Words with Subword Units", ACL 2016
> - Wu, Y., et al. "Google's Neural Machine Translation System", arXiv 2016
> - Kudo, T. "Subword Regularization: Improving Neural Network Translation Models with Multiple Subword Candidates", ACL 2018
> - Kudo, T. & Richardson, J. "SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing", EMNLP 2018
> - OpenAI. "tiktoken" — Documentación oficial: https://github.com/openai/tiktoken
> - Yu, L., et al. "Megabyte: Predicting Million-byte Sequences with Multiscale Transformers", arXiv 2023
> - Pagnoni, A., et al. "Byte Latent Transformer: Patches Scale Better Than Tokens", Meta FAIR 2024

[^1]: Sennrich et al., "Neural Machine Translation of Rare Words with Subword Units", ACL 2016. Introdujo BPE para NLP.
[^2]: Wu et al., "Google's Neural Machine Translation System", 2016. Describió WordPiece para NMT.
[^3]: Kudo, "Subword Regularization", ACL 2018. Propuso el modelo Unigram y subword sampling.
[^4]: Kudo & Richardson, "SentencePiece", EMNLP 2018. Framework unificado para BPE y Unigram.
[^5]: Pagnoni et al., "Byte Latent Transformer: Patches Scale Better Than Tokens", Meta FAIR 2024. Alternativa a tokenización fija.
