# BandManager

Plataforma privada para gestionar una banda musical: eventos, repertorio, setlists, tareas, archivos y merchandising.

## Tecnologías

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** + **Prisma ORM**
- **Auth.js** (next-auth v5) con credenciales
- **Zod** + **React Hook Form**
- **Vitest** (unitarias) + **Playwright** (e2e)
- **Docker** para PostgreSQL local

## Requisitos

- Node.js 20+
- Docker y Docker Compose
- npm

## Instalación rápida

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión PostgreSQL |
| `AUTH_SECRET` | Secreto para sesiones (generar en producción) |
| `AUTH_URL` | URL base de la app |
| `UPLOAD_DIR` | Carpeta local para archivos |
| `MAX_FILE_SIZE_MB` | Límite de subida |
| `WOOCOMMERCE_*` | Integración futura WooCommerce |
| `GELATO_*` | Integración futura Gelato |

## Credenciales de demostración (solo local)

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@losvoltios.es` | `demo1234` |
| Miembro | `miembro@losvoltios.es` | `demo1234` |
| Colaborador | `tecnicosala@losvoltios.es` | `demo1234` |

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Compilación
npm run lint         # ESLint
npm test             # Pruebas unitarias
npm run test:e2e     # Pruebas end-to-end
npm run db:seed      # Datos de demostración
```

## Arquitectura

```
src/
├── app/           # Rutas App Router (auth, dashboard, API)
├── actions/       # Server Actions con validación y permisos
├── components/    # UI reutilizable
└── lib/           # Lógica de negocio, auth, integraciones
```

Ver [ARCHITECTURE.md](./ARCHITECTURE.md) para detalle.

## Funcionalidades MVP

- Autenticación con roles (Admin, Miembro, Colaborador)
- Dashboard con resumen de actividad
- Eventos con confirmación de asistencia y exportación ICS
- Canciones, repertorios y setlists (vista escenario)
- Tareas internas
- Miembros de la banda
- Productos, stock y pedidos (venta rápida en concierto)
- Biblioteca de archivos (almacenamiento local)
- Integraciones simuladas WooCommerce/Gelato

## Pendiente / mejoras futuras

- Subida real de archivos desde la UI (API preparada)
- Exportación PDF de setlists
- Vista calendario mensual interactiva
- Notificaciones por email
- Integración real WooCommerce y Gelato
- Despliegue en Vercel + Postgres gestionado

## Despliegue recomendado

- **App**: Vercel o Docker
- **Base de datos**: Neon, Supabase o RDS
- **Archivos**: S3, Cloudflare R2 o Vercel Blob
- Generar `AUTH_SECRET` seguro y configurar variables de producción