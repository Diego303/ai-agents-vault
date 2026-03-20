---
title: "LangGraph — Máquinas de Estado para Agentes"
aliases:
  - "LangGraph"
  - "StateGraph"
  - "langgraph-studio"
tags:
  - framework
  - agentes
  - infraestructura
  - grafos
  - state-machine
created: 2025-06-01
updated: 2025-06-01
category: infraestructura
status: stable
difficulty: advanced
related:
  - "[[langchain-deep-dive]]"
  - "[[orchestration-patterns]]"
  - "[[state-management]]"
  - "[[crewai]]"
  - "[[autogen]]"
  - "[[mcp-servers-ecosystem]]"
up: "[[moc-infraestructura]]"
---

# LangGraph — Máquinas de Estado para Agentes

> [!abstract] Resumen
> LangGraph es un framework para construir ==agentes como grafos de estado== (*state machines*). A diferencia de los agentes lineales de LangChain, LangGraph permite ciclos, bifurcaciones condicionales, persistencia con ==checkpointing==, y control humano con *interrupt_before*/*interrupt_after*. Es la respuesta del ecosistema LangChain al problema de agentes complejos que requieren ==flujos de control no lineales y recuperación de estado==.
> ^resumen

---

## Conceptos fundamentales

### StateGraph

El *StateGraph* es la unidad central de LangGraph. Define un grafo dirigido donde:

- Los **nodos** son funciones que transforman el estado
- Las **aristas** (*edges*) definen transiciones entre nodos
- Las **aristas condicionales** (*conditional edges*) permiten enrutamiento dinámico
- El **estado** es un `TypedDict` o Pydantic model compartido entre todos los nodos

```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated
from operator import add

class AgentState(TypedDict):
    messages: Annotated[list, add]  # add = append reducer
    next_step: str
    iteration_count: int
```

> [!info] Reducers
> Los *reducers* definen cómo se combinan las actualizaciones al estado. `Annotated[list, add]` significa que las listas se concatenan en lugar de reemplazarse. Esto es fundamental para acumular mensajes sin perder historial.

### Nodos y aristas

```mermaid
graph LR
    START((START)) --> Agent["agent<br/>(llm call)"]
    Agent --> Cond{¿tool call?}
    Cond -->|Sí| Tools["tools<br/>(execute)"]
    Cond -->|No| END((END))
    Tools --> Agent
```

> [!example]- Implementación completa del grafo ReAct
> ```python
> from langgraph.graph import StateGraph, START, END
> from langgraph.prebuilt import ToolNode
> from langchain_openai import ChatOpenAI
> from langchain_core.tools import tool
> from typing import TypedDict, Annotated, Literal
> from operator import add
>
> # Estado
> class State(TypedDict):
>     messages: Annotated[list, add]
>
> # Herramientas
> @tool
> def search_web(query: str) -> str:
>     """Busca información en internet."""
>     return f"Resultados para: {query}"
>
> @tool
> def calculate(expression: str) -> str:
>     """Evalúa expresiones matemáticas."""
>     return str(eval(expression))
>
> tools = [search_web, calculate]
> model = ChatOpenAI(model="gpt-4o").bind_tools(tools)
>
> # Nodos
> def agent_node(state: State) -> dict:
>     response = model.invoke(state["messages"])
>     return {"messages": [response]}
>
> # Condición de enrutamiento
> def should_continue(state: State) -> Literal["tools", "end"]:
>     last_msg = state["messages"][-1]
>     if last_msg.tool_calls:
>         return "tools"
>     return "end"
>
> # Construcción del grafo
> graph = StateGraph(State)
> graph.add_node("agent", agent_node)
> graph.add_node("tools", ToolNode(tools))
>
> graph.add_edge(START, "agent")
> graph.add_conditional_edges("agent", should_continue, {
>     "tools": "tools",
>     "end": END
> })
> graph.add_edge("tools", "agent")
>
> # Compilar
> app = graph.compile()
>
> # Ejecutar
> result = app.invoke({
>     "messages": [("human", "¿Cuánto es 25 * 17?")]
> })
> ```

---

## Aristas condicionales

Las *conditional edges* son el mecanismo que da poder real a LangGraph. Permiten que el flujo del agente se determine en runtime:

```python
def route_by_intent(state: State) -> str:
    intent = state.get("classified_intent", "unknown")
    routes = {
        "technical": "technical_agent",
        "billing": "billing_agent",
        "general": "general_agent"
    }
    return routes.get(intent, "general_agent")

graph.add_conditional_edges(
    "classifier",
    route_by_intent,
    {
        "technical_agent": "technical_agent",
        "billing_agent": "billing_agent",
        "general_agent": "general_agent"
    }
)
```

> [!tip] Patrón supervisor
> Un patrón poderoso es tener un nodo "supervisor" que clasifica y enruta hacia agentes especializados. Esto implementa el ==patrón de delegación jerárquica== descrito en [[orchestration-patterns]].

---

## Persistencia y checkpointing

La persistencia es lo que transforma un grafo en un sistema de agentes robusto. LangGraph soporta *checkpointing* que permite:

1. **Pausar y reanudar** ejecuciones en cualquier punto
2. **Inspeccionar** el estado histórico del agente
3. **Retroceder** a estados anteriores (*time travel*)
4. **Escalar** distribuyendo ejecuciones entre workers

### Configuración de checkpointers

| Checkpointer | Uso | Persistencia |
|--------------|-----|-------------|
| `MemorySaver` | ==Desarrollo y testing== | En memoria (volátil) |
| `SqliteSaver` | Prototipos con persistencia | Archivo SQLite |
| `PostgresSaver` | ==Producción== | PostgreSQL |
| `AsyncPostgresSaver` | Producción async | PostgreSQL async |

> [!example]- Checkpointing con PostgreSQL
> ```python
> from langgraph.checkpoint.postgres import PostgresSaver
> from psycopg_pool import ConnectionPool
>
> DB_URI = "postgresql://user:pass@localhost:5432/langgraph"
>
> with ConnectionPool(conninfo=DB_URI) as pool:
>     checkpointer = PostgresSaver(pool)
>     checkpointer.setup()  # Crear tablas necesarias
>
>     app = graph.compile(checkpointer=checkpointer)
>
>     # Cada invocación se asocia a un thread_id
>     config = {"configurable": {"thread_id": "user-123-conv-456"}}
>
>     # Primera invocación
>     result = app.invoke(
>         {"messages": [("human", "Hola")]},
>         config=config
>     )
>
>     # Segunda invocación — continúa la conversación
>     result = app.invoke(
>         {"messages": [("human", "Continúa lo anterior")]},
>         config=config
>     )
>
>     # Inspeccionar historial
>     history = list(app.get_state_history(config))
>     for state in history:
>         print(f"Step: {state.metadata['step']}, "
>               f"Node: {state.metadata.get('source')}")
> ```

> [!warning] Thread management
> El `thread_id` es la clave de aislamiento entre conversaciones. ==Nunca reutilices thread_ids entre usuarios distintos== o contaminarás contextos. Esto es análogo al manejo de sesiones en [[state-management|gestión de estado]] donde [[architect-overview|Architect]] usa IDs con formato `YYYYMMDD-HHMMSS-hexhex`.

---

## Human-in-the-loop

LangGraph soporta interrupciones controladas para intervención humana:

### interrupt_before / interrupt_after

```python
app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["tools"]  # Pausa ANTES de ejecutar tools
)

config = {"configurable": {"thread_id": "review-123"}}

# Primera invocación — se detiene antes de ejecutar la herramienta
result = app.invoke(
    {"messages": [("human", "Elimina el archivo config.yaml")]},
    config=config
)

# Inspeccionar qué herramienta quiere ejecutar
state = app.get_state(config)
pending_tool = state.values["messages"][-1].tool_calls[0]
print(f"Tool: {pending_tool['name']}, Args: {pending_tool['args']}")

# Decisión humana: aprobar o rechazar
if human_approves(pending_tool):
    result = app.invoke(None, config=config)  # Continuar
else:
    # Modificar el estado antes de continuar
    app.update_state(config, {
        "messages": [("human", "Operación cancelada por el usuario")]
    })
```

> [!danger] Acciones destructivas
> ==Siempre implementa `interrupt_before` para herramientas que modifiquen datos== (eliminar archivos, enviar emails, ejecutar SQL destructivo). El costo de una pausa es mínimo comparado con una acción irreversible no deseada.

### Patrón de aprobación escalonada

```mermaid
stateDiagram-v2
    [*] --> Analyze: Input
    Analyze --> Classify: Genera plan
    Classify --> LowRisk: Riesgo bajo
    Classify --> HighRisk: Riesgo alto
    LowRisk --> Execute: Auto-approve
    HighRisk --> HumanReview: interrupt_before
    HumanReview --> Execute: Aprobado
    HumanReview --> Reject: Rechazado
    Execute --> [*]: Resultado
    Reject --> [*]: Cancelado
```

---

## Streaming

LangGraph soporta múltiples modos de *streaming*:

### Streaming de eventos

```python
async for event in app.astream_events(
    {"messages": [("human", "Explica quantum computing")]},
    config=config,
    version="v2"
):
    kind = event["event"]
    if kind == "on_chat_model_stream":
        # Tokens individuales del LLM
        print(event["data"]["chunk"].content, end="")
    elif kind == "on_tool_start":
        # Una herramienta comienza a ejecutarse
        print(f"\n🔧 Ejecutando: {event['name']}")
    elif kind == "on_tool_end":
        print(f"\n✅ Resultado: {event['data'].content[:100]}")
```

### Streaming de actualizaciones de estado

```python
for chunk in app.stream(
    {"messages": [("human", "Busca y analiza datos")]},
    config=config,
    stream_mode="updates"  # Solo cambios al estado
):
    node_name = list(chunk.keys())[0]
    print(f"Nodo '{node_name}' actualizó el estado")
```

> [!tip] Modos de streaming disponibles
> | Modo | Descripción | Uso |
> |------|-------------|-----|
> | `values` | Estado completo tras cada nodo | Debugging |
> | `updates` | ==Solo deltas del estado== | Producción |
> | `messages` | Tokens de mensajes LLM | UI de chat |
> | `events` | Todos los eventos internos | Observabilidad |

---

## Subgrafos

Para agentes complejos, LangGraph permite componer grafos dentro de grafos:

> [!example]- Subgrafo de investigación dentro de un agente principal
> ```python
> # Subgrafo: investigador
> class ResearchState(TypedDict):
>     query: str
>     sources: Annotated[list, add]
>     summary: str
>
> research_graph = StateGraph(ResearchState)
> research_graph.add_node("search", search_node)
> research_graph.add_node("analyze", analyze_node)
> research_graph.add_node("summarize", summarize_node)
> research_graph.add_edge(START, "search")
> research_graph.add_edge("search", "analyze")
> research_graph.add_edge("analyze", "summarize")
> research_graph.add_edge("summarize", END)
> research_subgraph = research_graph.compile()
>
> # Grafo principal usa el subgrafo como nodo
> class MainState(TypedDict):
>     messages: Annotated[list, add]
>     research_results: str
>
> main_graph = StateGraph(MainState)
> main_graph.add_node("plan", plan_node)
> main_graph.add_node("research", research_subgraph)
> main_graph.add_node("respond", respond_node)
> main_graph.add_edge(START, "plan")
> main_graph.add_edge("plan", "research")
> main_graph.add_edge("research", "respond")
> main_graph.add_edge("respond", END)
> ```

---

## LangGraph Platform

*LangGraph Platform* es la solución de despliegue gestionado:

- **LangGraph Cloud** — hosting gestionado con auto-scaling
- **LangGraph Studio** — IDE visual para diseñar, debuggear y probar grafos
- **LangGraph CLI** — herramienta para desarrollo local y despliegue

> [!info] LangGraph Studio
> Studio permite ==visualizar la ejecución del grafo en tiempo real==, inspeccionar el estado en cada nodo, modificar el estado manualmente y re-ejecutar desde cualquier checkpoint. Es invaluable para debugging de agentes complejos.

### Despliegue como API

```python
# langgraph.json - configuración de despliegue
{
    "graphs": {
        "my_agent": "./agent.py:graph"
    },
    "dependencies": ["langchain-openai", "langchain-anthropic"],
    "env": ".env"
}
```

> [!warning] Vendor lock-in
> LangGraph Platform es una oferta comercial de LangChain Inc. El framework open-source funciona perfectamente sin ella, pero pierdes las herramientas de despliegue. Evalúa si el valor justifica la dependencia.

---

## Cuándo usar LangGraph vs alternativas

```mermaid
graph TD
    Need["¿Qué necesitas?"] --> Loop{"¿Ciclos en<br/>el flujo?"}
    Loop -->|Sí| State{"¿Estado<br/>persistente?"}
    Loop -->|No| Simple["LCEL / Cadena simple<br/>[[langchain-deep-dive]]"]

    State -->|Sí| Human{"¿Human-in-<br/>the-loop?"}
    State -->|No| Maybe["LangGraph posible<br/>pero quizás overkill"]

    Human -->|Sí| LG["==LangGraph==<br/>Ideal"]
    Human -->|No| Complex{"¿Múltiples<br/>agentes<br/>colaborando?"}

    Complex -->|Sí| Choose{"¿Control fino<br/>del flujo?"}
    Complex -->|No| LG2["LangGraph<br/>buena opción"]

    Choose -->|Sí| LG3["LangGraph"]
    Choose -->|No| Crew["[[crewai]] / [[autogen]]<br/>Más simple"]
```

> [!success] LangGraph excels cuando
> - Necesitas ==ciclos con control fino== (retry loops, refinamiento iterativo)
> - El agente debe ==pausar y reanudar== (aprobaciones humanas, procesos largos)
> - Requieres ==trazabilidad completa== del estado en cada paso
> - La lógica tiene múltiples ramas condicionales complejas

> [!failure] LangGraph es overkill cuando
> - Tu agente es un ==loop simple== de ReAct (prompt → tool → prompt)
> - No necesitas persistencia ni interrupciones
> - Un script de Python con un while loop resuelve tu problema
> - Estás prototipando y la velocidad de iteración importa más que la robustez

---

## Relación con el ecosistema

LangGraph complementa y compite con distintos componentes del ecosistema:

- **[[intake-overview|Intake]]** — el flujo de transformación de requisitos a especificaciones podría modelarse como un *StateGraph* con nodos de clasificación, extracción y validación. Sin embargo, Intake usa una pipeline más simple internamente
- **[[architect-overview|Architect]]** — implementa su propio sistema de orquestación con YAML pipelines y *ThreadPoolExecutor*. No usa LangGraph, pero los conceptos de state management son paralelos: Architect guarda sesiones con auto-save, LangGraph usa checkpoints. La diferencia es que Architect ==prioriza simplicidad sobre flexibilidad==
- **[[vigil-overview|Vigil]]** — al ser determinista, no necesita grafos de estado. Sus reglas se evalúan en secuencia sin ramificación dinámica
- **[[licit-overview|Licit]]** — podría beneficiarse de un grafo para flujos de compliance complejos con aprobaciones, pero su diseño como CLI favorece la ejecución secuencial

> [!question] ¿LangGraph o implementación propia?
> Si tu equipo ya tiene un sistema de orquestación (como Architect), ==adoptar LangGraph introduce una segunda abstracción de estado== que debe reconciliarse con la existente. El valor de LangGraph es máximo cuando es la primera y única capa de orquestación.

---

## Enlaces y referencias

> [!quote]- Bibliografía y recursos
> - [^1]: Documentación oficial LangGraph — https://langchain-ai.github.io/langgraph/
> - LangGraph Studio — IDE visual para grafos de agentes
> - Repositorio GitHub: `langchain-ai/langgraph`
> - Comparativa de orquestación: [[orchestration-patterns]]
> - Gestión de estado: [[state-management]]
> - Tutorial: "Building Reliable AI Agents with LangGraph" — blog oficial LangChain

[^1]: LangGraph fue creado como respuesta a la limitación de los agentes lineales de LangChain, reconociendo que los agentes reales requieren flujos de control cíclicos y persistencia.
