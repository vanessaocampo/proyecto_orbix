import { Request, Response } from 'express'
import * as authService from './auth.service'

export async function login(req: Request, res: Response) {
  const { correo, password } = req.body as { correo: string; password: string }
  const result = await authService.login({ correo, password })
  res.status(200).json({ success: true, data: result })
}

export async function perfil(req: Request, res: Response) {
  const usuario = await authService.getPerfil(req.user!.id)
  res.status(200).json({ success: true, data: usuario })
}

export async function changePassword(req: Request, res: Response) {
  await authService.changePassword({
    idUsuario: req.user!.id,
    passwordActual: req.body.passwordActual,
    passwordNueva: req.body.passwordNueva,
  })
  res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' })
}
