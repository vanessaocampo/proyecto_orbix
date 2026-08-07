import { Request, Response } from 'express'
import * as reporteService from './reporte.service'

export async function create(req: Request, res: Response) {
  const reporte = await reporteService.create({ ...req.body, idUsuario: req.user!.id })
  res.status(201).json({ success: true, data: reporte })
}

export async function list(req: Request, res: Response) {
  const { items, meta } = await reporteService.list(req.query)
  res.status(200).json({ success: true, data: items, meta })
}

export async function getById(req: Request, res: Response) {
  const reporte = await reporteService.getById(Number(req.params.id))
  res.status(200).json({ success: true, data: reporte })
}

export async function remove(req: Request, res: Response) {
  await reporteService.remove(Number(req.params.id))
  res.status(204).end()
}

export async function resumen(_req: Request, res: Response) {
  const data = await reporteService.resumen()
  res.status(200).json({ success: true, data })
}

export async function ventasPorCategoria(_req: Request, res: Response) {
  const data = await reporteService.ventasPorCategoria()
  res.status(200).json({ success: true, data })
}

export async function ultimasVentas(req: Request, res: Response) {
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 10
  const data = await reporteService.ultimasVentas(limit)
  res.status(200).json({ success: true, data })
}

export async function productosPorProveedor(_req: Request, res: Response) {
  const data = await reporteService.productosPorProveedor()
  res.status(200).json({ success: true, data })
}
