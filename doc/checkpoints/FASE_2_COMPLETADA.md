# FASE 2 · Reglas de negocio y pruebas unitarias

## Implementación

Se añadieron las constantes del dominio y las reglas puras en `src/lib/config/intertiendas.ts` y `src/lib/reglas/`:

- Catálogo de sucursales, costos, stock de seguridad, lote del proveedor, punto de reorden, zona horaria y límite de listado.
- Códigos/mensajes/estados HTTP de errores de negocio y `ErrorDeNegocio`.
- Fecha actual en la zona horaria `America/Bogota`.
- Costos de ruta y costo total.
- Validación y decisión de solicitud: venta local, transferencia de menor costo con stock de seguridad, o proveedor con motivo diferenciado.
- Cálculo de estado crítico y validación de productos.

Se añadieron pruebas T-01 a T-26 en `src/tests/reglas/`. La configuración existente de Vitest se conservó. Para T-20 se simuló un empate de costos en un archivo de prueba aislado; con la matriz real no existen empates entre las rutas hacia una sucursal.

## Verificación

```text
npm test -- src/tests/reglas
Test Files  5 passed (5)
Tests       26 passed (26)
```

```text
npm test
Test Files  16 passed (16)
Tests       54 passed (54)
```

```text
npm run build
Compiled successfully
Finished TypeScript
```

Vitest mostró una advertencia de compatibilidad futura de `configLoader: 'native'`, pero no afectó las pruebas.

## Archivos

- `src/lib/config/intertiendas.ts`
- `src/lib/reglas/errores.ts`
- `src/lib/reglas/fechas.ts`
- `src/lib/reglas/costos.ts`
- `src/lib/reglas/solicitud.ts`
- `src/lib/reglas/alertas.ts`
- `src/lib/reglas/producto.ts`
- `src/tests/reglas/`

P01 sigue en validación porque no fue posible conectar desde este entorno con la instancia Postgres remota. Completar esa comprobación antes de avanzar a P03.
