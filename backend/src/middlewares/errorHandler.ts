import { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ApiError } from '../utils/ApiError'

export const notFound: RequestHandler = (req, res, next) => {
  next(ApiError.notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada`))
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500
  let message = 'Error interno del servidor'

  if (err instanceof ApiError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err instanceof ZodError) {
    statusCode = 400
    message = 'Datos inválidos'
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409
      message = `El valor ya existe (${err.meta?.target ?? 'campo único'})`
    } else if (err.code === 'P2003') {
      statusCode = 400
      message = 'Registro relacionado no válido'
    } else if (err.code === 'P2025') {
      statusCode = 404
      message = 'Registro no encontrado'
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = 'Los datos enviados no coinciden con el esquema'
  }

  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err)

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { details: err instanceof ZodError ? err.flatten() : undefined }),
  })
}
