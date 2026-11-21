# FASE 4 · Datos y API

## Implementación

### P04 · Capa de datos

- Se implementó la capa de datos del módulo Inter-Tiendas en `src/lib/datos/` (`tipos.ts`, `productos.ts`, `existencias.ts`, `solicitudes.ts`, `transacciones.ts`, `ordenes.ts`, `cierre.ts`) y la fachada `src/lib/dataService.ts`.
- `procesarSolicitud` ejecuta la secuencia atómica en `conTransaccion`: valida la solicitud, obtiene el producto activo, bloquea existencias (`FOR UPDATE`), decide con `decidirSolicitud`, aplica venta local/transferencia/orden al proveedor, registra la transacción (y la orden cuando aplica) y devuelve `{ decision, stock, critico }`.
- `registrarEntrada` suma stock por sucursal y registra transacción tipo `entrada`; `listarInventario` consulta `v_inventario`; `listarTransacciones` filtra por producto, tipo, sucursal y rango de fechas.
- Se añadieron scripts/comandos: `db:limpiar`, `db:demo`, `probar:flujo` (`scripts/limpiar-prueba.mjs`, `scripts/cargar-demo.ts`, `scripts/probar-flujo.ts`).
- Ajuste de diagnóstico: `scripts/probar-flujo.ts` (prueba 10) ahora reporta detalle completo esperado vs. obtenido (tipos, costo de transferencia, motivos de órdenes e historial), y su expectativa incluye las 3 entradas registradas por el flujo además de venta local, transferencia y las 2 órdenes a proveedor.

### P05 · API

Se expusieron las rutas del módulo mínimo (tabla 11.3, sin informe/transferencia/órdenes de P09), todas con `export const dynamic = 'force-dynamic'`, `await exigirSesion()` como primera instrucción del handler, `conManejoDeErrores`, validación con `leerCuerpo`/esquemas Zod y `await params` en rutas dinámicas:

- `GET /api/tiendas/productos` → `FilaInventario[]` (filtros `categoria`, `soloCriticos` validados).
- `POST /api/tiendas/productos` → `{ id, codigo }` (201).
- `GET /api/tiendas/productos/[codigo]` → `DetalleProducto`.
- `POST /api/tiendas/productos/[codigo]/entrada` → `{ stock }` (201).
- `POST /api/tiendas/solicitud` → `ResultadoSolicitud` (200), con decisión de venta local, transferencia (origen y costo) u orden al proveedor (motivo) y nuevo stock.
- `GET /api/tiendas/transacciones` → `Transaccion[]` (filtros validados).

## Verificación `npm run probar:flujo` (P04)

Ejecución exitosa contra la base de datos (11 OK, 0 FALLA), cubriendo creación/duplicado, entradas, venta local, transferencia con costo, órdenes por `sin_candidata_viable` y `agotamiento_total`, rechazo de cantidad 0, estado crítico, historial y no negatividad de existencias:

```text
OK :: 1. Crear producto IT-TEST-1 con existencias 0 en A, B, C :: id=b9bdc126-892e-4f74-8c81-bc0505838cb6
OK :: 2. Crear IT-TEST-1 otra vez rechaza duplicado :: PRODUCTO_DUPLICADO
OK :: 3. Entrada de 10 a A, 20 a B, 20 a C :: A=10, B=20, C=20
OK :: 4. Solicitud A pide 4 -> venta local, A queda 6 :: accion=venta_local, A=6
OK :: 5. Solicitud A pide 8 -> transferencia desde B, costo 16000 :: accion=transferencia, origen=B, costo=16000, A=14, B=12
OK :: 6. Ajuste A=1,B=6,C=6 y solicitud A pide 3 -> orden sin_candidata_viable :: accion=orden_proveedor, motivo=sin_candidata_viable
OK :: 7. Ajuste A=1,B=0,C=0 y solicitud A pide 5 -> orden agotamiento_total :: accion=orden_proveedor, motivo=agotamiento_total
OK :: 8. Solicitud con cantidad 0 rechazada :: DATOS_INVALIDOS
OK :: 9. Inventario muestra el producto como crítico (total <= 10) :: total=1, critico=true
OK :: 10. Historial: entradas, venta local, transferencia (con costo) y 2 órdenes proveedor, en orden :: esperado={tipos:[entrada, entrada, entrada, venta_local, transferencia, orden_proveedor, orden_proveedor], costoTransferencia:16000, motivosOrden:[sin_candidata_viable, agotamiento_total]} | obtenido={tipos:[entrada, entrada, entrada, venta_local, transferencia, orden_proveedor, orden_proveedor], costoTransferencia:16000, motivosOrden:[sin_candidata_viable, agotamiento_total]}
OK :: 11. Ninguna existencia quedó negativa :: A=1, B=0, C=0

Resumen: 11 OK, 0 FALLA
```

## Verificación API sin sesión (TAREA 2)

Con `npm run dev` (servidor disponible en `http://localhost:3000`), sin cookie de sesión:

```text
GET /api/tiendas/productos -> 401 Unauthorized
Cache-Control: no-store
{"ok":false,"error":{"codigo":"NO_AUTORIZADO","mensaje":"Debe iniciar sesión.","detalles":null}}

POST /api/tiendas/solicitud -> 401 Unauthorized
Cache-Control: no-store
{"ok":false,"error":{"codigo":"NO_AUTORIZADO","mensaje":"Debe iniciar sesión.","detalles":null}}
```

La protección la aplica `src/proxy.ts` para `/api/tiendas/:path*` (y cada handler exige sesión como primera instrucción).

## Verificación API con sesión (TAREA 3)

Se requiere que el usuario inicie sesión con credenciales válidas de Supabase para obtener la cookie `tiendas_access_token` y ejercer los endpoints autenticados (el token se valida con `supabase.auth.getUser`). En este entorno no fue posible completar una verificación manual/autenticada end-to-end por HTTP sin credenciales reales.

Pasos solicitados para verificación con sesión (vía UI o HTTP autenticado):
1. Iniciar sesión en `/login` y confirmar acceso a `/tiendas`.
2. Crear un producto (`POST /api/tiendas/productos`) e ingresar stock a A, B y C (`POST /api/tiendas/productos/[codigo]/entrada`).
3. Procesar una solicitud cubierta localmente (`POST /api/tiendas/solicitud`) y verificar decisión `venta_local`.
4. Procesar una solicitud que requiera transferencia y comprobar que el origen elegido es el de menor costo hacia la solicitante y que `costoTotal` es correcto.
5. Forzar un caso de orden al proveedor y verificar decisión `orden_proveedor` con su motivo.
6. Enviar cantidad 0 y comprobar respuesta 400 `DATOS_INVALIDOS`.

Cobertura equivalente automatizada de la lógica: `npm run probar:flujo` valida estos mismos escenarios de negocio a través de `dataService` (venta local, transferencia desde B con costo 16000, órdenes por `sin_candidata_viable`/`agotamiento_total`, rechazo de cantidad 0). Los handlers P05 delegan en las mismas operaciones validadas.

## Verificación de compilación y pruebas

```text
npm run build
Compilado correctamente; TypeScript correcto.
Rutas dinámicas: /api/tiendas/productos, /api/tiendas/productos/[codigo],
/api/tiendas/productos/[codigo]/entrada, /api/tiendas/sesion,
/api/tiendas/solicitud, /api/tiendas/transacciones.

npm test
Test Files  16 passed (16)
Tests       56 passed (56)
```
