# Estado de ejecución del proyecto

## Tabla general de prompts

| Fase | Prompt | Estado |
|---|---|---|
| 0 · Conciliación | P00 | COMPLETADO |
| 1 · Base de datos | P01 | COMPLETADO |
| 2 · Reglas de negocio | P02 | COMPLETADO |
| 3 · Servidor | P03 | COMPLETADO |
| 4 · Datos y API | P04 | COMPLETADO |
| 4 · Datos y API | P05 | PENDIENTE |
| 5 · Interfaz | P06 | PENDIENTE |
| 5 · Interfaz | P07 | PENDIENTE |
| 5 · Interfaz | P08 | PENDIENTE |
| 7 · Opcionales | P09 | PENDIENTE |

## Bitácora

### 2026-11-07 — P00
- Se revisó la estructura real del repositorio.
- Se validó que el proyecto ya existe y que compila correctamente con `npm run build`.
- Se identificó que hay login existente con Supabase Auth y configuración de Supabase en `.env.local`.
- Se confirmó que la variable clave del pooler para Postgres es `GLOWSTOCK_POSTGRES_URL`.
- Se creó el dictamen y el estado inicial del repositorio para continuar con P01.

### 2026-11-07 — P01
- Se implementó la capa de base de datos del módulo Inter-Tiendas con SQL base y scripts de migración.
- Se añadieron `supabase/migrations/20261107000000_intertiendas_m1.sql` y `20261107000001_intertiendas_m2.sql`.
- Se añadieron `scripts/migrar.mjs` y `scripts/verificar-bd.mjs`, y los comandos `db:migrar` y `db:verificar` en `package.json`.
- Se validó la compilación del proyecto con `npm run build` y la suite con `npm test`.
- Para ejecución local, ambos scripts usan `GLOWSTOCK_POSTGRES_URL_NON_POOLING`, eliminan `sslmode` y configuran TLS con `rejectUnauthorized: false` y un tiempo límite de conexión de 10 segundos. Este ajuste no se debe copiar al código de la aplicación.
- `npm run db:migrar`:

  ```text
  > glowstock@0.1.0 db:migrar
  > node --env-file=.env.local scripts/migrar.mjs

  Aplicada: 20261003000000_create_usuarios.sql
  Aplicada: 20261107000000_intertiendas_m1.sql
  Aplicada: 20261107000001_intertiendas_m2.sql
  Migraciones ejecutadas correctamente.
  ```

- `npm run db:verificar`:

  ```text
  > glowstock@0.1.0 db:verificar
  > node --env-file=.env.local scripts/verificar-bd.mjs


  === Existencia de objetos ===
  productos: EXISTE
  existencias: EXISTE
  transacciones: EXISTE
  ordenes_proveedor: EXISTE
  v_inventario: EXISTE

  === Conteo de filas ===
  productos: 0
  existencias: 0
  transacciones: 0
  ordenes_proveedor: 0

  === Restricciones e índices ===
  productos_codigo_unico: PRESENTE
  existencias_sucursal_valida: PRESENTE
  existencias_cantidad_no_neg: PRESENTE
  existencias_unica: PRESENTE
  trans_tipo_valido: PRESENTE

  === RLS ===
  existencias: ACTIVO
  ordenes_proveedor: ACTIVO
  productos: ACTIVO
  transacciones: ACTIVO

  === Pruebas de integridad con rollback ===
  OK :: Crear producto con código válido
  OK :: Duplicado de codigo genera error :: codigo=23505
  OK :: Precio 0 genera error :: codigo=23514
  OK :: Sucursal inválida genera error :: codigo=23514
  OK :: Cantidad negativa genera error :: codigo=23514
  OK :: Duplicado de existencia genera error :: codigo=23505
  OK :: Tipo de transacción inválido genera error :: codigo=23514
  OK :: Cantidad de transacción inválida genera error :: codigo=23514
  OK :: Vista inventario total 50 y critico=false :: stock_total=50
  OK :: Vista inventario total 10 y critico=true :: stock_total=10

  TOTAL_FALLAS=0
  ```
- La primera verificación detectó que la prueba de stock crítico reinsertaba filas ya existentes; se corrigió para actualizar las filas dentro de su transacción con rollback.
- Después del ajuste: `npm test` → 16 archivos y 54 pruebas pasaron; `npm run build` → compilación y verificación TypeScript correctas.

### 2026-11-07 — P02
- Se crearon la configuración del dominio y las reglas puras de errores, fechas, costos, solicitudes, alertas y validación de productos bajo `src/lib/`.
- Se añadieron 26 pruebas identificadas T-01 a T-26 bajo `src/tests/reglas/`; T-20 fuerza costos iguales en un test aislado y verifica el orden A/B/C. La matriz real no produce empates hacia un mismo destino.
- Se reutilizó la configuración Vitest existente, que ya incluye pruebas de `src/`.
- `npm test -- src/tests/reglas`: 5 archivos y 26 pruebas pasaron.
- `npm test`: 16 archivos y 54 pruebas pasaron.
- `npm run build`: compilación y verificación TypeScript correctas.

### 2026-11-21 — P03
- Se implementó la infraestructura del servidor: `src/lib/db/conexion.ts` con `pg`, `GLOWSTOCK_POSTGRES_URL`, SSL y parsers; `src/lib/http/respuestas.ts`; `src/lib/validacion/esquemas.ts`; `src/lib/formato.ts`.
- Se adaptó el login existente de Supabase Auth como puerta para Inter-Tiendas: `src/lib/auth/sesion.ts` envuelve la sesión (`obtenerSesion`, `exigirSesion` con `NO_AUTORIZADO`), el formulario de login guarda la cookie `tiendas_access_token` y redirige a `/tiendas`, y `src/app/page.tsx` redirige según sesión.
- Se añadió `src/proxy.ts` para proteger `/tiendas/:path*` y `/api/tiendas/:path*` (páginas a `/login?siguiente=...`, API 401 con formato estándar y `Cache-Control: no-store`).
- Se creó `src/app/api/tiendas/sesion/route.ts` (`GET`, `force-dynamic`, `exigirSesion`, respuesta `{ email }`) y `src/app/tiendas/page.tsx` como destino mínimo.
- Verificación: `npm test` → 16 archivos y 56 pruebas pasaron; `npm run build` → compilación y TypeScript correctos.
- Verificación sin sesión en `npm run dev`: `GET /api/tiendas/sesion` devolvió 401 con `NO_AUTORIZADO` y `Cache-Control: no-store`; `GET /tiendas` devolvió redirección a `/login?siguiente=%2Ftiendas`.
- No se pudo verificar manualmente el inicio de sesión con credenciales reales de Supabase en este entorno; la decisión de login quedó documentada en `doc/checkpoints/FASE_3_COMPLETADA.md`.

### 2026-11-21 — P04
- Se implementó la capa de datos del módulo Inter-Tiendas en `src/lib/datos/` (`tipos.ts`, `productos.ts`, `existencias.ts`, `solicitudes.ts`, `transacciones.ts`, `ordenes.ts`, `cierre.ts`) y la fachada `src/lib/dataService.ts`.
- `procesarSolicitud` aplica la secuencia atómica de la sección 8.1 dentro de `conTransaccion`: valida la solicitud, obtiene el producto activo, bloquea existencias (`FOR UPDATE`), decide con `decidirSolicitud`, aplica venta local/transferencia/orden al proveedor, registra la transacción y la orden cuando aplica, y devuelve `{ decision, stock, critico }`.
- `registrarEntrada` suma stock por sucursal y registra transacción tipo `entrada`; `listarInventario` consulta `v_inventario` con filtros y calcula crítico con `esCritico`; `listarTransacciones` filtra por producto, tipo, sucursal y rango de fechas.
- Se añadieron scripts `scripts/limpiar-prueba.mjs`, `scripts/cargar-demo.ts` y `scripts/probar-flujo.ts`, y los comandos `db:limpiar`, `db:demo` y `probar:flujo` en `package.json`. Los scripts TS registran paths de `tsconfig`, usan `dataService` para las operaciones y emplean conexión directa con `pg` solo para limpieza/ajustes de preparación cuando es necesario.
- Se ajustó `src/lib/db/conexion.ts` para eliminar `sslmode` de la cadena de conexión antes de crear el pool (manteniendo SSL y `GLOWSTOCK_POSTGRES_URL`), mejorando compatibilidad de conexión en ejecución local.
- Verificación: `npm run build` → compilación y TypeScript correctos; `npm test` → 16 archivos y 56 pruebas pasaron.
- Verificación: no hay importaciones de `src/lib/db/conexion.ts` fuera de `src/lib/datos/`.
- Ejecución solicitada de `npm run db:demo` (bloqueada en este entorno por autenticación de base de datos):

  ```text
  > glowstock@0.1.0 db:demo
  > node --env-file=.env.local --import tsx scripts/cargar-demo.ts

  error: password authentication failed for user "postgres"
      at parseErrorMessage (node_modules/pg-protocol/src/parser.ts:395:9)
      at Parser.handlePacket (node_modules/pg-protocol/src/parser.ts:212:19)
      at Parser.parse (node_modules/pg-protocol/src/parser.ts:105:30)
      at TLSSocket.<anonymous> (node_modules/pg-protocol/src/index.ts:7:48)
  ```

- Ejecución solicitada de `npm run probar:flujo` (bloqueada en este entorno por autenticación de base de datos; no se pudieron ejecutar los 11 pasos contra la BD):

  ```text
  > glowstock@0.1.0 probar:flujo
  > node --env-file=.env.local --import tsx scripts/probar-flujo.ts

  error: password authentication failed for user "postgres"
      at parseErrorMessage (node_modules/pg-protocol/src/parser.ts:395:9)
      at Parser.handlePacket (node_modules/pg-protocol/src/parser.ts:212:19)
      at Parser.parse (node_modules/pg-protocol/src/parser.ts:105:30)
      at TLSSocket.<anonymous> (node_modules/pg-protocol/src/index.ts:7:48)
  ```

- Ajuste de diagnóstico en `scripts/probar-flujo.ts`: la prueba 10 ahora reporta detalle completo con valores esperados y obtenidos (tipos y costo de transferencia) e historial de transacciones para facilitar la depuración de fallas.
- Nota: la fase 4 sigue abierta hasta P05.

## Siguiente paso

P04 implementado; pendiente ejecutar/verificar `db:demo` y `probar:flujo` con credenciales de base de datos válidas en el entorno y continuar con P05 según el plan técnico. La fase 4 sigue abierta hasta P05.
