import 'reflect-metadata'
import Fastify from 'fastify'
import { analyzeContainer } from './modules/analyze/assets/analyze-container.js'
import { registerControllers } from './modules/shared/decorators/routes.js'
import { errorHandler } from './modules/shared/middlewares/error-middleware.js'

const app = Fastify()

app.setErrorHandler(errorHandler)
registerControllers(app, 'api', analyzeContainer)

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server running at ${address}`)
})