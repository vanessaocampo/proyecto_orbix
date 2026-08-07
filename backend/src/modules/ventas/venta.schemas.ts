import { z } from 'zod'
import { EstadoVenta } from '@prisma/client'

export const detalleVentaSchema = z.object({
  idProducto: z.coerce.number().int().positive('El producto es obligatorio'),
  cantidad: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  precioUnitario: z.coerce.number().nonnegative().optional(),
})

export const createVentaSchema = z.object({
  idCliente: z.coerce.number().int().positive('El cliente es obligatorio'),
  estado: z.nativeEnum(EstadoVenta).optional(),
  items: z.array(detalleVentaSchema).min(1, 'Debe incluir al menos un producto'),
})

export const updateVentaEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoVenta),
})

export const listVentasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  idCliente: z.coerce.number().int().positive().optional(),
  estado: z.nativeEnum(EstadoVenta).optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
})
