---
tags:
  - concepto
aliases:
  - Glosario
  - Glossary
created: 2025-06-01
updated: 2025-06-01
status: draft
---

# Glosario Maestro A-Z

> [!abstract] Resumen
> Glosario exhaustivo de términos técnicos usados en el vault. ==200+ definiciones== organizadas alfabéticamente con enlaces a las notas donde se profundiza cada concepto. ^resumen

> [!info] Convenciones
> - Cada término incluye: definición concisa + enlace a nota detallada (si existe)
> - Los términos en inglés se mantienen cuando son estándar del sector
> - ==Highlighted== indica términos críticos para el ecosistema propio

---

## A

- **A2A (Agent-to-Agent)**: Protocolo de Google para comunicación directa entre agentes de IA mediante Agent Cards y task lifecycle. Ver [[a2a-protocol]]
- **Adapter**: Módulo pequeño añadido a un modelo pre-entrenado para fine-tuning eficiente sin modificar los pesos originales. Ver [[lora-qlora]]
- **Agentic RAG**: Variante de RAG donde un agente orquesta múltiples retrievals adaptativamente. Ver [[advanced-rag]]
- **Agentic Workflow**: Flujo de trabajo orquestado por agentes de IA con toma de decisiones autónoma. Ver [[agentic-workflows]]
- **AGI (Artificial General Intelligence)**: IA hipotética con capacidad de razonamiento general comparable a humanos. Ver [[agi-debates]]
- **Alignment**: Proceso de alinear el comportamiento de un modelo con intenciones y valores humanos. Ver [[alignment]]
- **ALiBi (Attention with Linear Biases)**: Técnica de positional encoding que permite generalizar a secuencias más largas que las de entrenamiento. Ver [[context-window]]
- ==**Annex IV**==: Documentación técnica requerida por el EU AI Act para sistemas de alto riesgo. Ver [[eu-ai-act-anexo-iv]]
- **Anti-pattern**: Patrón de diseño contraproducente que parece solución pero crea problemas. Ver [[anti-patterns-ia]]
- ==**Architect**==: CLI del ecosistema propio que convierte LLMs en agentes de código autónomos. Ver [[architect-overview]]
- **Assertion**: Verificación en tests que valida un resultado esperado. Tests sin assertions son "test theater". Ver [[tests-vacios-cobertura-falsa]]
- **Attention mechanism**: Mecanismo que permite al modelo ponderar la relevancia de cada token respecto al contexto. Ver [[transformer-architecture]]
- **Auto-review**: Revisión automática de código por un agente en contexto limpio tras la generación. Ver [[architect-overview#Auto-Review]]

## B

- **Batch inference**: Procesamiento de múltiples prompts en lote para optimizar throughput y coste. Ver [[inference-optimization]]
- **BM25**: Algoritmo de sparse retrieval basado en frecuencia de términos, complementario a dense retrieval. Ver [[retrieval-strategies]]
- **BPE (Byte-Pair Encoding)**: Algoritmo de tokenización que fusiona iterativamente los pares de bytes más frecuentes. Ver [[tokenizacion]]
- **Budget enforcement**: Control de costes con límite máximo en operaciones de agentes. Ver [[architect-overview#Cost Management]]

## C

- **Chain of Thought (CoT)**: Técnica de prompting que solicita razonamiento paso a paso antes de la respuesta final. Ver [[chain-of-thought]]
- **Checkpoint**: Punto de guardado del estado en pipelines o entrenamiento para recovery o rollback. Ver [[architect-pipelines]]
- **Chunking**: Proceso de dividir documentos largos en fragmentos para indexación y retrieval en RAG. Ver [[chunking-strategies]]
- **Circuit breaker**: Patrón que detecta degradación de un servicio LLM y redirecciona automáticamente. Ver [[pattern-circuit-breaker]]
- **Coding agent**: Agente de IA especializado en escritura, modificación y debugging de código. Ver [[coding-agents]]
- **ColBERT**: Modelo de reranking basado en interacción token-level entre query y documento. Ver [[reranking]]
- **Compliance gate**: Verificación automática de cumplimiento regulatorio en pipelines CI/CD. Ver [[compliance-cicd]]
- **Constitutional AI**: Técnica de Anthropic para alinear modelos usando principios constitucionales en lugar de feedback humano directo. Ver [[constitutional-ai-paper]]
- **Context engineering**: Disciplina de diseñar y optimizar el contexto completo que recibe un LLM. Ver [[context-engineering-overview]]
- **Context window**: Cantidad máxima de tokens que un modelo puede procesar en una sola llamada. Ver [[context-window]]
- **CORS (Cross-Origin Resource Sharing)**: Mecanismo de seguridad del navegador; código AI suele desactivarlo inseguramente. Ver [[cors-seguridad-ia]]
- **Cross-encoder**: Modelo que procesa query y documento juntos para scoring de relevancia. Ver [[reranking]]
- **CWE**: Common Weakness Enumeration, catálogo estándar de debilidades de software. Ver [[vigil-vulnerability-catalog]]

## D

- **Damerau-Levenshtein**: Distancia de edición que incluye transposiciones; usada en detección de typosquatting. Ver [[slopsquatting]]
- **Data drift**: Cambio gradual en la distribución de datos de entrada que degrada el rendimiento. Ver [[drift-detection]]
- **Data poisoning**: Inyección de datos maliciosos en el entrenamiento para manipular el modelo. Ver [[model-security]]
- **Decoder-only**: Arquitectura de transformer que solo usa decoder (GPT, Llama, etc.). Ver [[arquitecturas-llm]]
- **Dense retrieval**: Búsqueda basada en similitud de embeddings vectoriales. Ver [[retrieval-strategies]]
- **Dependency confusion**: Ataque supply chain donde un paquete público sustituye a uno privado. Ver [[supply-chain-attacks-ia]]
- **Distillation**: Transferencia de conocimiento de un modelo grande (teacher) a uno pequeño (student). Ver [[distillation]]
- **DPO (Direct Preference Optimization)**: Alternativa a RLHF que optimiza directamente sobre preferencias sin reward model. Ver [[dpo-alternativas]]
- **Dry-run**: Modo de ejecución que simula acciones sin ejecutarlas realmente. Ver [[architect-overview#Dry-Run]]
- **DSPy**: Framework de Stanford para programar (no promptear) modelos de lenguaje. Ver [[dspy]]

## E

- **Embeddings**: Representaciones vectoriales densas de texto que capturan significado semántico. Ver [[embeddings]]
- **Encoder-decoder**: Arquitectura transformer completa (T5, BART). Ver [[arquitecturas-llm]]
- **EU AI Act**: Regulación de la Unión Europea que clasifica y regula sistemas de IA por nivel de riesgo. Ver [[eu-ai-act-completo]]
- **Eval/Evaluation**: Proceso de medir el rendimiento de modelos o agentes contra métricas definidas. Ver [[agent-evaluation]]
- **Evidence bundle**: Conjunto de evidencias recopiladas para evaluación de compliance. Ver [[licit-architecture]]

## F

- **Faithfulness**: Métrica RAG que mide si la respuesta es fiel al contexto recuperado. Ver [[rag-evaluation]]
- **Feature flag**: Toggle que permite activar/desactivar funcionalidades sin deploy. Ver [[feature-flags-ia]]
- **Few-shot**: Técnica de prompting que incluye ejemplos de input/output deseado. Ver [[tecnicas-basicas]]
- **Fine-tuning**: Proceso de adaptar un modelo pre-entrenado a una tarea específica con datos adicionales. Ver [[fine-tuning-overview]]
- ==**FRIA (Fundamental Rights Impact Assessment)**==: Evaluación de impacto en derechos fundamentales requerida por EU AI Act. Ver [[eu-ai-act-fria]]
- **Function calling**: Capacidad de LLMs para invocar funciones/herramientas estructuradamente. Ver [[tool-use-function-calling]]

## G

- **GGUF**: Formato de cuantización para modelos locales, sucesor de GGML, usado por llama.cpp. Ver [[inference-optimization]]
- **Graph RAG**: Combinación de knowledge graphs con RAG para capturar relaciones entre entidades. Ver [[graph-rag]]
- **Guardrails**: Reglas deterministas que restringen el comportamiento de agentes de IA. Ver [[guardrails-deterministas]]
- **gVisor**: Sandbox de kernel de Google para aislamiento de contenedores. Ver [[sandboxing-agentes]]

## H

- **Hallucination**: Generación de información falsa o inventada por un LLM. Ver [[hallucinations]]
- **HNSW (Hierarchical Navigable Small World)**: Algoritmo de indexación para búsqueda aproximada de vecinos más cercanos. Ver [[indexing-strategies]]
- **Human-in-the-loop (HITL)**: Patrón donde un humano revisa y aprueba acciones del agente. Ver [[pattern-human-in-loop]]
- **HyDE (Hypothetical Document Embeddings)**: Técnica de retrieval que genera un documento hipotético para mejorar la búsqueda. Ver [[retrieval-strategies]]

## I

- ==**Intake**==: CLI del ecosistema propio que transforma requisitos heterogéneos en specs normalizadas. Ver [[intake-overview]]
- **Inference**: Proceso de generar predicciones/respuestas usando un modelo entrenado. Ver [[inference-optimization]]
- **Instruction tuning**: Fine-tuning para que el modelo siga instrucciones de forma natural. Ver [[instruction-tuning]]

## J

- **Jailbreak**: Técnica para evadir las restricciones de seguridad de un LLM. Ver [[prompt-injection-seguridad]]
- **JSON mode**: Modo de generación que fuerza output JSON válido. Ver [[structured-generation]]
- **JUnit XML**: Formato estándar de reporte de tests usado en CI/CD. Ver [[vigil-overview#Output Formats]]

## K

- **Knowledge graph**: Grafo de entidades y relaciones usado para representación de conocimiento. Ver [[graph-rag]]
- **KV-cache**: Caché de key-value pairs en attention layers para acelerar generación autoregresiva. Ver [[inference-optimization]]

## L

- **LangChain**: Framework popular para construir aplicaciones con LLMs. Ver [[langchain-deep-dive]]
- **LangGraph**: Extensión de LangChain basada en grafos de estados para agentes. Ver [[langgraph]]
- **Langfuse**: Plataforma open source de observabilidad para LLMs. Ver [[langfuse]]
- ==**Licit**==: CLI del ecosistema propio para compliance regulatorio y trazabilidad de código IA. Ver [[licit-overview]]
- **LiteLLM**: Proxy universal que unifica 100+ proveedores de LLM bajo una API. Ver [[litellm]]
- **LLM (Large Language Model)**: Modelo de lenguaje con miles de millones de parámetros entrenado en texto masivo. Ver [[que-son-llms]]
- **LLMOps**: Disciplina operativa específica para sistemas basados en LLMs. Ver [[llmops]]
- **LoRA (Low-Rank Adaptation)**: Técnica de fine-tuning eficiente que entrena adaptadores de bajo rango. Ver [[lora-qlora]]

## M

- **MCP (Model Context Protocol)**: Protocolo de Anthropic para comunicación estandarizada entre LLMs y herramientas/datos. Ver [[mcp-protocol]]
- **Merkle tree**: Estructura de datos criptográfica usada para verificación de integridad en lotes. Ver [[licit-architecture]]
- **Mixture of Experts (MoE)**: Arquitectura que activa solo un subconjunto de parámetros por token. Ver [[arquitecturas-llm]]
- **MLOps**: Disciplina que une ML engineering y operaciones para producción. Ver [[mlops-overview]]
- **MOC (Map of Content)**: Nota índice que agrupa y conecta notas de un tema. Ver [[HOME]]
- **Model collapse**: Degradación de calidad cuando modelos se entrenan con datos generados por otros modelos. Ver [[model-collapse]]
- **Multi-agent system**: Sistema con múltiples agentes que colaboran o compiten. Ver [[multi-agent-systems]]
- **Multimodal**: Modelo o sistema que procesa múltiples tipos de input (texto, imagen, audio). Ver [[multimodal]]

## N

- **NIST AI RMF**: Framework de gestión de riesgos de IA del National Institute of Standards and Technology. Ver [[nist-ai-rmf]]

## O

- **Ollama**: Herramienta para ejecutar modelos de lenguaje localmente. Ver [[ollama]]
- **OpenTelemetry (OTel)**: Framework de observabilidad abierto para trazas, métricas y logs. Ver [[opentelemetry-ia]]
- **OWASP Agentic Top 10**: Lista de los 10 principales riesgos de seguridad en agentes de IA. Ver [[owasp-agentic-top10]]
- **OWASP LLM Top 10**: Lista de los 10 principales riesgos de seguridad en aplicaciones LLM. Ver [[owasp-llm-top10]]

## P

- **Paged attention**: Técnica de gestión de memoria que organiza KV-cache en bloques para servir múltiples secuencias eficientemente. Ver [[inference-optimization]]
- **PEFT (Parameter-Efficient Fine-Tuning)**: Familia de técnicas que adaptan modelos modificando pocos parámetros. Ver [[lora-qlora]]
- **Pipeline**: Secuencia de pasos declarativos para automatizar workflows. Ver [[pipelines-declarativos]]
- **Positional encoding**: Mecanismo que inyecta información de posición en secuencias para transformers. Ver [[transformer-architecture]]
- **Prompt caching**: Reutilización de la computación de prefijos largos para reducir latencia y coste. Ver [[context-caching]]
- **Prompt injection**: Ataque donde input malicioso manipula el comportamiento del LLM. Ver [[prompt-injection]]
- **Provenance**: Rastro del origen de código o datos (humano vs IA). Ver [[trazabilidad-codigo-ia]]

## Q

- **QLoRA**: Variante de LoRA sobre modelo cuantizado a 4 bits. Ver [[lora-qlora]]
- **Quality gate**: Verificación automática de calidad que debe pasar antes de avanzar. Ver [[quality-gates]]
- **Quantization**: Reducción de precisión de pesos del modelo para eficiencia. Ver [[inference-optimization]]

## R

- **RAG (Retrieval-Augmented Generation)**: Arquitectura que combina retrieval de información con generación LLM. Ver [[rag-overview]]
- ==**Ralph Loop**==: Patrón iterativo de architect: ejecutar → verificar → corregir → repetir hasta que los checks pasen. Ver [[architect-ralph-loop]]
- **RAGAS**: Framework de evaluación para pipelines RAG. Ver [[rag-evaluation]]
- **ReAct**: Patrón de agente que alterna razonamiento (Reasoning) y acción (Acting). Ver [[react-paper]]
- **Red teaming**: Ejercicio de seguridad donde se intenta hacer fallar al sistema. Ver [[red-teaming-ia]]
- **Reranking**: Segunda fase de retrieval que re-ordena resultados por relevancia. Ver [[reranking]]
- **RLHF (Reinforcement Learning from Human Feedback)**: Técnica de alignment que usa preferencias humanas. Ver [[rlhf]]
- **RoPE (Rotary Position Embedding)**: Codificación posicional rotacional para generalización a secuencias largas. Ver [[context-window]]

## S

- **Sandboxing**: Aislamiento de ejecución de agentes para seguridad. Ver [[sandboxing-agentes]]
- **SARIF**: Static Analysis Results Interchange Format, estándar para resultados de análisis estático. Ver [[sarif-format]]
- **Scaling laws**: Leyes que describen cómo el rendimiento de LLMs escala con compute, datos y parámetros. Ver [[scaling-laws]]
- **Self-RAG**: Variante donde el LLM decide autónomamente si necesita retrieval. Ver [[self-rag-paper]]
- **Semantic search**: Búsqueda basada en significado, no solo palabras clave. Ver [[semantic-search]]
- **Shadow AI**: Uso no autorizado de herramientas de IA en empresas. Ver [[shadow-ai]]
- ==**Slopsquatting**==: Ataque supply chain donde se registran nombres de paquetes alucinados por LLMs. Ver [[slopsquatting]]
- **Speculative decoding**: Técnica de aceleración donde un modelo draft genera tokens que un modelo grande verifica. Ver [[inference-optimization]]
- **SWE-bench**: Benchmark que evalúa agentes resolviendo issues reales de GitHub. Ver [[benchmarking-agentes]]
- **System prompt**: Instrucciones de configuración que definen el comportamiento base de un LLM. Ver [[system-prompts]]

## T

- **Test theater**: Tests que pasan sin verificar nada real (sin assertions significativas). Ver [[tests-vacios-cobertura-falsa]]
- **Token**: Unidad mínima de texto procesada por un LLM (subpalabra, carácter, o byte). Ver [[tokenizacion]]
- **Tool use**: Capacidad de un agente para invocar herramientas externas. Ver [[tool-use-function-calling]]
- **Transformer**: Arquitectura neural basada en self-attention, fundamento de los LLMs modernos. Ver [[transformer-architecture]]
- **Tree of Thoughts (ToT)**: Extensión de CoT que explora múltiples caminos de razonamiento. Ver [[tree-of-thought-paper]]
- **Trust boundary**: Límite de confianza entre componentes con diferentes niveles de privilegio. Ver [[trust-boundaries]]
- **Typosquatting**: Ataque que registra paquetes con nombres similares a los populares. Ver [[slopsquatting]]

## U

- **Unigram**: Algoritmo de tokenización probabilístico que selecciona el vocabulario óptimo. Ver [[tokenizacion]]

## V

- **Vector database**: Base de datos optimizada para almacenar y buscar embeddings vectoriales. Ver [[vector-databases]]
- **Vibe coding**: Desarrollo impulsado por prompts naturales en herramientas como Bolt, v0, Lovable. Ver [[vibe-coding]]
- ==**Vigil**==: Scanner de seguridad determinista del ecosistema propio para código generado por IA. Ver [[vigil-overview]]
- **vLLM**: Motor de serving de LLMs de alto rendimiento con paged attention. Ver [[model-serving]]

## W

- **Word2Vec**: Modelo seminal de embeddings de palabras (Mikolov et al., 2013). Ver [[embeddings]]
- **Worktree (git)**: Copia de trabajo adicional del repositorio git para aislamiento. Ver [[architect-overview#Parallel Execution]]

## X

- **XSS (Cross-Site Scripting)**: Vulnerabilidad web donde se inyecta código malicioso en páginas. Común en código generado por IA.

## Y

- **YAML pipeline**: Pipeline declarativo definido en YAML para orquestación de agentes. Ver [[architect-pipelines]]

## Z

- **Zero-shot**: Uso de un LLM sin ejemplos previos, solo con la instrucción de la tarea. Ver [[tecnicas-basicas]]
- **Zero-trust**: Modelo de seguridad que no confía en ningún componente por defecto. Ver [[zero-trust-ai]]

---

## Enlaces

- [[TAXONOMIA]] — Sistema de tags y categorías
- [[HOME]] — Dashboard principal
