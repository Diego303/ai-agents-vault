---
title: "Containerización para Agentes de IA"
aliases:
  - "containers IA"
  - "Docker IA"
  - "containerización agentes"
tags:
  - tecnica
  - cicd
  - infraestructura
  - containers
  - devops
created: 2025-06-01
updated: 2025-06-01
category: devops-ia
status: stable
difficulty: intermediate
related:
  - "[[infrastructure-as-code-ia]]"
  - "[[cicd-para-ia]]"
  - "[[agentops]]"
  - "[[cost-optimization]]"
  - "[[disaster-recovery-ia]]"
  - "[[multi-region-ai]]"
  - "[[canary-deployments-ia]]"
up: "[[moc-devops]]"
---

# Containerización para Agentes de IA

> [!abstract] Resumen
> Los contenedores (*containers*) son fundamentales para aislar y desplegar agentes de IA de forma reproducible. Este documento cubre ==Docker para aislamiento de agentes== (entornos reproducibles, gestión de dependencias), ==multi-stage builds para aplicaciones IA==, acceso a GPU en contenedores (NVIDIA Container Toolkit), Docker Compose para stacks completos (agente + vector DB + monitorización), Kubernetes para escalado de agentes, y seguridad (contenedores non-root, filesystems read-only, network policies). ^resumen

---

## Por qué contenedores para agentes de IA

Los agentes de IA tienen requisitos de aislamiento especiales que los contenedores resuelven:

> [!warning] Riesgos sin contenedores
> - Un agente que ejecuta código puede comprometer el sistema host
> - Dependencias de Python pueden conflictuar entre agentes
> - Sin aislamiento de red, un agente puede acceder a servicios internos
> - Sin límites de recursos, un agente puede consumir toda la memoria/CPU
> - Sin reproducibilidad, "funciona en mi máquina" se amplifica

| Beneficio | Descripción | ==Relevancia para IA== |
|---|---|---|
| Aislamiento | Proceso separado del host | ==Seguridad de agentes== |
| Reproducibilidad | Misma imagen = mismo entorno | ==Consistencia de resultados== |
| Escalabilidad | Múltiples instancias | ==Scaling de agentes== |
| Portabilidad | Funciona en cualquier host | Dev ↔ prod parity |
| Limites de recursos | CPU/memory caps | ==Prevenir costes descontrolados== |

---

## Docker para aislamiento de agentes

### Dockerfile base para agente de IA

> [!example]- Dockerfile multi-stage para agente IA
> ```dockerfile
> # Stage 1: Build
> FROM python:3.12-slim AS builder
>
> WORKDIR /app
>
> # Instalar dependencias de build
> RUN apt-get update && apt-get install -y --no-install-recommends \
>     build-essential \
>     git \
>     && rm -rf /var/lib/apt/lists/*
>
> # Copiar requirements y instalar dependencias
> COPY requirements.txt requirements-dev.txt ./
> RUN pip install --no-cache-dir --prefix=/install \
>     -r requirements.txt
>
> # Copiar código fuente
> COPY src/ ./src/
> COPY prompts/ ./prompts/
> COPY config/ ./config/
>
> # Stage 2: Runtime
> FROM python:3.12-slim AS runtime
>
> # Crear usuario non-root
> RUN groupadd -r agent && useradd -r -g agent -d /app -s /sbin/nologin agent
>
> WORKDIR /app
>
> # Copiar dependencias instaladas
> COPY --from=builder /install /usr/local
>
> # Copiar código
> COPY --from=builder /app/src ./src
> COPY --from=builder /app/prompts ./prompts
> COPY --from=builder /app/config ./config
>
> # Configuración de seguridad
> RUN chmod -R 555 /app/src && \
>     chmod -R 444 /app/prompts && \
>     chmod -R 444 /app/config && \
>     mkdir -p /app/workspace /app/logs && \
>     chown -R agent:agent /app/workspace /app/logs
>
> # Cambiar a usuario non-root
> USER agent
>
> # Health check
> HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
>     CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1
>
> # Variables de entorno por defecto
> ENV PYTHONPATH=/app \
>     PYTHONDONTWRITEBYTECODE=1 \
>     PYTHONUNBUFFERED=1 \
>     AGENT_MAX_STEPS=50 \
>     AGENT_BUDGET_USD=5.00 \
>     AGENT_LOG_LEVEL=INFO
>
> # Exponer puerto
> EXPOSE 8000
>
> # Entrypoint
> ENTRYPOINT ["python", "-m", "src.agent"]
> CMD ["--mode", "server"]
> ```

### Multi-stage builds para IA

> [!tip] Beneficios del multi-stage build
> - **Imagen más pequeña**: Solo incluye runtime, no herramientas de build
> - **Menos superficie de ataque**: Menos binarios = menos vulnerabilidades
> - **Build cache**: Layers de dependencias se cachean entre builds
> - **Separación de concerns**: Build vs runtime claramente separados

| Stage | Contenido | ==Tamaño típico== |
|---|---|---|
| Builder | Python + build tools + pip install | ~1.2 GB |
| Runtime | Python slim + dependencias + código | ==~350 MB== |
| Con modelo local | Runtime + modelo (Llama, etc.) | ==~8-70 GB== |

---

## GPU en contenedores

### NVIDIA Container Toolkit

Para modelos self-hosted que requieren GPU, el *NVIDIA Container Toolkit* permite acceder a GPUs desde dentro de contenedores.

> [!info] Requisitos para GPU en containers
> - Host con drivers NVIDIA instalados
> - NVIDIA Container Toolkit instalado
> - Docker con runtime nvidia configurado
> - Imagen base con CUDA toolkit

```bash
# Instalar NVIDIA Container Toolkit
distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

> [!example]- Dockerfile para modelo local con GPU
> ```dockerfile
> # Base con CUDA
> FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS base
>
> # Python
> RUN apt-get update && apt-get install -y \
>     python3.11 python3-pip \
>     && rm -rf /var/lib/apt/lists/*
>
> WORKDIR /app
>
> # Dependencias de ML
> COPY requirements-gpu.txt ./
> RUN pip3 install --no-cache-dir -r requirements-gpu.txt
>
> # Copiar modelo y código
> COPY models/ ./models/
> COPY src/ ./src/
>
> # Usuario non-root
> RUN useradd -r -m agent
> USER agent
>
> ENV NVIDIA_VISIBLE_DEVICES=all \
>     NVIDIA_DRIVER_CAPABILITIES=compute,utility
>
> CMD ["python3", "-m", "src.serve", "--model", "models/llama-3.1-70b"]
> ```

```bash
# Ejecutar contenedor con GPU
docker run --gpus all \
  -e NVIDIA_VISIBLE_DEVICES=0 \
  -p 8000:8000 \
  myorg/agent-gpu:latest
```

---

## Docker Compose para stack completo

### Agente + Vector DB + Monitorización

> [!example]- Docker Compose para stack de IA
> ```yaml
> # docker-compose.yml
> version: "3.9"
>
> services:
>   # Vector Database
>   qdrant:
>     image: qdrant/qdrant:latest
>     ports:
>       - "6333:6333"
>       - "6334:6334"
>     volumes:
>       - qdrant-data:/qdrant/storage
>     environment:
>       QDRANT__SERVICE__GRPC_PORT: 6334
>     healthcheck:
>       test: ["CMD", "curl", "-f", "http://localhost:6333/healthz"]
>       interval: 10s
>       timeout: 5s
>       retries: 3
>
>   # Redis for caching
>   redis:
>     image: redis:7-alpine
>     ports:
>       - "6379:6379"
>     volumes:
>       - redis-data:/data
>     command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
>
>   # Agent Service
>   agent:
>     build:
>       context: .
>       dockerfile: Dockerfile
>     ports:
>       - "8000:8000"
>     environment:
>       ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
>       VECTOR_DB_URL: http://qdrant:6333
>       REDIS_URL: redis://redis:6379
>       LANGFUSE_HOST: http://langfuse:3000
>       AGENT_MAX_STEPS: 50
>       AGENT_BUDGET_USD: 5.00
>     depends_on:
>       qdrant:
>         condition: service_healthy
>       redis:
>         condition: service_started
>     deploy:
>       resources:
>         limits:
>           memory: 1G
>           cpus: "1.0"
>     restart: unless-stopped
>
>   # LLM Observability
>   langfuse:
>     image: langfuse/langfuse:latest
>     ports:
>       - "3000:3000"
>     environment:
>       DATABASE_URL: postgresql://langfuse:langfuse@langfuse-db:5432/langfuse
>       NEXTAUTH_URL: http://localhost:3000
>       NEXTAUTH_SECRET: ${LANGFUSE_SECRET}
>     depends_on:
>       - langfuse-db
>
>   langfuse-db:
>     image: postgres:16-alpine
>     environment:
>       POSTGRES_USER: langfuse
>       POSTGRES_PASSWORD: langfuse
>       POSTGRES_DB: langfuse
>     volumes:
>       - langfuse-db-data:/var/lib/postgresql/data
>
>   # Prometheus
>   prometheus:
>     image: prom/prometheus:latest
>     ports:
>       - "9090:9090"
>     volumes:
>       - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
>       - prometheus-data:/prometheus
>
>   # Grafana
>   grafana:
>     image: grafana/grafana:latest
>     ports:
>       - "3001:3000"
>     environment:
>       GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
>     volumes:
>       - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
>       - grafana-data:/var/lib/grafana
>
> volumes:
>   qdrant-data:
>   redis-data:
>   langfuse-db-data:
>   prometheus-data:
>   grafana-data:
> ```

---

## Kubernetes para escalado de agentes

### Deployment de agente en K8s

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent
  labels:
    app: ai-agent
    version: v1.2.3
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
    spec:
      serviceAccountName: ai-agent
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: agent
          image: myorg/ai-agent:v1.2.3
          ports:
            - containerPort: 8000
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 20
          envFrom:
            - secretRef:
                name: llm-api-keys
            - configMapRef:
                name: agent-config
```

### Network Policies

> [!danger] Restricción de red para agentes
> Los agentes de IA deben tener acceso de red restringido. Solo deben poder comunicarse con:
> - APIs de LLM (Anthropic, OpenAI)
> - Vector database
> - Servicios de monitorización
> - Cola de tareas

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-agent-network-policy
spec:
  podSelector:
    matchLabels:
      app: ai-agent
  policyTypes:
    - Egress
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api-gateway
      ports:
        - port: 8000
  egress:
    # Solo permitir salida a servicios específicos
    - to:
        - podSelector:
            matchLabels:
              app: qdrant
      ports:
        - port: 6333
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - port: 6379
    # LLM APIs (Anthropic, OpenAI)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - port: 443
          protocol: TCP
    # DNS
    - to: []
      ports:
        - port: 53
          protocol: UDP
```

---

## Seguridad de contenedores para IA

### Principio de mínimo privilegio

> [!danger] Reglas de seguridad para contenedores de agentes
> 1. **Non-root**: Siempre ejecutar como usuario no-root
> 2. **Read-only filesystem**: Montar el filesystem como read-only con volúmenes específicos para escritura
> 3. **No capabilities**: Eliminar todas las Linux capabilities innecesarias
> 4. **No privilege escalation**: Prevenir escalada de privilegios
> 5. **Resource limits**: Siempre establecer límites de CPU y memoria
> 6. **Network policies**: Restringir comunicación a lo necesario

> [!example]- SecurityContext completo para agente en K8s
> ```yaml
> securityContext:
>   # Pod level
>   runAsNonRoot: true
>   runAsUser: 1000
>   runAsGroup: 1000
>   fsGroup: 1000
>   seccompProfile:
>     type: RuntimeDefault
>
> containers:
>   - name: agent
>     securityContext:
>       # Container level
>       allowPrivilegeEscalation: false
>       readOnlyRootFilesystem: true
>       capabilities:
>         drop:
>           - ALL
>     volumeMounts:
>       # Solo estos directorios son escribibles
>       - name: workspace
>         mountPath: /app/workspace
>       - name: tmp
>         mountPath: /tmp
>       - name: logs
>         mountPath: /app/logs
>
> volumes:
>   - name: workspace
>     emptyDir:
>       sizeLimit: 1Gi
>   - name: tmp
>     emptyDir:
>       sizeLimit: 100Mi
>   - name: logs
>     emptyDir:
>       sizeLimit: 500Mi
> ```

### Escaneo de imágenes

> [!tip] Pipeline de seguridad para imágenes de agentes
> ```bash
> # Escanear imagen con Trivy
> trivy image --severity HIGH,CRITICAL myorg/ai-agent:latest
>
> # Escanear con vigil para vulnerabilidades específicas de IA
> vigil scan --target container --image myorg/ai-agent:latest \
>   --format sarif --output container-scan.sarif
> ```

[[vigil-overview|Vigil]] puede escanear tanto el código como las configuraciones de agentes dentro de contenedores, generando reportes SARIF para integración con [[cicd-para-ia|CI/CD]].

---

## Patrones de containerización

### Patrón: Sidecar para observabilidad

```mermaid
graph LR
    subgraph Pod
        A[Agent Container] --> B[OTel Sidecar]
        A --> C[Log Sidecar]
    end

    B --> D[Jaeger/Tempo]
    C --> E[Loki]

    style A fill:#4ecdc4,color:#fff
    style B fill:#45b7d1,color:#fff
    style C fill:#45b7d1,color:#fff
```

### Patrón: Init container para datos

```yaml
initContainers:
  - name: load-prompts
    image: myorg/prompt-loader:latest
    command: ["sh", "-c", "cp /prompts/* /shared/prompts/"]
    volumeMounts:
      - name: prompts
        mountPath: /shared/prompts
  - name: warm-cache
    image: myorg/cache-warmer:latest
    command: ["python", "warm_cache.py"]
```

> [!question] ¿Cuándo usar init containers para IA?
> - Cargar prompts versionados desde un registry
> - Pre-calentar cache semántico con queries frecuentes
> - Verificar conectividad con LLM APIs antes de arrancar
> - Cargar modelos locales desde object storage

---

## Relación con el ecosistema

La containerización es la capa de empaquetado y aislamiento para todo el ecosistema:

- **[[intake-overview|Intake]]**: Intake puede ejecutarse como contenedor efímero en CI, recibiendo un issue y produciendo una spec como output — sin necesidad de estado persistente
- **[[architect-overview|Architect]]**: Architect en CI se ejecuta dentro de contenedores con acceso a git worktrees, requiriendo volúmenes persistentes para `.architect-ralph-worktree` y `.architect-parallel-N`
- **[[vigil-overview|Vigil]]**: Vigil se despliega como contenedor sidecar o como scanner en pipeline CI, con SARIF output para integración con GitHub Advanced Security
- **[[licit-overview|Licit]]**: Los contenedores de agentes deben cumplir con los requisitos de compliance de licit — imágenes firmadas, base images verificadas, scanning de vulnerabilidades

---

## Enlaces y referencias

> [!quote]- Bibliografía y recursos
> - Docker. "Docker Best Practices for AI/ML Workloads." 2024. [^1]
> - NVIDIA. "NVIDIA Container Toolkit Documentation." 2024. [^2]
> - Kubernetes. "Security Best Practices." CNCF, 2024. [^3]
> - Trivy. "Container Image Vulnerability Scanner." Aqua Security, 2024. [^4]
> - KServe. "Kubernetes-native Model Serving." CNCF, 2024. [^5]

[^1]: Mejores prácticas de Docker específicas para cargas de trabajo de AI/ML
[^2]: Documentación oficial de NVIDIA Container Toolkit para acceso a GPU desde contenedores
[^3]: Mejores prácticas de seguridad de Kubernetes aplicables a despliegue de agentes
[^4]: Trivy como scanner de vulnerabilidades de imágenes de contenedor
[^5]: KServe para serving de modelos en contenedores Kubernetes
