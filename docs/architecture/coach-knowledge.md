# Arquitectura del Conocimiento del Coach

> Cómo el coach "sabe" lo que sabe. Documento de referencia para el diseño del sistema.

---

## El modelo de capas

El coach no es un chatbot con un prompt largo. Es un sistema por capas donde cada capa aporta un tipo de conocimiento distinto:

```
┌─────────────────────────────────────────────────────┐
│  Capa 5 — transformContext                          │
│  Estado actual del atleta inyectado antes de cada    │
│  llamada al LLM. Dinámico, calculado en tiempo real. │
├─────────────────────────────────────────────────────┤
│  Capa 4 — Modelo de dominio (Base de datos)         │
│  Las entidades codifican los conceptos:              │
│  goals, subgoals, sesiones planificadas, actividades.│
├─────────────────────────────────────────────────────┤
│  Capa 3 — Tools que computan                        │
│  El coach no "habla" de métricas, las CALCULA.       │
│  TSS, CTL, ATL, TSB, adherencia, progresión.        │
├─────────────────────────────────────────────────────┤
│  Capa 2 — System prompt                             │
│  Principios, reglas de decisión, persona, idioma.    │
│  Define CÓMO razona y se comunica el coach.         │
├─────────────────────────────────────────────────────┤
│  Capa 1 — Conocimiento del LLM                      │
│  Claude ya sabe ciencia del deporte: periodización,  │
│  fisiología, modelos de entrenamiento, zonas.       │
└─────────────────────────────────────────────────────┘
```

---

## Capa 1 — Conocimiento inherente del LLM

**Qué es**: Todo lo que Claude ya sabe sobre ciencia del entrenamiento.

**Incluye**: Periodización (lineal, ondulante, ATR, polarizada), fisiología del ejercicio, principios del entrenamiento, zonas de intensidad, recuperación, nutrición deportiva, biomecánica, psicología deportiva.

**Rol**: Base de conocimiento pasiva. El coach puede razonar sobre cualquier concepto sin que se lo expliquemos. No necesitamos "enseñarle" qué es un mesociclo o el modelo PMC.

**Limitación**: No tiene datos del atleta. No puede calcular. No tiene contexto de la situación actual.

---

## Capa 2 — System prompt

**Qué es**: Las instrucciones que definen el comportamiento del coach.

**Incluye**:
- **Persona**: Tono, idioma, nivel de tecnicismo adaptativo
- **Principios de decisión**: "Prioriza seguridad sobre rendimiento", "Adapta el lenguaje al nivel del usuario"
- **Reglas operativas**: Cuándo usar cada tool, en qué orden, qué validar antes de actuar
- **Filosofía de entrenamiento**: Qué modelos preferir según contexto (ej: polarizado para endurance en fase de build)

**Rol**: Define CÓMO piensa y se comporta el coach. No le da datos, le da criterio.

**Clave**: El prompt no debe contener datos ni métricas — solo lógica de decisión. Los datos vienen de las capas superiores.

---

## Capa 3 — Tools que computan

**Qué es**: Herramientas que el coach ejecuta para obtener datos reales calculados.

**Principio fundamental**: El coach no "habla" de métricas, las CALCULA. La diferencia entre un chatbot y un coach real es que el coach opera con datos computados, no con texto.

**Mapping guía → tools**:

| Concepto (guía) | Tool del coach | Qué calcula |
|---|---|---|
| TSS | `calculate_training_stress` | Estrés de cada sesión relativo al umbral |
| CTL / ATL / TSB | `get_fitness_fatigue_form` | Estado actual de fitness, fatiga y forma |
| Zonas de entrenamiento | `get_athlete_zones` | Zonas actuales basadas en umbrales |
| Distribución de intensidad | `analyze_intensity_distribution` | % tiempo en cada zona (¿es polarizado?) |
| Adherencia | `get_goal_adherence` | % sesiones completadas vs prescriptas por Goal |
| Progresión | `analyze_progression` | Tendencias en rendimiento a lo largo del tiempo |
| Match planned↔actual | `match_session_activity` | Comparar lo prescrito vs lo realizado |
| Perfil del atleta | `get_athlete_context` | Todo lo que el coach necesita saber del atleta |
| Estado del Goal | `get_goal_status` | SubGoals, progreso, próximas sesiones |
| Prescribir sesiones | `prescribe_sessions` | Crear/ajustar sesiones planificadas para un Goal |

**Deporte-agnóstico**: Los tools operan con abstracciones. El TSS se calcula diferente para ciclismo (potencia) que para carrera (pace/HR) que para fuerza (volumen×RPE), pero el tool expone la misma interfaz.

---

## Capa 4 — Modelo de dominio (Base de datos)

**Qué es**: La estructura de datos que codifica los conceptos de entrenamiento.

**Principio**: Los conceptos de la guía (periodización, fases, carga, zonas) se materializan en entidades de base de datos. El dominio ES la ciencia del entrenamiento hecha estructura.

**Modelo adaptativo** (ver `docs/domain/entities.md` para detalle):

```
Event (competición, opcional)
  ↑ vinculación opcional
Goal (objetivo medible que genera entrenamiento)
  ├── SubGoals (capacidades fisiológicas a desarrollar)
  └── PlannedSessions (prescripciones del coach IA)
         └── Activity (lo que el atleta realmente hizo, emparejada)
```

No existe entidad TrainingPlan — el coach IA prescribe sesiones directamente basándose en el progreso de los subGoals, el historial de actividades y el estado del atleta. La periodización, fases y distribución de carga son conocimiento del coach (capas 1-2), no estructura de datos.

**Lo que cambia por deporte** (contenido, no estructura):
- Métrica de carga: TSS (potencia) vs hrTSS (FC) vs sRPE (percepción)
- Zonas: %FTP vs %LTHR vs %1RM vs pace
- Tipos de sesión: series/tempo/largo (running) vs hipertrofia/fuerza/potencia (gym)
- SubGoals típicos: umbral/VO2max/base (endurance) vs fuerza máx/hipertrofia/potencia (gym)

---

## Capa 5 — transformContext (inyección dinámica)

**Qué es**: Hook de pi-agent-core que inyecta contexto calculado antes de cada llamada al LLM.

**Principio**: El coach siempre llega a cada conversación "sabiendo" el estado actual del atleta, sin necesidad de que el atleta lo explique ni de que el coach llame a un tool primero.

**Qué se inyecta** (ejemplo):

```
── Contexto del atleta (auto-inyectado) ──
Goal principal: Sub 1:45 Media Maratón Valencia (12 nov) — Prioridad A
SubGoals: Base aeróbica ✅ | Umbral 4:55/km (en progreso) | Resistencia específica (pendiente)
Fitness (CTL): 47 — Fatiga (ATL): 62 — Forma (TSB): -15
Sesiones completadas esta semana: 3/5
Próxima sesión: Mañana — Series 6x1000m @ Z4 (Goal: umbral)
Última actividad: Hoy — Carrera fácil 8km, Z2, HR ok
Tendencia: Fitness ↑ constante, fatiga alta → descarga recomendable pronto
```

**Por qué es poderoso**: El coach puede responder "¿cómo voy?" sin hacer ningún tool call. Ya tiene los números. Puede dedicar su capacidad de razonamiento a INTERPRETAR, no a buscar datos.

**Cuándo se recalcula**: Antes de cada `agent.prompt()`. Es un snapshot fresco.

---

## Cómo fluye todo junto

```
Usuario: "Estoy cansado, ¿debería entrenar mañana?"

                    ┌──────────────────────┐
                    │ transformContext      │  ← TSB = -15, ATL alta
                    │ inyecta estado actual │     adherencia 3/5
                    └──────────┬───────────┘     próxima sesión: series
                               │
                    ┌──────────▼───────────┐
                    │ System prompt         │  ← "Si TSB < -10 y el atleta
                    │ aplica reglas         │     reporta fatiga, priorizar
                    └──────────┬───────────┘     recuperación"
                               │
                    ┌──────────▼───────────┐
                    │ LLM razona           │  ← Sabe que -15 es fatiga
                    │ con conocimiento     │     alta, que hay descarga
                    └──────────┬───────────┘     programada pronto
                               │
                    ┌──────────▼───────────┐
                    │ Tool: prescribe      │  ← Cambia series de mañana
                    │ ajusta la sesión     │     por Z2 suave o descanso
                    └──────────────────────┘

Coach: "Con tu TSB en -15 y la fatiga que describes, las series de mañana
serían contraproducentes. Te las cambio por una carrera suave de 30min en Z2.
La descarga de la semana que viene hará el resto. Las series las recuperamos
el jueves si te sientes mejor."
```

---

## Principios de diseño

1. **Los datos suben, las decisiones bajan** — Las capas inferiores aportan datos; las superiores aportan contexto; el LLM + prompt toman decisiones.

2. **Computar, no narrar** — El coach no debe "hablar de TSB". Debe tener el TSB calculado y actuar en consecuencia. La métrica se explica solo si el atleta pregunta o si ayuda a la comprensión.

3. **Deporte-agnóstico en estructura, específico en contenido** — El modelo Goal → SubGoals → PlannedSessions es universal. Lo que cambia son las métricas, zonas y tipos de sesión. La periodización es conocimiento del coach, no estructura de datos.

4. **El contexto es gratis** — Gracias a transformContext, el coach siempre sabe dónde está el atleta. No hay "arranque en frío" en cada conversación.

5. **Lenguaje adaptativo** — El coach usa terminología técnica (TSB, ATR, polarizado) cuando aporta, pero la traduce cuando el atleta no la maneja. El nivel se adapta al perfil.
