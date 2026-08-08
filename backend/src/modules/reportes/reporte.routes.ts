import { Router } from 'express'
import { RolUsuario } from '@prisma/client'
import { authenticate, authorize } from '../../middlewares/auth'
import { idParamSchema, validate } from '../../middlewares/validate'
import { asyncHandler } from '../../utils/asyncHandler'
import * as reporteController from './reporte.controller'
import { createReporteSchema, listReportesQuerySchema } from './reporte.schemas'

const router = Router()

router.use(authenticate)

router.get(
  '/',
  validate({ query: listReportesQuerySchema }),
  asyncHandler(reporteController.list),
)

router.get('/resumen', asyncHandler(reporteController.resumen))
router.get('/ventas-por-categoria', asyncHandler(reporteController.ventasPorCategoria))
router.get('/ultimas-ventas', asyncHandler(reporteController.ultimasVentas))
router.get('/productos-por-proveedor', asyncHandler(reporteController.productosPorProveedor))

router.get('/:id', validate({ params: idParamSchema }), asyncHandler(reporteController.getById))

router.post('/', validate({ body: createReporteSchema }), asyncHandler(reporteController.create))

router.delete(
  '/:id',
  authorize(RolUsuario.admin),
  validate({ params: idParamSchema }),
  asyncHandler(reporteController.remove),
)

export default router
