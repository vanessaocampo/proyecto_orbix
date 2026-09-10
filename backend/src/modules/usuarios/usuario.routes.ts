import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as usuarioController from './usuario.controller'
import { createUsuarioSchema, updateUsuarioSchema } from './usuario.schemas'

const router = Router()

router.use(authenticate, authorize(RolUsuario.admin))

router.get('/', asyncHandler(usuarioController.list))
router.get('/:id', validate({ params: idParamSchema }), asyncHandler(usuarioController.getById))

router.post('/', validate({ body: createUsuarioSchema }), asyncHandler(usuarioController.create))

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateUsuarioSchema }),
  asyncHandler(usuarioController.update),
)

router.delete('/:id', validate({ params: idParamSchema }), asyncHandler(usuarioController.remove))

export default router
