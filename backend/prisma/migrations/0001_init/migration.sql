-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoGeneral" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('activo', 'inactivo', 'agotado', 'descontinuado');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('pendiente', 'completada', 'cancelada', 'devuelta');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('admin', 'vendedor', 'inventario', 'consulta');

-- CreateEnum
CREATE TYPE "SegmentoCliente" AS ENUM ('minorista', 'mayorista', 'frecuente', 'nuevo');

-- CreateEnum
CREATE TYPE "TipoMovimientoInv" AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');

-- CreateEnum
CREATE TYPE "TipoReporte" AS ENUM ('general', 'periodo', 'equipo', 'proveedor', 'inventario');

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id_proveedor" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "nit" VARCHAR(20) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(120),
    "direccion" VARCHAR(200),
    "ciudad" VARCHAR(100),
    "estado" "EstadoGeneral" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'vendedor',
    "estado" "EstadoGeneral" NOT NULL DEFAULT 'activo',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "documento" VARCHAR(20) NOT NULL,
    "telefono" VARCHAR(20),
    "correo" VARCHAR(120),
    "direccion" VARCHAR(200),
    "segmento" "SegmentoCliente" NOT NULL DEFAULT 'nuevo',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "precio_compra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoProducto" NOT NULL DEFAULT 'activo',
    "id_categoria" INTEGER NOT NULL,
    "id_proveedor" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id_venta" SERIAL NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'pendiente',
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id_detalle" SERIAL NOT NULL,
    "id_venta" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "inventario_movimientos" (
    "id_movimiento" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "tipo" "TipoMovimientoInv" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "stock_resultante" INTEGER NOT NULL,
    "referencia" VARCHAR(150),
    "id_usuario" INTEGER,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_movimientos_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id_reporte" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" "TipoReporte" NOT NULL,
    "parametros" JSONB,
    "fecha_generado" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nit_key" ON "proveedores"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE INDEX "productos_id_categoria_idx" ON "productos"("id_categoria");

-- CreateIndex
CREATE INDEX "productos_id_proveedor_idx" ON "productos"("id_proveedor");

-- CreateIndex
CREATE INDEX "productos_estado_idx" ON "productos"("estado");

-- CreateIndex
CREATE INDEX "ventas_id_cliente_idx" ON "ventas"("id_cliente");

-- CreateIndex
CREATE INDEX "ventas_id_usuario_idx" ON "ventas"("id_usuario");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_estado_idx" ON "ventas"("estado");

-- CreateIndex
CREATE INDEX "detalle_venta_id_venta_idx" ON "detalle_venta"("id_venta");

-- CreateIndex
CREATE INDEX "detalle_venta_id_producto_idx" ON "detalle_venta"("id_producto");

-- CreateIndex
CREATE INDEX "inventario_movimientos_id_producto_idx" ON "inventario_movimientos"("id_producto");

-- CreateIndex
CREATE INDEX "inventario_movimientos_fecha_idx" ON "inventario_movimientos"("fecha");

-- CreateIndex
CREATE INDEX "reportes_id_usuario_idx" ON "reportes"("id_usuario");

-- CreateIndex
CREATE INDEX "reportes_tipo_idx" ON "reportes"("tipo");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "ventas"("id_venta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

