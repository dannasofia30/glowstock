# Aceptación del módulo Inter-Tiendas

Criterio de terminado del MVP. La aceptación A-01 a A-13 se ejecuta en el despliegue de Vercel y se documenta en esta tabla.

## Tabla de aceptación (A-01 a A-13)

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Abrir `/tiendas` sin sesión | Redirección al login |  |  |  |
| A-02 | Crear "Labial Matte Red" (precio $20.000) | Aparece en la matriz con 0 en A, B y C |  |  |  |
| A-03 | Intentar otro producto con el mismo código | Rechazo por duplicado |  |  |  |
| A-04 | Ingresar stock: 10 a A, 20 a B, 20 a C | La matriz muestra 10 / 20 / 20, total 50 |  |  |  |
| A-05 | Solicitud: A pide 4 | Venta local; A queda en 6 |  |  |  |
| A-06 | Solicitud: A pide 8 | Transferencia desde B (menor costo); muestra el costo del envío |  |  |  |
| A-07 | Preparar un caso con stock en la red pero sin candidata viable y solicitar | Orden al proveedor por 50, motivo "sin candidata viable" |  |  |  |
| A-08 | Preparar agotamiento total y solicitar | Orden al proveedor por 50, motivo "agotamiento total" |  |  |  |
| A-09 | Solicitud con cantidad 0 | Rechazo con mensaje |  |  |  |
| A-10 | Elegir el origen entre dos candidatas de distinto costo | Elige siempre la de menor costo hacia la solicitante |  |  |  |
| A-11 | Dejar el total de un producto en ≤ 10 y ver la matriz | El producto se marca como crítico |  |  |  |
| A-12 | Ver el historial | Lista las ventas, transferencias (con costo) y órdenes |  |  |  |
| A-13 | Cerrar el navegador y volver a entrar | Los datos persisten |  |  |  |
| A-14 | (Opcional) Ver el informe del periodo, hacer transferencia manual y recibir una orden pendiente | Informe muestra ventas locales, transferencias con costo total, órdenes y productos críticos; transferencia manual respeta stock de seguridad; al recibir una orden pendiente sube el stock de la sucursal |  |  |  |
