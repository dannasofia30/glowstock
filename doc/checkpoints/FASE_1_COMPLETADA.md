# FASE 1 · Base de datos del módulo Inter-Tiendas

## Estado

La base de la capa de datos del módulo está implementada, migrada y verificada:

- Migraciones SQL creadas en `supabase/migrations/`.
- Scripts de migración y verificación creados en `scripts/`.
- Comandos `db:migrar` y `db:verificar` añadidos a `package.json`.
- Las migraciones se ejecutaron correctamente contra Supabase usando la conexión directa para ejecución local.

## Evidencia de base de datos

- `npm run db:migrar` → se aplicaron las migraciones de usuarios, Inter-Tiendas M1 y M2.
- `npm run db:verificar` → objetos, restricciones, RLS y pruebas de integridad correctos; `TOTAL_FALLAS=0`.
- La verificación confirmó inventario total de 50 no crítico y total de 10 crítico.
- `npm test` → 16 archivos y 54 pruebas pasaron.
- `npm run build` → compilación y verificación TypeScript correctas.

## Conexión

Los scripts locales usan `GLOWSTOCK_POSTGRES_URL_NON_POOLING`, quitan `sslmode`, configuran `ssl: { rejectUnauthorized: false }` y establecen `connectionTimeoutMillis: 10000`. Este ajuste local no se copia al código de la aplicación; P03 debe usar el pooler mediante `GLOWSTOCK_POSTGRES_URL` y SSL estándar.

## Archivos principales

- `supabase/migrations/20261107000000_intertiendas_m1.sql`
- `supabase/migrations/20261107000001_intertiendas_m2.sql`
- `scripts/migrar.mjs`
- `scripts/verificar-bd.mjs`
- `package.json`
