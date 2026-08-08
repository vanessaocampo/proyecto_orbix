import { z } from 'zod'
import { SegmentoCliente } from '@prisma/client'

export const createClienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  documento: z.string().trim().min(1, 'El documento es obligatorio').max(20),
  telefono: z.string().trim().max(20).optional().nullable(),
  correo: z.string().trim().email('Correo inválido').max(120).optional().nullable(),
  direccion: z.string().trim().max(200).optional().nullable(),
  segmento: z.nativeEnum(SegmentoCliente).optional(),
})

export const updateClienteSchema = createClienteSchema.partial()
