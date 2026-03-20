---
tags:
  - runbook
  - produccion
aliases:
  -
created: {{date:YYYY-MM-DD}}
updated: {{date:YYYY-MM-DD}}
category: produccion
status: current
difficulty: intermediate
related:
  - "[[]]"
  - "[[]]"
  - "[[]]"
  - "[[]]"
  - "[[]]"
up: "[[moc-produccion]]"
---

# Runbook: {{title}}

> [!abstract] Resumen
> Procedimiento operativo para [situación]. Tiempo estimado de resolución: X minutos. ^resumen

> [!danger] Requisitos previos
> - Acceso a: ...
> - Permisos: ...
> - Herramientas: ...

---

## Síntomas / Cuándo usar este runbook

- Síntoma observable 1
- Alerta que lo dispara: `nombre_alerta`
- Dashboard relevante: [[dashboard-link]]

---

## Diagnóstico rápido (< 2 min)

```bash
# Paso 1: Verificar estado
comando_diagnostico_1

# Paso 2: Revisar logs
comando_diagnostico_2

# Paso 3: Identificar causa probable
comando_diagnostico_3
```

---

## Procedimiento de resolución

### Escenario A: [Causa más común]

> [!warning] Impacto de las acciones
> Estas acciones afectan a: [componentes]

1. **Paso 1**: Descripción
   ```bash
   comando
   ```
2. **Paso 2**: Descripción
   ```bash
   comando
   ```
3. **Verificación**: Confirmar resolución
   ```bash
   comando_verificacion
   ```

### Escenario B: [Segunda causa más común]

1. **Paso 1**: ...
2. **Paso 2**: ...

---

## Escalación

| Nivel | Cuándo escalar | A quién | Contacto |
|---|---|---|---|
| L1 | Si no se resuelve en 15 min | On-call lead | ... |
| L2 | Si afecta a más del 50% de usuarios | Engineering manager | ... |
| L3 | Si hay pérdida de datos | CTO | ... |

---

## Post-resolución

- [ ] Verificar que el servicio funciona correctamente
- [ ] Notificar a stakeholders
- [ ] Crear ticket de post-mortem si fue incidente > L1
- [ ] Actualizar este runbook si se descubrió algo nuevo

---

## Historial de uso

> [!info]+ Lecciones aprendidas
> - **YYYY-MM-DD**: Descripción de lo que se aprendió

---

## Enlaces y referencias

- [[on-call-ia]] — Guía general de on-call
- [[ai-postmortems]] — Plantilla de post-mortem
