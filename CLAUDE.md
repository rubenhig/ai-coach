# CLAUDE.md — Dux (ai-coach)

Contexto esencial para arrancar cualquier conversación sin releer docs.

---

## Stack

| Capa | Tech |
|------|------|
| Frontend | Next.js 16.2, React 19, Tailwind v4, shadcn/ui, TypeScript |
| Backend | Hono (Node.js ESM), `@mariozechner/pi-agent-core` |
| DB | PostgreSQL + Drizzle ORM |
| Cola | BullMQ + Redis |
| Infra | Docker Compose |

---

## Decisiones arquitectónicas — NO cambiar sin discutir

- **No existe TrainingPlan** como entidad. El coach prescribe sesiones directamente sobre Goals.
- **No existen Phase ni Week** como tablas. Son metadata plana en `planned_sessions`.
- **Goal** es la entidad organizadora. Tiene subgoals via `parent_id`. El coach crea y gestiona todo via herramientas.
- **Event** (competición externa) ≠ Goal (objetivo del atleta). Relación opcional en ambas direcciones.
- El cierre de un Goal siempre lo confirma el atleta, el coach lo propone.

---

## Docs de referencia

Leer en este orden para entender el proyecto:
1. `docs/domain/entities.md` — modelo conceptual (fuente de verdad)
2. `docs/domain/mvp.md` — alcance v1
3. `docs/architecture/agent.md` *(solo en stashed)* — diseño del agente IA
4. `docs/architecture/coach-knowledge.md` — modelo de capas del coach

---

## Comandos frecuentes

```bash
# Verificar tipos TypeScript (backend)
cd backend && npx tsc --noEmit

# Levantar stack completo
docker compose up

# Nueva migración Drizzle
cd backend && npx drizzle-kit generate
cd backend && npx drizzle-kit migrate
```

---

## Preferencias de Ruben

- No incluir `Co-Authored-By: Claude` en los commits.
- Respuestas concisas, sin resúmenes innecesarios al final.
- Diseñar a nivel conceptual antes de tocar código. Si hay duda, preguntar.
