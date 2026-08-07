import { Request, Response } from 'express'
import * as usuarioService from './usuario.service'

export async function create(req: Request, res: Response) {
  const usuario = await usuarioService.create(req.body)
  res.status(201).json({ success: true, data: usuario })
}

export async function list(req: Request, res: Response) {
  const { page, limit, search } = req.query as { page?: string; limit?: string; search?: string }
  const { items, meta } = await usuarioService.list({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search,
  })
  res.status(200).json({ success: true, data: items, meta })
}

export async function getById(req: Request, res: Response) {
  const usuario = await usuarioService.getById(Number(req.params.id))
  res.status(200).json({ success: true, data: usuario })
}

export async function update(req: Request, res: Response) {
  const usuario = await usuarioService.update(Number(req.params.id), req.body)
  res.status(200).json({ success: true, data: usuario })
}

export async function remove(req: Request, res: Response) {
  await usuarioService.remove(Number(req.params.id), req.user!.id)
  res.status(204).end()
}
