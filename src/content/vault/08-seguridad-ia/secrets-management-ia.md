---
title: Gestión de Secretos en Código Generado por IA
aliases:
  - secrets-management
  - gestion-secretos-ia
  - hardcoded-secrets
  - credenciales-codigo
tags:
  - seguridad
  - secretos
  - credenciales
  - vigil
  - api-keys
  - vault
created: 2025-06-01
updated: 2025-06-01
category: seguridad-codigo
status: stable
difficulty: intermediate
related:
  - "[[seguridad-codigo-generado-ia]]"
  - "[[ai-security-tools]]"
  - "[[guardrails-deterministas]]"
  - "[[cors-seguridad-ia]]"
  - "[[sarif-format]]"
  - "[[data-exfiltration-agents]]"
up: "[[moc-seguridad]]"
---

# Gestión de Secretos en Código Generado por IA

> [!abstract] Resumen
> Los LLMs tienen una tendencia sistemática a ==hardcodear secretos directamente en el código fuente==: API keys, passwords, tokens y connection strings aparecen como constantes literales. El *SecretsAnalyzer* de [[vigil-overview|vigil]] detecta patrones como `"your-api-key-here"`, prefijos `"sk-..."`, secretos en Base64 y strings de alta entropía. Combinado con la protección de archivos sensibles de [[architect-overview|architect]] (`.env`, `*.pem`, `*.key`), se establece una defensa en profundidad contra la exposición de credenciales.
> ^resumen

---

## Por qué los LLMs hardcodean secretos

### El problema raíz

Los modelos de lenguaje generan código basándose en patrones del entrenamiento. El código público está ==plagado de secretos hardcodeados==: tutoriales, ejemplos, repositorios personales y snippets de Stack Overflow frecuentemente incluyen credenciales directamente en el código.

> [!danger] Estadísticas alarmantes
> - GitHub reporta ==más de 100 millones de secretos filtrados== en repositorios públicos hasta 2024[^1]
> - GitGuardian detecta ==10+ millones de nuevos secretos== expuestos cada año
> - El 83% de los secretos filtrados permanecen válidos al momento de la detección

### Patrones de generación

```mermaid
graph TD
    A[Prompt: necesito conectar a AWS S3] --> B[LLM genera código]
    B --> C{¿Cómo maneja credenciales?}
    C -->|70% de las veces| D[Hardcoded en código]
    C -->|20%| E[Variable de entorno<br>pero con fallback hardcoded]
    C -->|10%| F[Variable de entorno correcta]
    D --> G[VULNERABILIDAD CWE-798]
    E --> H[VULNERABILIDAD parcial]
    F --> I[SEGURO]
    style D fill:#ff6b6b,color:#fff
    style G fill:#ff6b6b,color:#fff
    style H fill:#fab005,color:#000
    style I fill:#51cf66,color:#fff
```

---

## Tipos de secretos en código generado

### Clasificación y ejemplos

> [!example]- Catálogo completo de patrones detectados por vigil
> ```python
> # ===== CATEGORÍA 1: API Keys hardcodeadas =====
>
> # OpenAI
> openai.api_key = "sk-proj-abc123def456ghi789"  # CRITICAL
>
> # AWS
> AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"      # CRITICAL
> AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG"  # CRITICAL
>
> # Google Cloud
> GOOGLE_API_KEY = "AIzaSyC-abc123def456"           # CRITICAL
>
> # Stripe
> stripe.api_key = "sk_live_abc123def456"            # CRITICAL
> stripe.api_key = "sk_test_abc123def456"             # HIGH
>
> # ===== CATEGORÍA 2: Placeholder secrets =====
>
> API_KEY = "your-api-key-here"                       # HIGH
> TOKEN = "INSERT_YOUR_TOKEN"                         # HIGH
> SECRET = "REPLACE_WITH_YOUR_SECRET"                 # HIGH
> password = "changeme"                                # HIGH
> password = "password123"                             # HIGH
>
> # ===== CATEGORÍA 3: Base64 encoded secrets =====
>
> auth_token = "dXNlcm5hbWU6cGFzc3dvcmQ="            # MEDIUM
> # Decodifica a: username:password
>
> # ===== CATEGORÍA 4: High-entropy strings =====
>
> secret_key = "aK8mP2xQ9wL5nR7tY3uI6oH4jF0gD1s"    # MEDIUM
> # Shannon entropy > 4.5 bits/char
>
> # ===== CATEGORÍA 5: Connection strings =====
>
> DATABASE_URL = "postgresql://user:pass@host:5432/db"  # CRITICAL
> MONGO_URI = "mongodb://admin:secret@mongo:27017"      # CRITICAL
> REDIS_URL = "redis://:password@redis:6379"            # HIGH
> ```

### Tabla de severidades

| Tipo de secreto | Patrón de detección | Severidad | CWE | Riesgo |
|-----------------|---------------------|-----------|-----|--------|
| API key de producción | Prefijos conocidos (`sk-`, `AKIA`) | ==CRITICAL== | CWE-798 | Acceso no autorizado a servicios |
| Connection string | URLs con credenciales | ==CRITICAL== | CWE-798 | Acceso a bases de datos |
| Private key | `-----BEGIN.*PRIVATE KEY-----` | ==CRITICAL== | CWE-321 | Suplantación de identidad |
| Placeholder secret | `your-*-here`, `changeme` | HIGH | CWE-798 | Indicador de mala práctica |
| Token genérico | Prefijos `ghp_`, `glpat-`, `xoxb-` | HIGH | CWE-798 | Acceso a plataformas |
| Base64 encoded | Strings Base64 que decodifican a credenciales | MEDIUM | CWE-312 | Ofuscación débil |
| High-entropy string | Entropía Shannon > 4.5 | MEDIUM | CWE-798 | Posible secreto |
| Test credentials | `test_key`, `demo_token` | LOW | CWE-798 | Riesgo limitado |

---

## SecretsAnalyzer de vigil

### Arquitectura de detección

```mermaid
flowchart TD
    A[Código fuente] --> B[Tokenización]
    B --> C[Extracción de strings]
    C --> D{Análisis paralelo}
    D --> E[Pattern Matching]
    D --> F[Entropy Analysis]
    D --> G[Known Prefixes]
    D --> H[Base64 Detection]
    E --> I{¿Match con patrón conocido?}
    I -->|Sí| J[Clasificar severidad]
    F --> K{¿Entropía > 4.5?}
    K -->|Sí| L[Verificar contexto]
    L --> M{¿En asignación de variable<br>tipo secret/key/token?}
    M -->|Sí| J
    G --> N{¿Prefijo conocido?}
    N -->|Sí| J
    H --> O{¿Decodifica a<br>texto legible?}
    O -->|Sí| J
    J --> P[SARIF Finding]
    style P fill:#4c6ef5,color:#fff
```

### Reglas del SecretsAnalyzer

> [!info] Las 7 reglas de detección de secretos
>
> | ID | Nombre | Descripción | Severidad |
> |---|--------|------------|-----------|
> | VIGIL-SEC-001 | hardcoded_api_key | API key con prefijo conocido | ==CRITICAL== |
> | VIGIL-SEC-002 | placeholder_secret | Placeholder como "your-api-key-here" | HIGH |
> | VIGIL-SEC-003 | base64_secret | Secreto codificado en Base64 | MEDIUM |
> | VIGIL-SEC-004 | high_entropy_string | String con entropía Shannon > 4.5 | MEDIUM |
> | VIGIL-SEC-005 | connection_string | URL con credenciales embebidas | ==CRITICAL== |
> | VIGIL-SEC-006 | private_key | Clave privada en código | ==CRITICAL== |
> | VIGIL-SEC-007 | generic_token | Token de plataforma conocida | HIGH |

### Cálculo de entropía Shannon

> [!tip] Entropía como indicador de secretos
> La entropía de Shannon mide la aleatoriedad de un string. Los secretos tienden a tener ==alta entropía (> 4.5 bits/carácter)== comparados con código normal (~3.5 bits/carácter).
>
> $$H(X) = -\sum_{i=1}^{n} p(x_i) \log_2 p(x_i)$$
>
> Donde $p(x_i)$ es la frecuencia relativa del carácter $x_i$ en el string.

> [!example]- Implementación del cálculo de entropía
> ```python
> import math
> from collections import Counter
>
> def shannon_entropy(s: str) -> float:
>     """Calcula la entropía Shannon de un string."""
>     if not s:
>         return 0.0
>
>     length = len(s)
>     freq = Counter(s)
>     entropy = 0.0
>
>     for count in freq.values():
>         p = count / length
>         if p > 0:
>             entropy -= p * math.log2(p)
>
>     return entropy
>
> # Ejemplos
> print(shannon_entropy("hello world"))       # ~3.18 - texto normal
> print(shannon_entropy("aK8mP2xQ9wL5nR7t"))  # ~4.08 - posible secreto
> print(shannon_entropy("sk-proj-a1b2c3d4e5")) # ~3.92 - API key
> print(shannon_entropy("aaaaaaaaaa"))          # 0.0 - sin entropía
> ```

---

## Protección de archivos sensibles en architect

### Archivos protegidos

[[architect-overview|architect]] implementa una lista de archivos sensibles que ==no pueden ser leídos ni escritos== por los agentes:

> [!warning] Archivos bloqueados por architect
> ```python
> SENSITIVE_FILES = [
>     ".env",
>     ".env.local",
>     ".env.production",
>     "*.pem",
>     "*.key",
>     "*.p12",
>     "*.pfx",
>     "*.jks",
>     "credentials.json",
>     "service-account.json",
>     "id_rsa",
>     "id_ed25519",
>     ".npmrc",  # puede contener tokens
>     ".pypirc", # puede contener tokens
> ]
> ```

### Modos de confirmación

| Modo | Comportamiento con secretos | Uso recomendado |
|------|---------------------------|-----------------|
| `yolo` | No bloquea (==peligroso==) | Solo desarrollo local |
| `confirm-sensitive` | Pide confirmación para archivos sensibles | ==Recomendado== |
| `confirm-all` | Pide confirmación para todo | Entornos de alta seguridad |

---

## Mejores prácticas de gestión de secretos

### Jerarquía de soluciones

```mermaid
graph BT
    A[Nivel 1: Hardcoded en código ❌] --> B[Nivel 2: Archivos .env ⚠️]
    B --> C[Nivel 3: Variables de entorno ✓]
    C --> D[Nivel 4: Secret Manager ✓✓]
    D --> E[Nivel 5: Dynamic secrets ✓✓✓]
    style A fill:#ff6b6b,color:#fff
    style B fill:#fab005,color:#000
    style C fill:#82c91e,color:#000
    style D fill:#51cf66,color:#fff
    style E fill:#20c997,color:#fff
```

### Secret Managers

> [!success] Soluciones recomendadas
>
> | Solución | Tipo | Rotación automática | Dynamic secrets | Precio |
> |----------|------|---------------------|-----------------|--------|
> | ==HashiCorp Vault== | Self-hosted/Cloud | Sí | ==Sí== | Open source + Enterprise |
> | ==AWS Secrets Manager== | Cloud | Sí | Via Lambda | $0.40/secreto/mes |
> | Azure Key Vault | Cloud | Sí | No | $0.03/10K ops |
> | GCP Secret Manager | Cloud | Sí | No | $0.06/10K ops |
> | 1Password Connect | SaaS | Manual | No | Business+ |
> | Doppler | SaaS | Sí | No | Free tier disponible |

### Patrón recomendado para código generado por IA

> [!tip] Prompt engineering para secretos seguros
> Al solicitar código a un LLM, incluir instrucciones explícitas:
> ```
> Genera código que:
> - Use variables de entorno para TODAS las credenciales
> - NUNCA incluya valores de ejemplo para secretos
> - Use python-dotenv para desarrollo local
> - Incluya validación de que los secretos existen
> - Falle rápido si falta algún secreto requerido
> ```

> [!example]- Patrón seguro vs inseguro
> ```python
> # ❌ Lo que el LLM genera habitualmente
> import openai
> openai.api_key = "sk-proj-your-key-here"
>
> # ✓ Lo que debería generar
> import os
> import openai
> from dotenv import load_dotenv
>
> load_dotenv()
>
> api_key = os.environ.get("OPENAI_API_KEY")
> if not api_key:
>     raise ValueError(
>         "OPENAI_API_KEY environment variable is required. "
>         "Set it in .env file or export it."
>     )
> openai.api_key = api_key
> ```

---

## Pre-commit hooks para detección

> [!example]- Configuración de pre-commit para secretos
> ```yaml
> # .pre-commit-config.yaml
> repos:
>   - repo: https://github.com/gitleaks/gitleaks
>     rev: v8.18.0
>     hooks:
>       - id: gitleaks
>
>   - repo: https://github.com/Yelp/detect-secrets
>     rev: v1.4.0
>     hooks:
>       - id: detect-secrets
>         args: ['--baseline', '.secrets.baseline']
>
>   # vigil como pre-commit hook
>   - repo: local
>     hooks:
>       - id: vigil-secrets
>         name: vigil secrets scan
>         entry: vigil scan --analyzer secrets --fail-on critical,high
>         language: system
>         pass_filenames: true
> ```

---

## Respuesta a incidentes de secretos filtrados

> [!danger] Procedimiento de emergencia
> Si se detecta un secreto filtrado:
> 1. **Revocar inmediatamente** la credencial expuesta
> 2. **Rotar** todas las credenciales del mismo servicio
> 3. **Auditar** logs de acceso del servicio afectado
> 4. **Escanear** el historial de git con `gitleaks` o `trufflehog`
> 5. **Limpiar** el historial si el repositorio es público (`git filter-branch` o BFG)
> 6. **Documentar** el incidente según [[ai-incident-response]]

> [!question] ¿Basta con eliminar el secreto del código?
> **No.** Si el secreto fue commiteado alguna vez, permanece en el historial de git. Herramientas como `git log -p` o servicios como GitGuardian lo encontrarán. Es necesario ==reescribir el historial== o ==rotar la credencial==.

---

## Relación con el ecosistema

- **[[intake-overview]]**: intake puede detectar especificaciones que solicitan explícitamente la inclusión de credenciales en código y rechazarlas o sanitizarlas antes de pasar la especificación al agente generador.
- **[[architect-overview]]**: architect protege archivos sensibles (`.env`, `*.pem`, `*.key`) mediante listas de archivos bloqueados en su sistema de `check_file_access`, impidiendo que los agentes lean o expongan credenciales almacenadas.
- **[[vigil-overview]]**: vigil detecta secretos en código generado mediante su SecretsAnalyzer con 7 reglas que cubren API keys, placeholders, Base64, alta entropía, connection strings, claves privadas y tokens de plataforma.
- **[[licit-overview]]**: licit asegura que la gestión de secretos cumple con requisitos regulatorios, incluyendo el registro de accesos a credenciales para auditoría y la verificación de que no se incluyen secretos en artefactos distribuidos.

---

## Enlaces y referencias

> [!quote]- Bibliografía
> - [^1]: GitHub. (2024). "Secret scanning: 100 million secrets blocked." GitHub Blog.
> - GitGuardian. (2024). "State of Secrets Sprawl 2024." Annual Report.
> - Meli, M., McNiece, M.R., & Reaves, B. (2019). "How Bad Can It Git? Characterizing Secret Leakage in Public GitHub Repositories." NDSS 2019.
> - HashiCorp. (2024). "Vault Documentation." https://developer.hashicorp.com/vault
> - OWASP. (2025). "Secrets Management Cheat Sheet." https://cheatsheetseries.owasp.org/

[^1]: GitHub introdujo secret scanning como feature nativa en 2022, expandiéndolo a todos los repositorios públicos en 2023.
