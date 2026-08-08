import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as inventarioController from './inventario.controller'
import {
  ajusteSchema,
  entradaSchema,
  listMovimientosQuerySchema,
  salidaSchema,
} from './inventario.schemas'

const router = Router()

router.use(authenticate, authorize(RolUsuario.admin, RolUsuario.inventario))

router.post('/entrada', validate({ body: entradaSchema }), asyncHandler(inventarioController.entrada))
router.post('/salida', validate({ body: salidaSchema }), asyncHandler(inventarioController.salida))
router.post(
  '/devolucion',
  validate({ body: entradaSchema }),
  asyncHandler(inventarioController.devolucion),
)
router.post(
  '/ajuste',
  validate({ body: ajusteSchema }),
  asyncHandler(inventarioController.ajuste),
)
router.get(
  '/movimientos',
  validate({ query: listMovimientosQuerySchema }),
  asyncHandler(inventarioController.listMovimientos),
)
router.get('/alertas', asyncHandler(inventarioController.alertas))

export default router
