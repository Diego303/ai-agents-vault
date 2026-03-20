---
tags:
  - concepto
  - fundamentos
  - fine-tuning
aliases:
  - transfer learning
  - aprendizaje por transferencia
  - aprendizaje transferido
  - pre-training and fine-tuning
created: 2025-06-01
updated: 2025-06-01
category: fundamentos-ia
status: evergreen
difficulty: intermediate
related:
  - "[[embeddings]]"
  - "[[transformer-architecture]]"
  - "[[lora-qlora]]"
  - "[[rlhf]]"
  - "[[datasets-entrenamiento]]"
  - "[[metricas-evaluacion-ia]]"
  - "[[foundation-models]]"
up: "[[moc-fundamentos]]"
---

# Transfer Learning

> [!abstract] Resumen
> *Transfer learning* (aprendizaje por transferencia) es el paradigma que permite reutilizar conocimiento aprendido en una tarea para mejorar el rendimiento en otra diferente. ==Es la razón por la cual los LLMs modernos pueden realizar tareas para las que nunca fueron explícitamente entrenados==. Desde el transfer learning en visión con *ImageNet* hasta el paradigma pre-training → fine-tuning que define la era actual de la IA, esta técnica ha reducido los costes de entrenamiento en órdenes de magnitud y ha democratizado el acceso a modelos de alto rendimiento. ^resumen

## Qué es y por qué importa

**Transfer learning** es la técnica de tomar un modelo entrenado en una tarea (generalmente con datos abundantes) y adaptarlo a una tarea diferente (generalmente con datos escasos). La intuición es que ==las representaciones aprendidas en la tarea fuente capturan conocimiento general que es útil para la tarea objetivo==.

El problema que resuelve: entrenar un modelo desde cero para cada nueva tarea requiere enormes cantidades de datos etiquetados y computación. Transfer learning permite:

1. **Reducir datos necesarios**: de millones de ejemplos a cientos o incluso cero (*zero-shot*)
2. **Reducir computación**: de semanas en clusters de GPUs a horas en una sola GPU
3. **Mejorar rendimiento**: los modelos pre-entrenados superan a modelos entrenados desde cero con datos limitados
4. **Democratizar la IA**: organizaciones sin recursos masivos pueden usar modelos de vanguardia

> [!tip] Cuándo usar transfer learning
> - **Usar siempre**: es el enfoque por defecto en IA moderna. ==Entrenar desde cero solo se justifica si tienes datos a escala de internet y presupuesto de millones de dólares==
> - **Fine-tuning completo**: cuando tienes miles de ejemplos y la tarea difiere significativamente del pre-entrenamiento
> - **Fine-tuning eficiente ([[lora-qlora|LoRA]])**: cuando quieres adaptar sin modificar todo el modelo
> - **Zero/Few-shot (prompting)**: cuando tienes muy pocos o ningún ejemplo. Ver [[chain-of-thought]]

---

## Historia y evolución

### Antes de transfer learning: la era del entrenamiento desde cero

Antes de 2012, cada tarea de ML requería:
- Diseñar features manualmente (*feature engineering*)
- Recolectar datos etiquetados específicos para la tarea
- Entrenar un modelo desde cero
- Repetir para cada nueva tarea

==El conocimiento era intransferible==. Un modelo de detección de gatos no ayudaba a detectar perros.

### La revolución ImageNet (2012-2017)

> [!example]- Ver línea temporal del transfer learning
> ```mermaid
> timeline
>     title Evolución del Transfer Learning
>     2012 : AlexNet gana ImageNet
>          : Se descubre que features CNN son transferibles
>     2014 : VGG, GoogLeNet
>          : Transfer learning en visión se vuelve estándar
>     2017 : "Attention is All You Need"
>          : Arquitectura Transformer
>     2018 : ULMFiT (primer transfer learning para NLP)
>          : ELMo, GPT-1, BERT
>          : Pre-train → Fine-tune se vuelve dominante
>     2020 : GPT-3: few-shot sin fine-tuning
>          : Scaling laws
>     2022 : ChatGPT, InstructGPT
>          : RLHF como fine-tuning de alineación
>     2023 : LoRA/QLoRA democratizan fine-tuning
>          : Foundation models como servicio
>     2024 : Modelos open-weight (LLaMA 3, Mistral)
>          : Fine-tuning como commodity
>     2025 : Transfer learning multimodal
>          : Adaptación eficiente como estándar
> ```

**AlexNet (2012)** ganó la competición ImageNet con una CNN profunda. Pero el descubrimiento realmente transformador fue que ==las capas iniciales de la red aprendían features visuales universales== (bordes, texturas, formas) que eran útiles para cualquier tarea de visión[^1].

**El protocolo de transfer learning en visión:**

1. Tomar un modelo pre-entrenado en ImageNet (1.2M imágenes, 1000 clases)
2. Remover la última capa (clasificador)
3. Congelar las capas iniciales (features universales)
4. Reentrenar las últimas capas con datos de la nueva tarea
5. Opcionalmente, descongelar gradualmente (*gradual unfreezing*)

> [!example]- Ver diagrama de transfer learning en visión
> ```mermaid
> flowchart TD
>     subgraph Pre["Modelo Pre-entrenado (ImageNet)"]
>         L1["Conv 1-3<br/>Bordes, texturas<br/>🔒 Congelado"] --> L2["Conv 4-6<br/>Patrones, partes<br/>🔒 Congelado"]
>         L2 --> L3["Conv 7-10<br/>Objetos parciales<br/>🔓 Fine-tune"]
>         L3 --> L4["FC + Softmax<br/>1000 clases ImageNet<br/>❌ Eliminado"]
>     end
>
>     subgraph Fine["Modelo Fine-tuned"]
>         F1["Conv 1-3<br/>🔒 Congelado"] --> F2["Conv 4-6<br/>🔒 Congelado"]
>         F2 --> F3["Conv 7-10<br/>🔓 Ajustado"]
>         F3 --> F4["FC + Softmax<br/>3 clases nuevas<br/>✅ Nuevo"]
>     end
>
>     Pre -.->|"Transferir pesos"| Fine
> ```

### La transición a NLP (2018)

Durante años, NLP se resistió al transfer learning. Los modelos de lenguaje no parecían transferir bien entre tareas. Tres trabajos en 2018 cambiaron esto dramáticamente:

**ULMFiT** (Howard & Ruder, 2018)[^2]: demostró transfer learning efectivo para NLP con tres innovaciones clave:
1. *Discriminative fine-tuning*: diferentes learning rates para diferentes capas
2. *Slanted triangular learning rates*: schedules de learning rate específicos
3. *Gradual unfreezing*: descongelar capas progresivamente

==ULMFiT logró resultados estado del arte en clasificación de texto con solo 100 ejemplos etiquetados==.

**GPT-1** (Radford et al., 2018)[^3]: primer uso de Transformers para pre-entrenamiento generativo seguido de fine-tuning discriminativo.

**BERT** (Devlin et al., 2018)[^4]: pre-entrenamiento bidireccional con *masked language modeling*, seguido de fine-tuning. ==BERT hizo que el paradigma pre-train → fine-tune fuera el estándar universal de NLP==.

---

## El paradigma Pre-training → Fine-tuning

### Fase 1: Pre-entrenamiento (*Pre-training*)

El modelo aprende representaciones generales del lenguaje a partir de datos no etiquetados a escala masiva.

| Aspecto | Detalles |
|---|---|
| **Datos** | Terabytes de texto (Common Crawl, libros, código). Ver [[datasets-entrenamiento]] |
| **Objetivo** | Predecir la siguiente palabra (GPT) o palabras enmascaradas (BERT) |
| **Coste** | ==Millones de dólares== (GPT-4 estimado en $50-100M) |
| **Duración** | Semanas o meses en miles de GPUs |
| **Quién lo hace** | OpenAI, Google, Meta, Anthropic, Mistral, pocos más |
| **Resultado** | *Foundation model* con conocimiento general |

### Fase 2: Fine-tuning

El modelo se adapta a una tarea o comportamiento específico.

| Tipo de fine-tuning | Datos necesarios | Coste | Resultado |
|---|---|---|---|
| **Supervised Fine-Tuning (SFT)** | Miles de pares (input, output) | $10-$1,000 | Modelo especializado en tarea |
| **Instruction Tuning** | Miles de instrucciones diversas | $100-$10,000 | Modelo que sigue instrucciones |
| **RLHF** ([[rlhf]]) | Miles de comparaciones humanas | $10,000-$100,000 | Modelo alineado con preferencias |
| **DPO** | Miles de pares preferido/rechazado | $1,000-$10,000 | Alternativa más simple a RLHF |
| **LoRA/QLoRA** ([[lora-qlora]]) | Cientos a miles de ejemplos | ==$1-$100== | Adaptación eficiente con pocos recursos |

^tabla-tipos-finetuning

> [!example]- Ver pipeline completo de pre-training a deployment
> ```mermaid
> flowchart TD
>     subgraph PT["Pre-training (meses, $$$)"]
>         D["Datos masivos<br/>[[datasets-entrenamiento]]<br/>~15T tokens"] --> M["Entrenamiento<br/>autoregresivo<br/>next-token prediction"]
>         M --> BM["Base Model<br/>(no sigue instrucciones)"]
>     end
>
>     subgraph FT["Fine-tuning (días, $$)"]
>         BM --> SFT["SFT<br/>Instruction tuning<br/>~100K ejemplos"]
>         SFT --> RM["Reward Model<br/>~50K comparaciones"]
>         RM --> RLHF["RLHF / DPO<br/>Alineación"]
>         RLHF --> AM["Aligned Model<br/>(ChatGPT, Claude)"]
>     end
>
>     subgraph AD["Adaptación (horas, $)"]
>         AM --> LORA["LoRA fine-tune<br/>Datos específicos"]
>         AM --> PROMPT["Prompt engineering<br/>Zero/few-shot"]
>         AM --> RAG["RAG pipeline<br/>[[pattern-rag]]"]
>     end
>
>     style PT fill:#922,stroke:#333
>     style FT fill:#952,stroke:#333
>     style AD fill:#295,stroke:#333
> ```

---

## Foundation Models: el concepto

El término *foundation model* (modelo fundacional) fue acuñado por el Stanford HAI en 2021[^5] para describir modelos que:

1. Se entrenan en datos amplios y a gran escala
2. Se adaptan (*fine-tune*) a múltiples tareas downstream
3. ==Sirven como base ("foundation") para una variedad de aplicaciones==

> [!info] Ejemplos de foundation models
> | Modalidad | Modelos | Pre-entrenamiento |
> |---|---|---|
> | **Texto** | GPT-4, Claude, LLaMA, Gemini | Predicción de siguiente token |
> | **Código** | Codex, DeepSeek Coder, StarCoder | Predicción de siguiente token en código |
> | **Imagen** | DALL-E, Stable Diffusion, Midjourney | Difusión / reconstrucción |
> | **Multimodal** | GPT-4V, Gemini, LLaVA | Alineación texto-imagen |
> | **Audio** | Whisper, SeamlessM4T | Transcripción / traducción |
> | **Video** | Sora, Runway Gen-3 | Predicción de frames |

> [!warning] Los foundation models no son omniscientes
> Un foundation model puede tener conocimiento general impresionante, pero ==carece de conocimiento actualizado, datos privados de tu organización, y puede alucinar con confianza==. Por eso las técnicas de adaptación ([[pattern-rag|RAG]], fine-tuning, [[context-engineering-overview|context engineering]]) son esenciales.

---

## Cómo transfer learning habilita few-shot learning

Una de las consecuencias más sorprendentes del transfer learning a escala es la capacidad emergente de *in-context learning* (ICL), donde ==el modelo aprende de ejemplos proporcionados en el prompt sin actualizar sus pesos==.

GPT-3 (Brown et al., 2020)[^6] demostró que los LLMs suficientemente grandes pueden:

- **Zero-shot**: realizar tareas con solo una instrucción
- **One-shot**: realizar tareas con un solo ejemplo
- **Few-shot**: realizar tareas con 2-32 ejemplos

```
# Zero-shot
Traduce al francés: "Hello world"
→ "Bonjour le monde"

# One-shot
Traduce al francés:
"Good morning" → "Bonjour"
"Hello world" → ?
→ "Bonjour le monde"

# Few-shot
Traduce al francés:
"Good morning" → "Bonjour"
"Thank you" → "Merci"
"Hello world" → ?
→ "Bonjour le monde"
```

> [!question] Debate abierto: ¿por qué funciona el in-context learning?
> Existen teorías contrapuestas:
> - **Posición A (aprendizaje implícito)**: durante el pre-entrenamiento, el modelo aprende a "aprender de ejemplos" como una habilidad emergente — defendida por el grupo de Stanford (Xie et al.)
> - **Posición B (recuperación de tareas)**: el modelo ya "sabe" hacer la tarea y los ejemplos solo activan el conocimiento correcto — defendida por Min et al.
> - **Posición C (gradient descent implícito)**: los Transformers implementan implícitamente un paso de gradient descent cuando procesan ejemplos in-context — defendida por Akyürek et al., von Oswald et al.
> Mi valoración: ==la evidencia más reciente sugiere que es una combinación de B y C, donde los modelos aprenden circuitos de meta-aprendizaje durante el pre-entrenamiento==.

---

## Conexión con técnicas modernas de fine-tuning

El transfer learning ha evolucionado desde "congelar capas y reentrenar las últimas" hasta un ecosistema sofisticado de técnicas de adaptación:

### Espectro de adaptación

| Técnica | Parámetros modificados | Datos necesarios | Coste | Profundidad de adaptación |
|---|---|---|---|---|
| **Prompting** | 0 | 0-32 ejemplos | $0 | Superficial |
| **RAG** ([[pattern-rag]]) | 0 | Base de documentos | $ | Conocimiento externo |
| **Prompt tuning** | ~20K | Cientos | $ | Ligera |
| **LoRA** ([[lora-qlora]]) | ~1-10M | Miles | $-$$ | ==Mejor balance== |
| **QLoRA** | ~1-10M (en 4-bit) | Miles | $ | Balance + eficiencia |
| **Full fine-tuning** | Todos (7B-70B+) | Miles-Millones | $$$ | Profunda |
| **Pre-training continuo** | Todos | Millones-Billones | $$$$ | Máxima |

^espectro-adaptacion

### LoRA: la democratización del fine-tuning

*Low-Rank Adaptation* (LoRA)[^7] es la técnica de fine-tuning eficiente (*PEFT — Parameter-Efficient Fine-Tuning*) más influyente. En lugar de modificar todos los pesos del modelo:

1. **Congela** todos los pesos originales del modelo
2. **Inyecta** matrices de bajo rango (rank 8-64) en capas específicas
3. **Entrena** solo estas matrices adicionales (==típicamente 0.1-1% de los parámetros totales==)

> [!example]- Ver diagrama de LoRA
> ```mermaid
> flowchart LR
>     subgraph Original["Capa original (congelada)"]
>         X["Input x"] --> W["W (d×d)<br/>Pesos congelados<br/>🔒"]
>         W --> H["Output h = Wx"]
>     end
>
>     subgraph LoRA["Con adaptación LoRA"]
>         X2["Input x"] --> W2["W (d×d)<br/>🔒 Congelado"]
>         X2 --> A["A (d×r)<br/>🔓 Entrenable"]
>         A --> B["B (r×d)<br/>🔓 Entrenable"]
>         W2 --> SUM(("+"))
>         B --> SUM
>         SUM --> H2["Output h = Wx + BAx"]
>     end
>
>     style A fill:#2d5
>     style B fill:#2d5
> ```
>
> Donde `r` (rank) es típicamente 8-64, mucho menor que `d` (dimensión del modelo, típicamente 4096-8192).

> [!success] Impacto práctico de LoRA
> - Fine-tuning de LLaMA-7B: de 112GB VRAM (full) a ==6GB VRAM (QLoRA en 4-bit)==
> - Coste: de $1,000+ a $10-50 en cloud GPUs
> - Tiempo: de días a horas
> - Resultado: 90-95% del rendimiento de full fine-tuning en la mayoría de tareas

---

## Ventajas y limitaciones

> [!success] Fortalezas del transfer learning
> - Reduce drásticamente los requisitos de datos etiquetados
> - Permite aprovechar el conocimiento del mundo contenido en modelos pre-entrenados
> - Democratiza el acceso a IA de alto rendimiento
> - Las representaciones aprendidas son robustas y generalizables
> - Permite adaptación rápida a nuevos dominios y tareas

> [!failure] Limitaciones
> - **Negative transfer**: cuando la tarea fuente y objetivo son muy diferentes, la transferencia puede empeorar el rendimiento
> - **Catastrophic forgetting**: al fine-tunear agresivamente, el modelo puede "olvidar" conocimiento general del pre-entrenamiento
> - **Sesgo transferido**: ==los sesgos del modelo pre-entrenado se transfieren a las tareas downstream==
> - **Dependencia del modelo base**: la calidad del fine-tuning está limitada por la calidad del pre-entrenamiento
> - **Homogeneización**: si todos usan el mismo modelo base, los errores sistémicos se propagan por todo el ecosistema

> [!danger] Riesgo: catastrophic forgetting
> Al hacer fine-tuning, es posible que el modelo pierda capacidades generales. Esto es especialmente problemático en modelos que se usan para múltiples tareas. Mitigaciones:
> - Usar LoRA (los pesos originales no se modifican)
> - Learning rates muy bajos
> - Mezclar datos de la tarea original con la nueva
> - Evaluación periódica en benchmarks generales ([[metricas-evaluacion-ia]])

---

## Estado del arte (2025-2026)

### Tendencias actuales

1. **Adaptación como servicio**: plataformas como OpenAI, Together AI y Fireworks ofrecen fine-tuning de modelos con unos pocos clicks
2. **Merging de modelos**: técnicas como TIES-Merging y DARE que combinan múltiples modelos fine-tuned sin reentrenamiento
3. **Continual pre-training**: adaptar modelos base a dominios específicos antes del fine-tuning (e.g., modelos médicos, legales, financieros)
4. **Multi-task fine-tuning**: entrenamiento simultáneo en múltiples tareas para mejorar generalización

> [!info] El futuro: ¿fin del fine-tuning?
> ==Existe un debate creciente sobre si el fine-tuning será menos necesario a medida que los modelos base mejoran y las técnicas de prompting/RAG avanzan==. Sin embargo, para tareas especializadas con requisitos de formato, estilo o conocimiento específico, el fine-tuning sigue siendo la herramienta más efectiva.

| Escenario | Técnica recomendada (2025) |
|---|---|
| Añadir conocimiento reciente | [[pattern-rag\|RAG]] |
| Cambiar estilo/formato de respuesta | SFT con LoRA |
| Dominio muy especializado (medicina, legal) | Continual pre-training + SFT |
| Alineación con preferencias del usuario | DPO con LoRA |
| Mejora general de instrucción | Instruction tuning con LoRA |
| Tarea completamente nueva | Few-shot prompting primero, fine-tuning si no es suficiente |

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake procesa documentos que pueden usarse como datos de entrenamiento para fine-tuning de modelos específicos del dominio
> - **[[architect-overview|architect]]**: architect se beneficia de modelos fine-tuned en generación de código, especialmente para patrones arquitectónicos del stack propio
> - **[[vigil-overview|vigil]]**: vigil puede detectar regresiones de rendimiento después de fine-tuning, monitorizando métricas de calidad en producción
> - **[[licit-overview|licit]]**: licit debe validar que los datos de fine-tuning cumplen regulaciones y que los modelos fine-tuned heredan las licencias del modelo base

---

## Enlaces y referencias

**Notas relacionadas:**
- [[embeddings]] — Los embeddings son una forma concreta de transfer learning
- [[transformer-architecture]] — Base arquitectónica del paradigma actual
- [[lora-qlora]] — Técnica de fine-tuning eficiente más importante
- [[rlhf]] — Fine-tuning de alineación con preferencias humanas
- [[datasets-entrenamiento]] — Los datos que alimentan el pre-entrenamiento
- [[chain-of-thought]] — Técnica de prompting que aprovecha el transfer learning
- [[foundation-models]] — Concepto derivado del transfer learning a escala

> [!quote]- Referencias bibliográficas
> - Yosinski, J. et al. "How transferable are features in deep neural networks?", NeurIPS 2014
> - Howard, J. & Ruder, S. "Universal Language Model Fine-tuning for Text Classification" (ULMFiT), ACL 2018
> - Radford, A. et al. "Improving Language Understanding by Generative Pre-Training" (GPT-1), OpenAI 2018
> - Devlin, J. et al. "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", NAACL 2019
> - Bommasani, R. et al. "On the Opportunities and Risks of Foundation Models", Stanford HAI 2021
> - Brown, T. et al. "Language Models are Few-Shot Learners" (GPT-3), NeurIPS 2020
> - Hu, E. et al. "LoRA: Low-Rank Adaptation of Large Language Models", ICLR 2022
> - Dettmers, T. et al. "QLoRA: Efficient Finetuning of Quantized Language Models", NeurIPS 2023

[^1]: Yosinski et al., "How transferable are features in deep neural networks?", NeurIPS 2014. Estudio fundacional sobre transferibilidad de features.
[^2]: Howard & Ruder, "ULMFiT", ACL 2018. Primer transfer learning exitoso para NLP general.
[^3]: Radford et al., "Improving Language Understanding by Generative Pre-Training", 2018. GPT-1.
[^4]: Devlin et al., "BERT", NAACL 2019. Estableció pre-train → fine-tune como paradigma dominante.
[^5]: Bommasani et al., "On the Opportunities and Risks of Foundation Models", Stanford HAI 2021. Acuñó el término "foundation model".
[^6]: Brown et al., "Language Models are Few-Shot Learners", NeurIPS 2020. Demostró in-context learning con GPT-3.
[^7]: Hu et al., "LoRA: Low-Rank Adaptation of Large Language Models", ICLR 2022. Técnica de fine-tuning eficiente más utilizada.
