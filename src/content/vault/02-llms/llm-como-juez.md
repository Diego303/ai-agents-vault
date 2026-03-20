---
tags:
  - concepto
  - llm
  - evaluacion-llm
aliases:
  - LLM-as-Judge
  - LLM como evaluador
  - juez LLM
created: 2025-06-01
updated: 2025-06-01
category: evaluacion-llm
status: current
difficulty: advanced
related:
  - "[[model-evaluation-practice]]"
  - "[[scaling-laws]]"
  - "[[mt-bench]]"
  - "[[chatbot-arena]]"
  - "[[bias-en-llms]]"
  - "[[rlhf]]"
  - "[[structured-generation]]"
up: "[[moc-llms]]"
---

# LLM como juez

> [!abstract] Resumen
> El paradigma *LLM-as-Judge* utiliza modelos de lenguaje para evaluar las salidas de otros modelos, reemplazando parcialmente la evaluación humana costosa y lenta. ==Reduce costes de evaluación en un 90%+ manteniendo correlación >80% con jueces humanos== en muchos benchmarks. Es la base de [[chatbot-arena]] y [[mt-bench]], y se ha convertido en el estándar de facto para evaluación rápida durante el desarrollo. ^resumen

## Qué es y por qué importa

**LLM como juez** (*LLM-as-Judge*) es un paradigma de evaluación donde un modelo de lenguaje grande actúa como evaluador de las respuestas generadas por otro modelo (o por sí mismo). En lugar de depender exclusivamente de evaluadores humanos — proceso caro, lento y difícil de escalar — se delega el juicio a un LLM que recibe instrucciones específicas sobre los criterios de evaluación.

El problema fundamental que resuelve es la **brecha de escalabilidad** en evaluación de LLMs. Las métricas automáticas tradicionales como [[bleu-score|BLEU]] o [[rouge-score|ROUGE]] capturan aspectos superficiales (solapamiento de n-gramas), pero fallan en evaluar cualidades complejas como coherencia, utilidad, seguridad o adherencia a instrucciones. La evaluación humana captura estas cualidades pero no escala: evaluar miles de respuestas con anotadores entrenados puede costar decenas de miles de dólares y semanas de tiempo.

> [!tip] Cuándo usar esto
> - **Usar cuando**: Se necesitan evaluaciones rápidas durante iteración de prompts, comparación entre modelos en desarrollo, evaluación de cualidades subjetivas (helpfulness, creatividad, tono)
> - **No usar cuando**: Se requiere certificación formal, evaluaciones de seguridad crítica (*safety*), dominios altamente especializados donde el LLM juez carece de expertise
> - Ver [[model-evaluation-practice]] para un framework completo de evaluación
> - Ver [[mt-bench]] para la metodología de benchmark basada en este paradigma

---

## Cómo funciona internamente

El mecanismo central consiste en construir un prompt que transforma al LLM en un evaluador estructurado. El modelo recibe: (1) los criterios de evaluación, (2) la pregunta o instrucción original, (3) la(s) respuesta(s) a evaluar, y opcionalmente (4) una respuesta de referencia. El LLM produce un juicio — ya sea una puntuación numérica, una elección entre respuestas, o una evaluación detallada con justificación.

> [!example]- Ver diagrama de arquitectura del paradigma LLM-as-Judge
> ```mermaid
> flowchart TD
>     A[Pregunta / Instrucción original] --> D[Prompt del Juez]
>     B[Respuesta del Modelo A] --> D
>     C[Respuesta del Modelo B] --> D
>     R[Referencia - opcional] -.-> D
>     CR[Criterios de evaluación] --> D
>     D --> E[LLM Juez]
>     E --> F{Tipo de evaluación}
>     F -->|Pairwise| G[Modelo A gana / Modelo B gana / Empate]
>     F -->|Pointwise| H[Puntuación 1-10 con justificación]
>     F -->|Reference-based| I[Score de fidelidad vs referencia]
>     G --> J[Agregación estadística]
>     H --> J
>     I --> J
>     J --> K[Ranking final de modelos]
> ```

### Modalidades de evaluación

Existen tres modalidades principales, cada una con sus ventajas y sesgos característicos:

**1. Comparación por pares (*Pairwise Comparison*)**

El juez recibe dos respuestas simultáneamente y debe elegir cuál es mejor. Es el método usado por [[chatbot-arena]] y produce rankings relativos muy fiables.

```
Pregunta del usuario: {question}

Respuesta A: {response_a}
Respuesta B: {response_b}

¿Cuál respuesta es mejor? Elige [A], [B] o [Empate].
Justifica tu elección.
```

**2. Puntuación directa (*Pointwise Scoring*)**

El juez evalúa una sola respuesta y asigna una puntuación en una escala predefinida (típicamente 1-5 o 1-10). Es más simple pero más susceptible a sesgos de calibración.

**3. Evaluación basada en referencia (*Reference-based*)**

El juez compara la respuesta contra una respuesta de referencia "gold standard". Útil para tareas con respuestas verificables (matemáticas, factual QA).

### Componentes clave

1. **Prompt del juez**: El componente más crítico. Define los criterios de evaluación, el formato de salida esperado y las instrucciones de calibración. Un prompt mal diseñado invalida todo el pipeline.
2. **Modelo juez**: Típicamente se usa el modelo más capaz disponible (GPT-4, Claude Opus). ==Usar un modelo inferior como juez de uno superior produce resultados poco fiables==.
3. **Rúbrica de evaluación**: Definición explícita de qué significa cada nivel de la escala. Sin rúbrica, los scores son inconsistentes entre ejecuciones.
4. **Sistema de agregación**: Métodos estadísticos para convertir juicios individuales en rankings robustos (Elo ratings, Bradley-Terry, bootstrap).

---

## Sesgos conocidos en LLM-as-Judge

> [!danger] Sesgos sistemáticos documentados
> Los LLMs como jueces exhiben sesgos significativos y sistemáticos que pueden invalidar evaluaciones si no se mitigan activamente. Zheng et al. (2023)[^1] documentaron los principales.

### Position bias (sesgo de posición)

El sesgo más prevalente. ==Los LLMs jueces tienden a favorecer la respuesta que aparece primero en el prompt==, independientemente de su calidad. En estudios controlados, intercambiar el orden de las respuestas cambia el veredicto en un 20-40% de los casos.

**Mitigación**: Evaluar cada par dos veces intercambiando posiciones. Solo contar como victoria cuando ambas evaluaciones concuerdan; de lo contrario, marcar como empate.

### Verbosity bias (sesgo de verbosidad)

Los jueces LLM tienden a preferir respuestas más largas y detalladas, incluso cuando la respuesta corta es más precisa y útil. Este sesgo es especialmente problemático porque incentiva la generación de contenido de relleno (*padding*).

**Mitigación**: Incluir instrucciones explícitas en el prompt del juez: "La longitud de la respuesta no debe influir en tu evaluación. Una respuesta concisa y precisa es preferible a una larga pero con relleno."

### Self-enhancement bias (auto-preferencia)

==Los modelos tienden a preferir sus propias respuestas sobre las de otros modelos==. GPT-4 como juez favorece respuestas de GPT-4; Claude favorece respuestas de Claude. Este sesgo hace problemático usar un modelo como juez de sí mismo.

**Mitigación**: Usar un modelo de familia diferente como juez. Si se evalúa GPT-4, usar Claude como juez y viceversa. O usar múltiples jueces y promediar.

### Limited reasoning bias (sesgo de razonamiento limitado)

En tareas que requieren razonamiento profundo (matemáticas, lógica formal), los jueces LLM pueden no detectar errores sutiles y asignar puntuaciones altas a respuestas incorrectas pero bien escritas.

**Mitigación**: Para estas tareas, combinar LLM-as-Judge con verificación programática (ejecución de código, *formal verification*).

| Sesgo | Prevalencia | Impacto | Mitigación principal |
|---|---|---|---|
| Position bias | ==Muy alta== | Cambia 20-40% veredictos | Doble evaluación con swap |
| Verbosity bias | Alta | Favorece relleno | Instrucciones explícitas |
| Self-enhancement | Moderada-Alta | Invalida auto-evaluación | Juez de familia diferente |
| Limited reasoning | Moderada | Falsos positivos en STEM | Verificación programática |
| Formato/estilo | Moderada | Favorece markdown/listas | Normalización de formato |

---

## Técnicas de calibración

### Chain-of-thought judging

Solicitar al juez que razone paso a paso antes de emitir su veredicto. Esto mejora la consistencia y permite auditar la lógica del juez.

```
Evalúa la siguiente respuesta paso a paso:
1. ¿Es factualmente correcta?
2. ¿Responde completamente a la pregunta?
3. ¿Es clara y bien estructurada?
4. ¿Hay información irrelevante o incorrecta?

Basándote en tu análisis, asigna una puntuación de 1 a 10.
```

### Evaluación multi-dimensión

En lugar de una sola puntuación global, evaluar múltiples dimensiones por separado (precisión factual, completitud, claridad, relevancia, seguridad). Esto reduce la ambigüedad y produce evaluaciones más accionables.

### Juez ensemble

Usar múltiples modelos como jueces y agregar sus veredictos. Reduce el impacto de sesgos específicos de cada modelo y aumenta la robustez.

> [!example]- Diagrama del sistema de calibración
> ```mermaid
> flowchart LR
>     Q[Pregunta] --> J1[Juez GPT-4o]
>     Q --> J2[Juez Claude Opus]
>     Q --> J3[Juez Gemini Ultra]
>     R1[Respuesta A] --> J1
>     R1 --> J2
>     R1 --> J3
>     R2[Respuesta B] --> J1
>     R2 --> J2
>     R2 --> J3
>     J1 -->|Voto + Score| AGG[Agregador]
>     J2 -->|Voto + Score| AGG
>     J3 -->|Voto + Score| AGG
>     AGG --> |Mayoría + promedio| RESULT[Veredicto final]
>     AGG --> |Discrepancia alta| HUMAN[Revisión humana]
> ```

---

## MT-Bench y Chatbot Arena

### MT-Bench

*MT-Bench* es un benchmark de evaluación multi-turno desarrollado por LMSYS[^1]. Consiste en ==80 preguntas cuidadosamente diseñadas en 8 categorías==: escritura, roleplay, razonamiento, matemáticas, programación, extracción, STEM y humanidades. Cada pregunta tiene un follow-up que testa la capacidad de mantener contexto.

Un LLM juez (originalmente GPT-4) evalúa las respuestas en escala 1-10 con referencia a rúbricas detalladas por categoría.

### Chatbot Arena

[[chatbot-arena|Chatbot Arena]] es una plataforma de evaluación "en vivo" donde usuarios reales conversan con dos modelos anónimos y votan cuál prefieren. Usa el sistema de rating *Elo* (adaptado del ajedrez) para construir un ranking. ==A marzo de 2025, ha recopilado más de 1.5 millones de votos humanos==, convirtiéndolo en el benchmark más citado del campo.

La combinación de votos humanos masivos con el sistema Elo produce rankings que correlacionan bien con evaluaciones de expertos, y sirve como ground truth para validar sistemas LLM-as-Judge.

> [!info] Relación MT-Bench y Arena
> MT-Bench y Chatbot Arena son complementarios. MT-Bench es reproducible y controlado; Arena captura preferencias reales de usuarios diversos. Los rankings de ambos ==correlacionan con r>0.9== en los modelos más usados, validando mutuamente ambas metodologías.

---

## Implementación

> [!example]- Ver implementación completa de LLM-as-Judge
> ```python
> """
> Implementación de LLM-as-Judge con mitigación de sesgos.
> Soporta evaluación pairwise y pointwise.
> """
> import json
> import random
> from dataclasses import dataclass
> from enum import Enum
> from typing import Optional
>
> from openai import OpenAI
> # También funciona con Anthropic, usar [[structured-generation]] para parseo
>
>
> class JudgeMode(Enum):
>     PAIRWISE = "pairwise"
>     POINTWISE = "pointwise"
>
>
> @dataclass
> class JudgeResult:
>     score: float  # 1-10 para pointwise, -1/0/1 para pairwise
>     reasoning: str
>     confidence: float
>     position_swapped: bool = False
>
>
> PAIRWISE_PROMPT = """Eres un evaluador experto e imparcial. Tu tarea es comparar
> dos respuestas a una pregunta del usuario y determinar cuál es mejor.
>
> CRITERIOS DE EVALUACIÓN:
> 1. Precisión factual y corrección
> 2. Completitud de la respuesta
> 3. Claridad y estructura
> 4. Relevancia (sin relleno innecesario)
> 5. Utilidad práctica
>
> IMPORTANTE:
> - La longitud NO es un indicador de calidad
> - Evalúa el contenido, no el formato
> - Si ambas son similares en calidad, elige "empate"
>
> Pregunta del usuario:
> {question}
>
> Respuesta A:
> {response_a}
>
> Respuesta B:
> {response_b}
>
> Razona paso a paso y luego responde en JSON:
> {{"reasoning": "tu análisis", "winner": "A" | "B" | "tie", "confidence": 0.0-1.0}}
> """
>
> POINTWISE_PROMPT = """Eres un evaluador experto. Evalúa la siguiente respuesta
> en una escala de 1 a 10 según estos criterios:
>
> - Precisión (1-10): ¿Es factualmente correcta?
> - Completitud (1-10): ¿Responde toda la pregunta?
> - Claridad (1-10): ¿Es fácil de entender?
> - Relevancia (1-10): ¿Se mantiene enfocada?
>
> Pregunta: {question}
> Respuesta: {response}
>
> Razona y responde en JSON:
> {{"reasoning": "análisis", "scores": {{"precision": N, "completitud": N,
>   "claridad": N, "relevancia": N}}, "overall": N, "confidence": 0.0-1.0}}
> """
>
>
> class LLMJudge:
>     """Juez LLM con mitigación de position bias."""
>
>     def __init__(self, model: str = "gpt-4o", temperature: float = 0.0):
>         self.client = OpenAI()
>         self.model = model
>         self.temperature = temperature
>
>     def _call_judge(self, prompt: str) -> dict:
>         response = self.client.chat.completions.create(
>             model=self.model,
>             messages=[{"role": "user", "content": prompt}],
>             temperature=self.temperature,
>             response_format={"type": "json_object"},
>         )
>         return json.loads(response.choices[0].message.content)
>
>     def pairwise_judge(
>         self, question: str, response_a: str, response_b: str
>     ) -> JudgeResult:
>         """
>         Evaluación pairwise CON mitigación de position bias.
>         Evalúa dos veces intercambiando posiciones.
>         """
>         # Primera evaluación: orden original
>         prompt_1 = PAIRWISE_PROMPT.format(
>             question=question, response_a=response_a, response_b=response_b
>         )
>         result_1 = self._call_judge(prompt_1)
>
>         # Segunda evaluación: orden invertido
>         prompt_2 = PAIRWISE_PROMPT.format(
>             question=question, response_a=response_b, response_b=response_a
>         )
>         result_2 = self._call_judge(prompt_2)
>
>         # Reconciliar resultados
>         # Mapear result_2 de vuelta (A en result_2 = B en original)
>         winner_2_mapped = {
>             "A": "B", "B": "A", "tie": "tie"
>         }[result_2["winner"]]
>
>         if result_1["winner"] == winner_2_mapped:
>             # Ambas evaluaciones concuerdan
>             score = {"A": 1, "B": -1, "tie": 0}[result_1["winner"]]
>             confidence = (result_1["confidence"] + result_2["confidence"]) / 2
>         else:
>             # Discrepancia -> empate (probable position bias)
>             score = 0
>             confidence = 0.3  # Baja confianza
>
>         return JudgeResult(
>             score=score,
>             reasoning=f"Eval 1: {result_1['reasoning']}\n"
>                        f"Eval 2 (swapped): {result_2['reasoning']}",
>             confidence=confidence,
>         )
>
>     def pointwise_judge(self, question: str, response: str) -> JudgeResult:
>         """Evaluación pointwise con scoring multi-dimensión."""
>         prompt = POINTWISE_PROMPT.format(
>             question=question, response=response
>         )
>         result = self._call_judge(prompt)
>         return JudgeResult(
>             score=result["overall"],
>             reasoning=result["reasoning"],
>             confidence=result["confidence"],
>         )
>
>
> # Uso
> judge = LLMJudge(model="gpt-4o")
> result = judge.pairwise_judge(
>     question="¿Qué es una red neuronal?",
>     response_a="Una red neuronal es un modelo de ML inspirado en...",
>     response_b="Las redes neuronales son algoritmos que...",
> )
> print(f"Score: {result.score}, Confianza: {result.confidence}")
> print(f"Razonamiento: {result.reasoning}")
> ```

---

## Cuándo usar cada tipo de evaluación

> [!question] ¿LLM-as-Judge, evaluación humana o métricas automáticas?
> La decisión depende del contexto, presupuesto y requisitos de fiabilidad. No son mutuamente excluyentes — los mejores pipelines combinan los tres enfoques.

| Criterio | LLM-as-Judge | Evaluación humana | Métricas automáticas |
|---|---|---|---|
| **Coste por evaluación** | ==~$0.01-0.10== | $1-50 | ~$0 |
| **Latencia** | Segundos | Horas-días | Milisegundos |
| **Escalabilidad** | Alta (miles/hora) | Baja (decenas/día) | Ilimitada |
| **Calidad subjetiva** | Buena (r>0.8 con humanos) | Gold standard | Pobre |
| **Dominios especializados** | Limitada | Excelente | Variable |
| **Reproducibilidad** | Alta (temp=0) | Baja (inter-annotator) | Perfecta |
| **Tareas verificables** | Innecesario (usar métrica) | Innecesario | ==Ideal== |
| **Seguridad / safety** | Complementario | ==Imprescindible== | Complementario |

> [!success] Recomendación práctica
> - **Desarrollo diario**: LLM-as-Judge para iteración rápida sobre prompts y modelos
> - **Release gates**: Combinación de métricas automáticas + LLM-as-Judge + muestra humana
> - **Evaluaciones de seguridad**: Siempre incluir revisión humana experta
> - **Benchmarks públicos**: Evaluación humana masiva (estilo [[chatbot-arena]])

---

## Ventajas y limitaciones

> [!success] Fortalezas
> - Reducción drástica de coste y tiempo vs evaluación humana pura
> - Reproducibilidad alta con temperatura 0
> - Escalabilidad: se pueden evaluar miles de respuestas en minutos
> - Facilita CI/CD para LLMs: se puede integrar en [[testing-agentes-ia|pipelines de testing]]
> - Explainability: el juez proporciona justificación de sus veredictos

> [!failure] Limitaciones
> - Sesgos sistemáticos que requieren mitigación activa
> - No sustituye evaluación humana para decisiones de alto impacto
> - Coste del modelo juez puede acumularse en evaluaciones frecuentes
> - Calidad del juez limitada por las capacidades del modelo (no puede juzgar lo que no entiende)
> - Circularidad: si el modelo juez y el evaluado comparten limitaciones, los errores pasan desapercibidos

> [!warning] Trampa común
> ==No usar el mismo modelo como juez y evaluado==. La auto-evaluación amplifica los sesgos de auto-preferencia y crea un ciclo cerrado donde los defectos del modelo se refuerzan en lugar de detectarse. Ver [[bias-en-llms]] para más contexto sobre sesgos en LLMs.

---

## Estado del arte (2025-2026)

La investigación activa se centra en varias direcciones:

- **Jueces más pequeños y eficientes**: Modelos fine-tuneados específicamente para evaluación (Prometheus[^2], JudgeLM) que logran rendimiento comparable a GPT-4 como juez a una fracción del coste.
- **Jueces multi-modales**: Extensión del paradigma a evaluación de imágenes, código ejecutable y respuestas interactivas.
- **Meta-evaluación**: Desarrollo de benchmarks para evaluar la calidad de los jueces mismos (evaluar al evaluador).
- **Jueces constitucionales**: Integración con [[constitutional-ai|Constitutional AI]] donde el juez evalúa no solo calidad sino adherencia a principios éticos.

> [!question] Debate abierto
> ¿Puede un LLM-as-Judge reemplazar completamente a la evaluación humana?
> - **Posición optimista**: Con suficiente calibración y ensemble de jueces, sí para la mayoría de tareas — defendida por investigadores de LMSYS
> - **Posición escéptica**: Los sesgos compartidos entre modelos crean puntos ciegos sistemáticos que solo humanos pueden detectar — defendida por investigadores de Anthropic[^3]
> - Mi valoración: ==LLM-as-Judge es excelente para desarrollo y screening, pero la evaluación humana sigue siendo necesaria para decisiones finales de alta importancia==

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake podría integrar un LLM-as-Judge para evaluar la calidad de la documentación generada y el código extraído, comparando múltiples estrategias de extracción
> - **[[architect-overview|architect]]**: El self-evaluator de architect es una implementación directa de LLM-as-Judge pointwise — evalúa la calidad del código generado antes de commit, usando rúbricas específicas por tipo de tarea
> - **[[vigil-overview|vigil]]**: vigil puede usar LLM-as-Judge para evaluar si las correcciones de seguridad sugeridas son válidas y completas, complementando el análisis estático con juicio semántico
> - **[[licit-overview|licit]]**: Para evaluación de compliance, LLM-as-Judge puede verificar si la documentación generada cumple los requisitos del [[eu-ai-act-completo|EU AI Act]], aunque siempre requiere revisión legal humana final

---

## Enlaces y referencias

**Notas relacionadas:**
- [[model-evaluation-practice]] — Framework completo de evaluación en producción
- [[chatbot-arena]] — Plataforma de evaluación con votos humanos masivos
- [[mt-bench]] — Benchmark multi-turno basado en LLM-as-Judge
- [[bias-en-llms]] — Sesgos inherentes en modelos de lenguaje
- [[structured-generation]] — Generación estructurada para parsear respuestas del juez
- [[rlhf]] — El paradigma de reward modeling comparte filosofía con LLM-as-Judge
- [[testing-agentes-ia|Testing de agentes]] — Integración de evaluadores en pipelines

> [!quote]- Referencias bibliográficas
> - Zheng, L. et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", NeurIPS 2023
> - Kim, S. et al., "Prometheus: Inducing Fine-grained Evaluation Capability in Language Models", ICLR 2024
> - Stureborg, R. et al., "Large Language Models are Inconsistent and Biased Evaluators", 2024
> - Documentación LMSYS Chatbot Arena: https://chat.lmsys.org/
> - Li, X. et al., "Alpaca Eval: An Automatic Evaluator of Instruction-Following Models", 2023

[^1]: Zheng, L. et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." NeurIPS 2023. Establecieron que GPT-4 como juez tiene >80% de concordancia con evaluadores humanos expertos.
[^2]: Kim, S. et al. "Prometheus: Inducing Fine-grained Evaluation Capability in Language Models." ICLR 2024. Demostraron que un modelo 13B fine-tuneado puede alcanzar rendimiento comparable a GPT-4 como juez en dominios específicos.
[^3]: Anthropic, "Challenges in Evaluating AI Systems", 2024. Argumentan que los sesgos compartidos entre modelos de la misma generación crean puntos ciegos que solo la evaluación humana diversa puede cubrir.
