CREATE TABLE IF NOT EXISTS productos (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        VARCHAR(40)   NOT NULL,
  nombre        VARCHAR(160)  NOT NULL,
  categoria     VARCHAR(80)   NOT NULL,
  precio        INTEGER       NOT NULL,
  stock_minimo  INTEGER       NOT NULL DEFAULT 5,
  activo        BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico  UNIQUE (codigo),
  CONSTRAINT productos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT productos_precio_positivo CHECK (precio > 0),
  CONSTRAINT productos_minimo_no_neg CHECK (stock_minimo >= 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS existencias (
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  sucursal     CHAR(1)       NOT NULL,
  cantidad     INTEGER       NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT existencias_sucursal_valida CHECK (sucursal IN ('A', 'B', 'C')),
  CONSTRAINT existencias_cantidad_no_neg CHECK (cantidad >= 0),
  CONSTRAINT existencias_unica UNIQUE (producto_id, sucursal)
);
CREATE INDEX IF NOT EXISTS idx_existencias_producto ON existencias (producto_id);

CREATE TABLE IF NOT EXISTS transacciones (
  id             BIGSERIAL     PRIMARY KEY,
  producto_id    UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo           VARCHAR(24)   NOT NULL,
  sucursal_origen   CHAR(1),
  sucursal_destino  CHAR(1),
  cantidad       INTEGER       NOT NULL,
  costo_logistico INTEGER      NOT NULL DEFAULT 0,
  motivo         VARCHAR(40),
  fecha          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT trans_tipo_valido CHECK (tipo IN ('venta_local', 'transferencia', 'orden_proveedor', 'entrada')),
  CONSTRAINT trans_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT trans_costo_no_neg CHECK (costo_logistico >= 0),
  CONSTRAINT trans_sucursales_validas CHECK (
    (sucursal_origen  IS NULL OR sucursal_origen  IN ('A','B','C')) AND
    (sucursal_destino IS NULL OR sucursal_destino IN ('A','B','C')))
);
CREATE INDEX IF NOT EXISTS idx_trans_producto ON transacciones (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_trans_tipo     ON transacciones (tipo, fecha);

CREATE TABLE IF NOT EXISTS ordenes_proveedor (
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  sucursal     CHAR(1)       NOT NULL,
  cantidad     INTEGER       NOT NULL DEFAULT 50,
  motivo       VARCHAR(40)   NOT NULL,
  estado       VARCHAR(10)   NOT NULL DEFAULT 'pendiente',
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
