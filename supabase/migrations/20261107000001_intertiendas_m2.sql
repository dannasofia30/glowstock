CREATE OR REPLACE VIEW v_inventario
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.codigo,
  p.nombre,
  p.categoria,
  p.precio,
  p.stock_minimo,
  p.activo,
  p.created_at,
  p.updated_at,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'A'), 0) AS stock_a,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'B'), 0) AS stock_b,
  COALESCE(MAX(e.cantidad) FILTER (WHERE e.sucursal = 'C'), 0) AS stock_c,
  COALESCE(SUM(e.cantidad), 0) AS stock_total,
  (COALESCE(SUM(e.cantidad), 0) <= 10) AS critico
FROM productos p
LEFT JOIN existencias e ON e.producto_id = p.id
GROUP BY p.id, p.codigo, p.nombre, p.categoria, p.precio, p.stock_minimo, p.activo, p.created_at, p.updated_at;

ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE existencias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_proveedor ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, existencias, transacciones, ordenes_proveedor FROM anon, authenticated;
REVOKE ALL ON v_inventario FROM anon, authenticated;
