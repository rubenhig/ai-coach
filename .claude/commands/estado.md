Lee los siguientes ficheros y dame un estado actual del proyecto:

1. `docs/domain/entities.md` — modelo conceptual
2. `docs/domain/mvp.md` — alcance MVP
3. `docs/architecture/agent.md` — arquitectura del agente
4. `backend/src/db/schema.ts` — schema actual de BD
5. `backend/src/agent/tools/` — lista qué tools existen

Con esa información, dame un resumen estructurado con estas secciones:

**Schema** — ¿Las tablas en `schema.ts` coinciden con las entidades en `entities.md`? ¿Falta algo, sobra algo?

**Agent tools** — De los 5 tools definidos en `agent.md` (`get_training_context`, `get_current_goals`, `save_goal`, `prescribe_sessions`, `update_session`), ¿cuáles existen en `backend/src/agent/tools/`? ¿Alguno tiene una implementación que no coincida con la spec?

**MVP** — ¿Qué casos de uso del MVP están cubiertos por los tools implementados? ¿Qué queda pendiente?

**Inconsistencias** — Cualquier cosa en el código que contradiga una decisión cerrada en `entities.md` o `agent.md`.

Sé directo y concreto. Sin introducción, sin resumen al final.
