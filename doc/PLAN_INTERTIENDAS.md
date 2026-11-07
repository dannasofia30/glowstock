# Inter-Tiendas · Plan técnico de implementación

> Sistema de Optimización e Inventario Inter-Tiendas (cosméticos y belleza) · versión técnica 1.0, derivada del plan funcional de Danna Osorio
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_INTERTIENDAS.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida y conciliación](#1-punto-de-partida-y-conciliación)
2. [Traducción del stack del plan funcional](#2-traducción-del-stack-del-plan-funcional)
3. [Alcance](#3-alcance)
4. [Acceso](#4-acceso)
5. [Las tres tiendas y los costos logísticos](#5-las-tres-tiendas-y-los-costos-logísticos)
6. [Reglas de negocio](#6-reglas-de-negocio)
7. [El algoritmo de la solicitud](#7-el-algoritmo-de-la-solicitud)
8. [Casos de uso](#8-casos-de-uso)
9. [Modelo de datos](#9-modelo-de-datos)
10. [Arquitectura del código](#10-arquitectura-del-código)
11. [Contratos de API](#11-contratos-de-api)
12. [Pantallas](#12-pantallas)
13. [Identidad visual](#13-identidad-visual)
14. [Dinero, fechas y zona horaria](#14-dinero-fechas-y-zona-horaria)
15. [Seguridad e integridad](#15-seguridad-e-integridad)
16. [Pruebas](#16-pruebas)
17. [Plan de ejecución](#17-plan-de-ejecución)
18. [Funcionalidades opcionales](#18-funcionalidades-opcionales)
19. [Glosario](#19-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

El plan funcional de Danna describe un prototipo de consola en Python/C++ con archivos de texto. Este plan técnico conserva toda su lógica (el algoritmo de decisión inter-tiendas, los costos logísticos, el reabastecimiento) y la traduce al stack del curso. El primer prompt (P00) concilia: audita qué hay montado en el repositorio y decide en cada paso si crear o adaptar.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_INTERTIENDAS.md` | Este documento |
| `doc/PROMPTS_INTERTIENDAS.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/DICTAMEN.md` | Qué existe, qué falta y qué se crea o adapta |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida y conciliación

### 1.1 Lo que el proyecto necesita

- Proyecto Next.js con TypeScript, desplegado en Vercel.
- Proyecto Supabase para la base de datos.
- Un login como puerta de acceso.

P00 verifica qué hay y el dictamen marca cada pieza como existe / falta / se crea.

### 1.2 Lo que P00 verifica (y el dictamen resuelve)

| Aspecto | Qué decide |
|---|---|
| Si existe el proyecto Next.js con TypeScript y compila | Si hay base o hay que crearla |
| Si existe conexión a Supabase/Postgres (en `.env.local`) | Confirma el nombre de la variable que usará `lib/db/conexion.ts` |
| Si hay login | Si se envuelve (sin reescribir) o se agrega uno mínimo en P03 |
| Mecanismo de migraciones | Si existe se usa; si no, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 13) |
| Qué del dominio ya está construido | Para adaptarlo en vez de rehacerlo |

### 1.3 Regla sobre el login

El plan funcional es un prototipo de consola sin autenticación. En el stack del curso la aplicación queda publicada en una URL de Vercel; dejarla abierta expondría el inventario y las transacciones. Se usa un login como puerta única de acceso para el personal de la cadena, sin roles diferenciados: se elige con qué sucursal se está operando dentro de la app (no es un permiso, es un contexto). El login no se reescribe; solo se agrega el adaptador `lib/auth/sesion.ts` (`obtenerSesion`, `exigirSesion`), la protección de `/tiendas/*` y `/api/tiendas/*`, y la redirección posterior al login hacia `/tiendas`.

---

## 2. Traducción del stack del plan funcional

El plan funcional usa Python/C++ por consola con archivos `inventario.txt` y `transacciones.txt`. Ese stack no es el del curso y los archivos de texto no persisten en Vercel (serverless, sistema de archivos efímero). La lógica no cambia; cambia dónde viven los datos y cómo se interactúa.

| Pieza del plan funcional | En este plan técnico | Motivo |
|---|---|---|
| Python/C++ por consola con menús | Next.js (App Router) + TypeScript, interfaz web | Es el stack del curso |
| Matriz de inventario (productos × sucursales) en memoria | Tabla `existencias` (una fila por producto y sucursal) | Equivale a la matriz, pero persistente y consultable |
| `inventario.txt` / `transacciones.txt` | Tablas `productos`, `existencias`, `transacciones` en Supabase Postgres | El texto no persiste en Vercel |
| Lógica de decisión en funciones | Igual, en `lib/reglas/` (funciones puras) | El plan ya separa la lógica; se conserva y se prueba con Vitest |
| ID de transacción incremental | `BIGSERIAL` | Equivalente en base de datos |
| Precio y costos como Float | Pesos enteros | El peso colombiano no usa centavos; los costos del plan ya son enteros ($2.000, $1.500, $3.500) |

Lo que **no cambia**: las tres sucursales (A, B, C), la matriz de costos logísticos, el stock mínimo de seguridad (5), el lote de reabastecimiento (50), el punto de reorden global (10) y todo el algoritmo de la solicitud (sección 7).

---

## 3. Alcance

### 3.1 Módulo mínimo (lo que "SÍ hace" el plan funcional)

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar productos y sus existencias por sucursal (la matriz) | CU-01, CU-02 | P04, P05, P06, P07 |
| F2 | Procesar una solicitud de compra en una sucursal | CU-03 | P02, P04, P05, P08 |
| F3 | Resolver la solicitud: venta local, transferencia inter-tiendas u orden al proveedor | CU-03 | P02, P04, P08 |
| F4 | Registrar en el historial cada operación (venta, transferencia, orden) | CU-03, CU-04 | P04, P08 |
| F5 | Mostrar el estado del inventario de la red y los productos en estado crítico | CU-05 | P02, P06, P08 |

El corazón del módulo mínimo es F3: el algoritmo que, ante una solicitud que el stock local no cubre, decide la mejor sucursal de origen por costo o emite la orden al proveedor (sección 7).

### 3.2 Funcionalidades opcionales

| ID | Funcionalidad | Prompts |
|---|---|---|
| F6 | Informe diario: resumen de ventas, transferencias y órdenes por periodo | P09 |
| F7 | Transferencia manual entre sucursales (reequilibrar sin una venta de por medio) | P09 |
| F8 | Recepción de una orden de proveedor (ingresar el lote recibido al stock) | P09 |

Se construyen solo con la fase 5 cerrada. (El estado "crítico" por punto de reorden global se calcula desde el módulo mínimo; el informe diario que lo agrupa es opcional.)

### 3.3 Fuera de alcance

Se mantiene la lista del plan funcional: no procesa pagos electrónicos ni pasarelas, no tiene interfaz gráfica compleja más allá de la web del curso, y no hace seguimiento por GPS ni geolocalización de vehículos.

### 3.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Los datos viven en Supabase Postgres | Para que persistan en producción (el texto no sirve en Vercel) |
| Precios y costos en pesos enteros | El peso colombiano no usa centavos; los costos del plan ya son enteros |
| La matriz producto × sucursal se modela como filas en `existencias` (producto_id, sucursal, cantidad) | Más flexible que una matriz fija; permite agregar productos sin tocar el esquema |
| Las tres sucursales son fijas: A, B, C | El plan define exactamente tres; la matriz de costos depende de ello |
| La solicitud se resuelve en una transacción con las filas de existencias bloqueadas | Evita que dos solicitudes simultáneas dejen stock negativo o decidan mal |
| El stock de seguridad (5), el lote (50), el reorden (10) y los costos son configurables | El plan los fija; se centralizan en `lib/config` para cambiarlos en un solo lugar |
| La orden al proveedor se emite tanto por agotamiento total como cuando ninguna sucursal puede transferir por el stock de seguridad | El diagrama del plan lleva ambos casos a la orden; se distinguen en el motivo (sección 7) |
| Un producto no se elimina; se desactiva | Un producto con transacciones debe seguir en el historial |
| Las transacciones no se editan ni se borran | Son el historial de la operación |

---

## 4. Acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Personal de la cadena | Login como puerta | Registrar productos y existencias, procesar solicitudes de compra, ver el inventario de la red, el estado crítico y el historial; (opcional) transferencias manuales, recibir órdenes, ver el informe |
| Sistema | Interno | Valida entradas, ejecuta el algoritmo de la solicitud, mueve stock entre sucursales, emite órdenes, marca productos críticos |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/tiendas` |
| `/tiendas/*` | Redirige al login | Sí |
| `/api/tiendas/*` | 401 | Sí |

La sucursal con la que se opera es un contexto que se elige en la app, no un permiso.

---

## 5. Las tres tiendas y los costos logísticos

El sistema maneja exactamente tres sucursales: **A**, **B** y **C**. El costo de transferir una unidad entre dos sucursales es simétrico (de A a B cuesta lo mismo que de B a A):

| Ruta | Costo por unidad |
|---|---|
| A ↔ B | $2.000 |
| B ↔ C | $1.500 |
| A ↔ C | $3.500 |

Estos costos se guardan en `lib/config/intertiendas.ts` como una matriz. El costo total de una transferencia es el costo por unidad × la cantidad transferida. Las constantes del dominio:

- Stock mínimo de seguridad: **5** unidades (una sucursal origen no baja de 5 tras transferir).
- Lote de reabastecimiento al proveedor: **50** unidades.
- Punto de reorden global (estado crítico): stock total de la red **≤ 10** unidades.

---

## 6. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | Atención prioritaria local: si la sucursal solicitante tiene stock suficiente, la venta se procesa sin transferencias | Regla 1 | `lib/reglas/solicitud.ts` |
| RN-02 | Una sucursal origen solo transfiere si tras la transferencia le quedan al menos 5 unidades (stock − cantidad ≥ 5) | Regla 2 | `lib/reglas/solicitud.ts` `cumpleSeguridad` |
| RN-03 | Si varias sucursales cumplen el stock de seguridad, se elige la de menor costo logístico hacia la solicitante; si solo una cumple, se elige esa | Regla 3 | `lib/reglas/solicitud.ts` `elegirOrigen` |
| RN-04 | El costo total de la transferencia es la cantidad × el costo por unidad de la ruta | Regla 3 | `lib/reglas/costos.ts` |
| RN-05 | Agotamiento total: si la suma del stock de la red es menor a la cantidad solicitada, la venta falla y se genera una orden al proveedor por 50 unidades a la sucursal solicitante | Regla 4 | `lib/reglas/solicitud.ts`; servicio |
| RN-06 | Si hay stock en la red pero ninguna sucursal puede transferir sin romper el stock de seguridad, también se genera la orden al proveedor (motivo distinto al agotamiento total) | Diagrama del plan (rama "no hay candidatas") | `lib/reglas/solicitud.ts` |
| RN-07 | Punto de reorden global: si el stock total de un producto es ≤ 10, se marca como CRÍTICO | Regla 4 | `lib/reglas/alertas.ts` `esCritico` |
| RN-08 | Cada operación (venta local, transferencia, orden) se registra en el historial con su tipo, producto, sucursales, cantidad, costo y fecha | Sección 4 del plan | Servicio; tabla `transacciones` |
| RN-09 | La cantidad solicitada es un entero mayor que 0 | Agregada | `lib/reglas/solicitud.ts`; Zod; BD CHECK |
| RN-10 | El stock de una sucursal nunca es negativo | Agregada | BD CHECK; el algoritmo nunca deja negativo |
| RN-11 | El código de producto es único; el precio es un entero mayor que 0; el stock mínimo es un entero ≥ 0 | Sección 4 del plan | BD UNIQUE, CHECK; Zod |
| RN-12 | La transferencia descuenta del origen y suma a la solicitante exactamente la cantidad solicitada, en una transacción | Diagrama del plan | Servicio `procesarSolicitud` |
| RN-13 | Un producto no se elimina; se desactiva. Las transacciones son inmutables | Agregada | Servicio; BD `ON DELETE RESTRICT` |
| RN-14 | Las tres sucursales son A, B y C; no se agregan ni se quitan | Sección 1 del plan | `lib/config`; BD CHECK |

### 6.1 Casos límite

| Caso | Resultado |
|---|---|
| Stock local suficiente | Venta local, sin transferencia (RN-01) |
| Stock local insuficiente, una sola sucursal cumple seguridad | Transferencia desde esa (RN-03) |
| Dos sucursales cumplen seguridad | Transferencia desde la de menor costo hacia la solicitante (RN-03) |
| Origen quedaría con 4 tras transferir (rompe seguridad) | No es candidata (RN-02) |
| Origen quedaría con exactamente 5 | Es candidata (≥ 5, RN-02) |
| Hay stock en la red pero ninguna cumple seguridad | Orden al proveedor, motivo "sin candidata viable" (RN-06) |
| Suma de la red menor a la cantidad | Orden al proveedor, motivo "agotamiento total" (RN-05) |
| Cantidad solicitada 0 o negativa | Rechazo (`DATOS_INVALIDOS`) |
| Tras la operación, stock total de la red ≤ 10 | El producto queda marcado crítico (RN-07) |

---

## 7. El algoritmo de la solicitud

Es el núcleo del proyecto y lo que el plan quiere demostrar. Se implementa como una función pura en `lib/reglas/solicitud.ts`, que recibe el stock de las tres sucursales y la solicitud, y devuelve la decisión (sin tocar la base). El servicio aplica esa decisión dentro de una transacción.

```ts
// lib/reglas/solicitud.ts
export type Sucursal = 'A' | 'B' | 'C';
export type AccionSolicitud = 'venta_local' | 'transferencia' | 'orden_proveedor';

export interface Decision {
  accion: AccionSolicitud;
  origen?: Sucursal;           // en transferencia
  costoUnitario?: number;      // en transferencia
  costoTotal?: number;         // en transferencia
  motivo?: 'agotamiento_total' | 'sin_candidata_viable';  // en orden_proveedor
  loteProveedor?: number;      // en orden_proveedor (50)
}

export function decidirSolicitud(
  stock: Record<Sucursal, number>,
  solicitante: Sucursal,
  cantidad: number,
): Decision {
  // RN-01: atención local
  if (stock[solicitante] >= cantidad) return { accion: 'venta_local' };

  // RN-02: candidatas que cumplen el stock de seguridad tras transferir
  const otras = (['A', 'B', 'C'] as Sucursal[]).filter((s) => s !== solicitante);
  const candidatas = otras.filter((s) => stock[s] - cantidad >= STOCK_SEGURIDAD);

  if (candidatas.length > 0) {
    // RN-03: menor costo hacia la solicitante; empate: orden A, B, C
    const origen = candidatas.sort(
      (x, y) => costoRuta(x, solicitante) - costoRuta(y, solicitante),
    )[0];
    const costoUnitario = costoRuta(origen, solicitante);
    return { accion: 'transferencia', origen, costoUnitario, costoTotal: cantidad * costoUnitario };
  }

  // No hay candidatas: orden al proveedor, distinguiendo el motivo
  const totalRed = stock.A + stock.B + stock.C;
  const motivo = totalRed < cantidad ? 'agotamiento_total' : 'sin_candidata_viable';  // RN-05, RN-06
  return { accion: 'orden_proveedor', motivo, loteProveedor: LOTE_PROVEEDOR };
}
```

Ejemplos verificables (seguridad 5, costos de la sección 5):

| Stock {A,B,C} | Solicitante | Cantidad | Decisión |
|---|---|---|---|
| {10, 3, 3} | A | 4 | venta local |
| {2, 20, 6} | A | 3 | transferencia desde B (C quedaría en 3, rompe seguridad; B en 17) · costo 3 × 2.000 = 6.000 |
| {1, 20, 20} | A | 3 | transferencia desde B (2.000 < 3.500 de C) · 6.000 |
| {20, 20, 1} | C | 3 | transferencia desde B (1.500 < 3.500 de A) · 4.500 |
| {1, 6, 6} | A | 3 | orden al proveedor, "sin candidata viable" (hay 13 en la red, pero B y C quedarían en 3) |
| {1, 0, 0} | A | 5 | orden al proveedor, "agotamiento total" (la red tiene 1) |

Tras aplicar la decisión, el servicio comprueba el stock total del producto y, si queda ≤ 10, lo marca crítico (RN-07).

### 7.1 Distinción de los dos motivos de orden al proveedor

El plan, en la regla 4, habla de "agotamiento total"; pero el diagrama de flujo emite la orden siempre que no haya candidatas, lo que incluye el caso en que sí hay stock en la red pero ninguna sucursal puede ceder sin romper su stock de seguridad. Ambos terminan en una orden de 50 unidades a la solicitante; se distinguen en el `motivo` para que el informe y el mensaje sean claros:

- `agotamiento_total`: la red no tiene suficiente ni sumando todo.
- `sin_candidata_viable`: la red tiene suficiente en total, pero el stock de seguridad impide la transferencia.

---

## 8. Casos de uso

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Registrar producto | código, nombre, categoría, precio, stock mínimo | código no repetido | Producto con existencias en 0 en A, B y C | `DATOS_INVALIDOS`, `PRODUCTO_DUPLICADO` |
| CU-02 Ajustar existencias (entrada de stock) | producto, sucursal, cantidad | el producto existe | Stock de esa sucursal aumentado; transacción de entrada | `PRODUCTO_NO_ENCONTRADO`, `DATOS_INVALIDOS` |
| CU-03 Procesar solicitud de compra | producto, sucursal solicitante, cantidad | el producto existe y está activo | Venta local, transferencia u orden al proveedor según el algoritmo; stock actualizado; transacción registrada | `PRODUCTO_NO_ENCONTRADO`, `DATOS_INVALIDOS` |
| CU-04 Consultar historial | filtros (producto, tipo, sucursal, rango) | — | Transacciones con tipo, producto, sucursales, cantidad, costo y fecha | — |
| CU-05 Ver inventario de la red y críticos | filtro opcional | — | Matriz de existencias por sucursal, stock total y productos en estado crítico | — |
| CU-06 Informe diario (opcional) | fecha o rango | — | Resumen de ventas, transferencias y órdenes del periodo | — |
| CU-07 Transferencia manual (opcional) | producto, origen, destino, cantidad | origen con stock que respeta seguridad | Stock movido; transacción de transferencia | `PRODUCTO_NO_ENCONTRADO`, `CANTIDAD_INSUFICIENTE`, `ROMPE_SEGURIDAD` |
| CU-08 Recibir orden de proveedor (opcional) | orden | la orden existe y está pendiente | Lote ingresado al stock de la sucursal; orden marcada recibida | `ORDEN_NO_ENCONTRADA` |

### 8.1 Secuencia de CU-03 (procesar solicitud)

Todo ocurre dentro de `conTransaccion`, con las existencias del producto bloqueadas (`FOR UPDATE`):

1. `validarSolicitud(cantidad)` (entero mayor que 0).
2. Obtener el producto activo; si no existe, `PRODUCTO_NO_ENCONTRADO`.
3. Leer y bloquear el stock del producto en A, B y C.
4. `decidirSolicitud(stock, solicitante, cantidad)` (sección 7).
5. Aplicar la decisión:
   - `venta_local`: descontar la cantidad de la solicitante.
   - `transferencia`: descontar del origen, sumar a la solicitante (RN-12).
   - `orden_proveedor`: no mueve stock entre sucursales; registra la orden de 50 unidades para la solicitante (que se recibe luego, opcional F8).
6. Registrar la transacción con su tipo, sucursales, cantidad y costo (RN-08).
7. Recalcular el stock total del producto y marcarlo crítico si queda ≤ 10 (RN-07).
8. Confirmar y devolver el resultado (la decisión, el nuevo stock y si quedó crítico).

```ts
export async function procesarSolicitud(d: DatosSolicitud): Promise<ResultadoSolicitud> {
  validarSolicitud(d.cantidad);
  return conTransaccion(async (tx) => {
    const producto = await obtenerProductoActivo(tx, d.productoId);     // PRODUCTO_NO_ENCONTRADO
    const stock = await bloquearStock(tx, producto.id);                 // { A, B, C } con FOR UPDATE
    const decision = decidirSolicitud(stock, d.solicitante, d.cantidad);
    switch (decision.accion) {
      case 'venta_local':
        await ajustar(tx, producto.id, d.solicitante, -d.cantidad); break;
      case 'transferencia':
        await ajustar(tx, producto.id, decision.origen!, -d.cantidad);
        await ajustar(tx, producto.id, d.solicitante, +d.cantidad); break;
      case 'orden_proveedor':
        await registrarOrden(tx, producto.id, d.solicitante, decision.loteProveedor!); break;
    }
    await registrarTransaccion(tx, producto.id, d, decision);           // RN-08
    const critico = await marcarCriticoSiAplica(tx, producto.id);      // RN-07
    return { decision, critico };
  });
}
```

---

## 9. Modelo de datos

### 9.1 Relaciones

```text
productos 1 ──── N existencias   (una fila por producto y sucursal: la "matriz")
productos 1 ──── N transacciones
productos 1 ──── N ordenes_proveedor   (opcional de recepción, F8)

v_inventario = productos + stock A, B, C, stock total y estado crítico derivado
```

Las migraciones se guardan en `supabase/migrations/`. En este documento se nombran M1 y M2. P00 confirma la numeración.

### 9.2 M1 · Tablas

```sql
-- M1: tablas de Inter-Tiendas

CREATE TABLE IF NOT EXISTS productos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        VARCHAR(40)   NOT NULL,
  nombre        VARCHAR(160)  NOT NULL,
  categoria     VARCHAR(80)   NOT NULL,
  precio        INTEGER       NOT NULL,                 -- pesos enteros (RN-11)
  stock_minimo  INTEGER       NOT NULL DEFAULT 5,
  activo        BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico  UNIQUE (codigo),                       -- RN-11
  CONSTRAINT productos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT productos_precio_positivo CHECK (precio > 0),                  -- RN-11
  CONSTRAINT productos_minimo_no_neg CHECK (stock_minimo >= 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS existencias (
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,  -- RN-13
  sucursal     CHAR(1)       NOT NULL,                  -- 'A' | 'B' | 'C'
  cantidad     INTEGER       NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT existencias_sucursal_valida CHECK (sucursal IN ('A', 'B', 'C')),   -- RN-14
  CONSTRAINT existencias_cantidad_no_neg CHECK (cantidad >= 0),                 -- RN-10
  CONSTRAINT existencias_unica UNIQUE (producto_id, sucursal)
);
CREATE INDEX IF NOT EXISTS idx_existencias_producto ON existencias (producto_id);

CREATE TABLE IF NOT EXISTS transacciones (
  id             BIGSERIAL     PRIMARY KEY,
  producto_id    UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo           VARCHAR(24)   NOT NULL,                -- 'venta_local' | 'transferencia' | 'orden_proveedor' | 'entrada'
  sucursal_origen   CHAR(1),                            -- en transferencia; null en los demás
  sucursal_destino  CHAR(1),                            -- solicitante / destino
  cantidad       INTEGER       NOT NULL,
  costo_logistico INTEGER      NOT NULL DEFAULT 0,      -- pesos enteros; 0 salvo en transferencia
  motivo         VARCHAR(40),                           -- agotamiento_total / sin_candidata_viable (en orden)
  fecha          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),  -- RN-08
  CONSTRAINT trans_tipo_valido CHECK (tipo IN ('venta_local', 'transferencia', 'orden_proveedor', 'entrada')),
  CONSTRAINT trans_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT trans_costo_no_neg CHECK (costo_logistico >= 0),
  CONSTRAINT trans_sucursales_validas CHECK (
    (sucursal_origen  IS NULL OR sucursal_origen  IN ('A','B','C')) AND
    (sucursal_destino IS NULL OR sucursal_destino IN ('A','B','C')))
);
CREATE INDEX IF NOT EXISTS idx_trans_producto ON transacciones (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_trans_tipo     ON transacciones (tipo, fecha);

CREATE TABLE IF NOT EXISTS ordenes_proveedor (     -- recepción opcional (F8)
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  sucursal     CHAR(1)       NOT NULL,
  cantidad     INTEGER       NOT NULL DEFAULT 50,
  motivo       VARCHAR(40)   NOT NULL,
  estado       VARCHAR(10)   NOT NULL DEFAULT 'pendiente',   -- 'pendiente' | 'recibida'
  fecha        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  recibida_at  TIMESTAMPTZ,
  CONSTRAINT orden_sucursal_valida CHECK (sucursal IN ('A','B','C')),
  CONSTRAINT orden_estado_valido   CHECK (estado IN ('pendiente', 'recibida')),
  CONSTRAINT orden_cantidad_positiva CHECK (cantidad > 0)
);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes_proveedor (estado, fecha);

CREATE OR REPLACE FUNCTION it_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION it_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_existencias_updated_at ON existencias;
CREATE TRIGGER trg_existencias_updated_at BEFORE UPDATE ON existencias
  FOR EACH ROW EXECUTE FUNCTION it_actualizar_updated_at();
```

### 9.3 M2 · Vista de inventario y seguridad

```sql
-- M2: vista con stock por sucursal, total y estado crítico; cierre de acceso público

CREATE OR REPLACE VIEW v_inventario
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'A'), 0) AS stock_a,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'B'), 0) AS stock_b,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'C'), 0) AS stock_c,
  COALESCE(SUM(e.cantidad), 0) AS stock_total,
  (COALESCE(SUM(e.cantidad), 0) <= 10) AS critico        -- RN-07 (apoyo; el servidor usa el umbral de config)
FROM productos p
LEFT JOIN existencias e ON e.producto_id = p.id
GROUP BY p.id;

ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE existencias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_proveedor ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, existencias, transacciones, ordenes_proveedor FROM anon, authenticated;
REVOKE ALL ON v_inventario FROM anon, authenticated;
```

El estado crítico (≤ 10) se calcula en el servidor con el umbral de `lib/config` y se apoya en la vista. Las tablas quedan sin políticas: todo el acceso ocurre en el servidor con la conexión directa a Postgres.

### 9.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `productos_codigo_unico` | `PRODUCTO_DUPLICADO` |
| `23505` | `existencias_unica` | `ERROR_INTERNO` (lo controla el servidor al crear el producto) |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `TIENE_DEPENDENCIAS` |
| `23514` | `existencias_cantidad_no_neg` | `CANTIDAD_INSUFICIENTE` (una salida no puede dejar negativo) |
| `23514` | cualquier otro CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 10. Arquitectura del código

### 10.1 Capas

```text
Pantallas (app/tiendas/*) ───┐
                             ├──► Rutas API (app/api/tiendas/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ──┘          │                              │
                                        └──── lib/validacion (Zod)     └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: el algoritmo de la solicitud, los costos, el estado crítico y las validaciones. No importan la base, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest. El algoritmo de decisión es la pieza más probada.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService`, responden con `lib/http/respuestas.ts`.

### 10.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/DICTAMEN.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_intertiendas_tablas.sql
supabase/migrations/NNNN_intertiendas_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/intertiendas.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/costos.ts
lib/reglas/solicitud.ts
lib/reglas/alertas.ts
lib/reglas/producto.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/productos.ts
lib/datos/existencias.ts
lib/datos/solicitudes.ts
lib/datos/transacciones.ts
lib/datos/ordenes.ts               (opcional)
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/solicitud.test.ts
tests/reglas/costos.test.ts
tests/reglas/alertas.test.ts
tests/reglas/producto.test.ts
vitest.config.ts

app/page.tsx                                  (redirige a /tiendas)
app/tiendas/layout.tsx
app/tiendas/page.tsx                          (inventario de la red + críticos)
app/tiendas/productos/nuevo/page.tsx
app/tiendas/productos/[codigo]/page.tsx       (existencias y entradas)
app/tiendas/solicitud/page.tsx                (procesar una solicitud de compra)
app/tiendas/historial/page.tsx                (transacciones)
app/tiendas/informe/page.tsx                  (opcional, F6)
app/tiendas/ordenes/page.tsx                  (opcional, F8)

app/api/tiendas/sesion/route.ts
app/api/tiendas/productos/route.ts
app/api/tiendas/productos/[codigo]/route.ts
app/api/tiendas/productos/[codigo]/entrada/route.ts
app/api/tiendas/solicitud/route.ts
app/api/tiendas/transacciones/route.ts
app/api/tiendas/informe/route.ts              (opcional, F6)
app/api/tiendas/transferencia/route.ts        (opcional, F7)
app/api/tiendas/ordenes/route.ts              (opcional, F8)
app/api/tiendas/ordenes/[id]/recibir/route.ts (opcional, F8)

components/ui/*  (Boton, Campo, Selector, Tarjeta, Insignia, Aviso, Modal, EstadoVacio)
components/tiendas/NavegacionTiendas.tsx
components/tiendas/MatrizInventario.tsx
components/tiendas/InsigniaCritico.tsx
components/tiendas/FormularioProducto.tsx
components/tiendas/FormularioEntrada.tsx
components/tiendas/FormularioSolicitud.tsx
components/tiendas/ResultadoSolicitud.tsx
components/tiendas/TablaTransacciones.tsx
components/tiendas/PanelInforme.tsx           (opcional)
```

### 10.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio |
| El algoritmo de la solicitud vive en `lib/reglas/solicitud.ts` y se prueba a fondo | Es el núcleo del proyecto (sección 7) |
| La solicitud se resuelve en una transacción con las existencias bloqueadas | Evita stock negativo o decisiones erradas por concurrencia |
| El stock de una sucursal nunca queda negativo | RN-10; CHECK en la base |
| Los costos, la seguridad, el lote y el reorden viven en `lib/config` | Configurables en un solo lugar (RN-02 a RN-07, RN-14) |
| Montos y costos como `number` entero en pesos | Sección 14 |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Las rutas `/api/tiendas/*` llaman `exigirSesion()` como primera instrucción | Sección 4 |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js entrega `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 10.4 Configuración

```ts
// lib/config/intertiendas.ts
export const SUCURSALES = ['A', 'B', 'C'] as const;
export const STOCK_SEGURIDAD = 5;        // RN-02
export const LOTE_PROVEEDOR = 50;        // RN-05
export const REORDEN_GLOBAL = 10;        // RN-07 (crítico si total <= 10)

// Matriz de costos logísticos por unidad (simétrica), RN-03/RN-04
export const COSTOS: Record<string, number> = {
  'A-B': 2000, 'B-A': 2000,
  'B-C': 1500, 'C-B': 1500,
  'A-C': 3500, 'C-A': 3500,
};

export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
```

### 10.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'PRODUCTO_DUPLICADO' | 'PRODUCTO_NO_ENCONTRADO'
  | 'CANTIDAD_INSUFICIENTE' | 'ROMPE_SEGURIDAD'
  | 'ORDEN_NO_ENCONTRADA' | 'TIENE_DEPENDENCIAS' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 11.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 11.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function hoyBogota(reloj?: Date): string;                 // 'YYYY-MM-DD'

// lib/reglas/costos.ts
export type Sucursal = 'A' | 'B' | 'C';
export function costoRuta(origen: Sucursal, destino: Sucursal): number;   // RN-04; desde COSTOS
export function costoTotal(origen: Sucursal, destino: Sucursal, cantidad: number): number;

// lib/reglas/solicitud.ts
export type AccionSolicitud = 'venta_local' | 'transferencia' | 'orden_proveedor';
export interface Decision { accion: AccionSolicitud; origen?: Sucursal; costoUnitario?: number; costoTotal?: number; motivo?: 'agotamiento_total' | 'sin_candidata_viable'; loteProveedor?: number }
export function validarSolicitud(cantidad: number): void;        // entero > 0 (RN-09)
export function cumpleSeguridad(stockOrigen: number, cantidad: number): boolean;  // stock - cantidad >= STOCK_SEGURIDAD (RN-02)
export function elegirOrigen(candidatas: Sucursal[], solicitante: Sucursal): Sucursal;  // menor costo; empate A,B,C (RN-03)
export function decidirSolicitud(stock: Record<Sucursal, number>, solicitante: Sucursal, cantidad: number): Decision;  // sección 7

// lib/reglas/alertas.ts
export function esCritico(stockTotal: number): boolean;          // <= REORDEN_GLOBAL (RN-07)

// lib/reglas/producto.ts
export function validarProducto(d: { codigo: string; nombre: string; categoria: string; precio: number; stockMinimo: number }): void;  // RN-11
```

### 10.6 Firmas de `dataService`

```ts
// Sesión
obtenerSesion(): Promise<{ email: string } | null>

// Productos y existencias
listarInventario(f?: { categoria?: string; soloCriticos?: boolean }): Promise<FilaInventario[]>   // matriz + total + crítico
crearProducto(d: DatosProducto): Promise<{ id: string; codigo: string }>
obtenerProducto(codigo: string): Promise<DetalleProducto>        // datos + stock por sucursal
registrarEntrada(codigo: string, sucursal: Sucursal, cantidad: number): Promise<{ stock: Record<Sucursal, number> }>  // CU-02

// Solicitud (el corazón)
procesarSolicitud(d: DatosSolicitud): Promise<ResultadoSolicitud>   // CU-03; transacción; sección 7, 8.1

// Historial
listarTransacciones(f?: { productoCodigo?: string; tipo?: string; sucursal?: Sucursal; desde?: string; hasta?: string }): Promise<Transaccion[]>

// Opcionales
obtenerInforme(desde: string, hasta: string): Promise<Informe>                 // F6
transferenciaManual(d: { codigo: string; origen: Sucursal; destino: Sucursal; cantidad: number }): Promise<...>  // F7
listarOrdenes(f?: { estado?: string }): Promise<OrdenProveedor[]>              // F8
recibirOrden(id: number): Promise<...>                                         // F8
```

Tipos (`lib/datos/tipos.ts`): `FilaInventario { codigo, nombre, categoria, precio, stockA, stockB, stockC, stockTotal, critico }`; `DetalleProducto`; `DatosSolicitud { productoId o codigo, solicitante, cantidad }`; `ResultadoSolicitud { decision: Decision, stock: Record<Sucursal, number>, critico: boolean }`; `Transaccion`, `OrdenProveedor`, `Informe`.

### 10.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → texto
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v);                 // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids, COUNT, SUM) → number

const globalParaPool = globalThis as unknown as { poolIntertiendas?: Pool };

export const pool = globalParaPool.poolIntertiendas ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolIntertiendas = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

`SUM(cantidad)` sobre `INTEGER` devuelve `BIGINT`; el parser lo pasa a número. Como todo es entero, no hace falta parser para `NUMERIC`.

---

## 11. Contratos de API

### 11.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "PRODUCTO_NO_ENCONTRADO", "mensaje": "El producto no existe.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 11.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `PRODUCTO_DUPLICADO` | 409 | Ya existe un producto con ese código. |
| `PRODUCTO_NO_ENCONTRADO` | 404 | El producto no existe. |
| `CANTIDAD_INSUFICIENTE` | 409 | No hay suficiente stock para esa operación. |
| `ROMPE_SEGURIDAD` | 409 | La transferencia dejaría la sucursal origen por debajo del stock de seguridad. |
| `ORDEN_NO_ENCONTRADA` | 404 | La orden de proveedor no existe. |
| `TIENE_DEPENDENCIAS` | 409 | No se puede eliminar: tiene transacciones asociadas. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 11.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/tiendas/sesion` | | `{ email }` |
| `GET /api/tiendas/productos?categoria=&soloCriticos=` | | `FilaInventario[]` |
| `POST /api/tiendas/productos` | `{ codigo, nombre, categoria, precio, stockMinimo? }` | `{ id, codigo }` (201) |
| `GET /api/tiendas/productos/[codigo]` | | `DetalleProducto` |
| `POST /api/tiendas/productos/[codigo]/entrada` | `{ sucursal, cantidad }` | `{ stock }` (201) |
| `POST /api/tiendas/solicitud` | `{ codigo, solicitante, cantidad }` | `ResultadoSolicitud` |
| `GET /api/tiendas/transacciones?productoCodigo=&tipo=&sucursal=&desde=&hasta=` | | `Transaccion[]` |
| `GET /api/tiendas/informe?desde=&hasta=` | | `Informe` (opcional, F6) |
| `POST /api/tiendas/transferencia` | `{ codigo, origen, destino, cantidad }` | `...` (opcional, F7) |
| `GET /api/tiendas/ordenes?estado=` | | `OrdenProveedor[]` (opcional, F8) |
| `POST /api/tiendas/ordenes/[id]/recibir` | | `...` (opcional, F8) |

La solicitud (`POST /api/tiendas/solicitud`) es el endpoint central: devuelve la decisión (venta local, transferencia con su costo, u orden al proveedor con su motivo) y el nuevo stock.

### 11.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaProducto` | codigo (1 a 40), nombre (1 a 160), categoria (1 a 80), precio entero ≥ 1, stockMinimo entero ≥ 0 opcional |
| `esquemaEntrada` | sucursal enum A/B/C, cantidad entero ≥ 1 |
| `esquemaSolicitud` | codigo, solicitante enum A/B/C, cantidad entero ≥ 1 |
| `esquemaTransferencia` | codigo, origen y destino enum A/B/C (distintos), cantidad entero ≥ 1 |
| `esquemaFiltros` | según cada listado |

---

## 12. Pantallas

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/tiendas`. |
| Layout `/tiendas` | Verifica la sesión; sin sesión redirige al login. Barra con "Inter-Tiendas", navegación (Inventario, Solicitud, Historial; Informe y Órdenes cuando estén activos), y cerrar sesión. |
| `/tiendas` · Inventario de la red | `MatrizInventario`: una fila por producto con sus columnas de stock A, B, C, el total y `InsigniaCritico` cuando el total ≤ 10. Filtro por categoría y "solo críticos". Botón "Nuevo producto". `EstadoVacio` si no hay. |
| `/tiendas/productos/nuevo` · Nuevo producto | `FormularioProducto`: código, nombre, categoría, precio, stock mínimo. Nace con existencias en 0 en A, B y C. Código duplicado muestra el mensaje. |
| `/tiendas/productos/[codigo]` · Producto | Datos del producto, su stock por sucursal y `FormularioEntrada` para ingresar stock a una sucursal (entrada). Historial de ese producto. |
| `/tiendas/solicitud` · Procesar solicitud | `FormularioSolicitud`: producto (selector o código), sucursal solicitante (A/B/C), cantidad. Al enviar, `ResultadoSolicitud` muestra con claridad qué pasó: "Venta local en [sucursal]", o "Transferencia desde [origen] · costo $[total]", o "Producto por reponer: orden de 50 unidades al proveedor para [sucursal]" con el motivo. Si el producto quedó crítico, lo indica. |
| `/tiendas/historial` · Historial | `TablaTransacciones`: fecha, tipo, producto, origen, destino, cantidad, costo logístico, motivo; filtros por producto, tipo, sucursal y rango de fechas. |
| `/tiendas/informe` · Informe (opcional) | Resumen del periodo: ventas, transferencias (y su costo total), órdenes al proveedor, productos en estado crítico. |
| `/tiendas/ordenes` · Órdenes (opcional) | Órdenes de proveedor pendientes; acción de recibir (ingresa el lote al stock). |

### 12.1 Textos fijos

Resultado de solicitud, según la decisión:

> Venta realizada en la sucursal {sucursal}.

> Transferencia autorizada desde la sucursal {origen} a la {solicitante}. Costo de envío: {costo}.

> Producto por reponer en la red. Se generó una orden de 50 unidades al proveedor para la sucursal {solicitante}.

Aviso de crítico:

> El producto {nombre} quedó en estado crítico (total en la red: {total} unidades).

---

## 13. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#C2457E` | Rosa cosmético: botones principales, barra superior |
| `--color-primario-suave` | `#F7E6EF` | Fondos de selección, hover |
| `--color-local` | `#2F7D4F` | Venta local |
| `--color-transferencia` | `#245A8D` | Transferencia |
| `--color-proveedor` | `#B7791F` | Orden al proveedor |
| `--color-critico` | `#B83232` | Estado crítico, errores |
| `--color-fondo` | `#FAF6F8` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#E6DAE1` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

Criterios: la matriz de inventario con las tres columnas de sucursal bien legibles y el total destacado; el resultado de una solicitud con color según el tipo (local, transferencia, proveedor) y siempre con texto; montos con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`; el estado crítico con color y texto, nunca solo color; bordes redondeados de 8 px; sin emojis; tablas en tarjetas apiladas bajo 640 px.

---

## 14. Dinero, fechas y zona horaria

| Regla | Implementación |
|---|---|
| Precios y costos | Pesos enteros (`INTEGER`); sin centavos |
| Presentación | `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })` |
| Cantidades | Enteros |
| "Hoy" (informe) | Con `hoyBogota()` |
| Fecha/hora de las transacciones | `TIMESTAMPTZ`; se muestra en zona `America/Bogota` |
| Lectura desde BD | Parsers de `pg` devuelven texto para marcas de tiempo (sección 10.7) |

El algoritmo de la solicitud no depende de fechas; la zona solo afecta la presentación de las horas y el periodo del informe.

---

## 15. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Acceso solo con sesión | Login como puerta y `exigirSesion()` en cada ruta de `/api/tiendas` |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Solicitud atómica y sin stock negativo | La solicitud se resuelve en una transacción con las existencias del producto bloqueadas (`FOR UPDATE`); `cantidad >= 0` en la base impide stock negativo (RN-10, RN-12) |
| Decisión reproducible | El algoritmo es una función pura, probada, y la base guarda la decisión tomada (tipo, costo, motivo) en la transacción |
| Datos inmutables | Las transacciones no se editan ni se borran; un producto se desactiva, no se elimina |
| Validación en tres puntos | Formulario (Zod y reglas), API (Zod y reglas) y base (CHECK, UNIQUE, llaves foráneas) |
| SQL parametrizado | Ningún valor se concatena |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 16. Pruebas

### 16.1 Pruebas unitarias de reglas (Vitest)

El algoritmo de la solicitud es el centro; se prueba a fondo. Seguridad 5, lote 50, reorden 10, costos de la sección 5.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `costoRuta` | A, B | 2000 |
| T-02 | `costoRuta` | B, A | 2000 (simétrico) |
| T-03 | `costoRuta` | B, C | 1500 |
| T-04 | `costoRuta` | A, C | 3500 |
| T-05 | `costoTotal` | B, A, 3 | 6000 |
| T-06 | `cumpleSeguridad` | stock 20, cantidad 3 | `true` (queda 17) |
| T-07 | `cumpleSeguridad` | stock 8, cantidad 3 | `true` (queda 5, igualdad) |
| T-08 | `cumpleSeguridad` | stock 7, cantidad 3 | `false` (quedaría 4) |
| T-09 | `validarSolicitud` | 0 | `DATOS_INVALIDOS` |
| T-10 | `validarSolicitud` | -2 | `DATOS_INVALIDOS` |
| T-11 | `validarSolicitud` | 2.5 | `DATOS_INVALIDOS` |
| T-12 | `decidirSolicitud` | {A:10,B:3,C:3}, A, 4 | venta_local |
| T-13 | `decidirSolicitud` | {A:2,B:20,C:6}, A, 3 | transferencia desde B (C rompe seguridad); costo 6000 |
| T-14 | `decidirSolicitud` | {A:1,B:20,C:20}, A, 3 | transferencia desde B (2000 < 3500); costo 6000 |
| T-15 | `decidirSolicitud` | {A:20,B:20,C:1}, C, 3 | transferencia desde B (1500 < 3500); costo 4500 |
| T-16 | `decidirSolicitud` | {A:20,B:1,C:20}, B, 3 | transferencia desde A o C: A=2000, C=1500 → C (1500); costo 4500 |
| T-17 | `decidirSolicitud` | {A:1,B:6,C:6}, A, 3 | orden_proveedor, motivo sin_candidata_viable (red 13, pero B y C quedarían en 3) |
| T-18 | `decidirSolicitud` | {A:1,B:0,C:0}, A, 5 | orden_proveedor, motivo agotamiento_total (red 1) |
| T-19 | `decidirSolicitud` | {A:0,B:0,C:0}, A, 1 | orden_proveedor, agotamiento_total |
| T-20 | `elegirOrigen` desempate | dos candidatas con el mismo costo hacia la solicitante (forzado en la prueba con costos iguales) | elige la primera en orden A, B, C (determinista). Nota: con la matriz real del plan las dos rutas a un mismo destino nunca cuestan igual, así que este caso no ocurre en producción; la prueba cubre el desempate de forma defensiva por si se cambian los costos en config |
| T-21 | `esCritico` | 10 | `true` (≤ 10) |
| T-22 | `esCritico` | 11 | `false` |
| T-23 | `esCritico` | 0 | `true` |
| T-24 | `validarProducto` | precio 0 | `DATOS_INVALIDOS` |
| T-25 | `validarProducto` | código " " | `DATOS_INVALIDOS` |
| T-26 | `validarProducto` | datos válidos | sin error |

Para T-20, construir un escenario de empate (por ejemplo, una solicitante y dos candidatas cuyas rutas cuesten lo mismo) y comprobar que el desempate es estable por el orden A, B, C.

Comando: `npm test`. Las 26 pruebas deben pasar antes de continuar con la fase 3.

### 16.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con códigos `IT-TEST-*`. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear producto IT-TEST-1 "Labial Prueba" (precio 20000, mínimo 5) | Creado, con existencias 0 en A, B, C |
| 2 | Crear IT-TEST-1 otra vez | `PRODUCTO_DUPLICADO` |
| 3 | Entrada de 10 a la sucursal A, 20 a B, 20 a C | Stock A=10, B=20, C=20 |
| 4 | Solicitud: A pide 4 | Venta local; A queda 6 |
| 5 | Solicitud: A pide 8 (A tiene 6) | Transferencia desde B (2000 < 3500); B y A actualizados; costo 16000 |
| 6 | Dejar A=1, B=6, C=6 (ajustar) y solicitar A pide 3 | orden_proveedor, sin_candidata_viable |
| 7 | Dejar todo bajo (A=1,B=0,C=0) y solicitar A pide 5 | orden_proveedor, agotamiento_total |
| 8 | Solicitud con cantidad 0 | `DATOS_INVALIDOS` |
| 9 | Tras dejar el total de la red ≤ 10, consultar el inventario | El producto aparece como crítico |
| 10 | Listar transacciones del producto | Venta local, transferencia (con costo) y órdenes, en orden |
| 11 | Verificar que ninguna existencia quedó negativa | Todas ≥ 0 |

### 16.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Abrir `/tiendas` sin sesión | Redirección al login |
| A-02 | Crear "Labial Matte Red" (precio $20.000) | Aparece en la matriz con 0 en A, B y C |
| A-03 | Intentar otro producto con el mismo código | Rechazo por duplicado |
| A-04 | Ingresar stock: 10 a A, 20 a B, 20 a C | La matriz muestra 10 / 20 / 20, total 50 |
| A-05 | Solicitud: A pide 4 | Venta local; A queda en 6 |
| A-06 | Solicitud: A pide 8 | Transferencia desde B (menor costo); muestra el costo del envío |
| A-07 | Preparar un caso con stock en la red pero sin candidata viable y solicitar | Orden al proveedor por 50, motivo "sin candidata viable" |
| A-08 | Preparar agotamiento total y solicitar | Orden al proveedor por 50, motivo "agotamiento total" |
| A-09 | Solicitud con cantidad 0 | Rechazo con mensaje |
| A-10 | Elegir el origen entre dos candidatas de distinto costo | Elige siempre la de menor costo hacia la solicitante |
| A-11 | Dejar el total de un producto en ≤ 10 y ver la matriz | El producto se marca como crítico |
| A-12 | Ver el historial | Lista las ventas, transferencias (con costo) y órdenes |
| A-13 | Cerrar el navegador y volver a entrar | Los datos persisten |
| A-14 | (Opcional) Ver el informe del día | Resumen de ventas, transferencias y órdenes |

A-14 corresponde a las opcionales; se verifica tras P09.

---

## 17. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Conciliación | P00 | `ESTADO_ACTUAL.md`, `DICTAMEN.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; estado de compilación | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas` (algoritmo incluido), 26 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, respuestas, esquemas, formato; sesión protegida | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, matriz de inventario, productos y entradas, solicitud y resultado, historial | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P08) | `ACEPTACION.md` con A-01 a A-13; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09 | Informe diario, transferencia manual, recepción de órdenes | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 18. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F6 · Informe diario | `obtenerInforme(desde, hasta)`: cuenta ventas, transferencias (y su costo total), órdenes al proveedor y productos en estado crítico del periodo. Ruta y pantalla `/tiendas/informe` |
| P09 | F7 · Transferencia manual | `transferenciaManual({ codigo, origen, destino, cantidad })`: mueve stock entre dos sucursales respetando el stock de seguridad del origen (`ROMPE_SEGURIDAD` si no); registra la transacción con su costo. Ruta `/api/tiendas/transferencia` |
| P09 | F8 · Recepción de órdenes | `listarOrdenes({ estado })` y `recibirOrden(id)`: una orden pendiente, al recibirse, suma su lote (50) al stock de la sucursal y se marca recibida. Ruta y pantalla `/tiendas/ordenes` |

---

## 19. Glosario

| Término | Definición |
|---|---|
| Sucursal | Una de las tres tiendas: A, B o C |
| Existencia | El stock de un producto en una sucursal (una celda de la matriz) |
| Matriz de inventario | El stock de cada producto en cada sucursal (productos × sucursales) |
| Solicitud | Un pedido de compra de un producto en una sucursal, por una cantidad |
| Venta local | La solicitud se cubre con el stock de la propia sucursal |
| Transferencia | Mover unidades de otra sucursal a la solicitante para cubrir la solicitud |
| Stock de seguridad | Mínimo que una sucursal debe conservar tras transferir (5 unidades) |
| Costo logístico | Lo que cuesta transferir una unidad entre dos sucursales |
| Orden al proveedor | Pedido automático de 50 unidades cuando la red no puede cubrir la solicitud |
| Punto de reorden global | Umbral (10) bajo el cual el stock total de un producto se marca crítico |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
