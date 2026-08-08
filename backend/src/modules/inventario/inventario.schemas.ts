import { z } from 'zod'
import { TipoMovimientoInv } from '@prisma/client'

export const movimientoBaseSchema = z.object({
  idProducto: z.coerce.number().int().positive('El producto es obligatorio'),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  referencia: z.string().trim().max(150).optional().nullable(),
})

export const entradaSchema = movimientoBaseSchema
export const salidaSchema = movimientoBaseSchema

export const ajusteSchema = z.object({
  idProducto: z.coerce.number().int().positive('El producto es obligatorio'),
  nuevoStock: z.coerce.number().int().nonnegative('El nuevo stock no puede ser negativo'),
  referencia: z.string().trim().max(150).optional().nullable(),
})

export const listMovimientosQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  idProducto: z.coerce.number().int().positive().optional(),
  tipo: z.nativeEnum(TipoMovimientoInv).optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
})
