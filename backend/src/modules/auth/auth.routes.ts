import { Router } from 'express'
import { authenticate } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as authController from './auth.controller'
import { changePasswordSchema, loginSchema } from './auth.schemas'

const router = Router()

router.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login))

router.get('/me', authenticate, asyncHandler(authController.perfil))

router.patch(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
)

export default router
