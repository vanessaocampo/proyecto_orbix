import { RolUsuario } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        correo: string
        rol: RolUsuario
      }
    }
  }
}

export {}
