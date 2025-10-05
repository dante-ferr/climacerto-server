import 'reflect-metadata'
import Fastify from 'fastify'
import { analyzeContainer } from './modules/analyze/assets/analyze-container.js'
import { registerControllers } from './modules/shared/decorators/routes.js'
import { errorHandler } from './modules/shared/middlewares/error-middleware.js'
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

const app = Fastify({ logger: true });

await app.register(helmet);

await app.register(cors);

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

app.setErrorHandler(errorHandler);
registerControllers(app, "api", analyzeContainer);

app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});