import { Request, Response } from 'express'
import * as authService from './auth.service'
import { env } from '../../config/env'

export async function login(req: Request, res: Response) {
  const { correo, password, captcha } = req.body as any
  const result = await authService.login({ correo, password, captcha })

  // Send refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.status(200).json({ 
    success: true, 
    data: { token: result.accessToken, usuario: result.usuario } 
  })
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token requerido' })
  }

  const result = await authService.refreshTokenLogic(refreshToken)

  res.status(200).json({
    success: true,
    data: { token: result.accessToken }
  })
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

export async function logout(req: Request, res: Response) {
  res.clearCookie('refreshToken')
  res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' })
}
