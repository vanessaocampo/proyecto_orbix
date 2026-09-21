import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../../config/env'
import { prisma } from '../../config/prisma'
import { ApiError } from '../../utils/ApiError'
import crypto from 'crypto'
import { sendEmail } from '../correo/email.service'

type LoginInput = {
  correo: string
  password: string
  captcha: string
}

type ChangePasswordInput = {
  idUsuario: string
  passwordActual: string
  passwordNueva: string
}

async function verificarRecaptcha(captcha: string) {
  if (process.env.NODE_ENV !== 'production') return; // BYPASS IN DEV

  const response = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY,
        response: captcha
      }),
    }
  )

  const data = await response.json() as {
    success: boolean
    'error-codes'?: string[]
  }

  if (!data.success) {
    throw ApiError.unauthorized(
      'La verificaciÃ³n reCAPTCHA no es vÃ¡lida'
    )
  }
}

export function signAccessToken(
  payload: {
    id: string
    correo: string
    rol: string
  }
): string {
  // La duración del access token se configura desde el archivo .env.
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  }

  return jwt.sign(
    {
      sub: payload.id.toString(),
      correo: payload.correo,
      rol: payload.rol,
      type: 'access'
    },
    env.JWT_SECRET,
    options
  )
}

export function signRefreshToken(
  payload: {
    id: string
  }
): string {
  // La duración del refresh token se configura desde el archivo .env.
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']
  }

  return jwt.sign(
    {
      sub: payload.id.toString(),
      type: 'refresh'
    },
    env.JWT_SECRET,
    options
  )
}

export async function login(input: LoginInput) {
  await verificarRecaptcha(input.captcha)

  const usuario = await prisma.usuario.findUnique({
    where: { correo: input.correo }
  })

  if (!usuario) {
    throw ApiError.unauthorized(
      'Credenciales invÃ¡lidas'
    )
  }

  if (usuario.estado !== 'activo') {
    throw ApiError.unauthorized(
      'El usuario estÃ¡ inactivo'
    )
  }

  const passwordValida = await bcrypt.compare(
    input.password,
    usuario.passwordHash
  )

  if (!passwordValida) {
    throw ApiError.unauthorized(
      'Credenciales invÃ¡lidas'
    )
  }

  const accessToken = signAccessToken({
    id: usuario.idUsuario,
    correo: usuario.correo,
    rol: usuario.rol
  })

  const refreshToken = signRefreshToken({
    id: usuario.idUsuario
  })

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    },
  }
}

export async function getPerfil(idUsuario: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    select: {
      idUsuario: true,
      nombre: true,
      correo: true,
      rol: true,
      estado: true,
      createdAt: true,
      identificacion: true,
      correoPersonal: true,
      direccion: true,
      celular: true,
      fechaNacimiento: true,
      fechaIngreso: true
    },
  })

  if (!usuario) {
    throw ApiError.notFound(
      'Usuario no encontrado'
    )
  }

  return usuario
}

export async function changePassword(
  input: ChangePasswordInput
) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      idUsuario: input.idUsuario
    }
  })

  if (!usuario) {
    throw ApiError.notFound(
      'Usuario no encontrado'
    )
  }

  const passwordValida = await bcrypt.compare(
    input.passwordActual,
    usuario.passwordHash
  )

  if (!passwordValida) {
    throw ApiError.unauthorized(
      'La contraseÃ±a actual no es correcta'
    )
  }

  const passwordHash = await bcrypt.hash(
    input.passwordNueva,
    10
  )

  await prisma.usuario.update({
    where: {
      idUsuario: input.idUsuario
    },
    data: {
      passwordHash
    }
  })
}

export async function refreshTokenLogic(
  token: string
) {
  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    ) as {
      sub: string
      type: string
    }

    if (payload.type !== 'refresh') {
      throw ApiError.unauthorized(
        'Token no es de tipo refresh'
      )
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: payload.sub
      }
    })

    if (
      !usuario ||
      usuario.estado !== 'activo'
    ) {
      throw ApiError.unauthorized(
        'Usuario invÃ¡lido o inactivo'
      )
    }

    const accessToken = signAccessToken({
      id: usuario.idUsuario,
      correo: usuario.correo,
      rol: usuario.rol
    })

    return { accessToken }
  } catch (error) {
    throw ApiError.unauthorized(
      'Refresh token invÃ¡lido o expirado'
    )
  }
}

export async function updateProfile(
  idUsuario: string,
  data: {
    nombre?: string
    celular?: string
    direccion?: string
  }
) {
  const usuario = await prisma.usuario.update({
    where: { idUsuario },
    data,
    select: {
      idUsuario: true,
      nombre: true,
      correo: true,
      rol: true,
      identificacion: true,
      correoPersonal: true,
      celular: true,
      direccion: true,
      fechaNacimiento: true,
      fechaIngreso: true,
      estado: true
    }
  })

  return usuario
}

export async function forgotPassword(
  correo: string
) {
  const usuario = await prisma.usuario.findUnique({
    where: { correo },
  })

  if (!usuario) {
    return
  }

  if (usuario.estado !== 'activo') {
    return
  }

  // Verificar que el usuario tenga un correo personal registrado
  if (!usuario.correoPersonal) {
    throw ApiError.badRequest(
      'El usuario no tiene un correo personal registrado'
    )
  }

  const token = crypto.randomBytes(32).toString('hex')

  const expires = new Date(
    Date.now() + 15 * 60 * 1000
  )

  await prisma.usuario.update({
    where: {
      idUsuario: usuario.idUsuario
    },
    data: {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    },
  })

  const frontendUrl = 'http://localhost:5173'

  const resetUrl =
    `${frontendUrl}/reset-password?token=${token}`

  const html = `
    <h2>Recuperación de contraseña - Orbix</h2>

    <p>Hola ${usuario.nombre},</p>

    <p>
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
    </p>

    <p>
      Haz clic en el siguiente botón para crear una nueva contraseña:
    </p>

    <p>
      <a
        href="${resetUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Restablecer contraseña
      </a>
    </p>

    <p>
      Este enlace será válido durante 15 minutos.
    </p>

    <p>
      Si tú no solicitaste este cambio, puedes ignorar este correo.
    </p>

    <p>
      Saludos,<br>
      Equipo Orbix
    </p>
  `

  // IMPORTANTE:
  // El correo de recuperación se envía al correo PERSONAL
  await sendEmail(
    usuario.correoPersonal,
    'Recuperación de contraseña - Orbix',
    html
  )
}

export async function resetPassword(
  token: string,
  passwordNueva: string
) {
  const usuario = await prisma.usuario.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
  })

  if (!usuario) {
    throw ApiError.badRequest(
      'El enlace de recuperación es inválido o ha expirado'
    )
  }

  const passwordHash = await bcrypt.hash(
    passwordNueva,
    10
  )

  await prisma.usuario.update({
    where: {
      idUsuario: usuario.idUsuario
    },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  })
}