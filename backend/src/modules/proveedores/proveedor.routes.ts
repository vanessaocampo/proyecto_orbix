import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as proveedorController from './proveedor.controller'
import { createProveedorSchema, updateProveedorSchema } from './proveedor.schemas'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(proveedorController.list))
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(proveedorController.getById))

router.post(
  '/',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ body: createProveedorSchema }),
  asyncHandler(proveedorController.create),
)

router.patch(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema, body: updateProveedorSchema }),
  asyncHandler(proveedorController.update),
)

router.delete(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema }),
  asyncHandler(proveedorController.remove),
)

export default router
