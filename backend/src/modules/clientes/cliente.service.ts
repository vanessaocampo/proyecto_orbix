import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'
import type { Cliente, SegmentoCliente } from '@prisma/client'

type CreateClienteInput = Pick<Cliente, 'nombre' | 'documento'> &
  Partial<Pick<Cliente, 'telefono' | 'correo' | 'direccion' | 'segmento'>>
type UpdateClienteInput = Partial<CreateClienteInput>
type ListQuery = { page?: number; limit?: number; search?: string; segmento?: SegmentoCliente }

export type { ListQuery }

export async function create(data: CreateClienteInput) {
  return prisma.cliente.create({ data })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = {
    ...(query.search
      ? {
          OR: [
            { nombre: { contains: query.search, mode: 'insensitive' as const } },
            { documento: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(query.segmento ? { segmento: query.segmento } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' } }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const cliente = await prisma.cliente.findUnique({ where: { idCliente: id } })
  if (!cliente) {
    throw ApiError.notFound('Cliente no encontrado')
  }
  return cliente
}

export async function update(id: number, data: UpdateClienteInput) {
  await getById(id)
  return prisma.cliente.update({ where: { idCliente: id }, data })
}

export async function remove(id: number) {
  await getById(id)
  await prisma.cliente.delete({ where: { idCliente: id } })
}
