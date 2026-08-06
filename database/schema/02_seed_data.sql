INSERT INTO categorias (nombre, descripcion) VALUES
('Abarrotes', 'Productos de consumo básico y despensa'),
('Aseo', 'Productos de limpieza e higiene'),
('Bebidas', 'Bebidas frías, calientes y gaseosas'),
('Papelería', 'Artículos de oficina y escolares');

INSERT INTO proveedores (nombre, nit, telefono, correo, direccion, ciudad, estado) VALUES
('Distribuidora La Central', '900123456-1', '3001234567', 'contacto@lacentral.com', 'Cra 45 #30-20', 'Medellín', 'activo'),
('Suministros del Valle', '900654321-2', '3109876543', 'ventas@svalle.com', 'Cll 10 #5-15', 'Cali', 'activo'),
('Papelería Andina', '900789456-3', '3204567890', 'info@papeleriaandina.com', 'Av 80 #12-45', 'Bogotá', 'activo');

INSERT INTO usuarios (nombre, correo, password_hash, rol, estado) VALUES
('Vanessa Ocampo', 'vanessa@orbix.com', crypt('admin123', gen_salt('bf')), 'admin', 'activo'),
('Andrés Portillo', 'andres@orbix.com', crypt('dev123', gen_salt('bf')), 'inventario', 'activo'),
('Juan David Noriega', 'juan@orbix.com', crypt('venta123', gen_salt('bf')), 'vendedor', 'activo');

INSERT INTO clientes (nombre, documento, telefono, correo, direccion, segmento) VALUES
('Tienda El Ahorro', '10123456', '3015557788', 'elahorro@mail.com', 'Cra 20 #15-30', 'mayorista'),
('María Fernanda Gómez', '43567890', '3126667788', 'mfgomez@mail.com', 'Cll 8 #9-12', 'minorista'),
('Comercial Los Andes', '9001112223', '3187778899', 'compras@losandes.com', 'Av 30 #40-10', 'frecuente');

INSERT INTO productos (nombre, descripcion, precio_compra, precio, stock, stock_minimo, estado, id_categoria, id_proveedor) VALUES
('Arroz 500g', 'Arroz blanco premium', 1800, 2500, 100, 20, 'activo', 1, 1),
('Detergente 1kg', 'Detergente en polvo', 6000, 8500, 50, 10, 'activo', 2, 2),
('Gaseosa 1.5L', 'Bebida gaseosa sabor cola', 2200, 3200, 80, 15, 'activo', 3, 1),
('Cuaderno 100 hojas', 'Cuaderno cuadriculado', 2500, 4000, 40, 10, 'activo', 4, 3);

INSERT INTO ventas (estado, id_cliente, id_usuario) VALUES
('completada', 1, 3),
('pendiente', 2, 3);

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 10, 2500),
(1, 3, 5, 3200),
(2, 2, 3, 8500);

INSERT INTO reportes (nombre, tipo, parametros, id_usuario) VALUES
('Reporte general de ventas', 'general', '{"periodo": "2026-07"}', 1),
('Reporte de inventario', 'inventario', '{"stock_minimo": true}', 2);

SELECT id_venta, total FROM ventas WHERE id_venta = 1;
SELECT id_producto, nombre, stock FROM productos WHERE nombre = 'Arroz 500g';
SELECT * FROM inventario_movimientos;
SELECT * FROM vw_alertas_inventario;
SELECT * FROM vw_ventas_por_categoria;
SELECT * FROM vw_ultimas_ventas;
SELECT * FROM vw_productos_por_proveedor;
