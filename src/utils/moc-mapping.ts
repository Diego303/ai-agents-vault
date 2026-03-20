/**
 * moc-mapping.ts
 * Maps virtual MOC names to physical vault folders.
 * Since MOC files don't physically exist in the vault,
 * this mapping allows us to generate virtual MOC pages
 * and resolve MOC wikilinks to folder-based listing pages.
 */

export interface MOCEntry {
  /** The MOC slug as referenced in wikilinks, e.g. "moc-fundamentos" */
  slug: string;
  /** Display title */
  title: string;
  /** The vault folder this MOC maps to */
  folder: string;
  /** Short description */
  description: string;
  /** Section grouping for the landing page */
  section: string;
}

export const MOC_MAP: MOCEntry[] = [
  // Fundamentos y modelos
  { slug: 'moc-fundamentos', title: 'Fundamentos IA', folder: '01-fundamentos-ia', description: 'Historia, conceptos base, arquitecturas fundacionales', section: 'Fundamentos y modelos' },
  { slug: 'moc-llms', title: 'LLMs', folder: '02-llms', description: 'Modelos de lenguaje: landscape, optimización, evaluación', section: 'Fundamentos y modelos' },
  { slug: 'moc-fine-tuning', title: 'Fine-tuning', folder: '05-fine-tuning-entrenamiento', description: 'Fine-tuning, RLHF, DPO, destilación', section: 'Fundamentos y modelos' },

  // Agentes y técnicas
  { slug: 'moc-agentes', title: 'Agentes IA', folder: '03-agentes-ia', description: 'Anatomía, loops, multi-agente, frameworks, protocolos', section: 'Agentes y técnicas' },
  { slug: 'moc-rag-retrieval', title: 'RAG & Retrieval', folder: '04-tecnicas-retrieval', description: 'RAG, embeddings, vector databases, búsqueda semántica', section: 'Agentes y técnicas' },
  { slug: 'moc-prompt-engineering', title: 'Prompt Engineering', folder: '06-prompt-engineering', description: 'Técnicas de prompting, testing, optimización', section: 'Agentes y técnicas' },
  { slug: 'moc-context-engineering', title: 'Context Engineering', folder: '24-context-engineering', description: 'Context windows, assembly, caching, compression', section: 'Agentes y técnicas' },

  // Infraestructura y operaciones
  { slug: 'moc-infraestructura', title: 'Infraestructura', folder: '07-infraestructura-agentes', description: 'Frameworks, serving, orquestación, SDKs', section: 'Infraestructura y operaciones' },
  { slug: 'moc-devops', title: 'DevOps & CI/CD', folder: '11-devops-cicd-ia', description: 'CI/CD para IA, MLOps, LLMOps, pipelines', section: 'Infraestructura y operaciones' },
  { slug: 'moc-observabilidad', title: 'Observabilidad', folder: '12-observabilidad-monitoring', description: 'OpenTelemetry, tracing, métricas, dashboards', section: 'Infraestructura y operaciones' },
  { slug: 'moc-produccion', title: 'Producción', folder: '20-produccion-operaciones', description: 'Runbooks, incidentes, escalado, on-call', section: 'Infraestructura y operaciones' },
  { slug: 'moc-herramientas', title: 'Herramientas', folder: '13-herramientas-ecosistema', description: 'Herramientas del ecosistema: IDEs, SDKs, servicios', section: 'Infraestructura y operaciones' },

  // Seguridad, compliance y datos
  { slug: 'moc-seguridad', title: 'Seguridad IA', folder: '08-seguridad-ia', description: 'OWASP, supply chain, guardrails, red teaming', section: 'Seguridad, compliance y datos' },
  { slug: 'moc-compliance', title: 'Compliance', folder: '09-compliance-regulacion', description: 'EU AI Act, FRIA, Annex IV, gobernanza', section: 'Seguridad, compliance y datos' },
  { slug: 'moc-testing', title: 'Testing & Calidad', folder: '10-testing-calidad', description: 'Testing de agentes, evals, quality gates', section: 'Seguridad, compliance y datos' },
  { slug: 'moc-datos-privacidad', title: 'Datos & Privacidad', folder: '22-datos-privacidad', description: 'PII, GDPR, anonimización, data lineage', section: 'Seguridad, compliance y datos' },
  { slug: 'moc-etica-ia', title: 'Ética IA', folder: '25-etica-ia-responsable', description: 'Bias, fairness, impacto ambiental, AI safety', section: 'Seguridad, compliance y datos' },

  // Arquitectura y decisiones
  { slug: 'moc-patrones', title: 'Patrones', folder: '14-patrones-arquitectura', description: 'Patrones de diseño: RAG, agent loop, circuit breaker', section: 'Arquitectura y decisiones' },
  { slug: 'moc-decision-frameworks', title: 'Decision Frameworks', folder: '23-decision-frameworks', description: 'Árboles de decisión, checklists, playbooks', section: 'Arquitectura y decisiones' },
  { slug: 'moc-economia', title: 'Economía IA', folder: '21-economia-costes-ia', description: 'Costes, pricing, ROI, modelos de negocio', section: 'Arquitectura y decisiones' },
  { slug: 'moc-ux-productos-ia', title: 'UX & Productos IA', folder: '26-ux-productos-ia', description: 'UX patterns, streaming, feedback, onboarding', section: 'Arquitectura y decisiones' },

  // Ecosistema propio
  { slug: 'moc-ecosistema-propio', title: 'Ecosistema Propio', folder: '16-ecosistema-propio', description: 'intake, architect, vigil, licit', section: 'Ecosistema propio' },

  // Investigación y landscape
  { slug: 'moc-investigacion', title: 'Investigación', folder: '17-investigacion-papers', description: 'Papers fundamentales y análisis', section: 'Investigación y landscape' },
  { slug: 'moc-tendencias', title: 'Tendencias', folder: '18-tendencias-futuro', description: 'Tendencias 2025-2026, futuro, debates', section: 'Investigación y landscape' },
  { slug: 'moc-landscape', title: 'Landscape', folder: '19-competidores-landscape', description: 'Mapas competitivos por categoría', section: 'Investigación y landscape' },
  { slug: 'moc-casos-uso', title: 'Casos de Uso', folder: '15-casos-uso-industria', description: 'Casos reales por industria', section: 'Investigación y landscape' },
];

/** Quick lookup by slug */
export function getMOCBySlug(slug: string): MOCEntry | undefined {
  return MOC_MAP.find(m => m.slug === slug);
}

/** Quick lookup by folder */
export function getMOCByFolder(folder: string): MOCEntry | undefined {
  return MOC_MAP.find(m => m.folder === folder);
}

/** Group MOCs by section */
export function getMOCsBySection(): Map<string, MOCEntry[]> {
  const sections = new Map<string, MOCEntry[]>();
  for (const moc of MOC_MAP) {
    const existing = sections.get(moc.section);
    if (existing) existing.push(moc);
    else sections.set(moc.section, [moc]);
  }
  return sections;
}
