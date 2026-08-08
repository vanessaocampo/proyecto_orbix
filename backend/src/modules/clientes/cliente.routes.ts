import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as clienteController from './cliente.controller'
import { createClienteSchema, updateClienteSchema } from './cliente.schemas'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(clienteController.list))
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(clienteController.getById))

router.post(
  '/',
  authorize(RolUsuario.admin, RolUsuario.vendedor, RolUsuario.inventario),
  validate({ body: createClienteSchema }),
  asyncHandler(clienteController.create),
)

router.patch(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.vendedor, RolUsuario.inventario),
  validate({ params: idParamSchema, body: updateClienteSchema }),
  asyncHandler(clienteController.update),
)

router.delete(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema }),
  asyncHandler(clienteController.remove),
)

export default router
