# API — Best Practices

## Regla fundamental

**Toda ruta nueva debe usar `createRoute()` + `router.openapi()`.**
Nunca `router.get()`, `router.post()`, etc. directamente.
Mezclar los dos estilos deja la documentación incompleta.

---

## Estructura de una ruta

```typescript
// 1. Definir schemas Zod
const ParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const ResponseSchema = z.object({
  activity: ActivitySchema,
  splits: z.array(SplitSchema),
})

// 2. Definir la ruta
const route = createRoute({
  method: 'get',
  path: '/activities/{id}',
  summary: 'Detalle de una actividad',
  tags: ['Activities'],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ResponseSchema } },
      description: 'Actividad encontrada',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'No encontrada',
    },
  },
})

// 3. Implementar el handler
router.openapi(route, async (c) => {
  const { id } = c.req.valid('param')
  // ...
  return c.json({ activity, splits })
})
```

---

## Schemas

- Los schemas van en `src/schemas/` compartidos entre rutas
- Un schema por entidad: `ActivitySchema`, `SplitSchema`, `LapSchema`...
- Los tipos TypeScript se derivan de los schemas, no al revés:
  ```typescript
  type Activity = z.infer<typeof ActivitySchema>
  ```
- Campos opcionales con `.nullable()` o `.optional()`, nunca `any`

---

## Errores

Usar siempre el mismo schema de error:

```typescript
export const ErrorSchema = z.object({
  error: z.string(),
})
```

Códigos de respuesta consistentes:
- `200` — éxito
- `400` — input inválido
- `401` — no autenticado
- `404` — recurso no encontrado

---

## Tags

Agrupar rutas por recurso para que Swagger UI quede organizado:

| Tag | Rutas |
|---|---|
| `Auth` | `/auth/*` |
| `Activities` | `/api/activities/*` |

---

## Documentación

Swagger UI disponible en `/docs` (solo en desarrollo).
Se genera automáticamente — no editar documentación a mano.
