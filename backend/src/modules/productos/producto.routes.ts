import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as productoController from './producto.controller'
import {
  createProductoSchema,
  listProductosQuerySchema,
  updateProductoSchema,
} from './producto.schemas'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  validate({ query: listProductosQuerySchema }),
  asyncHandler(productoController.list),
)
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(productoController.getById))

router.post(
  '/',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ body: createProductoSchema }),
  asyncHandler(productoController.create),
)

router.patch(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema, body: updateProductoSchema }),
  asyncHandler(productoController.update),
)

router.delete(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema }),
  asyncHandler(productoController.remove),
)

export default router
