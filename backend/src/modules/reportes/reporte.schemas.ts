import { z } from 'zod'
import { TipoReporte } from '@prisma/client'

export const createReporteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  tipo: z.nativeEnum(TipoReporte),
  parametros: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const listReportesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  tipo: z.nativeEnum(TipoReporte).optional(),
})
