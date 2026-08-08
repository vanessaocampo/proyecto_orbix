import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import { buildMeta, getPagination } from '../../utils/pagination'
import type { EstadoGeneral, RolUsuario } from '@prisma/client'

type CreateUsuarioInput = {
  nombre: string
  correo: string
  password: string
  rol?: RolUsuario
  estado?: EstadoGeneral
}

type UpdateUsuarioInput = Partial<Omit<CreateUsuarioInput, 'correo' | 'password'> & { correo?: string; password?: string }>
type ListQuery = { page?: number; limit?: number; search?: string }

const safeSelect = {
  idUsuario: true,
  nombre: true,
  correo: true,
  rol: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function create(data: CreateUsuarioInput) {
  const passwordHash = await bcrypt.hash(data.password, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      correo: data.correo,
      passwordHash,
      rol: data.rol,
      estado: data.estado,
    },
    select: safeSelect,
  })

  return usuario
}

export async function list(query: ListQuery) {
  const { page, limit, skip } = getPagination(query)

  const where = query.search
    ? {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' as const } },
          { correo: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [total, items] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({ where, skip, take: limit, orderBy: { nombre: 'asc' }, select: safeSelect }),
  ])

  return { items, meta: buildMeta(page, limit, total) }
}

export async function getById(id: number) {
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id }, select: safeSelect })
  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado')
  }
  return usuario
}

export async function update(id: number, data: UpdateUsuarioInput) {
  await getById(id)

  const { password, ...rest } = data

  const payload = {
    ...rest,
    ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
  }

  return prisma.usuario.update({ where: { idUsuario: id }, data: payload, select: safeSelect })
}

export async function remove(id: number, requesterId: number) {
  if (id === requesterId) {
    throw ApiError.badRequest('No puedes eliminar tu propio usuario')
  }

  const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id } })
  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado')
  }

  if (usuario.rol === 'admin') {
    const admins = await prisma.usuario.count({ where: { rol: 'admin', estado: 'activo' } })
    if (admins <= 1) {
      throw ApiError.conflict('No se puede eliminar el último administrador activo')
    }
  }

  await prisma.usuario.delete({ where: { idUsuario: id } })
}
