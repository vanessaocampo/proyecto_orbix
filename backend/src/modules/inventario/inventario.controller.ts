import { Request, Response } from 'express'
import * as inventarioService from './inventario.service'

export async function entrada(req: Request, res: Response) {
  const movimiento = await inventarioService.entrada({ ...req.body, idUsuario: req.user!.id })
  res.status(201).json({ success: true, data: movimiento })
}

export async function salida(req: Request, res: Response) {
  const movimiento = await inventarioService.salida({ ...req.body, idUsuario: req.user!.id })
  res.status(201).json({ success: true, data: movimiento })
}

export async function devolucion(req: Request, res: Response) {
  const movimiento = await inventarioService.devolucion({ ...req.body, idUsuario: req.user!.id })
  res.status(201).json({ success: true, data: movimiento })
}

export async function ajuste(req: Request, res: Response) {
  const movimiento = await inventarioService.ajuste({ ...req.body, idUsuario: req.user!.id })
  res.status(201).json({ success: true, data: movimiento })
}

export async function listMovimientos(req: Request, res: Response) {
  const { items, meta } = await inventarioService.listMovimientos(req.query)
  res.status(200).json({ success: true, data: items, meta })
}

export async function alertas(_req: Request, res: Response) {
  const items = await inventarioService.alertas()
  res.status(200).json({ success: true, data: items })
}
