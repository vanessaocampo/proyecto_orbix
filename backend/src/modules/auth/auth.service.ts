import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

type LoginInput = {
  correo: string
  password: string
}

type ChangePasswordInput = {
  idUsuario: number
  passwordActual: string
  passwordNueva: string
}

function signToken(payload: { id: number; correo: string; rol: string }): string {
  return jwt.sign(
    {
      sub: payload.id.toString(),
      correo: payload.correo,
      rol: payload.rol,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  )
}

export async function login(input: LoginInput) {
  const usuario = await prisma.usuario.findUnique({ where: { correo: input.correo } })

  if (!usuario) {
    throw ApiError.unauthorized('Credenciales inválidas')
  }

  if (usuario.estado !== 'activo') {
    throw ApiError.unauthorized('El usuario está inactivo')
  }

  const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash)
  if (!passwordValida) {
    throw ApiError.unauthorized('Credenciales inválidas')
  }

  const token = signToken({ id: usuario.idUsuario, correo: usuario.correo, rol: usuario.rol })

  return {
    token,
    usuario: {
      id: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  }
}

export async function getPerfil(idUsuario: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: {
      idUsuario: true,
      nombre: true,
      correo: true,
      rol: true,
      estado: true,
      createdAt: true,
    },
  })

  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado')
  }

  return usuario
}

export async function changePassword(input: ChangePasswordInput) {
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario: input.idUsuario } })

  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado')
  }

  const passwordValida = await bcrypt.compare(input.passwordActual, usuario.passwordHash)
  if (!passwordValida) {
    throw ApiError.unauthorized('La contraseña actual no es correcta')
  }

  const passwordHash = await bcrypt.hash(input.passwordNueva, 10)
  await prisma.usuario.update({
    where: { idUsuario: input.idUsuario },
    data: { passwordHash },
  })
}
