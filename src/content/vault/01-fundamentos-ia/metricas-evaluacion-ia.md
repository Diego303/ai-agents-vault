---
tags:
  - concepto
  - fundamentos
  - evaluacion-llm
aliases:
  - métricas de evaluación
  - evaluation metrics
  - benchmarks LLM
  - métricas ML
created: 2025-06-01
updated: 2025-06-01
category: fundamentos-ia
status: current
difficulty: intermediate
related:
  - "[[tokenizacion]]"
  - "[[embeddings]]"
  - "[[transfer-learning]]"
  - "[[datasets-entrenamiento]]"
  - "[[landscape-modelos]]"
  - "[[testing-agentes-ia]]"
  - "[[llm-como-juez]]"
up: "[[moc-fundamentos]]"
---

# Métricas de Evaluación en IA

> [!abstract] Resumen
> La evaluación de modelos de IA abarca desde métricas clásicas de ML (*accuracy*, *F1*, *AUC*) hasta benchmarks modernos para LLMs (*MMLU*, *HumanEval*, *MT-Bench*) y agentes (*SWE-bench*, *GAIA*). ==No existe una métrica única que capture la calidad de un modelo==; cada benchmark mide un aspecto diferente, y todos son susceptibles a contaminación, overfitting y manipulación. Comprender qué mide cada métrica — y qué no mide — es esencial para tomar decisiones informadas sobre qué modelo usar en producción. ^resumen

## Qué es y por qué importa

La **evaluación de modelos de IA** es el proceso de medir cuantitativamente el rendimiento de un modelo en tareas específicas. Sin evaluación rigurosa, es imposible:

1. Comparar modelos objetivamente
2. Detectar regresiones después de actualizaciones
3. Justificar decisiones de inversión en modelos
4. Garantizar que un modelo cumple requisitos de producción

> [!tip] Principio fundamental
> - **Nunca confíes en una sola métrica**: un modelo con 95% de accuracy puede ser inútil si el dataset está desbalanceado
> - **Evalúa en tus datos**: los benchmarks públicos son una referencia, no una garantía para tu caso de uso
> - **Automatiza la evaluación**: integra evaluaciones en tu pipeline de CI/CD. Ver [[testing-agentes-ia]]

---

## Métricas clásicas de Machine Learning

### Clasificación

| Métrica | Fórmula | Qué mide | Cuándo usar |
|---|---|---|---|
| **Accuracy** | $\frac{TP+TN}{TP+TN+FP+FN}$ | Proporción de predicciones correctas | Solo con datasets balanceados |
| **Precision** | $\frac{TP}{TP+FP}$ | De lo que predijiste positivo, cuánto es correcto | Cuando FP son costosos (spam filter) |
| **Recall** | $\frac{TP}{TP+FN}$ | De lo realmente positivo, cuánto detectaste | Cuando FN son costosos (detección de cáncer) |
| **F1 Score** | $2 \cdot \frac{P \cdot R}{P + R}$ | Media armónica de precision y recall | ==Balance general entre P y R== |
| **AUC-ROC** | Área bajo curva ROC | Capacidad de discriminación global | Comparar modelos independiente del threshold |
| **AUC-PR** | Área bajo curva Precision-Recall | Rendimiento en clases desbalanceadas | ==Preferible a AUC-ROC cuando hay desbalance== |

^metricas-clasificacion

> [!warning] La trampa del accuracy
> ==Con un dataset donde el 99% son negativos, un modelo que siempre predice "negativo" tiene 99% accuracy==. Por eso accuracy es la métrica más engañosa en escenarios de detección (fraude, anomalías, enfermedades raras). Usa F1, AUC-PR o métricas específicas del dominio.

> [!example]- Ver ejemplo concreto: clasificador de spam
> ```
> Dataset: 1000 emails (900 legítimos, 100 spam)
>
> Modelo A (siempre predice "legítimo"):
>   Accuracy: 900/1000 = 90% ← engañoso
>   Recall spam: 0/100 = 0% ← inútil para detectar spam
>   F1 spam: 0%
>
> Modelo B (classifier real):
>   Accuracy: 950/1000 = 95%
>   Precision spam: 85/90 = 94.4%
>   Recall spam: 85/100 = 85%
>   F1 spam: 89.4% ← mucho más informativo
> ```

### Regresión

| Métrica | Qué mide | Sensibilidad a outliers |
|---|---|---|
| **MAE** (Mean Absolute Error) | Error promedio en unidades originales | Baja |
| **MSE** (Mean Squared Error) | Error cuadrático promedio | ==Alta== (penaliza errores grandes) |
| **RMSE** (Root MSE) | Error en unidades originales (raíz de MSE) | Alta |
| **R²** | Proporción de varianza explicada | Media |
| **MAPE** | Error porcentual promedio | Problemática con valores cercanos a 0 |

---

## Métricas de NLP

### Perplexity (*Perplejidad*)

*Perplexity* mide qué tan "sorprendido" está un modelo de lenguaje por un texto. Formalmente, es la exponencial de la entropía cruzada:

$$PPL = \exp\left(-\frac{1}{N}\sum_{i=1}^{N}\log p(w_i | w_{<i})\right)$$

- ==Menor perplexity = mejor modelo de lenguaje==
- Un modelo con perplexity 10 es como si en cada posición tuviera 10 opciones igualmente probables
- GPT-3 tiene perplexity ~20 en texto general; modelos más recientes bajan a ~8-12

> [!info] Limitación de perplexity
> Perplexity mide la calidad como modelo de lenguaje pero ==no mide la calidad de las respuestas, la veracidad, ni la utilidad==. Un modelo puede tener baja perplexity y ser completamente inútil como asistente.

### BLEU

*Bilingual Evaluation Understudy* (Papineni et al., 2002)[^1] mide la similitud entre un texto generado y una referencia mediante coincidencia de n-gramas.

- Rango: 0-100 (mayor = mejor)
- Usado históricamente para traducción automática
- ==Limitación: no captura semántica, solo coincidencia superficial==
- "El gato gordo" vs "El felino obeso" → BLEU bajo a pesar de significado idéntico

### ROUGE

*Recall-Oriented Understudy for Gisting Evaluation* mide el solapamiento entre resúmenes generados y de referencia:

| Variante | Qué mide |
|---|---|
| **ROUGE-1** | Solapamiento de unigramas |
| **ROUGE-2** | Solapamiento de bigramas |
| **ROUGE-L** | Subsecuencia común más larga (LCS) |
| **ROUGE-Lsum** | ROUGE-L a nivel de resumen |

### BERTScore

*BERTScore* (Zhang et al., 2020)[^2] usa [[embeddings]] contextuales de BERT para medir similitud semántica entre textos generados y de referencia. ==Captura similitud semántica que BLEU y ROUGE no pueden medir==.

> [!success] Ventaja de BERTScore
> - "El auto rojo estaba en el garaje" vs "El coche rojo se encontraba en el parking"
> - BLEU: puntuación baja (pocas palabras coinciden)
> - BERTScore: puntuación alta (semánticamente equivalentes)

---

## Benchmarks modernos para LLMs

### Benchmarks de conocimiento y razonamiento

| Benchmark | Qué mide | Formato | Escala | Estado |
|---|---|---|---|---|
| **MMLU** | Conocimiento general en 57 dominios | Multiple choice (4 opciones) | 14,042 preguntas | ==Saturándose (>90%)== |
| **MMLU-Pro** | MMLU más difícil (10 opciones, razonamiento) | Multiple choice (10 opciones) | 12,032 preguntas | Activo |
| **ARC** | Razonamiento científico nivel escolar | Multiple choice | 7,787 preguntas | Saturado |
| **HellaSwag** | Sentido común y completar situaciones | Multiple choice | 10,042 preguntas | Saturado (>95%) |
| **WinoGrande** | Resolución de correferencia | Binary choice | 1,267 preguntas | Saturado |
| **GSM8K** | Razonamiento matemático (nivel escuela) | Respuesta numérica | 8,500 problemas | Saturándose |
| **MATH** | Matemáticas nivel competición | Respuesta libre | 12,500 problemas | Activo |
| **TruthfulQA** | Veracidad y resistencia a mitos | Multiple choice / generativo | 817 preguntas | Activo |
| **GPQA** | Preguntas de PhD en ciencias | Multiple choice | 448 preguntas | ==Benchmark elite== |

^tabla-benchmarks-llm

> [!example]- Ver diagrama de dificultad de benchmarks
> ```mermaid
> flowchart LR
>     subgraph Saturados["Saturados (>90%)"]
>         A["HellaSwag"]
>         B["ARC-Easy"]
>         C["WinoGrande"]
>     end
>
>     subgraph Activos["Activos"]
>         D["MMLU<br/>~90%"]
>         E["GSM8K<br/>~95%"]
>         F["MATH<br/>~75%"]
>         G["TruthfulQA<br/>~70%"]
>     end
>
>     subgraph Difíciles["Aún desafiantes"]
>         H["GPQA<br/>~60%"]
>         I["MMLU-Pro<br/>~70%"]
>         J["ARC-Challenge<br/>~85%"]
>     end
>
>     subgraph Frontier["Frontera"]
>         K["SWE-bench full<br/>~50%"]
>         L["FrontierMath<br/>~25%"]
>         M["GAIA Level 3<br/>~40%"]
>     end
>
>     Saturados --> Activos --> Difíciles --> Frontier
> ```

### Benchmarks de código

| Benchmark | Qué mide | Métrica | Nota |
|---|---|---|---|
| **HumanEval** | Generación de funciones Python | pass@1, pass@10 | 164 problemas, ==ya saturado== |
| **HumanEval+** | HumanEval con tests más rigurosos | pass@1 | Variante más fiable |
| **MBPP** | Problemas básicos de programación | pass@1 | 974 problemas |
| **SWE-bench** | Resolver issues reales de GitHub | % resueltos | ==El benchmark más relevante para agentes de código== |
| **SWE-bench Verified** | Subset validado por humanos de SWE-bench | % resueltos | 500 problemas verificados |
| **LiveCodeBench** | Problemas de competición de programación nuevos | pass@1 | Se actualiza continuamente |

### Benchmarks de conversación y preferencia humana

| Benchmark | Qué mide | Método | Relevancia |
|---|---|---|---|
| **MT-Bench** | Calidad conversacional multi-turno | LLM-as-judge (GPT-4) | ==Alta para chatbots== |
| **Chatbot Arena** | Preferencia humana en comparaciones ciegas | ELO rating humano | ==Gold standard para evaluación general== |
| **AlpacaEval 2.0** | Preferencia vs GPT-4 | LLM-as-judge | Rápido pero sesgado hacia respuestas largas |
| **WildBench** | Rendimiento en queries reales y difíciles | LLM-as-judge | Actualizado periódicamente |

^benchmarks-conversacion

> [!tip] Chatbot Arena como referencia
> ==Chatbot Arena de LMSYS es el benchmark más confiable para evaluar la calidad general de un LLM==. Usa comparaciones ciegas donde usuarios reales evalúan respuestas de dos modelos anónimos. El ranking ELO resultante tiene alta correlación con la percepción real de calidad.

---

## Por qué los benchmarks son imperfectos

> [!danger] Problemas fundamentales de los benchmarks
>
> ### 1. Contaminación de datos (*data contamination*)
> ==Los datos de benchmarks pueden filtrarse en los datos de entrenamiento==, inflando artificialmente las puntuaciones. Si MMLU está en Common Crawl y Common Crawl está en los datos de entrenamiento, el modelo puede haber "memorizado" las respuestas.
>
> ### 2. Overfitting al benchmark
> Los proveedores de modelos conocen los benchmarks y pueden optimizar específicamente para ellos, sin mejorar la capacidad real del modelo.
>
> ### 3. Formato-dependencia
> Pequeños cambios en el formato del prompt pueden causar variaciones de 5-15% en los resultados. El mismo modelo puede puntuar muy diferente según cómo se formule la pregunta.
>
> ### 4. Benchmarks estáticos
> Un benchmark publicado hoy será "gaming target" mañana. Solo los benchmarks que se actualizan continuamente (como LiveCodeBench o Chatbot Arena) mantienen su utilidad.
>
> ### 5. No miden lo que importa
> ==Ningún benchmark mide reliability, latencia, coste, o comportamiento en edge cases== — factores críticos para producción.

> [!question] Debate abierto: ¿es posible evaluar LLMs de forma justa?
> - **Posición A (benchmarks estáticos)**: benchmarks estandarizados permiten comparación reproducible — defendida por la mayoría de labs
> - **Posición B (evaluación humana)**: solo la evaluación humana captura la calidad real — defendida por Chatbot Arena/LMSYS
> - **Posición C (evaluación personalizada)**: cada organización debe crear sus propios evals específicos — defendida por Anthropic, Hamel Husain
> Mi valoración: ==la evaluación efectiva requiere combinar benchmarks públicos como referencia rápida con evaluaciones personalizadas para decisiones de producción==. ^eval-opinion

---

## Evaluación de agentes

Los agentes de IA ([[agent-loop]]) requieren métricas diferentes porque interactúan con entornos, usan herramientas, y ejecutan planes multi-paso.

| Benchmark | Qué evalúa | Entorno | Estado del arte (2025) |
|---|---|---|---|
| **SWE-bench** | Resolución de issues en repos Python | Repos reales de GitHub | ==~50% (Claude, GPT-4o)== |
| **SWE-bench Verified** | Subset validado de SWE-bench | Repos reales de GitHub | ~65% |
| **GAIA** | Tareas generales con herramientas | Web, calculadora, archivos | ~75% (Level 1), ~40% (Level 3) |
| **WebArena** | Navegación web autónoma | Websites reales clonados | ~35% |
| **OSWorld** | Uso de sistema operativo completo | VM con GUI | ~15% |
| **TAU-bench** | Interacción agente-usuario en dominios reales | Retail, airline | ~50% |
| **MLE-bench** | Competiciones de ML de Kaggle | Notebooks + datasets | ~17% medallas |

> [!warning] SWE-bench: métricas con contexto
> Las cifras de SWE-bench se citan frecuentemente sin contexto. Consideraciones clave:
> - **SWE-bench full** (2,294 issues) vs **SWE-bench Verified** (500 issues validados) vs **SWE-bench Lite** (300 issues)
> - Las puntuaciones dependen enormemente del scaffolding (el sistema de herramientas y prompts alrededor del modelo)
> - ==Un modelo que resuelve 50% de SWE-bench no resuelve 50% de los bugs reales de tu codebase==

---

## Construir tu propio framework de evaluación

> [!example]- Ver diagrama de framework de evaluación personalizado
> ```mermaid
> flowchart TD
>     subgraph Datos["1. Crear dataset de evaluación"]
>         R["Recoger queries reales<br/>de producción"] --> L["Etiquetar respuestas<br/>ideales (ground truth)"]
>         L --> C["Categorizar por<br/>tipo y dificultad"]
>         C --> D["Dataset eval<br/>(mínimo 100 ejemplos)"]
>     end
>
>     subgraph Eval["2. Evaluar"]
>         D --> AUTO["Eval automática<br/>Métricas objetivas"]
>         D --> LLM["LLM-as-judge<br/>[[llm-como-juez]]"]
>         D --> HUM["Eval humana<br/>(muestra del 10%)"]
>     end
>
>     subgraph Analyze["3. Analizar"]
>         AUTO --> AGG["Agregar resultados<br/>por categoría"]
>         LLM --> AGG
>         HUM --> AGG
>         AGG --> DASH["Dashboard de<br/>métricas"]
>         AGG --> REG["Detección de<br/>regresiones"]
>     end
>
>     subgraph CI["4. Automatizar"]
>         REG --> CICD["Integrar en CI/CD"]
>         CICD --> ALERT["Alertas si<br/>rendimiento baja"]
>     end
> ```

### Pasos prácticos

1. **Recoger datos reales**: toma 100-500 queries reales de tu aplicación en producción
2. **Crear ground truth**: para cada query, define la respuesta ideal o criterios de calidad
3. **Definir métricas**: combina métricas automáticas (exactitud, formato) con evaluación LLM-as-judge
4. **Automatizar**: ejecuta evaluaciones automáticamente al cambiar modelos, prompts o datos
5. **Monitorizar**: establece umbrales mínimos y alertas para regresiones

> [!example]- Ver código: framework de evaluación básico
> ```python
> import json
> from openai import OpenAI
> from dataclasses import dataclass
>
> client = OpenAI()
>
> @dataclass
> class EvalCase:
>     query: str
>     expected: str
>     category: str
>     difficulty: str
>
> @dataclass
> class EvalResult:
>     case: EvalCase
>     response: str
>     score: float  # 0-1
>     reasoning: str
>
> def llm_judge(case: EvalCase, response: str) -> tuple[float, str]:
>     """Usa un LLM como juez para evaluar la respuesta."""
>     judge_prompt = f"""Evalúa la siguiente respuesta en una escala de 0 a 1.
>
> Pregunta: {case.query}
> Respuesta esperada: {case.expected}
> Respuesta del modelo: {response}
>
> Criterios:
> - Corrección factual (0.4)
> - Completitud (0.3)
> - Claridad (0.2)
> - Formato adecuado (0.1)
>
> Responde en JSON: {{"score": 0.0-1.0, "reasoning": "..."}}"""
>
>     result = client.chat.completions.create(
>         model="gpt-4o",
>         messages=[{"role": "user", "content": judge_prompt}],
>         response_format={"type": "json_object"},
>     )
>     data = json.loads(result.choices[0].message.content)
>     return data["score"], data["reasoning"]
>
> def run_evaluation(
>     cases: list[EvalCase],
>     model: str = "gpt-4o-mini",
> ) -> list[EvalResult]:
>     """Ejecuta evaluación completa."""
>     results = []
>     for case in cases:
>         # Generar respuesta del modelo bajo evaluación
>         response = client.chat.completions.create(
>             model=model,
>             messages=[{"role": "user", "content": case.query}],
>         ).choices[0].message.content
>
>         # Evaluar con LLM-as-judge
>         score, reasoning = llm_judge(case, response)
>         results.append(EvalResult(case, response, score, reasoning))
>
>     # Resumen por categoría
>     categories = set(r.case.category for r in results)
>     for cat in categories:
>         cat_results = [r for r in results if r.case.category == cat]
>         avg_score = sum(r.score for r in cat_results) / len(cat_results)
>         print(f"[{cat}] Score promedio: {avg_score:.2f} "
>               f"({len(cat_results)} cases)")
>
>     return results
> ```

---

## LLM-as-Judge

La técnica de *LLM-as-Judge* ([[llm-como-juez]]) usa un modelo fuerte (típicamente GPT-4 o Claude) para evaluar las respuestas de otro modelo. Es la base de benchmarks como MT-Bench y AlpacaEval.

> [!success] Ventajas
> - Escalable: puede evaluar miles de respuestas automáticamente
> - Más semántico que métricas de n-gramas (BLEU, ROUGE)
> - Correlaciona razonablemente bien con evaluación humana (~80% agreement)

> [!failure] Limitaciones conocidas
> - **Sesgo de verbosidad**: ==los jueces LLM favorecen respuestas más largas, incluso si son redundantes==
> - **Sesgo de posición**: cuando comparan dos respuestas, favorecen la primera o la segunda según el modelo
> - **Sesgo de auto-preferencia**: GPT-4 como juez favorece respuestas de GPT-4
> - **No detecta confabulaciones sutiles**: si la respuesta "suena bien" pero contiene errores fácticos sutiles

---

## Ventajas y limitaciones del ecosistema de evaluación

> [!success] Fortalezas del sistema actual
> - Benchmarks estandarizados permiten comparación rápida entre modelos
> - Chatbot Arena proporciona señal humana real
> - Herramientas open-source (lm-evaluation-harness, bigcode-evaluation) facilitan la reproducibilidad
> - LLM-as-judge escala la evaluación a bajo coste

> [!failure] Limitaciones sistémicas
> - Los leaderboards incentivan optimización para el benchmark, no para la calidad real
> - ==No existen benchmarks estándar para fiabilidad, seguridad o comportamiento en edge cases==
> - La evaluación multilingüe está subdesarrollada (la mayoría de benchmarks son en inglés)
> - Los benchmarks de agentes son aún inmaduros y poco reproducibles
> - No hay consenso sobre cómo medir "alucinaciones" de forma sistemática

---

## Estado del arte (2025-2026)

Tendencias en evaluación:

1. **Evaluación continua y dinámica**: benchmarks que se actualizan con nuevos problemas (LiveCodeBench, Chatbot Arena)
2. **Evaluación de seguridad**: aparición de benchmarks específicos de safety (HarmBench, TrustLLM, WMDP)
3. **Evaluación multimodal**: benchmarks que miden capacidades de visión + texto + razonamiento
4. **Evaluación de agentes end-to-end**: medir no solo la respuesta sino todo el plan y ejecución
5. **Evaluación personalizada como servicio**: plataformas como Braintrust, Humanloop, Patronus ofrecen evaluación como SaaS

> [!info] El concepto de "vibes-based evaluation"
> Existe un reconocimiento creciente de que ==la evaluación informal basada en intuición ("vibes") de los desarrolladores captura aspectos que los benchmarks formales no miden==. La tendencia es complementar — no reemplazar — los benchmarks con evaluación cualitativa estructurada.

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake debe evaluar la calidad de la ingesta de documentos, midiendo si el chunking y la indexación preservan la información relevante
> - **[[architect-overview|architect]]**: architect necesita evaluación de código generado — SWE-bench y HumanEval son referencias directas; las métricas personalizadas deben medir corrección, estilo y adherencia a patrones
> - **[[vigil-overview|vigil]]**: vigil puede integrar evaluación continua como parte del monitoreo de seguridad, detectando degradación del modelo en producción
> - **[[licit-overview|licit]]**: licit puede usar métricas de TruthfulQA y benchmarks de safety para verificar que los modelos usados cumplen con requisitos regulatorios

---

## Enlaces y referencias

**Notas relacionadas:**
- [[landscape-modelos]] — Comparación de modelos usando estos benchmarks
- [[llm-como-juez]] — Profundización en evaluación con LLM-as-judge
- [[testing-agentes-ia]] — Testing específico para agentes de IA
- [[datasets-entrenamiento]] — Los datos de entrenamiento determinan los resultados en benchmarks
- [[transfer-learning#tabla-tipos-finetuning|técnicas de fine-tuning]] — Evaluación antes y después de fine-tuning
- [[embeddings#tabla-modelos-embedding|modelos de embedding]] — MTEB como benchmark específico

> [!quote]- Referencias bibliográficas
> - Papineni, K. et al. "BLEU: a method for automatic evaluation of machine translation", ACL 2002
> - Zhang, T. et al. "BERTScore: Evaluating Text Generation with BERT", ICLR 2020
> - Hendrycks, D. et al. "Measuring Massive Multitask Language Understanding" (MMLU), ICLR 2021
> - Chen, M. et al. "Evaluating Large Language Models Trained on Code" (HumanEval), arXiv 2021
> - Cobbe, K. et al. "Training Verifiers to Solve Math Word Problems" (GSM8K), arXiv 2021
> - Zheng, L. et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023
> - Jimenez, C.E. et al. "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?", ICLR 2024
> - Mialon, G. et al. "GAIA: a benchmark for General AI Assistants", ICLR 2024

[^1]: Papineni et al., "BLEU: a method for automatic evaluation of machine translation", ACL 2002. Métrica fundacional de NLG.
[^2]: Zhang et al., "BERTScore: Evaluating Text Generation with BERT", ICLR 2020. Evaluación semántica con embeddings.
[^3]: Hendrycks et al., "Measuring Massive Multitask Language Understanding", ICLR 2021. Introdujo MMLU.
[^4]: Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023. Estableció LLM-as-judge y Chatbot Arena.
[^5]: Jimenez et al., "SWE-bench", ICLR 2024. Benchmark de referencia para agentes de código.
[^6]: Mialon et al., "GAIA", ICLR 2024. Benchmark para asistentes generales con herramientas.
