import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import routes from './routes'
import { notFound, errorHandler } from './middlewares/errorHandler'

import { rateLimit } from 'express-rate-limit'

export function createApp(): Express {
  const app = express()

  // Rate Limiting general
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 100, // Límite de 100 peticiones por ventana por IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos' }
  })
  app.use(limiter)

  app.use(helmet())
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
  app.use(cookieParser())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'))
  }

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Orbix API funcionando' })
  })

  app.use('/api/v1', routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
