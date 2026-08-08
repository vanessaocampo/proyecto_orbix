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

function extractToken(authorization?: string): string {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token de autenticación requerido')
  }
  return authorization.slice('Bearer '.length)
}

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req.headers.authorization)
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload

  req.user = {
    id: Number(payload.sub),
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
