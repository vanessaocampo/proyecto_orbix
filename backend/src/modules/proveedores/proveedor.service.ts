import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'
import type { Proveedor } from '@prisma/client'

type CreateProveedorInput = Pick<Proveedor, 'nombre' | 'nit'> &
  Partial<Pick<Proveedor, 'telefono' | 'correo' | 'direccion' | 'ciudad' | 'estado'>>
type UpdateProveedorInput = Partial<CreateProveedorInput>
type ListQuery = { page?: number; limit?: number; search?: string }

export async function create(data: CreateProveedorInput) {
  return prisma.proveedor.create({ data })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = query.search
    ? {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' as const } },
          { nit: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [total, items] = await Promise.all([
    prisma.proveedor.count({ where }),
    prisma.proveedor.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' } }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const proveedor = await prisma.proveedor.findUnique({ where: { idProveedor: id } })
  if (!proveedor) {
    throw ApiError.notFound('Proveedor no encontrado')
  }
  return proveedor
}

export async function update(id: number, data: UpdateProveedorInput) {
  await getById(id)
  return prisma.proveedor.update({ where: { idProveedor: id }, data })
}

export async function remove(id: number) {
  await getById(id)
  await prisma.proveedor.delete({ where: { idProveedor: id } })
}
