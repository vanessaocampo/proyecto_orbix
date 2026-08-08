import { Request, Response } from 'express'
import * as clienteService from './cliente.service'

export async function create(req: Request, res: Response) {
  const cliente = await clienteService.create(req.body)
  res.status(201).json({ success: true, data: cliente })
}

export async function list(req: Request, res: Response) {
  const { page, limit, search, segmento } = req.query as {
    page?: string
    limit?: string
    search?: string
    segmento?: string
  }
  const { items, meta } = await clienteService.list({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
    segmento: segmento as clienteService.ListQuery['segmento'],
  })
  res.status(200).json({ success: true, data: items, meta })
}

export async function getById(req: Request, res: Response) {
  const cliente = await clienteService.getById(Number(req.params.id))
  res.status(200).json({ success: true, data: cliente })
}

export async function update(req: Request, res: Response) {
  const cliente = await clienteService.update(Number(req.params.id), req.body)
  res.status(200).json({ success: true, data: cliente })
}

export async function remove(req: Request, res: Response) {
  await clienteService.remove(Number(req.params.id))
  res.status(204).end()
}
