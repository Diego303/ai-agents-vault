# Taxonomía del Vault

> [!abstract] Resumen
> Definición completa del sistema de tags, categorías, estados y convenciones de nomenclatura usados en todo el vault. ==Referencia obligatoria antes de crear nuevas notas==.

---

## Tags principales (primer nivel)

Cada nota debe tener al menos un tag de primer nivel y los sub-tags que apliquen.

| Tag | Uso | Ejemplo de nota |
|---|---|---|
| `#concepto` | Conceptos teóricos, definiciones, fundamentos | [[transformer-architecture]], [[embeddings]] |
| `#tecnica` | Técnicas aplicables, metodologías, approaches | [[chain-of-thought]], [[chunking-strategies]] |
| `#herramienta` | Software, servicios, productos específicos | [[cursor]], [[litellm]], [[ollama]] |
| `#framework` | Frameworks de desarrollo o evaluación | [[langchain-deep-dive]], [[crewai]] |
| `#regulacion` | Leyes, normativas, estándares de compliance | [[eu-ai-act-completo]], [[iso-standards-ia]] |
| `#patron` | Patrones de diseño y arquitectura | [[pattern-rag]], [[pattern-circuit-breaker]] |
| `#paper` | Análisis de papers académicos | [[attention-is-all-you-need]], [[lora-paper]] |
| `#ecosistema` | Documentación de herramientas propias | [[architect-overview]], [[vigil-overview]] |
| `#tendencia` | Tendencias, predicciones, futuro | [[tendencias-2025-2026]], [[agi-debates]] |
| `#seguridad` | Seguridad, ataques, defensas | [[slopsquatting]], [[prompt-injection-seguridad]] |
| `#caso-de-uso` | Casos reales por industria | [[caso-fintech-agentes]], [[caso-healthcare-ia]] |
| `#decision` | Frameworks de decisión, checklists | [[decision-modelo-llm]], [[checklist-production-readiness]] |
| `#runbook` | Procedimientos operativos | [[runbook-agente-produccion]], [[on-call-ia]] |
| `#etica` | Ética, bias, responsabilidad, impacto social | [[bias-en-llms]], [[impacto-ambiental-ia]] |
| `#ux` | UX/UI para productos con IA | [[ux-patterns-ia]], [[streaming-ux]] |
| `#context-engineering` | Diseño y gestión de contexto para LLMs | [[context-engineering-overview]], [[context-caching]] |
| `#produccion` | Operaciones en producción | [[escalado-agentes]], [[disponibilidad-agentes]] |
| `#economia` | Costes, pricing, ROI, negocio | [[pricing-llm-apis]], [[roi-agentes-codigo]] |

---

## Sub-tags (segundo nivel)

### Temáticos
| Sub-tag | Ámbito |
|---|---|
| `#agentes` | Agentes de IA en general |
| `#llm` | Modelos de lenguaje |
| `#rag` | Retrieval-Augmented Generation |
| `#fine-tuning` | Entrenamiento y adaptación |
| `#prompting` | Prompt engineering |
| `#embeddings` | Vectores y representaciones |
| `#multimodal` | Visión, audio, video |
| `#multi-agente` | Sistemas multi-agente |
| `#observabilidad` | Logging, tracing, métricas |
| `#testing` | Testing y evaluación |
| `#cicd` | CI/CD y DevOps |
| `#compliance` | Cumplimiento regulatorio |
| `#privacidad` | Protección de datos |
| `#open-source` | Software libre |
| `#api` | APIs y diseño de interfaces |

### Por herramienta del ecosistema
| Sub-tag | Herramienta |
|---|---|
| `#intake` | intake CLI |
| `#architect` | architect CLI |
| `#vigil` | vigil scanner |
| `#licit` | licit compliance |

### Por tecnología
| Sub-tag | Tecnología |
|---|---|
| `#opentelemetry` | OpenTelemetry |
| `#sarif` | SARIF format |
| `#mcp` | Model Context Protocol |
| `#litellm` | LiteLLM proxy |
| `#worktree` | Git worktrees |
| `#pydantic` | Pydantic validation |
| `#kubernetes` | Kubernetes/containers |
| `#terraform` | Infrastructure as Code |

---

## Categorías (campo `category` en frontmatter)

Las categorías agrupan notas dentro de su carpeta temática:

| Categoría | Carpeta | Ejemplo |
|---|---|---|
| `fundamentos-ia` | 01-fundamentos-ia | historia-ia, tipos-ia |
| `arquitecturas-ml` | 01-fundamentos-ia | transformer-architecture, redes-neuronales |
| `modelos-llm` | 02-llms | landscape-modelos, arquitecturas-llm |
| `inference` | 02-llms | inference-optimization, context-window |
| `evaluacion-llm` | 02-llms | llm-como-juez, model-evaluation-practice |
| `agentes-core` | 03-agentes-ia | agent-loop, anatomia-agente |
| `agentes-avanzado` | 03-agentes-ia | multi-agent-systems, autonomous-agents |
| `protocolos-agentes` | 03-agentes-ia | mcp-protocol, a2a-protocol |
| `tecnicas-retrieval` | 04-tecnicas-retrieval | rag-overview, chunking-strategies |
| `vector-search` | 04-tecnicas-retrieval | vector-databases, embedding-models |
| `entrenamiento` | 05-fine-tuning-entrenamiento | lora-qlora, rlhf, dpo-alternativas |
| `prompting` | 06-prompt-engineering | chain-of-thought, advanced-prompting |
| `infraestructura` | 07-infraestructura-agentes | model-serving, llm-routers |
| `seguridad-codigo` | 08-seguridad-ia | slopsquatting, secrets-management-ia |
| `seguridad-agentes` | 08-seguridad-ia | agent-safety, sandboxing-agentes |
| `compliance-eu` | 09-compliance-regulacion | eu-ai-act-completo, eu-ai-act-fria |
| `compliance-global` | 09-compliance-regulacion | regulacion-global, nist-ai-rmf |
| `testing-ia` | 10-testing-calidad | testing-agentes-ia, evaluation-frameworks |
| `devops-ia` | 11-devops-cicd-ia | cicd-para-ia, mlops-overview |
| `observabilidad-ia` | 12-observabilidad-monitoring | opentelemetry-ia, tracing-agentes |
| `herramientas-coding` | 13-herramientas-ecosistema | cursor, claude-code, github-copilot |
| `patrones-ia` | 14-patrones-arquitectura | pattern-rag, pattern-agent-loop |
| `casos-industria` | 15-casos-uso-industria | caso-fintech-agentes |
| `ecosistema-intake` | 16-ecosistema-propio | intake-overview, intake-architecture |
| `ecosistema-architect` | 16-ecosistema-propio | architect-overview, architect-ralph-loop |
| `ecosistema-vigil` | 16-ecosistema-propio | vigil-overview, vigil-architecture |
| `ecosistema-licit` | 16-ecosistema-propio | licit-overview, licit-architecture |
| `ecosistema-integracion` | 16-ecosistema-propio | ecosistema-completo, ecosistema-cicd-integration |
| `papers` | 17-investigacion-papers | attention-is-all-you-need |
| `tendencias` | 18-tendencias-futuro | tendencias-2025-2026 |
| `landscape` | 19-competidores-landscape | landscape-agentes-codigo |
| `produccion` | 20-produccion-operaciones | runbook-agente-produccion |
| `economia-ia` | 21-economia-costes-ia | pricing-llm-apis |
| `privacidad` | 22-datos-privacidad | pii-en-pipelines-ia |
| `decisiones` | 23-decision-frameworks | decision-modelo-llm |
| `context-eng` | 24-context-engineering | context-engineering-overview |
| `etica` | 25-etica-ia-responsable | bias-en-llms |
| `ux-ia` | 26-ux-productos-ia | ux-patterns-ia |

---

## Estados (campo `status` en frontmatter)

| Estado | Significado | Cadencia de revisión |
|---|---|---|
| `evergreen` | Contenido atemporal (conceptos, matemáticas, arquitecturas base) | Anual |
| `current` | Actual pero requiere revisión periódica (benchmarks, precios, comparativas) | Trimestral |
| `volatile` | Cambia rápidamente (landscape, tendencias, features) | Mensual |
| `complete` | Nota terminada en su versión actual | Según tipo de contenido |
| `draft` | Borrador en progreso | N/A |
| `review` | Pendiente de revisión | N/A |
| `outdated` | Obsoleto, se mantiene como referencia histórica | No necesita revisión |

---

## Niveles de dificultad (campo `difficulty`)

| Nivel | Público objetivo |
|---|---|
| `beginner` | Sin experiencia previa en el tema |
| `intermediate` | Conocimiento básico del área |
| `advanced` | Experiencia práctica significativa |
| `expert` | Conocimiento profundo, contribuye al estado del arte |

---

## Convenciones de nomenclatura de archivos

- **Kebab-case**: `mi-nota-aqui.md` (nunca camelCase ni snake_case)
- **Sin números de prefijo** en los archivos (solo en carpetas)
- **Prefijos de tipo**:
  - `moc-` para Maps of Content
  - `pattern-` para patrones de arquitectura
  - `caso-` para casos de uso
  - `decision-` para árboles de decisión
  - `checklist-` para checklists
  - `playbook-` para playbooks
  - `template-` para templates
  - `landscape-` para mapas de landscape
- **Sin acentos** en nombres de archivo (sí en contenido)
- **Idioma**: Español para nombres descriptivos, inglés para términos técnicos estándar
