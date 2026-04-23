import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import {
  conceptExampleParamsSchema,
  createExampleSchema,
  exampleIdParamsSchema,
  updateExampleSchema,
} from "../schemas/examples.schema";

export async function examplesRoutes(app: FastifyInstance) {
  app.post("/concepts/:conceptId/examples", async (request, reply) => {
    const { conceptId } = conceptExampleParamsSchema.parse(request.params);
    const body = createExampleSchema.parse(request.body);

    const concept = await prisma.concept.findUnique({ where: { id: conceptId } });

    if (!concept) {
      return reply.code(404).send({ message: "Concept introuvable" });
    }

    const example = await prisma.example.create({
      data: {
        conceptId,
        ...body,
      },
    });

    return reply.code(201).send(example);
  });

  app.patch("/examples/:id", async (request, reply) => {
    const { id } = exampleIdParamsSchema.parse(request.params);
    const body = updateExampleSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      return reply.code(400).send({ message: "Aucun champ a mettre a jour" });
    }

    try {
      return await prisma.example.update({
        where: { id },
        data: body,
      });
    } catch {
      return reply.code(404).send({ message: "Exemple introuvable" });
    }
  });

  app.delete("/examples/:id", async (request, reply) => {
    const { id } = exampleIdParamsSchema.parse(request.params);

    try {
      await prisma.example.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ message: "Exemple introuvable" });
    }
  });
}
