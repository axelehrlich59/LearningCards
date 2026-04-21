import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { prisma } from "../prisma";
import {
  conceptIdParamsSchema,
  createConceptSchema,
  updateConceptSchema,
  updateReviewStatusSchema,
} from "../schemas/concepts.schema";

export async function conceptsRoutes(app: FastifyInstance) {
  app.get("/concepts", async () => {
    return prisma.concept.findMany({
      orderBy: { updatedAt: "desc" },
      include: { quizQuestions: true },
    });
  });

  app.post("/concepts", async (request, reply) => {
    const body = createConceptSchema.parse(request.body);
    const concept = await prisma.concept.create({ data: body });

    return reply.code(201).send(concept);
  });

  app.get("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: { quizQuestions: true },
    });

    if (!concept) {
      return reply.code(404).send({ message: "Concept introuvable" });
    }

    return concept;
  });

  app.patch("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const body = updateConceptSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      return reply.code(400).send({ message: "Aucun champ a mettre a jour" });
    }

    try {
      return await prisma.concept.update({
        where: { id },
        data: body,
      });
    } catch {
      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });

  app.patch("/concepts/:id/review-status", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const body = updateReviewStatusSchema.parse(request.body);

    try {
      return await prisma.concept.update({
        where: { id },
        data: body,
      });
    } catch {
      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });

  app.delete("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);

    try {
      await prisma.concept.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
