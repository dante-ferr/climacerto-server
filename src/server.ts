import 'reflect-metadata'
import Fastify from 'fastify'
import { analyzeContainer } from './modules/analyze/assets/analyze-container.js'
import { registerControllers } from './modules/shared/decorators/routes.js'
import { errorHandler } from './modules/shared/middlewares/error-middleware.js'
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors);

app.setErrorHandler(errorHandler);
registerControllers(app, "api", analyzeContainer);

app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});