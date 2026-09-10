import { z } from 'zod'

export const createCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(2000).optional().nullable(),
})

export const updateCategoriaSchema = createCategoriaSchema.partial()
