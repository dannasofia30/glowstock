# Estado actual del repositorio

## Resumen ejecutivo

El repositorio ya tiene una base Next.js con TypeScript funcionando y un proyecto de Supabase configurado en variables de entorno. El código actual no es el módulo técnico de Inter-Tiendas del plan, sino una app de inventario / auth existente con varios módulos de administración y recuperación de contraseña. Por tanto, la base sirve como infraestructura, pero la lógica del dominio de Inter-Tiendas aún debe crearse o adaptarse en los prompts siguientes.

## 1. Proyecto Next.js con TypeScript

Sí existe un proyecto Next.js 16.3.5 con React 19 y TypeScript 5.

- Framework: Next.js 16.3.5
- React: 19.2.8
- TypeScript: ^5
- Tailwind CSS: ^4
- App Router: sí (`src/app`)
- Estado de compilación: OK (`npm run build` ejecutado correctamente)

### Evidencia

- `package.json`
- `src/app/`
- `next.config.ts`
- `tsconfig.json`

## 2. Scripts del proyecto

Se observan estos scripts principales en `package.json`:

- `dev`: `node scripts/tokenVercel.mjs && next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`
- `format`: `prettier --write "src/**/*.{ts,tsx,css}"`
- `type-check`: `tsc --noEmit`
- `test`: `vitest run`
- `test:watch`: `vitest`
- `test:coverage`: `vitest run --coverage`

## 3. Estructura general del repositorio

Estructura relevante:

- `src/app/`
  - `login/`
  - `products/`
  - `users/`
  - `settings/password/`
  - `reset-password/`
  - `restablecer-contrasena/`
  - `recuperar-contrasena/`
  - `api/`
- `src/components/`
  - `auth/`
  - `home/`
  - `layout/`
  - `users/`
- `src/lib/`
  - `supabase/`
  - `correo.ts`
  - `plantillasCorreo.ts`
  - `tokenRecuperacion.ts`
  - `urlBase.ts`
- `supabase/`
  - `migrations/`
  - `restablecimientos_contrasena.sql`
- `scripts/`
  - `tokenVercel.mjs`
- `data/`
- `public/`

La app usa `src/` como carpeta principal, no un `app/` raíz directo.

> La estructura actual no coincide aún con el dominio Inter-Tiendas del plan, pero sí hay una base sólida de Next + Supabase + autenticación + páginas.

## 4. Dependencias relevantes

Presentes:

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `vitest`
- `@supabase/supabase-js`
- `zod`
- `pg` no aparece explícitamente en `package.json`

Faltantes respecto al plan técnico:

- `pg` no está instalado
- `lib/db/conexion.ts`, `lib/reglas/`, `lib/datos/`, `lib/config/` no existen todavía con la arquitectura del plan
- `lib/dataService.ts` no existe todavía con la capa de servicio del dominio inter-tiendas

## 5. Autenticación

Sí existe autenticación en la app actual, basada en Supabase Auth.

### Evidencia

- `src/components/auth/LoginForm.tsx`
- `src/lib/supabase/client.ts`
- `src/app/login/page.tsx`
- `src/app/api/auth/recuperar/route.ts`
- `src/app/api/auth/restablecer/route.ts`

### Observación

El login actual está funcionando como una autenticación de usuario con correo y contraseña. No parece ser un login mínimo del tipo “puerta única de acceso” del plan técnico, ni tiene la capa `lib/auth/sesion.ts` ni la protección específica para rutas `/tiendas/*` y `/api/tiendas/*`.

## 6. Base de datos y conexión a Postgres

Sí existe configuración de Supabase en `.env.local`.

### Variables detectadas (solo nombres, sin valores)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GLOWSTOCK_POSTGRES_URL`
- `GLOWSTOCK_POSTGRES_URL_NON_POOLING`
- `GLOWSTOCK_POSTGRES_PRISMA_URL`
- `GLOWSTOCK_POSTGRES_HOST`
- `GLOWSTOCK_SUPABASE_URL`
- `GLOWSTOCK_SUPABASE_PUBLISHABLE_KEY`
- `GLOWSTOCK_SUPABASE_SECRET_KEY`
- `GLOWSTOCK_SUPABASE_SERVICE_ROLE_KEY`

### Variable relevante para `pg`

La variable correcta para usar con `pg` en un pooler de Supabase es:

- `GLOWSTOCK_POSTGRES_URL`

Es la que corresponde al pooler en puerto `6543`, adecuada para serverless.

La variable `GLOWSTOCK_POSTGRES_URL_NON_POOLING` apunta a 5432 y no es la recomendada para el patrón `pg` del plan técnico.

## 7. Dónde viven los datos hoy

La app ya tiene integración con Supabase, pero no la arquitectura de Inter-Tiendas del plan.

- `src/lib/supabase/database.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/client.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/auth/*`
- `supabase/migrations/`

## 8. Migraciones y base

Sí existe una estructura de migraciones y la base ya tiene SQL y conexión.

- `supabase/migrations/20261003000000_create_usuarios.sql`
- `supabase/restablecimientos_contrasena.sql`

No se observan aún las tablas del dominio Inter-Tiendas del plan (`productos`, `existencias`, `transacciones`, `ordenes_proveedor`, `v_inventario`), ni la arquitectura de `lib/reglas`, `lib/datos`, `lib/config` y `lib/dataService` que requiere el plan técnico.

## 9. Dominio y estado del negocio

### Estado del dominio Inter-Tiendas

- Productos: NO EXISTE como dominio técnico del plan
- Existencias: NO EXISTE bajo la estructura esperada del plan
- Transacciones: NO EXISTE bajo la arquitectura esperada
- Inventario de red: NO EXISTE
- Criterio crítico: NO EXISTE
- Lógica de solicitud: NO EXISTE

La app actual parece ser una aplicación más general de inventario y usuarios, pero no el algoritmo de decisión inter-tiendas ni la matriz A/B/C del plan.

## 10. Estilos y Tailwind

Sí existe Tailwind CSS instalado y configurado.

- `tailwindcss` presente
- `postcss.config.mjs`
- `src/app/globals.css`
- `src/app/layout.tsx`

La app ya usa estilos modernos con gradientes, Glassmorphism, etc. Se puede reutilizar la base visual, pero no hay aún la identidad exacta del plan Inter-Tiendas.

## 11. Pruebas

Sí hay pruebas con Vitest.

- `vitest.config.ts`
- `src/app/page.test.tsx`
- `src/app/login/page.test.tsx`
- `src/components/auth/ChangePasswordForm.test.tsx`
- `src/components/users/UserManagement.test.tsx`
- `src/components/layout/AppShell.test.tsx`

Se observa que la base ya viene con pruebas de UI y rutas. Faltan aún las pruebas del algoritmo de negocio del plan técnico.

## 12. Conflictos / compatibilidad con el plan

Los principales puntos a resolver son:

- La base actual está orientada a una app distinta, aunque con infraestructura útil.
- No existe todavía la estructura `lib/reglas/solicitud.ts` ni la lógica de intercambio A/B/C.
- No existe la interfaz `/tiendas/*` del plan técnico.
- No existe la capa `lib/dataService.ts` ni los servicios de inventario.
- No existe la lógica de `venta_local`, `transferencia`, `orden_proveedor`.
- La app ya tiene login con Supabase, pero no la capa de sesión del plan ni la protección de rutas protegidas por contexto de negocio.

## 13. Decisiones derivadas

- Hay base Next.js y Supabase funcional: `USAR` la infraestructura, no crearla desde cero.
- La ruta de login ya existe: `/login`.
- El patrón de protección para rutas y APIs debe decidirse en P03; la estrategia del plan exige protección por sesión para `/tiendas/*` y `/api/tiendas/*`.
- El nombre de la variable de conexión a Postgres que se debe usar es `GLOWSTOCK_POSTGRES_URL`.
- La estructura del dominio Inter-Tiendas aún debe crearse: `lib/config`, `lib/reglas`, `lib/datos`, `lib/dataService`, `supabase/migrations` del plan.
- La app ya usa `src/`, así que la implementación del plan debe seguir esa convención existente.

## 14. Compilación base

Resultado verificado con `npm run build`:

- Estado: `OK`
- Salida clave: `Compiled successfully`
- No hubo errores de compilación en la base actual

## Conclusión

El repositorio ya tiene una infraestructura sólida y funcional de Next.js + TypeScript + Tailwind + Supabase + Vitest. La parte del dominio Inter-Tiendas todavía está por crear o adaptar, pero la base es adecuada para continuar con los prompts del plan.

Se recomienda seguir con P01 usando la conexión `GLOWSTOCK_POSTGRES_URL` y construyendo primero la capa de datos del dominio, luego las reglas de negocio y luego la interfaz del módulo mínimo.
