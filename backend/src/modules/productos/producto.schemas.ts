import { z } from 'zod'
import { EstadoProducto } from '@prisma/client'

export const createProductoSchema = z.object({
  sku: z.string().trim().max(50).optional().nullable(),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  descripcion: z.string().max(5000).optional().nullable(),
  precioCompra: z.coerce.number().nonnegative('El precio de compra no puede ser negativo').optional(),
  precio: z.coerce.number().nonnegative('El precio de venta no puede ser negativo'),
  stock: z.coerce.number().int().nonnegative('El stock no puede ser negativo').optional(),
  stockMinimo: z.coerce.number().int().nonnegative('El stock mínimo no puede ser negativo').optional(),
  estado: z.nativeEnum(EstadoProducto).optional(),
  idCategoria: z.string().uuid('La categoría es obligatoria'),
  idProveedor: z.string().uuid().optional().nullable(),
})

export const updateProductoSchema = createProductoSchema.partial()

export const listProductosQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  idCategoria: z.string().uuid().optional(),
  idProveedor: z.string().uuid().optional(),
  estado: z.nativeEnum(EstadoProducto).optional(),
})
