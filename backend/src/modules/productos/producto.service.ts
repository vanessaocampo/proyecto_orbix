import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'
import type { EstadoProducto, Producto } from '@prisma/client'

type CreateProductoInput = Pick<Producto, 'nombre' | 'precio' | 'idCategoria'> &
  Partial<
    Pick<
      Producto,
      'descripcion' | 'precioCompra' | 'stock' | 'stockMinimo' | 'estado' | 'idProveedor'
    >
  >
type UpdateProductoInput = Partial<CreateProductoInput>
type ListQuery = {
  page?: number
  limit?: number
  search?: string
  idCategoria?: number
  idProveedor?: number
  estado?: EstadoProducto
}

const include = {
  categoria: { select: { idCategoria: true, nombre: true } },
  proveedor: { select: { idProveedor: true, nombre: true, nit: true } },
} as const

export async function create(data: CreateProductoInput) {
  await ensureCategoriaExists(data.idCategoria)

  return prisma.producto.create({ data, include })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = {
    ...(query.search ? { nombre: { contains: query.search, mode: 'insensitive' as const } } : {}),
    ...(query.idCategoria ? { idCategoria: query.idCategoria } : {}),
    ...(query.idProveedor ? { idProveedor: query.idProveedor } : {}),
    ...(query.estado ? { estado: query.estado } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.producto.count({ where }),
    prisma.producto.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' }, include }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const producto = await prisma.producto.findUnique({ where: { idProducto: id }, include })
  if (!producto) {
    throw ApiError.notFound('Producto no encontrado')
  }
  return producto
}

export async function update(id: number, data: UpdateProductoInput) {
  await getById(id)

  if (data.idCategoria) {
    await ensureCategoriaExists(data.idCategoria)
  }

  return prisma.producto.update({ where: { idProducto: id }, data, include })
}

export async function remove(id: number) {
  await getById(id)
  await prisma.producto.delete({ where: { idProducto: id } })
}

async function ensureCategoriaExists(idCategoria: number) {
  const categoria = await prisma.categoria.findUnique({ where: { idCategoria } })
  if (!categoria) {
    throw ApiError.badRequest(`La categoría ${idCategoria} no existe`)
  }
}
