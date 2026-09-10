import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as categoriaController from './categoria.controller'
import { createCategoriaSchema, updateCategoriaSchema } from './categoria.schemas'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(categoriaController.list))
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(categoriaController.getById))

router.post(
  '/',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ body: createCategoriaSchema }),
  asyncHandler(categoriaController.create),
)

router.patch(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema, body: updateCategoriaSchema }),
  asyncHandler(categoriaController.update),
)

router.delete(
  '/:id',
  authorize(RolUsuario.admin, RolUsuario.inventario),
  validate({ params: idParamSchema }),
  asyncHandler(categoriaController.remove),
)

export default router
