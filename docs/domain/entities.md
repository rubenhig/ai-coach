# Entidades de Dominio — AI Coach

> Fuente de verdad del modelo de dominio. Cada entidad aquí está cerrada conceptualmente.

---

## Fundamento: Planificación adaptativa

### El modelo

Esta aplicación es un **coach IA**: el agente de inteligencia artificial es el núcleo de la aplicación, no una funcionalidad añadida. El coach analiza, planifica, prescribe y se adapta — como lo haría un entrenador personal humano.

Se investigaron las plataformas líderes del mercado (TrainingPeaks, Intervals.icu, Garmin Training API, Athletica.ai) para entender cómo estructuran la planificación deportiva. Se identificaron dos modelos:

- **Plan rígido** (TrainingPeaks, Garmin): un coach diseña semanas de sesiones de antemano, se aplican al calendario como bloque, y si algo cambia hay que rehacer o parchear. El plan es un producto terminado.
- **Planificación adaptativa** (Athletica.ai): la IA evalúa continuamente lo completado, la respuesta del atleta y el contexto. Genera y ajusta sesiones de forma continua. No hay un "plan de 12 semanas" — hay un flujo de prescripciones que emergen de la evaluación continua.

**Esta aplicación sigue el modelo de planificación adaptativa.** El "plan" no es una entidad rígida almacenada — es emergente: el conjunto de sesiones que el coach IA genera para un objetivo, adaptándose a la realidad del atleta.

### Por qué no existe una entidad "TrainingPlan"

Se evaluó y descartó. Razones:

1. **El coach IA prescribe sesiones directamente**, no aplica plantillas predefinidas. No necesita un contenedor rígido.
2. **Las sesiones futuras son volátiles** — pueden cambiar en cualquier momento según lo que haga o deje de hacer el atleta. Persistir un plan completo de semanas es incompatible con la adaptabilidad.
3. **Ninguna plataforma IA adaptativa modela el plan como entidad** — lo hacen las plataformas de plan fijo, que no es nuestro caso.
4. **Los subGoals son la columna vertebral** de la planificación: representan las capacidades fisiológicas que el atleta necesita desarrollar para alcanzar su objetivo. El coach IA evalúa su progreso y prescribe sesiones en consecuencia.

### Flujo de planificación

```
Goal: "Sub 1:45 media maratón" (15 junio)
  ├── SubGoal: "Base aeróbica: ritmo fácil ≤ 5:30/km"
  ├── SubGoal: "Umbral: sostener 4:55/km durante 20min"
  └── SubGoal: "Resistencia específica: 15km a ritmo objetivo"

El coach IA evalúa subGoals + historial de activities + fatiga + disponibilidad
        ↓
PlannedSession (prescripción concreta para una fecha próxima, vinculada al Goal)
        ↓
Activity (lo que el atleta realmente hizo, emparejada con la PlannedSession)
        ↓
El coach IA evalúa el resultado y prescribe las siguientes sesiones
```

La inteligencia de planificación (periodización, distribución de intensidad, cuándo priorizar qué capacidad, cuánto taper) es conocimiento del coach IA. No necesita ser una entidad de datos — es razonamiento del agente.

### Hallazgos adicionales de la investigación

- **Phase/Week no son entidades** en ninguna plataforma del mercado. Son visualización o metadata, no tablas. Con un coach IA adaptativo, fases rígidas tienen aún menos sentido.
- **El emparejamiento planned ↔ actual** se resuelve con una referencia directa en la sesión planificada (patrón de Intervals.icu `paired_event_id`). No necesita entidad puente.
- **Un atleta puede tener múltiples Goals activos** con sesiones planificadas para cada uno. El coach IA gestiona la priorización entre ellos.

---

## Activity

### Qué es

Esfuerzo atlético completado y registrado, sincronizado desde un proveedor externo.

### Características

- Es un hecho consumado: el atleta realizó una actividad y quedó registrada (Strava, Garmin, archivo FIT/GPX...).
- Tiene datos de resumen (distancia, tiempo, velocidad, FC media/máx, potencia, cadencia, elevación, calorías, mapa) y metadatos (nombre, tipo de deporte, equipo, dispositivo, fecha/hora con timezone).
- Es **inmutable**: lo que el proveedor envía no se modifica. Es la verdad del esfuerzo realizado.
- Se enriquece en fases: primero llega el resumen (sync), luego el detalle (splits, laps), luego los streams punto a punto. No toda la información está disponible desde el primer momento.
- Siempre conserva el JSON crudo original del proveedor para acceder a cualquier dato no normalizado.

### Componentes (partes de una Activity, no entidades independientes)

- **Streams**: datos punto a punto de sensores (tiempo, distancia, GPS, altitud, FC, potencia, cadencia, velocidad, temperatura). Un registro por actividad. Son la materia prima para análisis profundo.
- **Splits**: segmentos por distancia fija (típicamente km o milla). Pre-calculados por el proveedor. Útiles para análisis de ritmo/pacing.
- **Laps**: segmentos definidos por el atleta (pulsando botón de vuelta) o auto-detectados por el dispositivo. Representan intervalos intencionados durante la actividad.

### Ciclo de vida

```
[sync] → summary → detail_enriched → streams_enriched
```

- No tiene estados tipo "borrador" o "cancelado". Existe o no existe.
- El enriquecimiento es progresivo y asíncrono: el sistema va completando datos conforme los obtiene del proveedor.

### Relaciones

- Pertenece a un usuario.
- Puede ser vinculada a un Goal como evidencia de su resultado (al completar un objetivo).
- Puede ser emparejada con una PlannedSession (enlace planned ↔ actual).

### Notas

- Es la entidad con más volumen de datos del sistema. El diseño de almacenamiento de streams impacta directamente en rendimiento.
- El tipo de deporte usa la taxonomía del proveedor (Strava: Run, Ride, Swim, TrailRun, WeightTraining, etc.). No inventamos tipos propios.

---

## Event

### Qué es

Acontecimiento deportivo formal y organizado del mundo real.

### Características

- Es un hecho externo: una carrera, un triatlón, una marcha cicloturista. Existe independientemente del atleta.
- Tiene un nombre, un deporte, una fecha, y opcionalmente distancia, formato y notas descriptivas.
- Tiene un estado propio: puede estar pendiente, haberse celebrado, o haberse cancelado (`upcoming` | `completed` | `cancelled`).
- Retos personales, tests o metas informales NO son Events — son Goals.

### Relaciones

- Pertenece a un usuario (el atleta lo registra en su sistema).
- Un Goal puede vincularse a un Event, pero no es obligatorio en ninguna dirección: un Event puede existir sin Goal, y un Goal puede existir sin Event.

---

## Goal

### Qué es

Objetivo concreto, medible y con fin, que genera planificación de entrenamiento.

### Características

- Responde a la pregunta: "¿cómo sabremos que lo has logrado?". Si no puede responderla, no es un Goal — es contexto del atleta.
- Tiene un nombre descriptivo, un deporte, y una prioridad (A/B/C) que indica su importancia relativa frente a otros Goals del atleta.
- Define un **target** en texto libre ("sub 1:45", "FTP 300W") y opcionalmente una representación estructurada del mismo (métrica + valor + unidad) que permite al sistema medir progreso automáticamente. Es el coach quien decide qué estructura asignar.
- Puede tener una fecha objetivo o no.
- Al completarse, almacena el **resultado real**: qué se logró, notas del cierre, y opcionalmente la actividad vinculada al resultado.
- Puede descomponerse en **subobjetivos** (subGoals): Goals hijos que representan capacidades fisiológicas o hitos intermedios necesarios para alcanzar el padre. Cada subobjetivo es un Goal completo con su propio target y tracking. Los subGoals son la columna vertebral de la planificación adaptativa — el coach IA evalúa su progreso para decidir qué prescribir.
- Un usuario puede tener múltiples Goals activos simultáneamente.
- Lo que NO es un Goal: hábitos ("correr 3x/semana"), preferencias ("no entrenar viernes"), objetivos vagos ("ponerme en forma"). Eso pertenece al perfil/contexto del atleta.

### Ciclo de vida

```
[creación] → active → completed
                   ↘ cancelled
```

- **Creación → active**: el coach y el atleta conversan hasta concretar un objetivo medible. No hay estado "draft" — si aún no está concretado, no es un Goal todavía.
- **active → completed**: el ciclo del objetivo terminó. La transición siempre es explícita — el coach puede proponerla (al detectar una actividad relevante o al pasar la fecha), pero el atleta confirma. Al cerrarse, se registra el resultado real.
- **active → cancelled**: el atleta abandona el objetivo (lesión, cambio de prioridades, etc.).
- **Cierre por Event**: cuando un Event vinculado pasa (su fecha llega), los Goals vinculados se cierran. El coach propone el cierre — con resultado si el atleta participó, o como cancelado si no.
- **Cierre de subGoals**: al completar o cancelar un Goal padre, todos sus subGoals se cierran con él. Si el atleta quiere seguir persiguiendo un subGoal, crea un nuevo Goal independiente.
- **Completar un padre**: requiere que todos sus subGoals estén cerrados primero (o el padre se cierra con resultado parcial).
- **Horizonte temporal**: un Goal sin fecha explícita tendrá un horizonte temporal estimado por el coach, que el atleta valida.

### Relaciones

- Pertenece a un usuario.
- Puede vincularse opcionalmente a un Event (cuando el objetivo gira alrededor de una competición).
- Puede tener un Goal padre (cuando es un subobjetivo de otro Goal).
- Al completarse, puede vincularse a la Activity que representa el resultado.
- Es la entidad raíz de la planificación: las PlannedSessions se generan para un Goal.

### Propiedades derivadas (calculadas por el coach, no almacenadas)

- **Predicción de rendimiento**: rango estimado de resultado para el target, actualizado conforme avanza el entrenamiento.
- **Probabilidad de logro**: estimación de la probabilidad de alcanzar el target con el plan actual. Aplica tanto al Goal padre como a cada subGoal.
- **Estado de progreso**: indicador de si el atleta va en camino de lograr el objetivo (on_track / at_risk / off_track).
- **Estimación de completitud**: cuándo se logrará el target, para Goals sin fecha fija.

### Notas

- El historial de Goals surge naturalmente: Goals completados con su resultado real conforman el historial del atleta.
- Se evaluó incluir un estado `paused` (objetivo aparcado temporalmente) pero se descartó en v1 para mantener simplicidad. Se puede añadir si surge la necesidad.

---

## PlannedSession

### Qué es

Prescripción concreta del coach IA: qué debe hacer el atleta en una fecha determinada.

### Características

- Es la unidad atómica de planificación: "el martes, haz esto".
- Tiene una fecha, un deporte, un título descriptivo, y una descripción del coach que explica la intención de la sesión (por qué se prescribe, qué se busca).
- Define objetivos de la sesión: duración estimada, intensidad objetivo (zona, RPE, rangos de FC/potencia/pace).
- Contiene una **prescripción estructurada**: los pasos concretos del entrenamiento (calentamiento, intervalos, recuperación, vuelta a la calma). El formato de la prescripción es flexible (JSON) y varía por deporte — un entrenamiento de carrera tiene intervalos con paces, uno de fuerza tiene ejercicios con series/reps.
- Es **volátil por naturaleza**: las sesiones futuras pueden cambiar en cualquier momento. Si el atleta no hizo lo planificado ayer, las sesiones de mañana pueden ajustarse. El coach IA prescribe en horizonte corto y adapta continuamente.
- Puede haber varias sesiones planificadas en un mismo día (ej: carrera por la mañana + fuerza por la tarde).
- Toda PlannedSession pertenece a un Goal. Si el coach prescribe sesiones, hay un objetivo que las justifica. No existen sesiones "huérfanas" sin propósito.
- No toda sesión apunta a un subGoal específico: una sesión de recuperación no desarrolla una capacidad concreta, pero contribuye al Goal global al permitir que las sesiones de calidad sean efectivas.

### Ciclo de vida

```
[prescripción] → planned → completed
                        ↘ skipped
```

- **planned**: el coach IA prescribió esta sesión para una fecha.
- **completed**: el atleta realizó la sesión y se emparejó con una Activity.
- **skipped**: la fecha pasó sin que el atleta la realizara.
- No hay estado "modified" — si el coach cambia una sesión futura, la reemplaza. No se versiona.

### Relaciones

- Pertenece a un Goal (siempre — es la razón de su existencia).
- Al completarse, se empareja con una Activity (referencia directa).
- Pertenece indirectamente a un usuario (a través del Goal).

### Notas

- El horizonte de prescripción (cuántos días adelante prescribe el coach) es una decisión operativa del coach IA, no una propiedad de la entidad. Podría ser "esta semana", "los próximos 3 días", o lo que el coach considere apropiado.
- La fase de entrenamiento (base, build, peak, taper...) y el tipo de semana (carga, descarga...) no son propiedades almacenadas de la sesión — son contexto que el coach IA maneja internamente para decidir qué prescribir. Si en el futuro se necesitaran para visualización, se pueden añadir como metadata opcional sin cambiar el modelo.
