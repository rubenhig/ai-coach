# Frontend — Arquitectura MVP

> Fuente de verdad del diseño de frontend. Define las pantallas, su propósito y qué entidades muestra cada una.

---

## Principios de diseño

1. **Goal-centric**: Los objetivos son la entidad organizadora principal. Las sesiones viven dentro de ellos.
2. **Coach como herramienta**: El coach IA es la interfaz para CREAR y MODIFICAR. Las vistas de consulta son independientes.
3. **Glanceable**: El usuario debe poder responder "¿qué entreno hoy?" en 2 segundos.
4. **Feedback en tiempo real**: El usuario siempre sabe qué está haciendo el agente.
5. **Mobile-first mindset**: Todo debe funcionar en pantallas estrechas (aunque MVP sea desktop).

---

## Navegación

```
Sidebar:
  🏠 Inicio          → /dashboard
  💬 Coach            → /coach
  🎯 Mis Objetivos    → /goals
  🏃 Actividades      → /activities
```

4 secciones. Sin placeholders. Cada una tiene un propósito claro.

---

## Pantallas

### 1. 🏠 Inicio (`/dashboard`)

**Propósito**: Primera pantalla al abrir la app. Responde a "¿cómo voy?" de un vistazo.

**Entidades que muestra**:
- User (perfil)
- Activity (stats semanales, recientes)
- Goal (resumen de goals activos)
- PlannedSession (próxima sesión)

**Secciones**:

| Sección | Descripción | Estado actual |
|---------|-------------|---------------|
| Profile header | Nombre, foto, miembro desde, última sync | ✅ Existe |
| Stats semanales | Actividades, distancia, tiempo (vs media 4 sem) | ✅ Existe |
| Volumen semanal | Gráfica de volumen últimas semanas | ✅ Existe |
| Trend insight | Texto generado sobre tendencia | ✅ Existe |
| Actividades recientes | Últimas 5 actividades | ✅ Existe |
| **Próxima sesión** | Tarjeta destacada con la sesión más próxima de cualquier goal | 🆕 Nuevo |
| **Goals activos** | Lista compacta de goals activos (nombre, deporte, fecha, progreso) | 🆕 Nuevo |

**Wireframe**:
```
┌──────────────────────────────────────────────┐
│  👤 Nombre · Miembro desde...                │
├──────────────────────────────────────────────┤
│  📅 PRÓXIMA SESIÓN                           │
│  ┌──────────────────────────────────────┐    │
│  │ Mar 15 abr · Rodaje fácil 45min     │    │
│  │ Running · 45 min · Goal: Maratón    │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  🎯 OBJETIVOS ACTIVOS                        │
│  ┌────────────────┐ ┌────────────────┐       │
│  │ Maratón BCN    │ │ FTP 280W       │       │
│  │ 15 jun · A     │ │ Sin fecha · B  │       │
│  │ 3/12 sesiones  │ │ 1/5 sesiones   │       │
│  └────────────────┘ └────────────────┘       │
├──────────────────────────────────────────────┤
│  📊 ESTA SEMANA                              │
│  [3 actividades] [42 km] [4h 30m]            │
├──────────────────────────────────────────────┤
│  📈 Gráfica volumen semanal                  │
├──────────────────────────────────────────────┤
│  🏃 Actividades recientes                    │
└──────────────────────────────────────────────┘
```

---

### 2. 💬 Coach (`/coach`)

**Propósito**: Interfaz conversacional para CREAR, MODIFICAR y CONSULTAR con el coach IA.

**Entidades que muestra (inline en el chat)**:
- Goal (tarjeta rica cuando se crea/actualiza)
- PlannedSession (tabla/lista cuando se prescriben)
- Activity (referenciada en el contexto del coach)

**Layout**: Chat a pantalla completa. Sin paneles laterales. Toda la información fluye en la conversación.

**Elementos UX**:

| Elemento | Descripción |
|----------|-------------|
| Header | Icono coach + estado ("Listo" / "Escribiendo..." / "Analizando historial...") |
| Streaming de texto | Respuesta aparece progresivamente |
| Indicador de herramienta | Cuando ejecuta una tool: icono + label ("Creando objetivo...", "Planificando sesiones...") |
| Tarjeta de Goal inline | Cuando crea/modifica un goal, aparece embebida en la conversación |
| Lista de sesiones inline | Cuando prescribe sesiones, aparecen como lista ordenada |
| Empty state | "¿Cuál es tu próximo reto?" + ejemplos sugeridos |
| Borrar conversación | Botón en el header |

**Wireframe**:
```
┌──────────────────────────────────────────────┐
│  ⚡ Coach IA · Listo                    🗑️  │
├──────────────────────────────────────────────┤
│                                              │
│  ¿Cuál es tu próximo reto?                   │
│  Ej: "Quiero correr un maratón en octubre"   │
│                                              │
│  ─ ─ ─ ─ (después de conversar) ─ ─ ─ ─     │
│                                              │
│      [Quiero hacer sub 1:45 en la media  ]   │
│      [maratón de Valencia el 15 de junio ]   │
│                                              │
│  ⚡ He analizado tu historial y te propongo   │
│     el siguiente objetivo:                   │
│                                              │
│     ┌─ 🎯 OBJETIVO ─────────────────────┐   │
│     │ Sub 1:45 Media Maratón Valencia    │   │
│     │ Running · 15 jun 2025 · Prioridad A│   │
│     │                                    │   │
│     │ Sub-objetivos:                     │   │
│     │  ○ Base aeróbica ≤ 5:30/km         │   │
│     │  ○ Umbral 4:55/km × 20min         │   │
│     │  ○ Resistencia 15km a 4:58/km      │   │
│     └────────────────────────────────────┘   │
│                                              │
│  ⚡ He planificado tus sesiones de esta       │
│     semana:                                  │
│                                              │
│     ┌─ 📅 SESIONES ─────────────────────┐   │
│     │ Lun 14 · Rodaje fácil     · 45min │   │
│     │ Mié 16 · Intervalos 6×1km · 55min │   │
│     │ Vie 18 · Tempo 20min      · 50min │   │
│     │ Dom 20 · Tirada larga     · 80min │   │
│     └────────────────────────────────────┘   │
│                                              │
├──────────────────────────────────────────────┤
│  [Escribe tu mensaje...               ] [➤] │
└──────────────────────────────────────────────┘
```

**Tarjetas inline vs panel lateral**: Se eligió inline porque:
1. El chat tiene todo el ancho — más legible
2. Las tarjetas aparecen en el contexto de la conversación (el usuario sabe POR QUÉ se creó ese goal)
3. En "Mis Objetivos" están las mismas tarjetas pero en vista de consulta permanente
4. Responsive: un panel lateral de 420px no funciona en móvil

---

### 3. 🎯 Mis Objetivos (`/goals`)

**Propósito**: Vista goal-centric del atleta. Muestra todos los objetivos con sus sesiones. Es la pantalla de consulta permanente — lo que abres para ver "¿qué tengo y cómo voy?"

**Entidades que muestra**:
- Goal (todos, agrupados por estado)
- SubGoal (dentro de cada goal)
- PlannedSession (dentro de cada goal)
- Activity (vinculada a sesiones completadas)

**Layout**: Lista de goals → click para expandir/navegar al detalle.

**Vista lista** (`/goals`):

```
┌──────────────────────────────────────────────┐
│  🎯 Mis Objetivos                            │
├──────────────────────────────────────────────┤
│  ACTIVOS                                     │
│  ┌──────────────────────────────────────┐    │
│  │ 🏃 Sub 1:45 Media Maratón Valencia  │    │
│  │ 15 jun 2025 · Prioridad A           │    │
│  │ 3 sub-objetivos · 12 sesiones       │    │
│  │ ████████░░ 7 completadas            │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │ 🚴 FTP 280W                         │    │
│  │ Sin fecha · Prioridad B             │    │
│  │ 2 sub-objetivos · 5 sesiones        │    │
│  │ ██░░░░░░░░ 1 completada             │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  COMPLETADOS                                 │
│  ┌──────────────────────────────────────┐    │
│  │ ✅ 10K sub 45min · 2 mar 2025       │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Vista detalle** (`/goals/[id]`):

```
┌──────────────────────────────────────────────┐
│  ← Mis Objetivos                             │
├──────────────────────────────────────────────┤
│  🏃 Sub 1:45 Media Maratón Valencia          │
│  Running · 15 jun 2025 · Prioridad A         │
│  "Correr la media maratón de Valencia en      │
│   menos de 1 hora y 45 minutos"              │
├──────────────────────────────────────────────┤
│  SUB-OBJETIVOS                               │
│  ○ Base aeróbica: ritmo fácil ≤ 5:30/km      │
│  ○ Umbral: sostener 4:55/km × 20min          │
│  ○ Resistencia específica: 15km a ritmo obj.  │
├──────────────────────────────────────────────┤
│  SESIONES PLANIFICADAS                       │
│                                              │
│  ── Esta semana ──                           │
│  ○ Lun 14 abr · Rodaje fácil · 45min        │
│  ○ Mié 16 abr · Intervalos 6×1km · 55min    │
│  ○ Vie 18 abr · Tempo 20min · 50min         │
│  ○ Dom 20 abr · Tirada larga · 80min        │
│                                              │
│  ── Semana pasada ──                         │
│  ✓ Lun 7 abr · Rodaje fácil · 45min         │
│  ✓ Mié 9 abr · Series 8×400m · 50min        │
│  ✗ Vie 11 abr · Fartlek · 45min (skipped)   │
│  ✓ Dom 13 abr · Tirada larga · 75min        │
└──────────────────────────────────────────────┘
```

---

### 4. 🏃 Actividades (`/activities`)

**Propósito**: Historial de actividades de Strava. Ya construida.

**Estado**: ✅ Completa (lista/grid, paginación, detalle de actividad).

Sin cambios para MVP.

---

## Entidades ↔ Pantallas (matriz)

| Entidad | Inicio | Coach | Mis Objetivos | Actividades |
|---------|--------|-------|---------------|-------------|
| User | Perfil | — | — | — |
| Activity | Stats, recientes | Contexto | Vinculada a sesión | Lista completa |
| Goal | Resumen compacto | Tarjeta inline | Vista completa | — |
| SubGoal | — | Dentro de tarjeta | Lista con estado | — |
| PlannedSession | Próxima sesión | Lista inline | Cronológica dentro de goal | — |

---

## Lo que se difiere a v2+

- **Calendario** (`/calendar`): Vista semanal/mensual cruzando todos los goals. Para cuando haya múltiples goals con muchas sesiones simultáneas.
- **Formularios interactivos en el Coach**: Botones de opción, date pickers, wizards para preguntas del agente.
- **Settings**: Preferencias del usuario (notificaciones, idioma, zonas de entrenamiento custom).
- **Análisis de progreso**: Gráficas de progreso hacia subGoals, predicción de rendimiento.
- **Vista detalle de sesión**: Página dedicada con prescripción detallada + actividad vinculada.
- **Notificaciones**: Push/badge cuando hay sesión pendiente o el coach tiene algo que decir.

---

## Stack técnico

- **Framework**: Next.js 16 (App Router)
- **UI Components**: shadcn/ui (ya configurado)
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react
- **Charts**: existentes en dashboard (recharts o similar)
- **State management**: React state local + server components para datos iniciales
- **Streaming**: SSE vía fetch + ReadableStream (ya implementado)
