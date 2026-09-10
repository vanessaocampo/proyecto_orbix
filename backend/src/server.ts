import { createApp } from './app'
import { env } from './config/env'

const app = createApp()

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Orbix API corriendo en http://localhost:${env.PORT}/api/v1`)
})

function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} recibido, cerrando servidor...`)
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
