# Arquitectura del Coach IA

> Diseño del agente inteligente basado en `@mariozechner/pi-agent-core`.
> Referencia: [`entities.md`](../domain/entities.md) para el modelo de dominio.
> Referencia: [`mvp.md`](../domain/mvp.md) para el alcance v1.

---

## Principios de diseño

1. **El agente es el coach** — no es un wrapper de formularios. Razona, evalúa y decide.
2. **Tools = acciones atómicas** — cada tool hace una cosa concreta y bien definida.
3. **Contexto explícito** — el agente siempre tiene acceso al estado actual (goals, sesiones, historial) antes de decidir.
4. **Persistencia fuera del agente** — los tools escriben en BD. El agente solo orquesta.
5. **Ejecución secuencial** — los tools modifican estado; se ejecutan uno a uno para evitar condiciones de carrera.
6. **Horizonte corto** — el agente prescribe sesiones para los próximos 7-10 días, nunca un plan completo.

---

## Capacidades del framework que usamos

| Capacidad | Para qué la usamos |
|-----------|-------------------|
| `initialState.tools` | Inyectar tools con closures sobre userId y callbacks |
| `initialState.messages` | Restaurar historial de conversación entre sesiones |
| `subscribe()` | Streaming de texto y notificaciones de tool execution al frontend |
| `toolExecution: "sequential"` | Garantizar orden en escrituras a BD |
| `transformContext` | Inyectar estado actual de goals como contexto antes de cada turno LLM |
| `state.systemPrompt` | Prompt dinámico con fecha actual y configuración |
| `sessionId` | Prompt caching — reutiliza tokens del system prompt + historial entre turnos. Reduce coste ~90% en tokens cacheados |
| `abort()` | Cancelar ejecución del agente si el usuario cierra el chat o navega fuera. Evita escrituras a BD huérfanas |

### Capacidades preparadas para v2+

El framework ofrece capacidades avanzadas que no usamos en v1 pero cuya integración está prevista. La arquitectura no las bloquea — se pueden añadir sin refactoring.

| Capacidad | Uso futuro | Cómo se integraría |
|-----------|-----------|-------------------|
| `beforeToolCall` / `afterToolCall` | Validación transversal, logging, auditoría, rate limiting | Hooks en el constructor del Agent. No requiere cambios en tools. |
| `steer()` / `followUp()` | Interrupciones mid-run ("para, cambia de plan") y encadenamiento de tareas post-completión | Exponer vía API al frontend (ej: botón "Cancelar y re-planificar"). |
| `CustomAgentMessages` + `convertToLlm` | Mensajes de contexto tipados en lugar de fake user messages en `transformContext` | Declarar tipos custom, filtrar en `convertToLlm`. Reemplazaría el approach actual de `transformContext`. |
| `thinkingLevel` | Razonamiento profundo para evaluaciones complejas (UC6) | `agent.state.thinkingLevel = "medium"` antes de evaluaciones. Requiere provider con soporte (Anthropic, OpenAI). |
| `onPayload` | Inspeccionar/modificar payloads al proveedor para debugging | Hook en constructor. Útil para logging de requests en desarrollo. |

---

## Tools del agente

### Inventario

| # | Tool | Lectura/Escritura | Descripción | Casos de uso MVP |
|---|------|-------------------|-------------|-----------------|
| 1 | `get_training_context` | Lectura | Historial de actividades (8 semanas) + zonas fisiológicas | Todos |
| 2 | `get_current_goals` | Lectura | Goals activos con subGoals, sessions y sus estados | UC5, UC6, UC7 |
| 3 | `save_goal` | Escritura | Crear o actualizar un Goal con sus SubGoals | UC1, UC2, UC7 |
| 4 | `prescribe_sessions` | Escritura | Añadir sesiones planificadas a un Goal | UC3, UC6 |
| 5 | `update_session` | Escritura | Cambiar estado de una sesión (completed/skipped) y vincular Activity | UC5 |

### Detalle de cada tool

#### 1. `get_training_context`

**Ya existe.** Lee las últimas 8 semanas de actividades + zonas del atleta. Sin cambios.

```
Parámetros: {} (vacío — usa userId del closure)
Retorna: JSON con resumen de volumen semanal, tipos de actividad, zonas
```

#### 2. `get_current_goals` ← NUEVO

Lee todos los Goals activos del usuario con su estado completo.

```
Parámetros: {} (vacío)
Retorna: Array de Goals con:
  - nombre, deporte, target, fecha, prioridad, status
  - subGoals: [{ nombre, target, status }]
  - sessions: [{ id, fecha, título, status, linkedActivityId? }]
```

**Decisión**: herramienta explícita (no `transformContext`) porque:
- No siempre se necesita (charla casual, primera conversación)
- El payload puede ser grande (muchas sesiones)
- El agente decide cuándo la necesita — el prompt le dice cuándo llamarla

#### 3. `save_goal` ← REEMPLAZA `update_goal`

Crea o actualiza un Goal con sus SubGoals. **No toca sesiones.**

```
Parámetros: {
  goalId?: number        // Si se proporciona, actualiza. Si no, crea.
  name: string
  sport: string
  targetDescription: string
  targetDate?: string    // ISO date
  priority?: "A" | "B" | "C"
  status?: "active" | "completed" | "cancelled"
  resultDescription?: string     // Solo al cerrar
  resultActivityId?: number      // Solo al cerrar
  subGoals?: [{
    name: string
    sport: string
    targetDescription: string
  }]
}
```

**Persistencia**:
- Si `goalId` existe → UPDATE del goal, merge de subGoals
- Si no existe → INSERT nuevo goal + subGoals
- SubGoals: se reemplazan los activos (los completed no se tocan)
- **Nunca toca PlannedSessions** — eso es responsabilidad de `prescribe_sessions`

#### 4. `prescribe_sessions` ← NUEVO

Añade sesiones planificadas a un Goal existente.

```
Parámetros: {
  goalId: number
  sessions: [{
    date: string           // ISO date
    sport: string
    title: string
    description?: string   // Texto libre del coach
    targetDuration?: number // Minutos
  }]
  replaceFromDate?: string  // Si se proporciona, elimina sesiones PLANNED desde esta fecha antes de insertar
}
```

**Persistencia**:
- Si `replaceFromDate`: elimina sesiones con `status = 'planned'` y `date >= replaceFromDate`
- Inserta las nuevas sesiones
- **Nunca toca sesiones `completed` o `skipped`** — son hechos consumados

**¿Por qué `replaceFromDate`?** Cuando el coach re-planifica (UC6), necesita reemplazar las sesiones futuras planificadas pero preservar el historial. Este parámetro permite "limpiar lo planificado desde hoy y poner sesiones nuevas".

#### 5. `update_session` ← NUEVO

Cambia el estado de una sesión individual.

```
Parámetros: {
  sessionId: number
  status: "completed" | "skipped"
  linkedActivityId?: number    // Solo para completed
}
```

**Persistencia**:
- UPDATE de la sesión específica
- Si `status = completed` y `linkedActivityId` → valida que la Activity existe y pertenece al usuario

---

## Prompt del sistema

### Estructura

```
[Rol y personalidad]
[Modelo de planificación: Goal → SubGoal → PlannedSession]
[Herramientas disponibles y cuándo usar cada una]
[Reglas de horizonte de prescripción]
[Reglas de evaluación y adaptación]
[Formato de respuesta]
[Fecha actual: {ISO_DATE}]
```

### Reglas clave en el prompt

1. **Horizonte de prescripción**: "Prescribe sesiones para los próximos 7-10 días como máximo. Nunca generes un plan completo de semanas."
2. **Flujo obligatorio**: "SIEMPRE llama a `get_training_context` antes de proponer cualquier plan. Si ya existe un Goal activo, llama también a `get_current_goals`."
3. **Separación goal/sessions**: "Usa `save_goal` para definir el objetivo y sus sub-objetivos. Usa `prescribe_sessions` para las sesiones concretas. Son dos acciones separadas."
4. **No duplicar sesiones**: "Antes de prescribir, revisa con `get_current_goals` qué sesiones ya existen para evitar duplicar."
5. **Adaptación**: "Cuando el atleta reporta que hizo o no hizo una sesión, evalúa el impacto y ajusta las próximas sesiones."
6. **Idioma**: "Responde SIEMPRE en español."

---

## Inyección de contexto con `transformContext`

Aunque `get_current_goals` es la herramienta principal, usamos `transformContext` para inyectar un **resumen mínimo** de contexto en cada turno:

```typescript
transformContext: async (messages) => {
  const summary = await getGoalsSummaryOneLiner(userId);
  if (!summary) return messages;

  // Inyectar como primer mensaje de contexto
  const contextMsg: UserMessage = {
    role: 'user',
    content: `[Estado actual] ${summary}`,
    timestamp: Date.now(),
  };
  return [contextMsg, ...messages];
}
```

El resumen es una línea: `"Goal activo: Maratón Valencia sub-3:30 (15 jun). 3 sesiones planned, 12 completed."` — suficiente para que el LLM sepa si necesita llamar a `get_current_goals` para más detalle.

---

## Flujo de ejecución por caso de uso

### UC1+UC2+UC3: Crear Goal y prescribir sesiones

```
Usuario: "Quiero preparar una media maratón en sub 1:45 para junio"

Agente:
  1. get_training_context()           → historial + zonas
  2. Razona: nivel actual, semanas disponibles, capacidades a desarrollar
  3. save_goal({                      → crear Goal + SubGoals
       name: "Sub 1:45 Media Maratón",
       sport: "Run",
       targetDescription: "Terminar en sub 1:45",
       targetDate: "2025-06-15",
       priority: "A",
       subGoals: [
         { name: "Base aeróbica", sport: "Run", targetDescription: "Ritmo fácil ≤ 5:30/km" },
         { name: "Umbral", sport: "Run", targetDescription: "Sostener 4:55/km 20min" },
         { name: "Resistencia específica", sport: "Run", targetDescription: "15km a 4:58/km" }
       ]
     })
  4. prescribe_sessions({             → sesiones próximos 7-10 días
       goalId: <id del goal>,
       sessions: [
         { date: "2025-02-11", sport: "Run", title: "Rodaje suave Z2", targetDuration: 45, description: "..." },
         { date: "2025-02-13", sport: "Run", title: "Fartlek 6x3min", targetDuration: 55, description: "..." },
         ...
       ]
     })
  5. Responde al usuario con resumen y explicación
```

### UC5+UC6: Emparejar actividad y re-planificar

```
Usuario: "Ayer hice el rodaje pero me costó mucho, las piernas muy cargadas"

Agente:
  1. get_current_goals()              → ver sesiones planned y estado actual
  2. get_training_context()           → ver la actividad de ayer
  3. update_session({                 → vincular actividad a sesión
       sessionId: 42,
       status: "completed",
       linkedActivityId: 12345
     })
  4. Razona: piernas cargadas + datos reales de la actividad
  5. prescribe_sessions({             → ajustar próximas sesiones
       goalId: <id>,
       replaceFromDate: "2025-02-12", // replanificar desde mañana
       sessions: [ ...sesiones ajustadas... ]
     })
  6. Responde: "He visto tu rodaje. Has ido a 5:45/km con FC media de 148,
     que es un poco alto para Z2. Voy a bajar la carga los próximos días..."
```

### UC7: Cerrar Goal

```
Usuario: "Hice la media maratón! 1:43:22!"

Agente:
  1. get_current_goals()              → ver el goal activo
  2. get_training_context()           → ver la actividad de la carrera
  3. save_goal({                      → cerrar con resultado
       goalId: <id>,
       status: "completed",
       resultDescription: "Completada en 1:43:22 — objetivo sub 1:45 LOGRADO",
       resultActivityId: <id de la actividad>
     })
  4. Responde con felicitación y análisis
```

---

## Persistencia de conversación

### Qué se persiste

- **Mensajes del agente**: `coachMessages` tabla, columna `data` (JSONB) con el `AgentMessage` completo.
- **Goals + SubGoals + Sessions**: tablas `goals` y `planned_sessions`.

### Restauración de sesión

```typescript
// Al iniciar una sesión de chat:
const history = await getStoredMessages(userId);

const agent = new Agent({
  initialState: {
    systemPrompt: buildSystemPrompt(), // con fecha actual
    model: getModel('openrouter', 'anthropic/claude-3.7-sonnet'),
    tools: buildTools(userId, callbacks),
    messages: history,
  },
  toolExecution: 'sequential',
  transformContext: buildContextTransformer(userId),
  sessionId: `coach-${userId}`, // Prompt caching — reutiliza tokens entre turnos
});

await agent.prompt(userMessage);

// Persistir solo los mensajes nuevos
const newMessages = agent.state.messages.slice(history.length);
await storeMessages(userId, newMessages);
```

### Abort (cancelación limpia)

Si el usuario cierra el chat o el cliente desconecta, se aborta la ejecución del agente:

```typescript
// En el endpoint SSE, al detectar desconexión del cliente:
agent.abort();
// El AbortSignal se propaga a:
// - El stream LLM en curso (deja de recibir tokens)
// - Los tools en ejecución (reciben signal.aborted = true)
// - Los listeners de subscribe()
// El agente queda en estado idle y no persiste mensajes parciales.
```

Esto evita que tools sigan escribiendo en BD después de que el usuario se fue. Los tools de escritura (`save_goal`, `prescribe_sessions`, `update_session`) deben verificar `signal?.aborted` antes de hacer commits.

### Limpieza de historial

Cuando la conversación crece mucho (> N mensajes), se podrá usar `transformContext` para comprimir mensajes antiguos. No implementado en v1 — la conversación se resetea si el usuario lo pide.

---

## Estructura de archivos

```
backend/src/agent/
├── service.ts                 # AgentService: orquesta agente + persistencia
├── types.ts                   # Tipos: GoalData, SessionData, CoachSSEEvent
├── prompts/
│   └── coach.ts               # System prompt del coach
├── tools/
│   ├── get-training-context.ts   # Tool 1: historial + zonas
│   ├── get-current-goals.ts      # Tool 2: goals activos con detalle
│   ├── save-goal.ts              # Tool 3: crear/actualizar goal + subgoals
│   ├── prescribe-sessions.ts     # Tool 4: añadir sesiones planificadas
│   └── update-session.ts         # Tool 5: cambiar estado de sesión
└── context/
    └── transformer.ts            # transformContext: inyección de resumen
```

---

## Eventos SSE al frontend

| Evento | Cuándo | Payload |
|--------|--------|---------|
| `text_delta` | Streaming de texto del asistente | `{ delta: string }` |
| `tool_start` | Inicio de ejecución de tool | `{ label: string }` |
| `goal_update` | Tool `save_goal` ejecutado | `{ goal: GoalData }` |
| `sessions_update` | Tool `prescribe_sessions` ejecutado | `{ goalId: number, sessions: SessionData[] }` |
| `session_update` | Tool `update_session` ejecutado | `{ session: SessionData }` |

---

## Decisiones técnicas

### ¿Por qué tools separados para goal y sessions?

El modelo de dominio separa claramente Goal (qué quiero lograr) de PlannedSession (qué hago hoy). Son preocupaciones diferentes con ciclos de vida diferentes:
- El Goal se crea una vez y se actualiza poco
- Las sesiones se prescriben y reemplazan continuamente

Un tool monolítico (`update_goal` con sessions incluidas) mezcla responsabilidades y obliga al LLM a generar todo junto. Con tools separados, el LLM puede crear el goal, luego prescribir sesiones, y en futuras conversaciones prescribir más sesiones sin re-enviar el goal.

### ¿Por qué `replaceFromDate` y no delete+recreate?

El patrón delete-all + recreate destruye sesiones completadas y sus vínculos con Activities. `replaceFromDate` es un merge selectivo: solo toca sesiones futuras en estado `planned`, preservando el historial de lo ejecutado.

### ¿Por qué `toolExecution: "sequential"`?

Los tools 3-5 escriben en BD. Si el LLM llama a `save_goal` + `prescribe_sessions` en el mismo turno (lo cual es posible y deseable), la ejecución secuencial garantiza que el goal existe antes de insertar sesiones referenciándolo.

### ¿Por qué no usar `beforeToolCall` para validación?

En v1, la validación se hace dentro de cada tool (verificar que el goal existe, que la session pertenece al usuario, etc.). Es más simple y más legible. En v2, `beforeToolCall` puede añadir logging, rate limiting, o validación transversal.
