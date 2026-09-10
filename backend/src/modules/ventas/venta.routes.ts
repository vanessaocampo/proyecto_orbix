import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as ventaController from './venta.controller'
import {
  createVentaSchema,
  listVentasQuerySchema,
  updateVentaEstadoSchema,
} from './venta.schemas'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  validate({ query: listVentasQuerySchema }),
  asyncHandler(ventaController.list),
)
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(ventaController.getById))

router.post(
  '/',
  authorize(RolUsuario.admin, RolUsuario.vendedor),
  validate({ body: createVentaSchema }),
  asyncHandler(ventaController.create),
)

router.patch(
  '/:id/estado',
  authorize(RolUsuario.admin, RolUsuario.vendedor),
  validate({ params: idParamSchema, body: updateVentaEstadoSchema }),
  asyncHandler(ventaController.updateEstado),
)

router.delete(
  '/:id',
  authorize(RolUsuario.admin),
  validate({ params: idParamSchema }),
  asyncHandler(ventaController.remove),
)

export default router
