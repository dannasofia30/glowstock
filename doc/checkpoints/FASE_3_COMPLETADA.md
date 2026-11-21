# FASE 3 · Infraestructura del servidor

## Implementación

Se creó la infraestructura de servidor para el módulo Inter-Tiendas y la protección de acceso:

- `src/lib/db/conexion.ts`: conexión con `pg` usando `GLOWSTOCK_POSTGRES_URL` (pooler, 6543), SSL con `rejectUnauthorized: false`, pool (`max: 3`, `idleTimeoutMillis: 10000`) y parsers para `DATE`, `TIMESTAMP`, `TIMESTAMPTZ` y `BIGINT`; helpers `consultar` y `conTransaccion`.
- `src/lib/auth/sesion.ts`: adaptador de sesión para tiendas (`obtenerSesion`, `exigirSesion`) que valida el token de acceso guardado en cookie (`tiendas_access_token`) contra Supabase Auth y lanza `ErrorDeNegocio('NO_AUTORIZADO')` si no hay sesión válida.
- `src/proxy.ts`: protege `/tiendas/:path*` y `/api/tiendas/:path*`; sin sesión redirige páginas a `/login?siguiente=...` y responde 401 en API con el formato `{ ok, error: { codigo, mensaje, detalles } }` y `Cache-Control: no-store`.
- `src/lib/http/respuestas.ts`: `responderOk`, `responderError` (mapea `ErrorDeNegocio`, `ZodError` a `DATOS_INVALIDOS` con `flatten`, errores `pg` `23505/23503/23514` según tabla 9.4, otros a `console.error` + `ERROR_INTERNO`), `conManejoDeErrores` y `leerCuerpo`; respuestas JSON con `Cache-Control: no-store`.
- `src/lib/validacion/esquemas.ts`: esquemas Zod de la sección 11.4 (`producto`, `entrada`, `solicitud`, `transferencia`, filtros e informe) con tipos `z.infer`.
- `src/lib/formato.ts`: `formatearPesos` (`Intl`, `es-CO`, `COP`, sin decimales) y `formatearFecha` en zona `America/Bogota`.
- `src/app/api/tiendas/sesion/route.ts`: `GET` con `conManejoDeErrores`, primera instrucción `await exigirSesion()`, respuesta `{ email }` y `export const dynamic = 'force-dynamic'`.
- Adaptación del acceso existente: `src/components/auth/LoginForm.tsx` y `src/app/login/page.tsx` conservan el login con Supabase Auth y, tras autenticar y validar perfil activo, guardan la cookie de sesión de tiendas y redirigen a `/tiendas` (o a la ruta segura `siguiente`); `src/app/page.tsx` redirige a `/tiendas` o `/login` según sesión.
- `src/app/tiendas/page.tsx`: página mínima del módulo para la verificación de redirección/acceso.

## Decisión de login

Se reutilizó el login existente con Supabase Auth (adaptación, sin reescritura). `src/lib/auth/sesion.ts` actúa como envoltorio de sesión para Inter-Tiendas obteniendo el token emitido por Supabase desde la cookie `tiendas_access_token` y resolviendo el usuario con `supabase.auth.getUser`. `exigirSesion()` lanza `ErrorDeNegocio('NO_AUTORIZADO')` cuando no hay sesión. No se agregaron roles nuevos; la protección cubre `/tiendas/*` y `/api/tiendas/*`.

## Verificación

```text
npm test
Test Files  16 passed (16)
Tests       56 passed (56)
```

```text
npm run build
Compiled successfully
Finished TypeScript
Route /api/tiendas/sesion (Dynamic)
Route /tiendas (Static)
ƒ Proxy (Middleware)
```

Comprobación sin sesión con `npm run dev`:

```text
GET /api/tiendas/sesion -> 401
Cache-Control: no-store
{"ok":false,"error":{"codigo":"NO_AUTORIZADO","mensaje":"Debe iniciar sesión.","detalles":null}}

GET /tiendas -> 307
Location: /login?siguiente=%2Ftiendas
```

No se pudo completar en este entorno la comprobación manual de inicio de sesión con credenciales reales de Supabase; la ruta autenticada a `/tiendas` queda respaldada por la adaptación del formulario, las pruebas automatizadas y la protección por cookie/proxy.
