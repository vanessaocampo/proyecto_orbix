import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes'
import { notFound, errorHandler } from './middlewares/errorHandler'

export function createApp(): Express {
  const app = express()

  app.use(helmet())
  app.use(cors())
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
