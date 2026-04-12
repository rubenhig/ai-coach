# Ideas — AI Coach

> Documento vivo. Ideas cortas, sin detalle técnico todavía.

---

## Decisiones ✅

- **El agente ES la aplicación** — no es un feature, es el núcleo. El usuario interactúa con él para todo
- **Wizards dinámicos** — el agente genera formularios/wizards cuando necesita datos estructurados del usuario
- **Artefactos** — el agente crea visualizaciones persistentes que el usuario guarda (calendario, gráficos, resúmenes)
- **Deporte-agnóstico** — modelo de dominio genérico desde el inicio, especialización por deporte después
- **Múltiples Goals** con prioridad A/B/C simultáneos. Events opcionalmente vinculados a Goals
- **Edición mixta**: usuario puede tocar cosas manualmente, pero el objetivo es que el agente sea tan bueno que prefiera usarlo
- **Memoria total**: el coach recuerda todo (planes previos, lesiones, qué funcionó)
- **Métricas adaptativas**: más hardware/datos = más precisión, pero funciona con lo mínimo (Strava básico + RPE)
- **Conocimiento por capas**: LLM (sabe ciencia) → prompt (criterio) → tools (computan) → dominio (estructura) → contexto dinámico (estado actual)

---

## El modelo de interacción

```
Chat con el coach
  ├── Texto (explicaciones, motivación, feedback)
  ├── Wizards (formularios que el agente genera cuando los necesita)
  └── Artefactos (visualizaciones que el usuario puede GUARDAR)

Plan = vistas base comunes + colección de artefactos del agente
```

---

## Ideas 🔍

- **Coach proactivo**: no solo responde, también inicia ("llevas 3 días sin entrenar")
- **Coach como equipo**: un coach principal que puede consultar "especialistas" (fuerza, nutrición...)
- **Match automático Strava ↔ sesión planificada**: cuando llega actividad, matchear con lo prescrito
- **Ciclo de vida del Goal**: active → completed/cancelled. SubGoals cerrados con el padre
- **Métricas de progresión**: fitness/fatiga/forma (CTL/ATL/TSB), adherencia a sesiones planificadas
- **Custom AgentMessages**: mensajes custom (wizard_form, artifact, plan_update, alert...) que el frontend renderiza de forma especial
- **Steering/Follow-up**: el sistema inyecta mensajes al coach (ej: "acaba de llegar una actividad nueva")
- **transformContext**: inyectar estado actual del atleta antes de cada llamada al LLM (sin tool call)

---

## Más adelante 💭

- Más plataformas (Garmin, Polar, Wahoo)
- Entrenador humano supervisando al coach IA
- Comunidad / planes compartidos
- Wearables (sueño, HRV, recovery)
- Presencia del agente fuera del chat (comentarios en actividades, sugerencias en el plan...)

---

## Principios 🎯

1. **El agente es el centro** — toda interacción pasa por él o es enriquecida por él
2. **Para todos los públicos** — técnico cuando aporta, accesible siempre
3. **Datos reales > teoría** — computar, no narrar
4. **Adaptativo** — el plan se ajusta a la vida real
5. **Transparente** — el coach explica el porqué
6. **100% interactivo** — el usuario QUIERE usar el agente porque es muy capaz
