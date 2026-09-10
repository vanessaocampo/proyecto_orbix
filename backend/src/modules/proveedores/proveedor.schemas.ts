import { z } from 'zod'
import { EstadoGeneral } from '@prisma/client'

const estadoEnum = z.nativeEnum(EstadoGeneral)

export const createProveedorSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  nit: z.string().trim().min(1, 'El NIT es obligatorio').max(20),
  telefono: z.string().trim().max(20).optional().nullable(),
  correo: z.string().trim().email('Correo inválido').max(120).optional().nullable(),
  direccion: z.string().trim().max(200).optional().nullable(),
  ciudad: z.string().trim().max(100).optional().nullable(),
  estado: estadoEnum.optional(),
})

export const updateProveedorSchema = createProveedorSchema.partial()
