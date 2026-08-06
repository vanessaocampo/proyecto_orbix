-- =========================================================
-- ORBIX - Esquema de Base de Datos (PostgreSQL / Neon)
-- SENA - ADSO - Ficha 3114227
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE estado_general AS ENUM ('activo', 'inactivo');
CREATE TYPE estado_producto AS ENUM ('activo', 'inactivo', 'agotado', 'descontinuado');
CREATE TYPE estado_venta AS ENUM ('pendiente', 'completada', 'cancelada', 'devuelta');
CREATE TYPE rol_usuario AS ENUM ('admin', 'vendedor', 'inventario', 'consulta');
CREATE TYPE segmento_cliente AS ENUM ('minorista', 'mayorista', 'frecuente', 'nuevo');
CREATE TYPE tipo_movimiento_inv AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');
CREATE TYPE tipo_reporte AS ENUM ('general', 'periodo', 'equipo', 'proveedor', 'inventario');

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE categorias (
    id_categoria    SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categorias_updated
BEFORE UPDATE ON categorias
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE proveedores (
    id_proveedor    SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    nit             VARCHAR(20) NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    correo          VARCHAR(120),
    direccion       VARCHAR(200),
    ciudad          VARCHAR(100),
    estado          estado_general NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_proveedores_updated
BEFORE UPDATE ON proveedores
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    correo          VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    rol             rol_usuario NOT NULL DEFAULT 'vendedor',
    estado          estado_general NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_usuarios_updated
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE clientes (
    id_cliente      SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    documento       VARCHAR(20) NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    correo          VARCHAR(120),
    direccion       VARCHAR(200),
    segmento        segmento_cliente NOT NULL DEFAULT 'nuevo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_clientes_updated
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE productos (
    id_producto     SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    precio_compra   DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
    precio          DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo    INT NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    estado          estado_producto NOT NULL DEFAULT 'activo',
    id_categoria    INT NOT NULL REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    id_proveedor    INT REFERENCES proveedores(id_proveedor) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_proveedor ON productos(id_proveedor);
CREATE INDEX idx_productos_estado ON productos(estado);

CREATE TRIGGER trg_productos_updated
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE ventas (
    id_venta        SERIAL PRIMARY KEY,
    fecha           TIMESTAMPTZ NOT NULL DEFAULT now(),
    estado          estado_venta NOT NULL DEFAULT 'pendiente',
    total           DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    id_cliente      INT NOT NULL REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    id_usuario      INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX idx_ventas_usuario ON ventas(id_usuario);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_estado ON ventas(estado);

CREATE TRIGGER trg_ventas_updated
BEFORE UPDATE ON ventas
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE detalle_venta (
    id_detalle      SERIAL PRIMARY KEY,
    id_venta        INT NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
    id_producto     INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_detalle_venta_venta ON detalle_venta(id_venta);
CREATE INDEX idx_detalle_venta_producto ON detalle_venta(id_producto);

CREATE OR REPLACE FUNCTION fn_calcular_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.cantidad * NEW.precio_unitario;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_subtotal
BEFORE INSERT OR UPDATE ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_calcular_subtotal();

CREATE OR REPLACE FUNCTION fn_actualizar_total_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_id_venta INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_id_venta := OLD.id_venta;
    ELSE
        v_id_venta := NEW.id_venta;
    END IF;

    UPDATE ventas
    SET total = COALESCE((
        SELECT SUM(subtotal) FROM detalle_venta WHERE id_venta = v_id_venta
    ), 0)
    WHERE id_venta = v_id_venta;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detalle_total_venta
AFTER INSERT OR UPDATE OR DELETE ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_total_venta();

CREATE TABLE inventario_movimientos (
    id_movimiento    SERIAL PRIMARY KEY,
    id_producto      INT NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
    tipo             tipo_movimiento_inv NOT NULL,
    cantidad         INT NOT NULL CHECK (cantidad > 0),
    stock_resultante INT NOT NULL,
    referencia       VARCHAR(150),
    id_usuario       INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    fecha            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inv_mov_producto ON inventario_movimientos(id_producto);
CREATE INDEX idx_inv_mov_fecha ON inventario_movimientos(fecha);

CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
BEGIN
    SELECT stock INTO v_stock_actual FROM productos WHERE id_producto = NEW.id_producto FOR UPDATE;

    IF v_stock_actual < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto %: disponible %, solicitado %',
            NEW.id_producto, v_stock_actual, NEW.cantidad;
    END IF;

    UPDATE productos SET stock = stock - NEW.cantidad WHERE id_producto = NEW.id_producto;

    INSERT INTO inventario_movimientos (id_producto, tipo, cantidad, stock_resultante, referencia)
    VALUES (NEW.id_producto, 'salida', NEW.cantidad, v_stock_actual - NEW.cantidad,
            'venta #' || NEW.id_venta);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

CREATE TABLE reportes (
    id_reporte      SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    tipo            tipo_reporte NOT NULL,
    parametros      JSONB,
    fecha_generado  TIMESTAMPTZ NOT NULL DEFAULT now(),
    id_usuario      INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX idx_reportes_usuario ON reportes(id_usuario);
CREATE INDEX idx_reportes_tipo ON reportes(tipo);

CREATE VIEW vw_alertas_inventario AS
SELECT p.id_producto, p.nombre, p.stock, p.stock_minimo, c.nombre AS categoria
FROM productos p
JOIN categorias c ON c.id_categoria = p.id_categoria
WHERE p.stock <= p.stock_minimo
  AND p.estado = 'activo';

CREATE VIEW vw_ventas_por_categoria AS
SELECT c.nombre AS categoria, SUM(dv.subtotal) AS total_vendido
FROM detalle_venta dv
JOIN productos p ON p.id_producto = dv.id_producto
JOIN categorias c ON c.id_categoria = p.id_categoria
JOIN ventas v ON v.id_venta = dv.id_venta
WHERE v.estado = 'completada'
GROUP BY c.nombre;

CREATE VIEW vw_ultimas_ventas AS
SELECT v.id_venta, v.fecha, v.total, v.estado, cl.nombre AS cliente, u.nombre AS vendedor
FROM ventas v
JOIN clientes cl ON cl.id_cliente = v.id_cliente
JOIN usuarios u ON u.id_usuario = v.id_usuario
ORDER BY v.fecha DESC;

CREATE VIEW vw_productos_por_proveedor AS
SELECT pr.id_proveedor, pr.nombre AS proveedor, p.id_producto, p.nombre AS producto, p.stock
FROM productos p
JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
ORDER BY pr.nombre, p.nombre;
