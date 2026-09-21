import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  PORT: z.coerce.number().int().positive().default(3000),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres'),

  // Tiempo de expiración del access token.
  JWT_EXPIRES_IN: z.string().default('4h'),

  // Tiempo de expiración del refresh token.
  JWT_REFRESH_EXPIRES_IN: z.string().default('24h'),

  RECAPTCHA_SECRET_KEY: z.string().min(1, 'RECAPTCHA_SECRET_KEY es obligatoria'),

  AZURE_EMAIL_CONNECTION_STRING: z.string().min(1, 'AZURE_EMAIL_CONNECTION_STRING es obligatoria'),

  AZURE_EMAIL_FROM: z.string().email('AZURE_EMAIL_FROM debe ser un correo válido'),

})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {

  // eslint-disable-next-line no-console
  console.error(
    ' Variables de entorno inválidas:',
    parsed.error.flatten().fieldErrors
  )

  throw new Error('Configuración de entorno inválida')
}

export const env = parsed.data