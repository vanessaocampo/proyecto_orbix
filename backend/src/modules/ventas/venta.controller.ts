import { Request, Response } from 'express'
import * as ventaService from './venta.service'

export async function create(req: Request, res: Response) {
  const venta = await ventaService.create({
    ...req.body,
    idUsuario: req.user!.id,
  })
  res.status(201).json({ success: true, data: venta })
}

export async function list(req: Request, res: Response) {
  const { items, meta } = await ventaService.list(req.query)
  res.status(200).json({ success: true, data: items, meta })
}

export async function getById(req: Request, res: Response) {
  const venta = await ventaService.getById(Number(req.params.id))
  res.status(200).json({ success: true, data: venta })
}

export async function updateEstado(req: Request, res: Response) {
  const venta = await ventaService.updateEstado({
    id: Number(req.params.id),
    estado: req.body.estado,
  })
  res.status(200).json({ success: true, data: venta })
}

export async function remove(req: Request, res: Response) {
  await ventaService.remove(Number(req.params.id))
  res.status(204).end()
}
