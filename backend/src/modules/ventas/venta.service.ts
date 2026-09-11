import { Prisma, EstadoVenta, MetodoPago } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'

type CreateVentaInput = {
  idCliente: string
  idUsuario: string
  estado?: EstadoVenta
  metodoPago?: MetodoPago
  items: { idProducto: string; cantidad: number; precioUnitario?: number }[]
}

type UpdateEstadoInput = { id: string; estado: EstadoVenta }

type ListQuery = {
  page?: number
  limit?: number
  search?: string
  idCliente?: string
  estado?: EstadoVenta
  metodoPago?: MetodoPago
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

// Neon (DB remota) tiene latencia alta por consulta; la transacción por defecto
// expira a los 5s. Subimos maxWait/timeout y reducimos viajes a la BD.
const TRANSACTION_OPTS = { maxWait: 15000, timeout: 60000 } as const

export async function create(data: CreateVentaInput) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUnique({ where: { idCliente: data.idCliente } })
    if (!cliente) {
      throw ApiError.badRequest(`El cliente ${data.idCliente} no existe`)
    }

    const idsProductos = [...new Set(data.items.map((item) => item.idProducto))]
    const productos = await tx.producto.findMany({
      where: { idProducto: { in: idsProductos } },
    })
    const productoPorId = new Map(productos.map((p) => [p.idProducto, p]))

    const detalles: {
      idProducto: string
      cantidad: number
      precioUnitario: Prisma.Decimal
      subtotal: Prisma.Decimal
    }[] = []
    let total = new Prisma.Decimal(0)

    for (const item of data.items) {
      const producto = productoPorId.get(item.idProducto)
      if (!producto) {
        throw ApiError.badRequest(`El producto ${item.idProducto} no existe`)
      }
      if (producto.stock < item.cantidad) {
        throw ApiError.badRequest(
          `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, solicitado ${item.cantidad}`,
        )
      }

      const precioUnitario = new Prisma.Decimal(item.precioUnitario ?? producto.precio)
      const subtotal = precioUnitario.mul(item.cantidad)
      total = total.add(subtotal)

      detalles.push({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal,
      })
    }

    const venta = await tx.venta.create({
      data: {
        idCliente: data.idCliente,
        idUsuario: data.idUsuario,
        codigoVenta: await generarCodigoVenta(tx),
        estado: data.estado,
        metodoPago: data.metodoPago,
        total,
        detalles: { create: detalles },
      },
      include,
    })

    await Promise.all(
      detalles.map((d) =>
        tx.producto.update({
          where: { idProducto: d.idProducto },
          data: { stock: { decrement: d.cantidad } },
        }),
      ),
    )

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
  }, TRANSACTION_OPTS)
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = {
    ...(query.idCliente ? { idCliente: query.idCliente } : {}),
    ...(query.estado ? { estado: query.estado } : {}),
    ...(query.metodoPago ? { metodoPago: query.metodoPago } : {}),
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

export async function getById(id: string) {
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
      await Promise.all(
        venta.detalles.map((d) =>
          tx.producto.update({
            where: { idProducto: d.idProducto },
            data: { stock: { increment: d.cantidad } },
          }),
        ),
      )
    }

    if (restauraStockPendiente) {
      const ids = venta.detalles.map((d) => d.idProducto)
      const productos = await tx.producto.findMany({ where: { idProducto: { in: ids } } })
      const stockPorId = new Map(productos.map((p) => [p.idProducto, p.stock]))
      for (const d of venta.detalles) {
        const stock = stockPorId.get(d.idProducto) ?? 0
        if (stock < d.cantidad) {
          throw ApiError.badRequest(
            `Stock insuficiente para reactivar la venta ${id} (producto ${d.idProducto})`,
          )
        }
      }
      await Promise.all(
        venta.detalles.map((d) =>
          tx.producto.update({
            where: { idProducto: d.idProducto },
            data: { stock: { decrement: d.cantidad } },
          }),
        ),
      )
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
  }, TRANSACTION_OPTS)
}

export async function remove(id: string) {
  await prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { idVenta: id },
      include: { detalles: true },
    })
    if (!venta) {
      throw ApiError.notFound('Venta no encontrada')
    }

    if (venta.estado !== 'cancelada' && venta.estado !== 'devuelta') {
      await Promise.all(
        venta.detalles.map((d) =>
          tx.producto.update({
            where: { idProducto: d.idProducto },
            data: { stock: { increment: d.cantidad } },
          }),
        ),
      )
    }

    await tx.inventarioMovimiento.deleteMany({ where: { referencia: `venta #${id}` } })
    await tx.venta.delete({ where: { idVenta: id } })
  }, TRANSACTION_OPTS)
}

async function generarCodigoVenta(tx: Prisma.TransactionClient): Promise<string> {
  const ventas = await tx.venta.findMany({
    where: { codigoVenta: { not: '' } },
    select: { codigoVenta: true },
  })

  let siguienteNumero = 0
  for (const venta of ventas) {
    const numero = Number((venta.codigoVenta ?? '').replace(/^\D+/, ''))
    if (Number.isInteger(numero) && numero > siguienteNumero) {
      siguienteNumero = numero
    }
  }

  return `ORD-${String(siguienteNumero + 1).padStart(3, '0')}`
}
