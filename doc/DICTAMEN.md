# Dictamen de conciliación del proyecto

## Resumen ejecutivo

El repositorio ya tiene una base funcional de Next.js + TypeScript + Tailwind + Supabase + autenticación. No obstante, la lógica del dominio Inter-Tiendas del plan aún no existe en la forma que exige este proyecto técnico. La infraestructura sirve para desarrollar la solución, pero la parte de negocio necesita crearse adaptándola a la estructura actual del repositorio.

## Tabla resumen

| Pieza | Estado | Qué hacer | Detalle |
|---|---|---|---|
| Proyecto Next.js + TypeScript | EXISTE Y SIRVE | USAR | La app ya está creada y compila correctamente |
| Tailwind CSS | EXISTE Y SIRVE | USAR | Ya está instalado y configurado |
| Conexión Supabase/Postgres | EXISTE | USAR | Hay variables de entorno y conexión a Supabase |
| Login | EXISTE PARCIAL | ADAPTAR | Existe login con Supabase Auth, pero no la capa de sesión del plan |
| Migraciones | EXISTE PARCIAL | ADAPTAR / CREAR | Hay migraciones existentes, pero no las del dominio Inter-Tiendas |
| F1: productos y existencias | NO EXISTE | CREAR | Faltan tablas y servicios del dominio |
| F2: solicitud de compra | NO EXISTE | CREAR | Falta lógica de procesar solicitud |
| F3: algoritmo de decisión | NO EXISTE | CREAR | Debe implementarse en `lib/reglas/solicitud.ts` |
| F4: historial | NO EXISTE | CREAR | Hace falta tabla y capa de transacciones |
| F5: inventario y críticos | NO EXISTE | CREAR | Hace falta vista y cálculo de crítico |

## Infraestructura

## Proyecto Next/TS
- Estado: EXISTE Y SIRVE
- Qué hacer: USAR
- Detalle: el proyecto ya compila con Next.js 16, TypeScript y React 19; seguir usando la base actual en `src/`

## Tailwind
- Estado: EXISTE Y SIRVE
- Qué hacer: USAR
- Detalle: Tailwind está instalado y ya hay `src/app/globals.css`, `postcss.config.mjs` y estructura base de estilos

## Conexión Supabase/Postgres
- Estado: EXISTE
- Qué hacer: USAR
- Detalle: hay variables de entorno con Supabase y Postgres pooler; la variable recomendada es `GLOWSTOCK_POSTGRES_URL` (6543)

## Login
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR
- Detalle: existe un flujo de autenticación con Supabase Auth; falta la capa de sesión y la protección de rutas `/tiendas/*` y `/api/tiendas/*` del plan

## Migraciones
- Estado: EXISTE PARCIAL
- Qué hacer: ADAPTAR / CREAR
- Detalle: hay migraciones base y archivos SQL, pero faltan las migraciones del dominio Inter-Tiendas (`productos`, `existencias`, `transacciones`, `ordenes_proveedor`, `v_inventario`)

## Módulo mínimo del dominio

## F1: Registrar productos y existencias
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: debe implementarse la matriz A/B/C mediante `existencias` con una fila por producto y sucursal

## F2: Procesar solicitud de compra
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: falta el flujo de compra y su resolución dentro de una transacción

## F3: Resolver la solicitud
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: hay que crear `lib/reglas/solicitud.ts` con venta local, transferencia o orden al proveedor y criterios de seguridad

## F4: Registrar historial
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: falta la tabla `transacciones` y la capa de inserción con tipos y costo logístico

## F5: Inventario de la red y críticos
- Estado: NO EXISTE
- Qué hacer: CREAR
- Detalle: hacer vista de inventario, stock total, y cálculo de crítico según el umbral del plan

## Qué necesita conseguir la estudiante

- Confirmar la conexión a Supabase/Postgres del proyecto si aún no está en `.env.local`
- Continuar con la migración del dominio Inter-Tiendas en P01
- Implementar la lógica de negocio en P02
- Crear la capa de datos y APIs en P03/P04/P05
- Diseñar la interfaz Inter-Tiendas en P06/P07/P08

## Decisión general

La base del proyecto es útil y ya funciona, por lo tanto se debe reutilizar. La parte del dominio Inter-Tiendas no está construida y debe crearse con la arquitectura del plan técnico, respetando la estructura ya existente del repositorio.
