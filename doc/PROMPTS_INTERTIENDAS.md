# Inter-Tiendas · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_INTERTIENDAS.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: por confirmar en P00 (el primer prompt averigua qué hay montado)

---

## El primer prompt concilia

El primer prompt (P00) audita el repositorio (proyecto Next, Supabase, login) y escribe un dictamen de qué usar, qué adaptar y qué crear. Los prompts siguientes leen ese dictamen. La conexión a Postgres se asume ya copiada en `.env.local` desde Vercel; el P00 solo confirma el nombre de la variable.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_INTERTIENDAS.md` y `PROMPTS_INTERTIENDAS.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Conciliación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 7 · Opcionales | P09 |

---

## P00 · Conciliación: qué hay, qué falta, qué se crea

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `doc/DICTAMEN.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio.

Contexto: el proyecto "Inter-Tiendas" (inventario unificado de tres tiendas de cosméticos con transferencias entre sucursales y órdenes al proveedor) se construye sobre el stack del curso (Next.js + TypeScript + Tailwind + Supabase + Vercel). NO se da por hecho que la infraestructura esté montada. Este prompt NO implementa funcionalidades: audita lo que exista y produce un dictamen. El plan técnico está en doc/PLAN_INTERTIENDAS.md.

Lee completo doc/PLAN_INTERTIENDAS.md, en especial las secciones 0, 1, 2, 3, 5, 6, 7 y 17.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con una radiografía fiel. No supongas: revisa el repositorio. Secciones:
1. ¿Hay un proyecto Next.js con TypeScript? Versión de next, react, typescript, tailwindcss; si no hay package.json o no es Next, dilo claramente.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/, scripts/ hasta 3 niveles; indica si usa src/.
4. Dependencias relevantes presentes o ausentes: pg, zod, @supabase/supabase-js, vitest. Marca cuáles FALTAN.
5. Autenticación: ¿hay login? Si lo hay, archivos, mecanismo, función de sesión, ruta de login, a dónde redirige. Si NO hay, indícalo (se agrega en P03).
6. Base de datos: ¿hay una variable de conexión directa a Postgres en .env.local? (solo NOMBRES, nunca valores). Indica cuál es y su nombre exacto; se asume que ya fue copiada desde Vercel.
7. Dónde viven los datos hoy, si hay algo.
8. Migraciones: ¿mecanismo? Si no, se crea.
9. Qué del dominio ya está construido: productos, existencias, transacciones. Estado de cada uno.
10. Estilos: versión de Tailwind, globals.css, tokens, fuentes.
11. Pruebas: framework (Vitest u otro) y pruebas existentes.
12. Conflictos: existencia previa de app/tiendas, app/api/tiendas, lib/dataService, components/ui; contenido de app/page.tsx; tablas productos/existencias/transacciones.
13. Decisiones derivadas: ¿hay base Next o hay que crear el proyecto?; ruta de login (existe o se agrega); archivo de protección (proxy.ts en Next 16, middleware.ts antes); mecanismo de migraciones; nombre de la variable de conexión a Postgres; nombres de M1 y M2; prefijo de imports; dónde está app/.
14. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea doc/DICTAMEN.md: para cada pieza de INFRAESTRUCTURA (proyecto Next/TS, Tailwind, conexión Supabase/Postgres, login, migraciones) y cada funcionalidad del módulo mínimo (F1 productos y existencias, F2 solicitud, F3 algoritmo de decisión, F4 historial, F5 inventario y críticos), di su estado y qué hacer:

```markdown
## [Pieza o funcionalidad]
- Estado: EXISTE Y SIRVE | EXISTE PARCIAL | NO EXISTE
- Qué hacer: USAR | ADAPTAR | CREAR
- Detalle: [qué exactamente, en qué prompt]
```

Si algo EXISTE Y SIRVE, se USA; si EXISTE PARCIAL, se ADAPTA; si NO EXISTE, se CREA. Incluye una tabla resumen y una lista de "qué necesita conseguir la estudiante" (crear el proyecto Supabase si no existe, confirmar la conexión en .env.local).

TAREA 3. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# Inter-Tiendas · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_INTERTIENDAS.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Dictamen de conciliación: doc/DICTAMEN.md. Antes de crear algo, revisa si dice USAR (ya existe).
- Avance: doc/ESTADO_EJECUCION.md.

## Stack objetivo
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: conexión]. (pg [AJUSTAR: está / falta].)
- Validación con Zod. Pruebas con Vitest.
- Login: [AJUSTAR: existe / se agrega en P03] como puerta única, sin roles. La sucursal (A/B/C) con la que se opera es un contexto, no un permiso.

## Lo más importante del dominio
- Tres sucursales fijas: A, B, C. La matriz de inventario es una fila por producto y sucursal (tabla existencias).
- El algoritmo de la solicitud (lib/reglas/solicitud.ts) decide: venta local si la solicitante tiene stock; si no, transferencia desde la sucursal candidata de MENOR costo que, tras ceder, conserve al menos 5 unidades (stock de seguridad); si ninguna candidata cumple, orden al proveedor de 50 unidades. Distingue dos motivos de orden: agotamiento_total (la red no alcanza ni sumando) y sin_candidata_viable (hay stock pero el de seguridad lo impide).
- Costos logísticos por unidad (simétricos): A-B 2000, B-C 1500, A-C 3500.
- Punto de reorden global: si el stock total de un producto <= 10, se marca crítico.
- La solicitud se resuelve en una transacción con las existencias del producto bloqueadas; el stock nunca queda negativo.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Las constantes (seguridad 5, lote 50, reorden 10, matriz de costos) viven en lib/config/intertiendas.ts.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/tiendas/ llama await exigirSesion() como primera instrucción.
- Montos y costos en pesos enteros. Cantidades enteras.
- Fechas 'YYYY-MM-DD' como texto entre capas. Zona horaria America/Bogota; "hoy" solo con hoyBogota().
- En rutas dinámicas params es una Promise: const { codigo } = await params.
- SQL siempre con parámetros. Nunca concatenar valores.
- Un producto se desactiva, no se elimina. Las transacciones no se editan.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR]. Archivo de protección: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: la estudiante revisa y hace el commit.
```

TAREA 4. Si hay proyecto Next y falta node_modules, ejecuta npm install y luego npm run build; registra el resultado en la sección 14 de ESTADO_ACTUAL.md. Si no hay proyecto o falla, NO lo arregles: descríbelo y dilo en el dictamen.

TAREA 5. Crea doc/ESTADO_EJECUCION.md con la tabla de prompts (P00 a P09) en estado pendiente y una sección de bitácora.

TAREA 6. Revisa .env.local y dime qué variable de conexión a Postgres hay (se asume copiada desde Vercel). Confírmame su nombre exacto (puede ser DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL u otro) y cuál debe usar lib/db/conexion.ts: la del pooler (puerto 6543), adecuada para `pg` en serverless; si hay una de puerto 5432 (non-pooling), no es esa. Si en .env.local no hay ninguna, avísame para copiarla desde Vercel antes de P01. Solo confírmame el nombre.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo creas los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: estado de la infraestructura, resumen del dictamen y qué necesita conseguir la estudiante.
- Marca P00 en ESTADO_EJECUCION.md.
- Muéstrame el dictamen resumido y el nombre de la variable de conexión antes de seguir con P01.
````

**Verificación del estudiante:** leer `doc/DICTAMEN.md`. Dice qué ya tienes, qué falta y qué se va a crear, y confirma el nombre de la variable de conexión (la del pooler, 6543).

**Commit sugerido:** `docs: conciliación y dictamen de Inter-Tiendas`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea o usa:** dependencia `pg`, migraciones M1 y M2, `scripts/verificar-bd.mjs`, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 5, 6, 7, 9 y 15), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Si el dictamen dice que falta la conexión a Postgres, detente y avísame.

OBJETIVO: crear las tablas en Supabase Postgres y dejar un script que demuestre que la base protege las reglas (código único, sucursal válida A/B/C, stock no negativo, una existencia por producto y sucursal).

TAREA 1. Si falta pg, agrégalo (y @types/pg).

TAREA 2. Crea en supabase/migrations/ dos archivos con los nombres de la sección 13 de ESTADO_ACTUAL.md:
- M1 (tablas productos, existencias, transacciones, ordenes_proveedor) con el SQL exacto de la sección 9.2 del plan.
- M2 (vista v_inventario y seguridad) con el SQL exacto de la sección 9.3.
No cambies nombres, columnas ni restricciones: el código depende de ellos (sección 9.4).

TAREA 3. Aplica las migraciones con el mecanismo existente o creando scripts/migrar.mjs (patrón estándar: variable de conexión, tabla _migrations, orden alfabético, transacción, aplicada/omitida, código 1 si falla) y "db:migrar". Ejecútalo.

TAREA 4. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de productos, existencias, transacciones, ordenes_proveedor y la vista v_inventario.
2. Número de filas de cada tabla.
3. Restricciones e índices: productos_codigo_unico, existencias_sucursal_valida, existencias_cantidad_no_neg, existencias_unica, trans_tipo_valido.
4. Si RLS está activo en las cuatro tablas.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Crear producto "IT-A" (precio 20000): funciona; crear "IT-A" otra vez: 23505 (productos_codigo_unico).
   b) Crear producto con precio 0: 23514.
   c) Insertar existencia con sucursal 'D': 23514 (existencias_sucursal_valida).
   d) Insertar existencia con cantidad −1: 23514 (existencias_cantidad_no_neg).
   e) Insertar dos existencias para el mismo producto y sucursal 'A': la segunda 23505 (existencias_unica).
   f) Insertar una transacción con tipo 'devolucion': 23514 (trans_tipo_valido).
   g) Insertar una transacción con cantidad 0: 23514.
   h) Insertar existencias A=10, B=20, C=20 de IT-A y comprobar que v_inventario reporta stock_total 50 y critico=false; bajar a total 10 y comprobar critico=true.
   Imprime OK o FALLA por caso.
6. Total de fallas; código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques el login ni app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase aparecen `productos`, `existencias`, `transacciones`, `ordenes_proveedor`. La salida de `npm run db:verificar` no tiene FALLA; el caso h confirma el stock total y el estado crítico.

**Commit sugerido:** `feat(bd): productos, existencias, transacciones y vista de inventario`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/intertiendas.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 5, 6, 7, 10, 11.2 y 16.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. El núcleo es el algoritmo de la solicitud (decidirSolicitud) y los costos; se prueba a fondo.

TAREA 1. Si falta Vitest, instálalo y configúralo (environment node, include ['tests/**/*.test.ts'], alias de tsconfig). Si ya hay Vitest, respétalo.

TAREA 2. Crea lib/config/intertiendas.ts con el contenido exacto de la sección 10.4 (SUCURSALES, STOCK_SEGURIDAD 5, LOTE_PROVEEDOR 50, REORDEN_GLOBAL 10, la matriz COSTOS, zona horaria).

TAREA 3. Crea lib/reglas/ con las firmas de la sección 10.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP (tabla 11.2); clase ErrorDeNegocio.
- fechas.ts: hoyBogota.
- costos.ts: Sucursal; costoRuta(origen, destino) (desde COSTOS; la ruta es simétrica); costoTotal(origen, destino, cantidad).
- solicitud.ts: AccionSolicitud; Decision; validarSolicitud(cantidad) (entero > 0, RN-09); cumpleSeguridad(stockOrigen, cantidad) (stock - cantidad >= STOCK_SEGURIDAD, RN-02); elegirOrigen(candidatas, solicitante) (menor costoRuta hacia la solicitante; empate: orden A, B, C, determinista); decidirSolicitud(stock, solicitante, cantidad) EXACTO como la sección 7 (venta_local; transferencia desde la candidata de menor costo; orden_proveedor con motivo agotamiento_total si la red < cantidad, o sin_candidata_viable si hay stock pero ninguna candidata cumple seguridad).
- alertas.ts: esCritico(stockTotal) (<= REORDEN_GLOBAL, RN-07).
- producto.ts: validarProducto (código, nombre, categoría no vacíos; precio entero > 0; stockMinimo entero >= 0; RN-11).

Ninguna regla importa pg, red, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de hoyBogota).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo). Crea las pruebas (solicitud, costos, alertas, producto) cubriendo T-01 a T-26 de la sección 16.1. Cada caso con su ID. Lo crítico es decidirSolicitud (T-12 a T-19): venta local; transferencia eligiendo la de menor costo; descarte de candidata que rompe seguridad; los dos motivos de orden al proveedor. Para T-20, fuerza en la prueba dos candidatas con el mismo costo hacia la solicitante (pasando costos iguales o construyendo el caso) y comprueba el desempate A/B/C; documenta que con la matriz real no hay empates.

TAREA 5. Ejecuta npm test hasta que pasen las 26. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (26 pruebas). Abrir `lib/reglas/solicitud.ts` y comprobar las ramas: venta local, transferencia por menor costo, descarte por stock de seguridad, y los dos motivos de orden al proveedor.

**Commit sugerido:** `feat(reglas): algoritmo de solicitud, costos y críticos con 26 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión (login como puerta), respuestas, esquemas, formato · **Modifica:** protección de rutas

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 1.3, 4, 9.4, 10, 11.1, 11.2, 11.4, 14 y 15), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: la infraestructura del servidor y el acceso.

TAREA 1. lib/db/conexion.ts como la sección 10.7 (con los parsers). Usa el nombre real de la variable de conexión que confirmó P00 (la del pooler, 6543).

TAREA 2. Login y sesión:
- Si el dictamen dice que hay login: crea lib/auth/sesion.ts que lo envuelve (obtenerSesion, exigirSesion) sin reescribirlo.
- Si NO hay login: agrega uno mínimo como puerta (página /login con contraseña de acceso en variable de entorno y cookie de sesión firmada; el mecanismo más simple y seguro que encaje con la versión de Next). Documenta la decisión. Sin roles.
- exigirSesion() lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión.

TAREA 3. Protección de rutas (proxy.ts en Next 16, o el archivo del dictamen): protege /tiendas/:path* y /api/tiendas/:path*. Sin sesión: páginas a /login; API 401 con el formato de la sección 11.1.

TAREA 4. Tras iniciar sesión, redirige a /tiendas. app/page.tsx redirige a /tiendas (o a /login si no hay sesión).

TAREA 5. lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23505/23503/23514 → tabla 9.4 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con los esquemas de la sección 11.4, con tipos z.infer. No importa nada del servidor.

TAREA 7. lib/formato.ts: formatearPesos (Intl es-CO, COP, sin decimales); formatearFecha.

TAREA 8. app/api/tiendas/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, la ruta de sesión da 401 y /tiendas redirige al login. Inicia sesión y comprueba que llega a /tiendas.

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y la decisión de login.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** sin sesión, `/tiendas` redirige al login; con sesión, entra.

**Commit sugerido:** `feat(servidor): conexión, login de acceso y utilidades de API`

---

## P04 · Datos: productos, existencias y solicitud

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, scripts de prueba y demo

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 5, 6, 7, 8, 8.1, 9, 10.5, 10.6 y 16.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: la capa de datos y los casos de uso contra Postgres, con transacciones, y comprobar el flujo. Lo crítico: procesarSolicitud (algoritmo + aplicación atómica) y el estado crítico.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 10.6.

TAREA 2. lib/datos/productos.ts y lib/datos/existencias.ts:
- productos: listarInventario({ categoria, soloCriticos }) desde v_inventario (stock A/B/C, total, crítico con esCritico); crearProducto(d) (validarProducto; inserta el producto y sus tres existencias en 0; PRODUCTO_DUPLICADO si choca); obtenerProducto(codigo) con su stock por sucursal.
- existencias: registrarEntrada(codigo, sucursal, cantidad) en transacción (suma al stock de esa sucursal; registra una transacción tipo 'entrada'); bloquearStock(tx, productoId) (interna; devuelve { A, B, C } con FOR UPDATE); ajustar(tx, productoId, sucursal, delta) (interna).

TAREA 3. lib/datos/solicitudes.ts:
- procesarSolicitud(d): secuencia EXACTA de la sección 8.1 dentro de conTransaccion: validarSolicitud; obtener el producto activo (PRODUCTO_NO_ENCONTRADO); bloquearStock; decidirSolicitud; aplicar la decisión (venta_local descuenta; transferencia descuenta del origen y suma a la solicitante; orden_proveedor registra la orden de 50); registrar la transacción con tipo, sucursales, cantidad, costo y motivo; recalcular el total y marcar crítico si <= 10. Devuelve { decision, stock, critico }.

TAREA 4. lib/datos/transacciones.ts: listarTransacciones({ productoCodigo, tipo, sucursal, desde, hasta }).

TAREA 5. lib/datos/ordenes.ts: créalo preparado para los opcionales (F8); en el mínimo solo registra la orden desde procesarSolicitud.

TAREA 6. lib/dataService.ts como fachada: reexporta las funciones públicas y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 7. scripts/limpiar-prueba.mjs ("db:limpiar") y scripts/cargar-demo.ts ("db:demo"): demo con varios productos de cosméticos y existencias repartidas en A, B, C (alguno en estado crítico, alguno que requiera transferencia). Limpia los demo antes. Ejecútalo.

TAREA 8. Instala tsx si falta. scripts/probar-flujo.ts ("probar:flujo") con los 11 pasos de la sección 16.2 usando solo dataService. Imprime OK/FALLA por paso; los que esperan error verifican el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. CRÍTICO: el paso 4 (venta local), el 5 (transferencia por menor costo con su costo), el 6 (orden sin_candidata_viable), el 7 (orden agotamiento_total), el 9 (crítico) y el 11 (ninguna existencia negativa). Ejecuta y corrige hasta 0 fallas.

RESTRICCIONES: no romper el login ni las pruebas. No dupliques lógica (el algoritmo vive en lib/reglas/).

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (11 OK, 0 fallas). Los pasos 5 a 7 confirman las tres salidas del algoritmo (transferencia, los dos tipos de orden) y el 11 que no hay stock negativo.

**Commit sugerido:** `feat(datos): solicitud con algoritmo atómico y existencias`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/tiendas/`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 11.1 a 11.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del módulo mínimo con rutas protegidas.

TAREA 1. Crea las rutas del módulo mínimo de la tabla 11.3 (deja informe, transferencia y ordenes para P09). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 11.4; filtros validados.
- [codigo] con await params.
- export const dynamic = 'force-dynamic'.
- POST de crear y de entrada responden 201; la solicitud responde 200 con la decisión.
- POST /api/tiendas/solicitud es el endpoint central: devuelve la decisión (venta local, transferencia con costo, u orden con motivo) y el nuevo stock.

TAREA 2. Verificación sin sesión: con npm run dev, GET /api/tiendas/productos y POST /api/tiendas/solicitud deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión. Crea un producto; ingresa stock a A, B, C; procesa una solicitud que se cubra local; otra que requiera transferencia (comprueba el origen de menor costo y el costo); fuerza un caso de orden al proveedor. Comprueba una cantidad 0 (400). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas dan 401 sin sesión; con sesión, una solicitud devuelve la decisión correcta (local, transferencia con su costo, u orden con su motivo).

**Commit sugerido:** `feat(api): rutas de productos, existencias y solicitud`

---

## P06 · Interfaz base y matriz de inventario

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/tiendas`, matriz de inventario · **Modifica:** `app/globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 4, 5, 7, 11, 12, 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: componentes reutilizables, navegación y la matriz de inventario de la red con el estado crítico.

TAREA 1. Agrega los tokens de color de la sección 13 sin borrar nada existente (Tailwind 4: @theme; Tailwind 3: tailwind.config).

TAREA 2. components/ui/: Boton (primario, secundario, peligro, fantasma; prop cargando), Campo, Selector, Tarjeta, Insignia (tono neutro, local, transferencia, proveedor, critico), Aviso (info, exito, advertencia, error), Modal, EstadoVacio. Foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /tiendas (o a /login si no hay sesión).

TAREA 4. components/tiendas/NavegacionTiendas.tsx y app/tiendas/layout.tsx (servidor): obtenerSesion(); sin sesión, redirect al login. Barra con "Inter-Tiendas", enlaces Inventario, Solicitud, Historial (y Informe/Órdenes cuando existan); cerrar sesión. Menú móvil.

TAREA 5. components/tiendas/MatrizInventario.tsx, InsigniaCritico.tsx y app/tiendas/page.tsx (servidor): listarInventario; una fila por producto con sus columnas de stock A, B, C, el total destacado e InsigniaCritico cuando el total <= 10. Filtro por categoría y "solo críticos". Botón "Nuevo producto". EstadoVacio si no hay. Tarjetas apiladas en móvil.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver la matriz con las tres columnas de sucursal, el total y los productos marcados como críticos; filtrar por "solo críticos". Revisa en móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver la matriz de inventario con las columnas A/B/C, el total y los críticos resaltados.

**Commit sugerido:** `feat(interfaz): matriz de inventario de la red`

---

## P07 · Productos y entradas de stock

**Fase:** 5 · **Crea:** registro de producto y entrada de existencias

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 5, 8, 11, 12), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: crear productos (nacen con existencias en 0 en A, B y C) e ingresar stock a una sucursal.

TAREA 1. components/tiendas/FormularioProducto.tsx (cliente) y app/tiendas/productos/nuevo/page.tsx: código, nombre, categoría, precio, stock mínimo. Validación con esquemaProducto; POST /api/tiendas/productos; PRODUCTO_DUPLICADO muestra el mensaje. Al crear, el producto aparece en la matriz con 0 en las tres sucursales.

TAREA 2. components/tiendas/FormularioEntrada.tsx y app/tiendas/productos/[codigo]/page.tsx (servidor): obtenerProducto (notFound si no existe); muestra los datos y el stock por sucursal; FormularioEntrada para ingresar una cantidad a una sucursal (selector A/B/C) vía POST /api/tiendas/productos/[codigo]/entrada; tras la entrada, actualiza el stock mostrado. Muestra las transacciones de ese producto.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Crear un producto (ver que nace con 0 en A, B, C); ingresar stock a cada sucursal y ver actualizarse la matriz; intentar un código repetido (error). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear un producto e ingresar stock a las tres sucursales; comprobar el rechazo de un código repetido.

**Commit sugerido:** `feat(interfaz): productos y entradas de stock`

---

## P08 · Solicitud, historial y aceptación del MVP

**Fase:** 5 y 6 · **Crea:** la pantalla de solicitud con su resultado, el historial, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 5, 6, 7, 8, 11, 12, 14, 15, 16 y 17), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: la pantalla central (procesar una solicitud y ver su resultado), el historial, y el cierre del MVP con la aceptación.

TAREA 1. components/tiendas/FormularioSolicitud.tsx (cliente) y ResultadoSolicitud.tsx, en app/tiendas/solicitud/page.tsx: producto (selector o código), sucursal solicitante (A/B/C), cantidad. Al enviar (POST /api/tiendas/solicitud), ResultadoSolicitud muestra con claridad la decisión según su tipo, con el color y el texto de la sección 12.1: "Venta local en [sucursal]", "Transferencia desde [origen] a [solicitante] · costo $[total]", o "Producto por reponer: orden de 50 al proveedor para [sucursal]" con el motivo (agotamiento total o sin candidata viable). Si el producto quedó crítico, lo indica.

TAREA 2. components/tiendas/TablaTransacciones.tsx y app/tiendas/historial/page.tsx (servidor): listarTransacciones con filtros por producto, tipo, sucursal y rango de fechas; columnas fecha, tipo, producto, origen, destino, cantidad, costo logístico, motivo.

TAREA 3. Revisa el código contra las secciones 7 y 15. Reporta y corrige en la bitácora: algoritmo de decisión fuera de lib/reglas/solicitud.ts; solicitud no atómica o que pueda dejar stock negativo; elección de origen que no sea la de menor costo; stock de seguridad no respetado; costos o montos con decimales; "hoy" con new Date() fuera de fechas.ts; rutas sin exigirSesion; SQL concatenado; resultado comunicado solo con color.

TAREA 4. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba; conserva los demo.

TAREA 5. Crea doc/ACEPTACION.md con la tabla A-01 a A-13 de la sección 16.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-14 es de la opcional (P09).

TAREA 6. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts; una nota sobre el algoritmo de la solicitud (local / transferencia por menor costo / orden al proveedor), el stock de seguridad (5), el lote (50) y el reorden global (10); enlace a doc/PLAN_INTERTIENDAS.md.

TAREA 7. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-13 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** procesar solicitudes y ver las tres salidas del algoritmo (venta local, transferencia con su costo, orden al proveedor con su motivo); comprobar que un producto queda crítico al bajar de 10. Hacer push y ejecutar A-01 a A-13 en Vercel.

**Commit sugerido:** `feat(interfaz): solicitud con su resultado, historial y aceptación`

---

## P09 · Opcionales: informe, transferencia manual y recepción de órdenes

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md (secciones 11.3, 16.3 (A-14) y 18), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: las tres mejoras opcionales.

TAREA 1. F6 · Informe diario:
- lib/datos: obtenerInforme(desde, hasta): cuenta ventas locales, transferencias (y su costo logístico total), órdenes al proveedor y productos en estado crítico del periodo. Reexporta en dataService.
- Ruta GET /api/tiendas/informe; pantalla /tiendas/informe con el resumen.

TAREA 2. F7 · Transferencia manual:
- transferenciaManual({ codigo, origen, destino, cantidad }) en transacción: respeta el stock de seguridad del origen (ROMPE_SEGURIDAD si quedaría bajo 5); mueve el stock; registra una transacción de transferencia con su costo. Reexporta en dataService. Ruta POST /api/tiendas/transferencia; un formulario en la pantalla correspondiente.

TAREA 3. F8 · Recepción de órdenes:
- listarOrdenes({ estado }) y recibirOrden(id): una orden pendiente, al recibirse, suma su lote (50) al stock de la sucursal y se marca recibida (con fecha). Reexporta en dataService. Ruta GET /api/tiendas/ordenes y POST /api/tiendas/ordenes/[id]/recibir; pantalla /tiendas/ordenes.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos demo: ver el informe del periodo (verifica a mano el costo total de transferencias); hacer una transferencia manual (y comprobar el rechazo si rompe seguridad); recibir una orden pendiente y ver subir el stock. Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md el resultado de A-14.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver el informe del periodo; hacer una transferencia manual (con su control de stock de seguridad); recibir una orden de proveedor y ver subir el stock.

**Commit sugerido:** `feat(opcional): informe, transferencia manual y recepción de órdenes`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/DICTAMEN.md, doc/PLAN_INTERTIENDAS.md y doc/PROMPTS_INTERTIENDAS.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel —incluida la conexión a Postgres—, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
