import { Prisma, TipoReporte } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'

type CreateReporteInput = {
  nombre: string
  tipo: TipoReporte
  parametros?: Record<string, unknown> | null
  idUsuario: number
}

type ListQuery = { page?: number; limit?: number; tipo?: TipoReporte }

export async function create(data: CreateReporteInput) {
  return prisma.reporte.create({
    data: {
      nombre: data.nombre,
      tipo: data.tipo,
      parametros:
        data.parametros === null
          ? Prisma.DbNull
          : (data.parametros as Prisma.InputJsonValue),
      idUsuario: data.idUsuario,
    },
    include: { usuario: { select: { idUsuario: true, nombre: true } } },
  })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = query.tipo ? { tipo: query.tipo } : undefined

  const [total, items] = await Promise.all([
    prisma.reporte.count({ where }),
    prisma.reporte.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fechaGenerado: 'desc' },
      include: { usuario: { select: { idUsuario: true, nombre: true } } },
    }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const reporte = await prisma.reporte.findUnique({
    where: { idReporte: id },
    include: { usuario: { select: { idUsuario: true, nombre: true } } },
  })
  if (!reporte) {
    throw ApiError.notFound('Reporte no encontrado')
  }
  return reporte
}

export async function remove(id: number) {
  await getById(id)
  await prisma.reporte.delete({ where: { idReporte: id } })
}

export async function resumen() {
  const [ventasCompletadas, ingresos, ventasPendientes, productosAgotados, totalClientes, totalProductos] =
    await Promise.all([
      prisma.venta.count({ where: { estado: 'completada' } }),
      prisma.venta.aggregate({ where: { estado: 'completada' }, _sum: { total: true } }),
      prisma.venta.count({ where: { estado: 'pendiente' } }),
      prisma.producto.count({
        where: { estado: 'activo', stock: { lte: prisma.producto.fields.stockMinimo } },
      }),
      prisma.cliente.count(),
      prisma.producto.count(),
    ])

  return {
    ventasCompletadas,
    ingresosTotales: ingresos._sum.total ?? new Prisma.Decimal(0),
    ventasPendientes,
    productosAgotados,
    totalClientes,
    totalProductos,
  }
}

export async function ventasPorCategoria() {
  return prisma.$queryRaw<
    { categoria: string; totalVendido: Prisma.Decimal }[]
  >`
    SELECT c.nombre AS categoria, COALESCE(SUM(dv.subtotal), 0) AS "totalVendido"
    FROM detalle_venta dv
    JOIN productos p ON p.id_producto = dv.id_producto
    JOIN categorias c ON c.id_categoria = p.id_categoria
    JOIN ventas v ON v.id_venta = dv.id_venta
    WHERE v.estado = 'completada'
    GROUP BY c.nombre
    ORDER BY "totalVendido" DESC
  `
}

export async function ultimasVentas(limit = 10) {
  return prisma.$queryRaw<unknown[]>`
    SELECT v.id_venta, v.fecha, v.total, v.estado,
           cl.nombre AS cliente, u.nombre AS vendedor
    FROM ventas v
    JOIN clientes cl ON cl.id_cliente = v.id_cliente
    JOIN usuarios u ON u.id_usuario = v.id_usuario
    ORDER BY v.fecha DESC
    LIMIT ${limit}
  `
}

export async function productosPorProveedor() {
  return prisma.$queryRaw<unknown[]>`
    SELECT pr.id_proveedor, pr.nombre AS proveedor,
           p.id_producto, p.nombre AS producto, p.stock
    FROM productos p
    JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
    ORDER BY pr.nombre, p.nombre
  `
}
