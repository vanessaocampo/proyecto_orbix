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
  type?: string
  tokenVersion: number
}

export const authenticate: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    let token = req.cookies?.accessToken

    // Se mantiene temporalmente como compatibilidad
    // mientras el frontend termina la migración a cookies.
    if (!token) {
      const authHeader = req.headers.authorization

      if (
        authHeader &&
        authHeader.startsWith('Bearer ')
      ) {
        token = authHeader.slice('Bearer '.length)
      }
    }

    if (!token) {
      throw ApiError.unauthorized(
        'Token de autenticación requerido'
      )
    }

    try {
      const payload = jwt.verify(
        token,
        env.JWT_SECRET
      ) as JwtPayload

      if (payload.type !== 'access') {
        throw ApiError.unauthorized(
          'Token de acceso inválido'
        )
      }

      // Validar tokenVersion para revocar sesiones
      const { prisma } = require('../config/prisma');
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: payload.sub },
        select: { tokenVersion: true }
      });

      if (!usuario || usuario.tokenVersion !== payload.tokenVersion) {
        throw ApiError.unauthorized('Sesión caducada. Inicia sesión nuevamente.');
      }

      req.user = {
        id: payload.sub,
        correo: payload.correo,
        rol: payload.rol,
      }

      next()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw ApiError.unauthorized(
        'Token de autenticación inválido o expirado'
      )
    }
  }
)

export function authorize(
  ...roles: RolUsuario[]
): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        ApiError.unauthorized(
          'Debes iniciar sesión'
        )
      )
    }

    if (!roles.includes(req.user.rol)) {
      return next(
        ApiError.forbidden(
          `Se requiere rol: ${roles.join(', ')}`
        )
      )
    }

    next()
  }
}