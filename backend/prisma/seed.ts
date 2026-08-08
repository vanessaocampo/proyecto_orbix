import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // --- Categorías ---
  const categorias = await Promise.all(
    [
      { nombre: 'Abarrotes', descripcion: 'Productos de consumo básico y despensa' },
      { nombre: 'Aseo', descripcion: 'Productos de limpieza e higiene' },
      { nombre: 'Bebidas', descripcion: 'Bebidas frías, calientes y gaseosas' },
      { nombre: 'Papelería', descripcion: 'Artículos de oficina y escolares' },
    ].map((c) =>
      prisma.categoria.upsert({
        where: { nombre: c.nombre },
        update: {},
        create: c,
      }),
    ),
  )
  // eslint-disable-next-line no-console
  console.log(`✔ Categorías: ${categorias.length}`)

  // --- Proveedores ---
  const proveedores = await Promise.all(
    [
      {
        nombre: 'Distribuidora La Central',
        nit: '900123456-1',
        telefono: '3001234567',
        correo: 'contacto@lacentral.com',
        direccion: 'Cra 45 #30-20',
        ciudad: 'Medellín',
      },
      {
        nombre: 'Suministros del Valle',
        nit: '900654321-2',
        telefono: '3109876543',
        correo: 'ventas@svalle.com',
        direccion: 'Cll 10 #5-15',
        ciudad: 'Cali',
      },
      {
        nombre: 'Papelería Andina',
        nit: '900789456-3',
        telefono: '3204567890',
        correo: 'info@papeleriaandina.com',
        direccion: 'Av 80 #12-45',
        ciudad: 'Bogotá',
      },
    ].map((p) =>
      prisma.proveedor.upsert({
        where: { nit: p.nit },
        update: {},
        create: p,
      }),
    ),
  )
  // eslint-disable-next-line no-console
  console.log(`✔ Proveedores: ${proveedores.length}`)

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
      create: {
        nombre: u.nombre,
        correo: u.correo,
        passwordHash,
        rol: u.rol,
      },
    })
    usuarios.push(usuario)
  }
  // eslint-disable-next-line no-console
  console.log(`✔ Usuarios: ${usuarios.length} (admin123 / dev123 / venta123)`)

  // --- Clientes ---
  const clientes = await Promise.all(
    [
      {
        nombre: 'Tienda El Ahorro',
        documento: '10123456',
        telefono: '3015557788',
        correo: 'elahorro@mail.com',
        direccion: 'Cra 20 #15-30',
        segmento: 'mayorista' as const,
      },
      {
        nombre: 'María Fernanda Gómez',
        documento: '43567890',
        telefono: '3126667788',
        correo: 'mfgomez@mail.com',
        direccion: 'Cll 8 #9-12',
        segmento: 'minorista' as const,
      },
      {
        nombre: 'Comercial Los Andes',
        documento: '9001112223',
        telefono: '3187778899',
        correo: 'compras@losandes.com',
        direccion: 'Av 30 #40-10',
        segmento: 'frecuente' as const,
      },
    ].map((c) =>
      prisma.cliente.upsert({
        where: { documento: c.documento },
        update: {},
        create: c,
      }),
    ),
  )
  // eslint-disable-next-line no-console
  console.log(`✔ Clientes: ${clientes.length}`)

  // --- Productos ---
  const productos = await Promise.all(
    [
      {
        nombre: 'Arroz 500g',
        descripcion: 'Arroz blanco premium',
        precioCompra: 1800,
        precio: 2500,
        stock: 100,
        stockMinimo: 20,
        idCategoria: 1,
        idProveedor: 1,
      },
      {
        nombre: 'Detergente 1kg',
        descripcion: 'Detergente en polvo',
        precioCompra: 6000,
        precio: 8500,
        stock: 50,
        stockMinimo: 10,
        idCategoria: 2,
        idProveedor: 2,
      },
      {
        nombre: 'Gaseosa 1.5L',
        descripcion: 'Bebida gaseosa sabor cola',
        precioCompra: 2200,
        precio: 3200,
        stock: 80,
        stockMinimo: 15,
        idCategoria: 3,
        idProveedor: 1,
      },
      {
        nombre: 'Cuaderno 100 hojas',
        descripcion: 'Cuaderno cuadriculado',
        precioCompra: 2500,
        precio: 4000,
        stock: 40,
        stockMinimo: 10,
        idCategoria: 4,
        idProveedor: 3,
      },
    ].map((p, i) =>
      prisma.producto.upsert({
        where: { idProducto: i + 1 },
        update: {},
        create: {
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioCompra: p.precioCompra,
          precio: p.precio,
          stock: p.stock,
          stockMinimo: p.stockMinimo,
          idCategoria: p.idCategoria,
          idProveedor: p.idProveedor,
        },
      }),
    ),
  )
  // eslint-disable-next-line no-console
  console.log(`✔ Productos: ${productos.length}`)

  // --- Ventas (solo si no existen) ---
  const ventasExistentes = await prisma.venta.count()
  if (ventasExistentes === 0) {
    await prisma.$transaction(async (tx) => {
      const detalleArroz = {
        idProducto: 1,
        cantidad: 10,
        precioUnitario: 2500,
        subtotal: 25000,
      }
      const detalleGaseosa = {
        idProducto: 3,
        cantidad: 5,
        precioUnitario: 3200,
        subtotal: 16000,
      }
      const detalleDetergente = {
        idProducto: 2,
        cantidad: 3,
        precioUnitario: 8500,
        subtotal: 25500,
      }

      await tx.venta.create({
        data: {
          estado: 'completada',
          total: 41000,
          idCliente: 1,
          idUsuario: 3,
          detalles: { create: [detalleArroz, detalleGaseosa] },
        },
      })
      await tx.venta.create({
        data: {
          estado: 'pendiente',
          total: 25500,
          idCliente: 2,
          idUsuario: 3,
          detalles: { create: [detalleDetergente] },
        },
      })

      await tx.producto.update({
        where: { idProducto: 1 },
        data: { stock: { decrement: detalleArroz.cantidad } },
      })
      await tx.producto.update({
        where: { idProducto: 3 },
        data: { stock: { decrement: detalleGaseosa.cantidad } },
      })
      await tx.producto.update({
        where: { idProducto: 2 },
        data: { stock: { decrement: detalleDetergente.cantidad } },
      })

      await tx.inventarioMovimiento.createMany({
        data: [
          {
            idProducto: 1,
            tipo: 'salida',
            cantidad: detalleArroz.cantidad,
            stockResultante: 90,
            referencia: 'venta #1',
            idUsuario: 3,
          },
          {
            idProducto: 3,
            tipo: 'salida',
            cantidad: detalleGaseosa.cantidad,
            stockResultante: 75,
            referencia: 'venta #1',
            idUsuario: 3,
          },
          {
            idProducto: 2,
            tipo: 'salida',
            cantidad: detalleDetergente.cantidad,
            stockResultante: 47,
            referencia: 'venta #2',
            idUsuario: 3,
          },
        ],
      })
    })
    // eslint-disable-next-line no-console
    console.log('✔ Ventas de ejemplo creadas')
  } else {
    // eslint-disable-next-line no-console
    console.log('≈ Ventas ya existentes, se omiten')
  }

  // --- Reportes ---
  await prisma.reporte.createMany({
    data: [
      {
        nombre: 'Reporte general de ventas',
        tipo: 'general',
        parametros: { periodo: '2026-07' },
        idUsuario: 1,
      },
      {
        nombre: 'Reporte de inventario',
        tipo: 'inventario',
        parametros: { stockMinimo: true },
        idUsuario: 2,
      },
    ],
    skipDuplicates: true,
  })
  // eslint-disable-next-line no-console
  console.log('✔ Reportes de ejemplo')
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error en el seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
