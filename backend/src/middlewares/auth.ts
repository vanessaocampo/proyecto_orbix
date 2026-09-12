import { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { RolUsuario } from '@prisma/client'
import { env } from '../config/env'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'

type JwtPayload = {
  sub: string
  correo: string
  rol: RolUsuario
}

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken

  if (!token) {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length)
    }
  }

  if (!token) {
    throw ApiError.unauthorized('Token de autenticación requerido (header o cookie)')
  }

  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload

  req.user = {
    id: payload.sub,
    correo: payload.correo,
    rol: payload.rol,
  }
  next()
})

export function authorize(...roles: RolUsuario[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Debes iniciar sesión'))
    }
    if (!roles.includes(req.user.rol)) {
      return next(ApiError.forbidden(`Se requiere rol: ${roles.join(', ')}`))
    }
    next()
  }
}
