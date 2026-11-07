# Inter-Tiendas · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: `doc/PLAN_INTERTIENDAS.md`. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: `doc/ESTADO_ACTUAL.md`.
- Dictamen de conciliación: `doc/DICTAMEN.md`. Antes de crear algo, revisa si dice USAR (ya existe).
- Avance: `doc/ESTADO_EJECUCION.md`.

## Stack objetivo
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete `pg` y la variable `GLOWSTOCK_POSTGRES_URL`. (`pg` está disponible para instalar y usar en la capa de datos.)
- Los scripts de migración usan la conexión directa por una restricción de la red local; `lib/db/conexion.ts` (P03) debe usar `GLOWSTOCK_POSTGRES_URL` (pooler, puerto 6543) con la configuración SSL estándar.
- Validación con Zod. Pruebas con Vitest.
- Login: existe en la app actual como autenticación en Supabase Auth; hay que adaptarlo al flujo del plan y proteger las rutas del módulo Inter-Tiendas.

## Lo más importante del dominio
- Tres sucursales fijas: A, B, C. La matriz de inventario es una fila por producto y sucursal.
- El algoritmo de la solicitud decide: venta local si la solicitante tiene stock; si no, transferencia desde la sucursal candidata de menor costo que conserve al menos 5 unidades; si ninguna cumple, orden al proveedor de 50 unidades.
- Costos logísticos por unidad: A-B 2000, B-C 1500, A-C 3500.
- Punto de reorden global: si el stock total de un producto <= 10, se marca crítico.
- La solicitud se resuelve en una transacción con las existencias bloqueadas.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en `src/lib/reglas/` o en `lib/reglas/` según la estructura final del proyecto: funciones puras, sin `pg`, sin red, sin variables de entorno y sin reloj (excepto fechas).
- Las constantes (seguridad 5, lote 50, reorden 10, matriz de costos) viven en la configuración del dominio.
- Solo la capa de datos importa la conexión a la base.
- Las rutas API y las páginas del módulo Inter-Tiendas deben protegerse con sesión.
- Montos y costos en pesos enteros. Cantidades enteras.
- Fechas como texto de capa media cuando aplique.
- En rutas dinámicas, tratar `params` como `Promise` cuando corresponda.
- SQL con parámetros y nunca concatenando strings.
- Un producto se desactiva, no se elimina; las transacciones no se editan.
- No instalar librerías de componentes ajenas al proyecto. Preferir componentes propios.
- Prefijo de imports para `lib`: usar alias del proyecto o rutas relativas según el módulo.
- Ruta de login actual: `/login`.
- Archivo de protección: pendiente por definir en P03 según el flujo final.

## Al terminar cada tarea
1. `npm run build` sin errores.
2. `npm test` sin fallas.
3. Actualizar `doc/ESTADO_EJECUCION.md`.
4. No hacer commit: la estudiante revisa y hace el commit.
