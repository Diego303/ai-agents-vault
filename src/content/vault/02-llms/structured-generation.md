---
tags:
  - concepto
  - llm
  - agentes
aliases:
  - Generación estructurada
  - Structured output
  - JSON mode
  - Constrained decoding
created: 2025-06-01
updated: 2025-06-01
category: modelos-llm
status: current
difficulty: intermediate
related:
  - "[[function-calling]]"
  - "[[llm-api-design]]"
  - "[[pydantic-validation]]"
  - "[[agent-loop]]"
  - "[[tool-use-patterns]]"
  - "[[structured-generation-comparison]]"
up: "[[moc-llms]]"
---

# Generación estructurada (Structured Generation)

> [!abstract] Resumen
> La *generación estructurada* (*structured generation*) es el conjunto de técnicas que fuerzan a un LLM a producir salidas que cumplen un esquema predefinido (JSON, XML, SQL, etc.) en lugar de texto libre. ==Es la base de todo sistema de agentes que necesita invocar herramientas (*tool calling*)==, y ha evolucionado desde hacks frágiles con regex hasta *constrained decoding* a nivel de tokens que garantiza conformidad con gramáticas formales. ^resumen

## Qué es y por qué importa

La **generación estructurada** (*structured generation*) aborda un problema fundamental: los LLMs generan texto libre, pero los sistemas de software necesitan datos estructurados. Cuando un agente necesita invocar una función, debe producir un JSON válido con los argumentos correctos. Cuando un pipeline de datos extrae información, necesita que la salida sea parseable programáticamente.

Sin generación estructurada, ==un agente que falla en producir JSON válido el 5% del tiempo es inútil en producción==, porque ese 5% de errores se propaga y corrompe todo el flujo. La diferencia entre un prototipo y un sistema de producción a menudo es la robustez de la generación estructurada.

> [!tip] Cuándo usar esto
> - **Usar siempre que**: La salida del LLM deba ser consumida por código (APIs, agentes, pipelines de datos, formularios)
> - **No usar cuando**: Se busca creatividad libre en texto, la salida es para consumo humano directo
> - Ver [[function-calling]] para el caso específico de invocación de herramientas
> - Ver [[llm-api-design]] para el diseño de APIs que consumen salidas estructuradas

---

## Cómo funciona internamente

Existen tres enfoques fundamentales para lograr generación estructurada, cada uno con diferentes garantías y limitaciones:

### Enfoque 1: Prompting + Parsing (sin garantías)

El método más simple: se instruye al LLM en el prompt para que genere JSON, y se parsea la salida con un parser tolerante a errores. ==No ofrece garantías de conformidad==; depende de que el modelo "quiera" seguir las instrucciones.

```python
# Frágil: el modelo puede no generar JSON válido
prompt = """Extrae los datos en formato JSON:
{"nombre": "...", "edad": ..., "email": "..."}

Texto: Juan tiene 30 años y su correo es juan@mail.com
"""
```

### Enfoque 2: JSON Mode en APIs (garantías parciales)

Los proveedores de APIs ofrecen modos especializados que garantizan JSON sintácticamente válido, aunque no necesariamente conforme a un esquema específico.

### Enfoque 3: Constrained decoding (garantías formales)

El método más robusto. Modifica el proceso de decodificación a nivel de tokens para ==hacer imposible generar secuencias que violen la gramática especificada==.

> [!example]- Ver diagrama de constrained decoding
> ```mermaid
> flowchart TD
>     A[Token actual generado] --> B[Calcular logits del siguiente token]
>     B --> C[Aplicar máscara de gramática]
>     C --> D{¿Tokens válidos según gramática?}
>     D -->|Sí| E[Samplear solo entre tokens válidos]
>     D -->|No| F[Error: gramática inconsistente]
>     E --> G[Añadir token a la secuencia]
>     G --> H{¿Secuencia completa?}
>     H -->|No| A
>     H -->|Sí| I[Output garantizado conforme a gramática]
>
>     style C fill:#FF9800
>     style I fill:#4CAF50
> ```

#### Mecanismo del constrained decoding

En cada paso de decodificación:

1. El modelo genera una distribución de probabilidad sobre todo el vocabulario (~32K-128K tokens)
2. Un autómata de estados finitos (derivado de la gramática/esquema) determina qué tokens son válidos en el estado actual
3. Se aplica una máscara que pone probabilidad 0 a todos los tokens inválidos
4. Se re-normaliza la distribución y se samplea entre los tokens restantes

==Esto garantiza que el output siempre sea válido, sin importar qué "quiera" generar el modelo==.

---

## JSON Mode en APIs de proveedores

### OpenAI

OpenAI ofrece dos niveles de soporte:

| Feature | Descripción | Garantía |
|---|---|---|
| `response_format: {"type": "json_object"}` | JSON válido, sin esquema | Sintaxis JSON válida |
| `response_format: {"type": "json_schema", "json_schema": {...}}` | ==JSON conforme a esquema== | Conformidad con JSON Schema |

El *Structured Outputs* mode de OpenAI (lanzado agosto 2024) usa constrained decoding internamente y ==garantiza 100% de conformidad con el JSON Schema proporcionado==.

### Anthropic

Anthropic ofrece *tool use* como mecanismo principal de generación estructurada. Los schemas de herramientas se definen con JSON Schema, y el modelo genera argumentos conformes.

```python
# Anthropic tool use para structured output
tools = [{
    "name": "extract_person",
    "description": "Extrae información de una persona",
    "input_schema": {
        "type": "object",
        "properties": {
            "nombre": {"type": "string"},
            "edad": {"type": "integer"},
            "email": {"type": "string", "format": "email"}
        },
        "required": ["nombre", "edad"]
    }
}]
```

### Google (Gemini)

Gemini soporta `response_mime_type: "application/json"` con un `response_schema` que acepta un subconjunto de JSON Schema. ==Limitado a tipos básicos; no soporta `$ref`, `oneOf` o recursión==.

| Proveedor | JSON libre | JSON con esquema | Constrained decoding | Schemas complejos |
|---|---|---|---|---|
| OpenAI | Sí | ==Sí (Structured Outputs)== | Sí (interno) | Bueno |
| Anthropic | Via tool use | Via tool use | Parcial | Bueno |
| Google Gemini | Sí | Sí (limitado) | Parcial | Limitado |
| Local (vLLM) | Via Outlines | Via Outlines | ==Sí (configurable)== | Excelente |

---

## Grammar-based sampling (llama.cpp)

Para modelos locales, llama.cpp implementa *grammar-based sampling* que permite definir gramáticas formales tipo GBNF (una variante de BNF) para constrainer la generación.

> [!example]- Ver ejemplo de gramática GBNF para JSON
> ```
> # Gramática GBNF para un objeto persona
> root   ::= "{" ws "\"nombre\":" ws string "," ws "\"edad\":" ws number "," ws "\"activo\":" ws boolean "}" ws
> string ::= "\"" [a-zA-ZáéíóúÁÉÍÓÚñÑ ]+ "\""
> number ::= [0-9]+
> boolean ::= "true" | "false"
> ws     ::= [ \t\n]*
> ```
>
> Esta gramática garantiza que la salida sea exactamente un objeto JSON con los campos `nombre` (string), `edad` (number) y `activo` (boolean). ==Cualquier token que violaría esta estructura es eliminado de la distribución de probabilidad antes del sampling==.

> [!warning] Limitaciones del grammar-based sampling
> - Puede degradar la calidad de la respuesta si la gramática es demasiado restrictiva
> - El modelo necesita "forzar" tokens que no habría elegido naturalmente
> - Gramáticas complejas (con recursión profunda) pueden ralentizar la generación
> - El modelo puede "rellenar" campos obligatorios con contenido sin sentido para satisfacer la gramática

---

## Bibliotecas especializadas

### Outlines

*Outlines* es la biblioteca open-source más potente para generación estructurada con modelos locales. Implementa constrained decoding con soporte completo para JSON Schema, regex y gramáticas libres de contexto.

> [!example]- Ver implementación con Outlines
> ```python
> import outlines
> from pydantic import BaseModel, Field
> from enum import Enum
>
>
> class Sentiment(str, Enum):
>     POSITIVE = "positive"
>     NEGATIVE = "negative"
>     NEUTRAL = "neutral"
>
>
> class ReviewAnalysis(BaseModel):
>     """Schema para análisis de reseñas."""
>     sentiment: Sentiment
>     confidence: float = Field(ge=0.0, le=1.0)
>     key_phrases: list[str] = Field(min_length=1, max_length=5)
>     summary: str = Field(max_length=200)
>
>
> # Cargar modelo con Outlines
> model = outlines.models.transformers("meta-llama/Llama-3.1-8B-Instruct")
>
> # Crear generador con schema Pydantic
> generator = outlines.generate.json(model, ReviewAnalysis)
>
> # Generar — GARANTIZADO conforme al schema
> result = generator(
>     "Analiza esta reseña: 'El producto es excelente, la mejor compra del año'"
> )
> print(result)
> # ReviewAnalysis(sentiment=<Sentiment.POSITIVE>, confidence=0.95,
> #   key_phrases=["excelente", "mejor compra"], summary="Reseña muy positiva...")
> ```

### Instructor

*Instructor* es una biblioteca que añade generación estructurada a las APIs de LLM cloud (OpenAI, Anthropic, Google) usando [[pydantic-validation|Pydantic]] como capa de definición de schemas y validación.

> [!example]- Ver implementación con Instructor
> ```python
> import instructor
> from pydantic import BaseModel, Field
> from openai import OpenAI
>
>
> class ToolCall(BaseModel):
>     """Schema para invocación de herramienta de un agente."""
>     tool_name: str = Field(description="Nombre de la herramienta a invocar")
>     arguments: dict = Field(description="Argumentos de la herramienta")
>     reasoning: str = Field(description="Por qué se eligió esta herramienta")
>
>
> class AgentResponse(BaseModel):
>     """Respuesta estructurada de un agente."""
>     thought: str = Field(description="Razonamiento del agente")
>     tool_calls: list[ToolCall] = Field(
>         default_factory=list,
>         description="Herramientas a invocar"
>     )
>     final_answer: str | None = Field(
>         default=None,
>         description="Respuesta final si no se necesitan herramientas"
>     )
>
>
> # Patch del cliente OpenAI con Instructor
> client = instructor.from_openai(OpenAI())
>
> # Usar como si fuera un cliente normal, pero con schema
> response = client.chat.completions.create(
>     model="gpt-4o",
>     response_model=AgentResponse,
>     messages=[
>         {"role": "system", "content": "Eres un agente con acceso a herramientas."},
>         {"role": "user", "content": "¿Qué tiempo hace en Madrid?"}
>     ],
>     max_retries=3,  # Reintentar si falla validación
> )
>
> print(response.thought)
> for tc in response.tool_calls:
>     print(f"  Herramienta: {tc.tool_name}({tc.arguments})")
>     print(f"  Razón: {tc.reasoning}")
> ```

### LMQL y Guidance

| Biblioteca | Enfoque | Modelos soportados | Fortaleza principal |
|---|---|---|---|
| **Outlines** | Constrained decoding | Locales (HF, vLLM) | ==Garantías formales, Pydantic nativo== |
| **Instructor** | API patching + retry | Cloud (OpenAI, Anthropic, Google) | ==Simplicidad, validación automática== |
| **LMQL** | Query language para LLMs | Locales + APIs | Constraints inline en el prompt |
| **Guidance** | Template language | Locales + APIs | Control de flujo granular |
| **SGLang** | Runtime con constraints | Locales (SGLang server) | Rendimiento en serving |

---

## Function calling como generación estructurada

El *function calling* (o *tool use*) es el caso de uso más crítico de generación estructurada para agentes. El modelo debe generar un JSON que especifica qué función invocar y con qué argumentos.

> [!example]- Diagrama del flujo de function calling
> ```mermaid
> sequenceDiagram
>     participant U as Usuario
>     participant A as Agente (LLM)
>     participant S as Schema Validator
>     participant T as Tool Executor
>
>     U->>A: "Busca vuelos a Paris para julio"
>     A->>A: Genera JSON estructurado
>     A->>S: {"tool": "search_flights", "args": {"dest": "CDG", "month": 7}}
>     S->>S: Valida contra JSON Schema
>     alt Schema válido
>         S->>T: Ejecutar herramienta
>         T->>A: Resultado de la herramienta
>         A->>U: "Encontré estos vuelos..."
>     else Schema inválido
>         S->>A: Error de validación
>         A->>A: Regenerar con corrección
>     end
> ```

> [!danger] Criticidad en agentes
> ==Un error en la generación de tool calls puede tener consecuencias graves==: ejecutar la herramienta equivocada, pasar argumentos incorrectos, o inyectar datos maliciosos. La generación estructurada es una capa de defensa esencial:
> - Previene inyección de campos no definidos en el schema
> - Garantiza tipos correctos (no pasar un string donde se espera un número)
> - Permite validación semántica adicional sobre la estructura ya validada
> - Ver [[prompt-injection-seguridad]] para ataques que intentan manipular tool calls

---

## Validación de schemas y manejo de errores

### Estrategia de validación en capas

```python
# Capa 1: Validación sintáctica (JSON válido)
# Capa 2: Validación de schema (campos correctos, tipos correctos)
# Capa 3: Validación semántica (valores razonables)
# Capa 4: Validación de negocio (permisos, límites)

from pydantic import BaseModel, Field, field_validator

class TransferRequest(BaseModel):
    """Schema con validación multicapa para transferencias."""
    source_account: str = Field(pattern=r"^[A-Z]{2}\d{20}$")  # Capa 2: formato IBAN
    dest_account: str = Field(pattern=r"^[A-Z]{2}\d{20}$")
    amount: float = Field(gt=0, le=100000)  # Capa 3: límite razonable
    currency: str = Field(pattern=r"^[A-Z]{3}$")

    @field_validator("source_account")
    @classmethod
    def accounts_must_differ(cls, v, info):
        if "dest_account" in info.data and v == info.data["dest_account"]:
            raise ValueError("Las cuentas origen y destino no pueden ser iguales")
        return v
```

### Patrones de retry

Cuando la generación falla la validación (especialmente con APIs que no garantizan conformidad), se aplican patrones de reintento:

| Patrón | Descripción | Cuándo usar |
|---|---|---|
| **Simple retry** | Reintentar con el mismo prompt | Errores aleatorios infrecuentes |
| **Retry con error** | Incluir el error de validación en el prompt | ==Errores sistemáticos de schema== |
| **Retry con ejemplo** | Añadir un ejemplo del output esperado | Modelo no entiende el formato |
| **Fallback a modelo mayor** | Escalar a modelo más capaz | Modelo actual insuficiente |
| **Fallback a regex** | Extraer datos parciales con regex | Degradación graceful |

> [!tip] Instructor maneja esto automáticamente
> La biblioteca Instructor implementa retry con inyección del error de validación de Pydantic en el prompt de reintento. Con `max_retries=3`, ==la tasa de éxito sube de ~95% a >99.9%== en la mayoría de schemas.

---

## Ventajas y limitaciones

> [!success] Fortalezas
> - Permite integración robusta entre LLMs y sistemas de software
> - Constrained decoding ofrece garantías formales (100% conformidad)
> - Pydantic como capa de schema es type-safe, testeable y documentable
> - Function calling convierte LLMs en agentes capaces de actuar en el mundo real
> - Las APIs de proveedores maduran rápidamente — cada vez más fácil de usar

> [!failure] Limitaciones
> - Constrained decoding puede degradar calidad de generación (forzar tokens no naturales)
> - JSON Schemas muy complejos (recursivos, con `oneOf`) pueden no ser soportados por todos los proveedores
> - El overhead de validación y retry aumenta latencia y coste
> - Los modelos más pequeños tienen tasas de fallo más altas en generación estructurada
> - La generación de schemas nested profundos sigue siendo frágil en modelos < 7B

---

## Estado del arte (2025-2026)

- **Constrained decoding nativo en APIs**: OpenAI, Anthropic y Google ofrecen garantías cada vez más fuertes. ==La tendencia es que constrained decoding sea el default, no una feature premium==.
- **Schemas como contrato de agente**: En sistemas multi-agente, los schemas de tool calling funcionan como contratos de interfaz entre agentes, similar a APIs REST. Ver [[a2a-protocol]] y [[mcp-protocol]].
- **Generación de UI estructurada**: Más allá de JSON, se explora la generación de componentes React/HTML estructurados directamente por el LLM.
- **Validación continua en streaming**: Validar conformidad parcial durante streaming, no solo al final.

> [!question] Debate abierto
> ¿Debería el schema ser parte del entrenamiento del modelo o una capa externa?
> - **Schema externo (constrained decoding)**: Más flexible, funciona con cualquier modelo — posición de Outlines, llama.cpp
> - **Schema en entrenamiento**: Modelos fine-tuneados específicamente para seguir schemas producen mejor calidad — posición de OpenAI con Structured Outputs
> - Mi valoración: ==Ambos enfoques convergen. Los mejores resultados vienen de modelos entrenados para generación estructurada + constrained decoding como safety net==

---

## Relación con el ecosistema

> [!info] Conexiones con mis herramientas
> - **[[intake-overview|intake]]**: intake usa generación estructurada para extraer metadata de repositorios (archivos relevantes, dependencias, patrones detectados) en schemas Pydantic que alimentan el grafo de conocimiento
> - **[[architect-overview|architect]]**: Cada iteración del RALPH loop genera tool calls estructurados (editar archivo, ejecutar tests, leer código); la robustez de estos schemas es crítica para la fiabilidad del agente
> - **[[vigil-overview|vigil]]**: Los hallazgos de seguridad se emiten en formato [[sarif-format|SARIF]] — generación estructurada garantiza que cada finding tiene los campos requeridos (severity, location, message, fix suggestion)
> - **[[licit-overview|licit]]**: Los informes de compliance usan schemas complejos que mapean a los requisitos del [[eu-ai-act-completo|EU AI Act]]; un schema mal generado podría omitir un requisito legal obligatorio

---

## Enlaces y referencias

**Notas relacionadas:**
- [[function-calling]] — El caso de uso más importante de generación estructurada
- [[llm-api-design]] — Diseño de APIs que consumen outputs estructurados
- [[pydantic-validation]] — Pydantic como capa de definición y validación de schemas
- [[agent-loop]] — Cómo los agentes usan tool calls en su loop principal
- [[tool-use-patterns]] — Patrones avanzados de invocación de herramientas
- [[mcp-protocol]] — Model Context Protocol y su uso de schemas para tools
- [[llm-como-juez]] — Usa generación estructurada para obtener evaluaciones parseables

> [!quote]- Referencias bibliográficas
> - Willard, B. & Louf, R., "Efficient Guided Generation for Large Language Models", 2023 (paper fundacional de Outlines)
> - Liu, J. et al., "Instructor: Structured outputs from LLMs", documentación oficial
> - OpenAI, "Structured Outputs", Blog post agosto 2024
> - Beurer-Kellner, L. et al., "Prompting Is Programming: A Query Language for Large Language Models" (LMQL), 2023
> - Lundberg, S. et al., "Guidance: A Language for Controlling Large Language Models", Microsoft Research, 2023

[^1]: Willard, B. & Louf, R. "Efficient Guided Generation for Large Language Models." 2023. Introdujeron el algoritmo de index-guided generation que permite constrained decoding eficiente con cualquier regex o JSON Schema.
[^2]: OpenAI. "Structured Outputs." Agosto 2024. Anunciaron conformidad 100% con JSON Schema usando constrained decoding interno, eliminando la necesidad de retry para validación sintáctica.
[^3]: Beurer-Kellner, L. et al. "Prompting Is Programming: A Query Language for Large Language Models." PLDI 2023. LMQL introdujo el concepto de constraints inline en prompts como un lenguaje de programación.
