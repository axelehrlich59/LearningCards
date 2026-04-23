import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { conceptsRoutes } from "./routes/concepts.routes";
import { examplesRoutes } from "./routes/examples.routes";
import { interactionsRoutes } from "./routes/interactions.routes";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      message: "Donnees invalides",
      errors: error.issues,
    });
  }

  app.log.error(error);
  return reply.code(500).send({ message: "Erreur serveur" });
});

app.get("/health", async () => {
  return { status: "ok" };
});

await app.register(conceptsRoutes);
await app.register(examplesRoutes);
await app.register(interactionsRoutes);

const port = Number(process.env["API_PORT"] ?? 3000);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
