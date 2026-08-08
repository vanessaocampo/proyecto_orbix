import { TipoMovimientoInv } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'

type MovimientoInput = {
  idProducto: number
  cantidad: number
  referencia?: string | null
  idUsuario: number
}

type AjusteInput = {
  idProducto: number
  nuevoStock: number
  referencia?: string | null
  idUsuario: number
}

type ListQuery = {
  page?: number
  limit?: number
  idProducto?: number
  tipo?: TipoMovimientoInv
  desde?: string
  hasta?: string
}

const include = {
  producto: { select: { idProducto: true, nombre: true } },
  usuario: { select: { idUsuario: true, nombre: true } },
} as const

async function getProducto(tx: PrismaTransactionClient, idProducto: number) {
  const producto = await tx.producto.findUnique({ where: { idProducto } })
  if (!producto) {
    throw ApiError.badRequest(`El producto ${idProducto} no existe`)
  }
  return producto
}

async function registrarMovimiento(
  tx: PrismaTransactionClient,
  data: {
    idProducto: number
    tipo: TipoMovimientoInv
    cantidad: number
    stockResultante: number
    referencia?: string | null
    idUsuario: number
  },
) {
  return tx.inventarioMovimiento.create({
    data: {
      idProducto: data.idProducto,
      tipo: data.tipo,
      cantidad: data.cantidad,
      stockResultante: data.stockResultante,
      referencia: data.referencia,
      idUsuario: data.idUsuario,
    },
    include,
  })
}

export async function entrada(data: MovimientoInput) {
  return prisma.$transaction(async (tx) => {
    const producto = await getProducto(tx, data.idProducto)
    const stockResultante = producto.stock + data.cantidad

    await tx.producto.update({
      where: { idProducto: data.idProducto },
      data: { stock: stockResultante },
    })

    return registrarMovimiento(tx, {
      ...data,
      tipo: 'entrada',
      stockResultante,
    })
  })
}

export async function salida(data: MovimientoInput) {
  return prisma.$transaction(async (tx) => {
    const producto = await getProducto(tx, data.idProducto)
    if (producto.stock < data.cantidad) {
      throw ApiError.badRequest(
        `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}`,
      )
    }
    const stockResultante = producto.stock - data.cantidad

    await tx.producto.update({
      where: { idProducto: data.idProducto },
      data: { stock: stockResultante },
    })

    return registrarMovimiento(tx, {
      ...data,
      tipo: 'salida',
      stockResultante,
    })
  })
}

export async function devolucion(data: MovimientoInput) {
  return prisma.$transaction(async (tx) => {
    const producto = await getProducto(tx, data.idProducto)
    const stockResultante = producto.stock + data.cantidad

    await tx.producto.update({
      where: { idProducto: data.idProducto },
      data: { stock: stockResultante },
    })

    return registrarMovimiento(tx, {
      ...data,
      tipo: 'devolucion',
      stockResultante,
    })
  })
}

export async function ajuste(data: AjusteInput) {
  return prisma.$transaction(async (tx) => {
    const producto = await getProducto(tx, data.idProducto)
    const diferencia = data.nuevoStock - producto.stock

    await tx.producto.update({
      where: { idProducto: data.idProducto },
      data: { stock: data.nuevoStock },
    })

    return registrarMovimiento(tx, {
      idProducto: data.idProducto,
      referencia: data.referencia,
      idUsuario: data.idUsuario,
      tipo: 'ajuste',
      cantidad: Math.abs(diferencia),
      stockResultante: data.nuevoStock,
    })
  })
}

export async function listMovimientos(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = {
    ...(query.idProducto ? { idProducto: query.idProducto } : {}),
    ...(query.tipo ? { tipo: query.tipo } : {}),
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
    prisma.inventarioMovimiento.count({ where }),
    prisma.inventarioMovimiento.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' },
      include,
    }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function alertas() {
  return prisma.producto.findMany({
    where: {
      estado: 'activo',
      stock: { lte: prisma.producto.fields.stockMinimo },
    },
    include: { categoria: { select: { idCategoria: true, nombre: true } } },
    orderBy: { stock: 'asc' },
  })
}

type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
