import { z } from 'zod'

export const loginSchema = z.object({
  correo: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const changePasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es obligatoria'),
  passwordNueva: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
})
