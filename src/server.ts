import dns from 'dns'
import 'reflect-metadata'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { analyzeContainer } from './modules/analyze/assets/analyze-container.js'
import { registerControllers } from './modules/shared/decorators/routes.js'
import { errorHandler } from './modules/shared/middlewares/error-middleware.js'
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"

dns.setDefaultResultOrder('ipv4first')

async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(helmet)

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  })

  // Configuração CORS manual
  app.addHook('preHandler', (request, reply, done) => {
    // Defina as origens permitidas
    const allowedOrigins = [
      "https://climacerto.onrender.com/",
      "https://climacerto-server-no3v5q7wc-therodrig0s-projects.vercel.app/"
    ];
    const origin = request.headers.origin;

    if (allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
    }

    // Defina os métodos permitidos (apenas GET)
    reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Responda imediatamente a requisições pre-flight (OPTIONS)
    if (request.method === 'OPTIONS') {
      reply.statusCode = 200;
      reply.send();
      return;
    }

    done();
  });

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
