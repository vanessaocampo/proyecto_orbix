import { RolUsuario } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        correo: string
        rol: import('@prisma/client').RolUsuario
      }
    }
  }
}

export {}
