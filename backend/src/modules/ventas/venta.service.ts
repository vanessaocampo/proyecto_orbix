import { Prisma, EstadoVenta } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'

type CreateVentaInput = {
  idCliente: number
  idUsuario: number
  estado?: EstadoVenta
  items: { idProducto: number; cantidad: number; precioUnitario?: number }[]
}

type UpdateEstadoInput = { id: number; estado: EstadoVenta }

type ListQuery = {
  page?: number
  limit?: number
  search?: string
  idCliente?: number
  estado?: EstadoVenta
  desde?: string
  hasta?: string
}

const include = {
  cliente: { select: { idCliente: true, nombre: true, documento: true } },
  usuario: { select: { idUsuario: true, nombre: true, correo: true } },
  detalles: {
    include: { producto: { select: { idProducto: true, nombre: true } } },
  },
} as const

const estadosSinStock = [EstadoVenta.cancelada, EstadoVenta.devuelta] as const

export async function create(data: CreateVentaInput) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUnique({ where: { idCliente: data.idCliente } })
    if (!cliente) {
      throw ApiError.badRequest(`El cliente ${data.idCliente} no existe`)
    }

    const detalles = []
    let total = new Prisma.Decimal(0)

    for (const item of data.items) {
      const producto = await tx.producto.findUnique({ where: { idProducto: item.idProducto } })
      if (!producto) {
        throw ApiError.badRequest(`El producto ${item.idProducto} no existe`)
      }
      if (producto.stock < item.cantidad) {
        throw ApiError.badRequest(
          `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, solicitado ${item.cantidad}`,
        )
      }

      const precioUnitario = item.precioUnitario ?? producto.precio
      const subtotal = new Prisma.Decimal(precioUnitario).mul(item.cantidad)
      total = total.add(subtotal)

      detalles.push({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal,
      })

      await tx.producto.update({
        where: { idProducto: item.idProducto },
        data: { stock: { decrement: item.cantidad } },
      })
    }

    const venta = await tx.venta.create({
      data: {
        idCliente: data.idCliente,
        idUsuario: data.idUsuario,
        estado: data.estado,
        total,
        detalles: { create: detalles },
      },
      include,
    })

    await tx.inventarioMovimiento.createMany({
      data: detalles.map((d) => ({
        idProducto: d.idProducto,
        tipo: 'salida',
        cantidad: d.cantidad,
        stockResultante: 0,
        referencia: `venta #${venta.idVenta}`,
        idUsuario: data.idUsuario,
      })),
    })

    return venta
  })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = {
    ...(query.idCliente ? { idCliente: query.idCliente } : {}),
    ...(query.estado ? { estado: query.estado } : {}),
    ...(query.desde || query.hasta
      ? {
          fecha: {
            ...(query.desde ? { gte: new Date(query.desde) } : {}),
            ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
          },
        }
      : {}),
  }

  const [total, items] = await Promise.all([
    prisma.venta.count({ where }),
    prisma.venta.findMany({ where, skip, take: limit, orderBy: { fecha: 'desc' }, include }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const venta = await prisma.venta.findUnique({ where: { idVenta: id }, include })
  if (!venta) {
    throw ApiError.notFound('Venta no encontrada')
  }
  return venta
}

export async function updateEstado({ id, estado }: UpdateEstadoInput) {
  return prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { idVenta: id },
      include: { detalles: true },
    })
    if (!venta) {
      throw ApiError.notFound('Venta no encontrada')
    }
    if (venta.estado === estado) {
      return venta
    }

    const estabaRestaurado = (estadosSinStock as readonly string[]).includes(venta.estado)
    const nuevoRestaurado = (estadosSinStock as readonly string[]).includes(estado)
    const restauraStock = !estabaRestaurado && nuevoRestaurado
    const restauraStockPendiente = estabaRestaurado && !nuevoRestaurado

    if (restauraStock) {
      for (const d of venta.detalles) {
        await tx.producto.update({
          where: { idProducto: d.idProducto },
          data: { stock: { increment: d.cantidad } },
        })
      }
    }

    if (restauraStockPendiente) {
      for (const d of venta.detalles) {
        const producto = await tx.producto.findUnique({ where: { idProducto: d.idProducto } })
        if (!producto || producto.stock < d.cantidad) {
          throw ApiError.badRequest(
            `Stock insuficiente para reactivar la venta ${id} (producto ${d.idProducto})`,
          )
        }
        await tx.producto.update({
          where: { idProducto: d.idProducto },
          data: { stock: { decrement: d.cantidad } },
        })
      }
    }

    const actualizada = await tx.venta.update({
      where: { idVenta: id },
      data: { estado },
      include,
    })

    if (restauraStock || restauraStockPendiente) {
      const tipo = restauraStock ? 'devolucion' : 'salida'
      await tx.inventarioMovimiento.createMany({
        data: venta.detalles.map((d) => ({
          idProducto: d.idProducto,
          tipo,
          cantidad: d.cantidad,
          stockResultante: 0,
          referencia: `venta #${id}`,
          idUsuario: venta.idUsuario,
        })),
      })
    }

    return actualizada
  })
}

export async function remove(id: number) {
  await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { idVenta: id },
      include: { detalles: true },
    })
    if (!venta) {
      throw ApiError.notFound('Venta no encontrada')
    }

    if (venta.estado !== 'cancelada' && venta.estado !== 'devuelta') {
      for (const d of venta.detalles) {
        await tx.producto.update({
          where: { idProducto: d.idProducto },
          data: { stock: { increment: d.cantidad } },
        })
      }
    }

    await tx.inventarioMovimiento.deleteMany({ where: { referencia: `venta #${id}` } })
    await tx.venta.delete({ where: { idVenta: id } })
  })
}
