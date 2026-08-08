import { Request, Response } from 'express'
import * as productoService from './producto.service'

export async function create(req: Request, res: Response) {
  const producto = await productoService.create(req.body)
  res.status(201).json({ success: true, data: producto })
}

export async function list(req: Request, res: Response) {
  const { items, meta } = await productoService.list(req.query)
  res.status(200).json({ success: true, data: items, meta })
}

export async function getById(req: Request, res: Response) {
  const producto = await productoService.getById(Number(req.params.id))
  res.status(200).json({ success: true, data: producto })
}

export async function update(req: Request, res: Response) {
  const producto = await productoService.update(Number(req.params.id), req.body)
  res.status(200).json({ success: true, data: producto })
}

export async function remove(req: Request, res: Response) {
  await productoService.remove(Number(req.params.id))
  res.status(204).end()
}
