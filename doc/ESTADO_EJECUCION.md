# Estado de ejecución del proyecto

## Tabla general de prompts

| Fase | Prompt | Estado |
|---|---|---|
| 0 · Conciliación | P00 | COMPLETADO |
| 1 · Base de datos | P01 | COMPLETADO |
| 2 · Reglas de negocio | P02 | COMPLETADO |
| 3 · Servidor | P03 | PENDIENTE |
| 4 · Datos y API | P04 | PENDIENTE |
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

## Siguiente paso

P01 está completado. Continuar con P03 según el plan técnico.
