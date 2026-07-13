# Arquitectura de BandManager

## Visión general

BandManager es una aplicación monolítica Next.js con renderizado en servidor, Server Actions para mutaciones y PostgreSQL como fuente de verdad.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js (App)   │────▶│ PostgreSQL  │
└─────────────┘     │  - Middleware    │     └─────────────┘
                    │  - Server Actions│
                    │  - API Routes    │     ┌─────────────┐
                    └────────┬─────────┘────▶│ Local files │
                             │                └─────────────┘
                    ┌────────▼─────────┐
                    │ Integraciones    │
                    │ (mock WC/Gelato) │
                    └──────────────────┘
```

## Capas

### Presentación (`src/app`, `src/components`)
- Rutas agrupadas: `(auth)` y `(dashboard)`
- Componentes shadcn/ui con tema claro/oscuro
- Formularios con validación en cliente y servidor

### Aplicación (`src/actions`)
- Server Actions con patrón `{ success, data } | { error }`
- Autorización por rol en cada acción
- Validación Zod antes de persistir

### Dominio (`src/lib`)
- `permissions.ts` — matriz de acceso por rol
- `money.ts`, `duration.ts`, `stock.ts` — reglas de negocio puras
- `files.ts` — almacenamiento local (abstracción para S3/R2)
- `integrations/` — interfaces y proveedores simulados

### Datos (`prisma/`)
- Esquema normalizado con importes en céntimos
- Borrado lógico en entidades principales
- Índices en campos de búsqueda y filtrado

## Roles y seguridad

| Rol | Alcance |
|-----|---------|
| ADMIN | Acceso total |
| MEMBER | Consulta + tareas propias + ventas |
| COLLABORATOR | Áreas explícitas en `CollaboratorAccess` |

La protección ocurre en tres niveles:
1. **Middleware** — redirige sin sesión
2. **Server Actions** — `requirePermission()`
3. **Layout** — oculta navegación no autorizada

## Integraciones futuras

### WooCommerce (`IEcommerceProvider`)
- `syncProducts()`, `syncOrders()`, `syncStock()`
- Variables: `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`
- Endpoint: `POST /api/integrations/sync`

### Gelato (`IPrintOnDemandProvider`)
- `syncCatalog()`, `submitOrder()`
- Variables: `GELATO_API_KEY`, `GELATO_STORE_ID`

Los proveedores mock registran operaciones en `SyncLog`.

## Esquema de base de datos (resumen)

```
User ── MemberProfile
User ── EventAttendance ── Event
Song ── RepertoireSong ── Repertoire
Song ── SetlistItem ── Setlist ── Event
Task ── TaskComment
Product ── ProductVariant ── OrderItem ── Order
FileAsset (polimórfico: event, task)
SyncLog
CollaboratorAccess
InventoryMovement
```

## Server Actions principales

| Módulo | Acciones |
|--------|----------|
| events | list, get, create, update, delete, updateAttendance, exportIcs |
| songs | list, get, create, update, delete |
| repertoires | list, get, create, update, reorder, duplicate, setActive |
| setlists | list, get, create, update, reorder, duplicate, getStageView |
| tasks | list, get, create, update, addComment |
| members | list, update, toggleActive |
| products | list, get, create, update, getStockAlerts |
| orders | list, get, create, quickConcertSale |
| files | list, upload, delete |
| dashboard | getDashboardData |

## Decisiones técnicas

- **Prisma 7 + adapter-pg**: driver nativo para PostgreSQL en runtime
- **Auth.js credentials**: MVP simple; extensible a OAuth
- **Céntimos enteros**: evita errores de coma flotante en importes
- **Almacenamiento local**: suficiente para desarrollo; interfaz lista para cloud

## Limitaciones actuales

- Subida de archivos desde UI limitada (API y modelo listos)
- PDF de setlists no implementado
- Calendario mensual visual pendiente
- Email de recuperación simulado (log en consola)