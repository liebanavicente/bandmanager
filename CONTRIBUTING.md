# Contribuir a BandManager

## Configuración local

1. Clona el repositorio
2. `cp .env.example .env`
3. `docker compose up -d`
4. `npm install`
5. `npx prisma migrate dev`
6. `npm run db:seed`
7. `npm run dev`

## Estándares de código

- TypeScript estricto, sin `any` innecesario
- Validar entradas con Zod en Server Actions
- Mensajes de error en español para el usuario
- Permisos verificados en servidor, no solo en UI
- Importes siempre en céntimos (`priceCents`, `totalCents`)

## Flujo de trabajo

1. Crea una rama desde `main`
2. Implementa cambios con pruebas si aplica
3. `npm run lint && npm test && npm run build`
4. Abre PR con descripción clara

## Pruebas

```bash
npm test           # Unitarias (Vitest)
npm run test:e2e   # End-to-end (Playwright, requiere dev server)
```

## Migraciones

```bash
npx prisma migrate dev --name descripcion_cambio
```

No edites migraciones ya aplicadas en producción.