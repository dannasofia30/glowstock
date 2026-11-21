# Inter-Tiendas (Glowstock)

Aplicación web para la gestión y optimización de inventario entre tres sucursales fijas (A, B y C) de una cadena de cosméticos y belleza. El sistema permite registrar productos y existencias por sucursal, procesar solicitudes de compra con decisión automática, consultar el historial de operaciones y visualizar el estado crítico del inventario de la red.

Plan técnico rector: [doc/PLAN_INTERTIENDAS.md](doc/PLAN_INTERTIENDAS.md)

## Funcionalidades

- **Inventario de la red:** matriz por producto con existencias en sucursales A, B y C, stock total, filtros por categoría y estado crítico (total ≤ 10).
- **Productos y existencias:** registro de productos (código único, precio entero en pesos) y entrada de stock por sucursal.
- **Solicitud de compra:** procesamiento de solicitudes con resultado claro (venta local, transferencia u orden al proveedor), costo logístico cuando aplica, motivo de orden y aviso de producto crítico.
- **Historial de transacciones:** consulta de ventas locales, transferencias, órdenes al proveedor y entradas, con filtros por producto, tipo, sucursal y rango de fechas.
- **Acceso protegido:** las rutas y API del módulo Inter-Tiendas requieren sesión iniciada.

## Requisitos

- Node.js y npm
- Acceso a una base de datos PostgreSQL de Supabase (o compatible)
- Variables de entorno configuradas en `.env.local`

## Cómo correr en local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear/ajustar `.env.local` con los **nombres** de variables requeridos por el proyecto (sin incluir valores en el repositorio). Variables relevantes:
   - `GLOWSTOCK_POSTGRES_URL`: cadena de conexión PostgreSQL usada por la aplicación (`lib/db/conexion.ts`, pooler).
   - `GLOWSTOCK_POSTGRES_URL_NON_POOLING`: cadena de conexión directa usada por scripts/migraciones locales cuando aplica.
   - `NEXT_PUBLIC_SUPABASE_URL` o `GLOWSTOCK_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `GLOWSTOCK_SUPABASE_PUBLISHABLE_KEY`: clave pública/publicable de Supabase para autenticación.
   - Otras variables ya presentes en el entorno del proyecto según los módulos habilitados.

3. Aplicar migraciones:

   ```bash
   npm run db:migrar
   ```

4. (Opcional) Cargar datos demo:

   ```bash
   npm run db:demo
   ```

5. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev`: inicia el entorno de desarrollo.
- `npm run build`: genera la compilación de producción.
- `npm run start`: inicia la aplicación compilada.
- `npm run lint`: ejecuta ESLint.
- `npm run format`: formatea archivos con Prettier.
- `npm run type-check`: verifica tipos con TypeScript.
- `npm run db:migrar`: aplica migraciones de base de datos.
- `npm run db:verificar`: verifica el estado/objetos de la base de datos.
- `npm run db:limpiar -- --prueba`: limpia datos de prueba (`IT-TEST-*`) conservando datos demo.
- `npm run db:demo`: carga datos de demostración.
- `npm run probar:flujo`: ejecuta la prueba de flujo del dominio contra la base de datos.
- `npm test`: ejecuta la suite de pruebas con Vitest.
- `npm run test:watch`: ejecuta Vitest en modo observación.
- `npm run test:coverage`: ejecuta pruebas con cobertura.

## Algoritmo de solicitud y reglas del dominio

Al procesar una solicitud de compra, el sistema decide:

1. **Venta local:** si la sucursal solicitante tiene stock suficiente, la venta se atiende localmente.
2. **Transferencia por menor costo:** si no hay stock local suficiente, se transfiere desde la sucursal candidata de **menor costo logístico** hacia la solicitante, siempre que conserve al menos el **stock de seguridad (5 unidades)** después de transferir. Costos por unidad: A↔B $2.000, B↔C $1.500, A↔C $3.500.
3. **Orden al proveedor:** si ninguna sucursal puede transferir sin romper el stock de seguridad o la red no tiene suficiente stock total, se genera una orden al proveedor por un **lote de 50 unidades** para la sucursal solicitante (con motivo: sin candidata viable o agotamiento total).

**Punto de reorden global:** si el stock total de un producto en la red es **≤ 10 unidades**, el producto se marca como **crítico**.

La solicitud se resuelve de forma atómica con las existencias del producto bloqueadas para evitar inconsistencias de stock.
