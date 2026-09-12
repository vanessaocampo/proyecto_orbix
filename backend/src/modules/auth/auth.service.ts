import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/env'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'

type LoginInput = {
  correo: string
  password: string
  captcha: string
}

type ChangePasswordInput = {
  idUsuario: string
  passwordActual: string
  passwordNueva: string
}

async function verificarRecaptcha(captcha: string) {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: env.RECAPTCHA_SECRET_KEY, response: captcha }),
  })
  const data = await response.json() as { success: boolean; 'error-codes'?: string[] }
  if (!data.success) {
    throw ApiError.unauthorized('La verificación reCAPTCHA no es válida')
  }
}

export function signAccessToken(payload: { id: string; correo: string; rol: string }): string {
  const options: SignOptions = { expiresIn: '12h' }
  return jwt.sign(
    { sub: payload.id.toString(), correo: payload.correo, rol: payload.rol, type: 'access' },
    env.JWT_SECRET,
    options
  )
}

export function signRefreshToken(payload: { id: string }): string {
  const options: SignOptions = { expiresIn: '7d' }
  return jwt.sign(
    { sub: payload.id.toString(), type: 'refresh' },
    env.JWT_SECRET,
    options
  )
}

export async function login(input: LoginInput) {
  await verificarRecaptcha(input.captcha)
  const usuario = await prisma.usuario.findUnique({ where: { correo: input.correo } })

  if (!usuario) { throw ApiError.unauthorized('Credenciales inválidas') }
  if (usuario.estado !== 'activo') { throw ApiError.unauthorized('El usuario está inactivo') }

  const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash)
  if (!passwordValida) { throw ApiError.unauthorized('Credenciales inválidas') }

  const accessToken = signAccessToken({ id: usuario.idUsuario, correo: usuario.correo, rol: usuario.rol })
  const refreshToken = signRefreshToken({ id: usuario.idUsuario })

  return {
    accessToken,
    refreshToken,
    usuario: { id: usuario.idUsuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
  }
}

export async function getPerfil(idUsuario: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: { 
      idUsuario: true, 
      nombre: true, 
      correo: true, 
      rol: true, 
      estado: true, 
      createdAt: true,
      identificacion: true,
      correoPersonal: true,
      direccion: true,
      celular: true,
      fechaNacimiento: true,
      fechaIngreso: true
    },
  })
  if (!usuario) { throw ApiError.notFound('Usuario no encontrado') }
  return usuario
}

export async function changePassword(input: ChangePasswordInput) {
  const usuario = await prisma.usuario.findUnique({ where: { idUsuario: input.idUsuario } })
  if (!usuario) { throw ApiError.notFound('Usuario no encontrado') }

  const passwordValida = await bcrypt.compare(input.passwordActual, usuario.passwordHash)
  if (!passwordValida) { throw ApiError.unauthorized('La contraseña actual no es correcta') }

  const passwordHash = await bcrypt.hash(input.passwordNueva, 10)
  await prisma.usuario.update({ where: { idUsuario: input.idUsuario }, data: { passwordHash } })
}

export async function refreshTokenLogic(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any
    if (payload.type !== 'refresh') {
      throw ApiError.unauthorized('Token no es de tipo refresh')
    }

    const usuario = await prisma.usuario.findUnique({ where: { idUsuario: payload.sub } })
    if (!usuario || usuario.estado !== 'activo') {
      throw ApiError.unauthorized('Usuario inválido o inactivo')
    }

    const accessToken = signAccessToken({ id: usuario.idUsuario, correo: usuario.correo, rol: usuario.rol })
    return { accessToken }
  } catch (error) {
    throw ApiError.unauthorized('Refresh token inválido o expirado')
  }
}
