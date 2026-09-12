import { Router } from 'express'
import { authenticate } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as authController from './auth.controller'
import { changePasswordSchema, loginSchema } from './auth.schemas'

import { rateLimit } from 'express-rate-limit'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5, // Límite de 5 intentos fallidos/exitosos de login por IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión desde esta IP, por favor intente de nuevo después de 15 minutos' }
})

router.post('/login', loginLimiter, validate({ body: loginSchema }), asyncHandler(authController.login))
router.post('/refresh', asyncHandler(authController.refresh))
router.post('/logout', asyncHandler(authController.logout))

router.get('/me', authenticate, asyncHandler(authController.perfil))

router.patch(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
)

export default router
