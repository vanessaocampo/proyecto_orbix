DROP VIEW IF EXISTS vw_productos_por_proveedor;
DROP VIEW IF EXISTS vw_ultimas_ventas;
DROP VIEW IF EXISTS vw_ventas_por_categoria;
DROP VIEW IF EXISTS vw_alertas_inventario;

DROP TABLE IF EXISTS reportes;
DROP TABLE IF EXISTS inventario_movimientos;
DROP TABLE IF EXISTS detalle_venta;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS categorias;

DROP FUNCTION IF EXISTS fn_descontar_stock();
DROP FUNCTION IF EXISTS fn_actualizar_total_venta();
DROP FUNCTION IF EXISTS fn_calcular_subtotal();
DROP FUNCTION IF EXISTS fn_set_updated_at();

DROP TYPE IF EXISTS tipo_reporte;
DROP TYPE IF EXISTS tipo_movimiento_inv;
DROP TYPE IF EXISTS segmento_cliente;
DROP TYPE IF EXISTS rol_usuario;
DROP TYPE IF EXISTS estado_venta;
DROP TYPE IF EXISTS estado_producto;
DROP TYPE IF EXISTS estado_general;
