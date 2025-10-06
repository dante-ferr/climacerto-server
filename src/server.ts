import dns from 'dns'
import 'reflect-metadata'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { analyzeContainer } from './modules/analyze/assets/analyze-container.js'
import { registerControllers } from './modules/shared/decorators/routes.js'
import { errorHandler } from './modules/shared/middlewares/error-middleware.js'
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"

dns.setDefaultResultOrder('ipv4first')

async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(helmet)
  await app.register(cors, {
    origin: "https://climacerto.onrender.com/"
  })
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  })

  app.setErrorHandler(errorHandler)
  registerControllers(app, "api", analyzeContainer)

  return app
}

let cachedApp: FastifyInstance

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await buildApp()
    await cachedApp.ready()
  }

  cachedApp.server.emit('request', req, res)
}