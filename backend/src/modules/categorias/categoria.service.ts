import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'
import type { Categoria } from '@prisma/client'

type CreateCategoriaInput = Pick<Categoria, 'nombre'> & { descripcion?: string | null }
type UpdateCategoriaInput = Partial<CreateCategoriaInput>
type ListQuery = { page?: number; limit?: number; search?: string }

export async function create(data: CreateCategoriaInput) {
  return prisma.categoria.create({ data })
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = query.search
    ? { nombre: { contains: query.search, mode: 'insensitive' as const } }
    : undefined

  const [total, items] = await Promise.all([
    prisma.categoria.count({ where }),
    prisma.categoria.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' } }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const categoria = await prisma.categoria.findUnique({ where: { idCategoria: id } })
  if (!categoria) {
    throw ApiError.notFound('Categoría no encontrada')
  }
  return categoria
}

export async function update(id: number, data: UpdateCategoriaInput) {
  await getById(id)
  return prisma.categoria.update({ where: { idCategoria: id }, data })
}

export async function remove(id: number) {
  await getById(id)
  await prisma.categoria.delete({ where: { idCategoria: id } })
}
