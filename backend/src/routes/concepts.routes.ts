import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { prisma } from "../prisma";
import {
  conceptIdParamsSchema,
  createConceptSchema,
  reviewConceptSchema,
  updateConceptSchema,
} from "../schemas/concepts.schema";

const reviewDelayByLevel = {
  SEEN: 1,
  UNDERSTOOD: 3,
  USED: 7,
  EXPLAINED: 14,
} as const;

type ConceptLevel = keyof typeof reviewDelayByLevel;

function getNextReviewDate(level: ConceptLevel) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + reviewDelayByLevel[level]);
  return nextDate;
}

export async function conceptsRoutes(app: FastifyInstance) {
  app.get("/concepts", async () => {
    return prisma.concept.findMany({
      orderBy: { updatedAt: "desc" },
      include: { examples: true, interactions: true },
    });
  });

  app.post("/concepts", async (request, reply) => {
    const body = createConceptSchema.parse(request.body);
    const { examples, interactions, ...conceptData } = body;
    const concept = await prisma.concept.create({
      data: {
        ...conceptData,
        nextReviewAt: getNextReviewDate("SEEN"),
        examples: examples ? { create: examples } : undefined,
        interactions: interactions ? { create: interactions } : undefined,
      },
      include: { examples: true, interactions: true },
    });

    return reply.code(201).send(concept);
  });

  app.get("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: { examples: true, interactions: true },
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
        include: { examples: true, interactions: true },
      });
    } catch {
      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });

  app.post("/concepts/:id/review", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const { level } = reviewConceptSchema.parse(request.body);

    try {
      return await prisma.concept.update({
        where: { id },
        data: {
          level,
          lastReviewedAt: new Date(),
          nextReviewAt: getNextReviewDate(level),
        },
        include: { examples: true, interactions: true },
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

  app.get("/reviews/due", async () => {
    return prisma.concept.findMany({
      where: {
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
      },
      orderBy: { nextReviewAt: "asc" },
      include: { examples: true, interactions: true },
    });
  });
}

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}
