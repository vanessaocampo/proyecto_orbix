import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando carga de datos con UUID...')

  // --- Categorías ---
  const catNames = ['Abarrotes', 'Aseo', 'Bebidas', 'Papelería']
  const categorias = []
  for (const name of catNames) {
    const c = await prisma.categoria.upsert({
      where: { nombre: name },
      update: {},
      create: { nombre: name, descripcion: `Categoría ${name}` }
    })
    categorias.push(c)
  }
  console.log(`✅ Categorías: ${categorias.length}`)

  // --- Proveedores ---
  const provData = [
    { nombre: 'Distribuidora La Central', nit: '900123456-1', telefono: '3001234567', correo: 'contacto@lacentral.com', direccion: 'Cra 45 #30-20', ciudad: 'Medellín' },
    { nombre: 'Suministros del Valle', nit: '900654321-2', telefono: '3109876543', correo: 'ventas@svalle.com', direccion: 'Cll 10 #5-15', ciudad: 'Cali' },
    { nombre: 'Papelería Andina', nit: '900789456-3', telefono: '3204567890', correo: 'info@papeleriaandina.com', direccion: 'Av 80 #12-45', ciudad: 'Bogotá' }
  ]
  const proveedores = []
  for (const p of provData) {
    const pr = await prisma.proveedor.upsert({ where: { nit: p.nit }, update: {}, create: p })
    proveedores.push(pr)
  }
  console.log(`✅ Proveedores: ${proveedores.length}`)

  // --- Usuarios ---
  const usuariosData = [
    { nombre: 'Vanessa Ocampo', correo: 'vanessa@orbix.com', password: 'admin123', rol: 'admin' as const },
    { nombre: 'Andrés Portillo', correo: 'andres@orbix.com', password: 'dev123', rol: 'inventario' as const },
    { nombre: 'Juan David Noriega', correo: 'juan@orbix.com', password: 'venta123', rol: 'vendedor' as const },
  ]
  const usuarios = []
  for (const u of usuariosData) {
    const passwordHash = await bcrypt.hash(u.password, 10)
    const usuario = await prisma.usuario.upsert({
      where: { correo: u.correo },
      update: {},
      create: { nombre: u.nombre, correo: u.correo, passwordHash, rol: u.rol }
    })
    usuarios.push(usuario)
  }
  console.log(`✅ Usuarios: ${usuarios.length}`)

  // --- Clientes ---
  const cliData = [
    { nombre: 'Tienda El Ahorro', documento: '10123456', telefono: '3015557788', correo: 'elahorro@mail.com', direccion: 'Cra 20 #15-30', segmento: 'mayorista' as const },
    { nombre: 'María Fernanda Gómez', documento: '43567890', telefono: '3126667788', correo: 'mfgomez@mail.com', direccion: 'Cll 8 #9-12', segmento: 'minorista' as const },
    { nombre: 'Comercial Los Andes', documento: '9001112223', telefono: '3187778899', correo: 'compras@losandes.com', direccion: 'Av 30 #40-10', segmento: 'frecuente' as const }
  ]
  const clientes = []
  for (const c of cliData) {
    const cli = await prisma.cliente.upsert({ where: { documento: c.documento }, update: {}, create: c })
    clientes.push(cli)
  }
  console.log(`✅ Clientes: ${clientes.length}`)

  // --- Productos ---
  const prodData = [
    { sku: 'PRD-1', nombre: 'Arroz 500g', descripcion: 'Arroz blanco premium', precioCompra: 1800, precio: 2500, stock: 100, stockMinimo: 20, idCategoria: categorias[0].idCategoria, idProveedor: proveedores[0].idProveedor },
    { sku: 'PRD-2', nombre: 'Detergente 1kg', descripcion: 'Detergente en polvo', precioCompra: 6000, precio: 8500, stock: 50, stockMinimo: 10, idCategoria: categorias[1].idCategoria, idProveedor: proveedores[1].idProveedor },
    { sku: 'PRD-3', nombre: 'Gaseosa 1.5L', descripcion: 'Bebida gaseosa sabor cola', precioCompra: 2200, precio: 3200, stock: 80, stockMinimo: 15, idCategoria: categorias[2].idCategoria, idProveedor: proveedores[0].idProveedor },
    { sku: 'PRD-4', nombre: 'Cuaderno 100 hojas', descripcion: 'Cuaderno cuadriculado', precioCompra: 2500, precio: 4000, stock: 40, stockMinimo: 10, idCategoria: categorias[3].idCategoria, idProveedor: proveedores[2].idProveedor }
  ]
  const productos = []
  for (const p of prodData) {
    const prd = await prisma.producto.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    })
    productos.push(prd)
  }
  console.log(`✅ Productos: ${productos.length}`)

  // --- Ventas ---
  const ventasExistentes = await prisma.venta.count()
  if (ventasExistentes === 0) {
    await prisma.$transaction(async (tx) => {
      const v1 = await tx.venta.create({
        data: {
          estado: 'completada', total: 41000, idCliente: clientes[0].idCliente, idUsuario: usuarios[2].idUsuario,
          detalles: { create: [
            { idProducto: productos[0].idProducto, cantidad: 10, precioUnitario: 2500, subtotal: 25000 },
            { idProducto: productos[2].idProducto, cantidad: 5, precioUnitario: 3200, subtotal: 16000 }
          ]}
        }
      })
      const v2 = await tx.venta.create({
        data: {
          estado: 'pendiente', total: 25500, idCliente: clientes[1].idCliente, idUsuario: usuarios[2].idUsuario,
          detalles: { create: [
            { idProducto: productos[1].idProducto, cantidad: 3, precioUnitario: 8500, subtotal: 25500 }
          ]}
        }
      })

      // Decrementar stock
      await tx.producto.update({ where: { idProducto: productos[0].idProducto }, data: { stock: { decrement: 10 } } })
      await tx.producto.update({ where: { idProducto: productos[2].idProducto }, data: { stock: { decrement: 5 } } })
      await tx.producto.update({ where: { idProducto: productos[1].idProducto }, data: { stock: { decrement: 3 } } })

      // Movimientos
      await tx.inventarioMovimiento.createMany({
        data: [
          { idProducto: productos[0].idProducto, tipo: 'salida', cantidad: 10, stockResultante: 90, referencia: 'venta #'+v1.idVenta, idUsuario: usuarios[2].idUsuario },
          { idProducto: productos[2].idProducto, tipo: 'salida', cantidad: 5, stockResultante: 75, referencia: 'venta #'+v1.idVenta, idUsuario: usuarios[2].idUsuario },
          { idProducto: productos[1].idProducto, tipo: 'salida', cantidad: 3, stockResultante: 47, referencia: 'venta #'+v2.idVenta, idUsuario: usuarios[2].idUsuario },
        ]
      })
    })
    console.log('✅ Ventas de ejemplo creadas')
  }

  // --- Reportes ---
  const repCount = await prisma.reporte.count()
  if (repCount === 0) {
    await prisma.reporte.createMany({
      data: [
        { nombre: 'Reporte general de ventas', tipo: 'general', parametros: { periodo: '2026-07' }, idUsuario: usuarios[0].idUsuario },
        { nombre: 'Reporte de inventario', tipo: 'inventario', parametros: { stockMinimo: true }, idUsuario: usuarios[1].idUsuario },
      ]
    })
    console.log('✅ Reportes de ejemplo creadas')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
