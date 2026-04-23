import type { FastifyInstance } from "fastify";
import { Prisma } from "../generated/prisma/client";
import { isRecordNotFoundError } from "../lib/prisma-errors";
import { getNextReviewDate } from "../lib/review-schedule";
import { prisma } from "../prisma";
import {
  conceptIdParamsSchema,
  createConceptSchema,
  listConceptsQuerySchema,
  reviewConceptSchema,
  updateConceptSchema,
} from "../schemas/concepts.schema";

const conceptInclude = {
  examples: { orderBy: { createdAt: "asc" } },
  interactions: { orderBy: { createdAt: "asc" } },
} as const;

export async function conceptsRoutes(app: FastifyInstance) {
  app.get("/concepts", async (request) => {
    const { due, level, search } = listConceptsQuerySchema.parse(request.query);
    const now = new Date();
    const filters: Prisma.ConceptWhereInput[] = [];

    if (level) {
      filters.push({ level });
    }

    if (due === "true") {
      filters.push({
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      });
    }

    if (due === "false") {
      filters.push({ nextReviewAt: { gt: now } });
    }

    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { personalExplanation: { contains: search, mode: "insensitive" } },
          { problemSolved: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    return prisma.concept.findMany({
      where: filters.length > 0 ? { AND: filters } : undefined,
      orderBy: { updatedAt: "desc" },
      include: conceptInclude,
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
      include: conceptInclude,
    });

    return reply.code(201).send(concept);
  });

  app.get("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: conceptInclude,
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
        include: conceptInclude,
      });
    } catch (error) {
      if (!isRecordNotFoundError(error)) {
        throw error;
      }

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
        include: conceptInclude,
      });
    } catch (error) {
      if (!isRecordNotFoundError(error)) {
        throw error;
      }

      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });

  app.delete("/concepts/:id", async (request, reply) => {
    const { id } = conceptIdParamsSchema.parse(request.params);

    try {
      await prisma.concept.delete({ where: { id } });
      return reply.code(204).send();
    } catch (error) {
      if (!isRecordNotFoundError(error)) {
        throw error;
      }

      return reply.code(404).send({ message: "Concept introuvable" });
    }
  });

  app.get("/reviews/due", async () => {
    return prisma.concept.findMany({
      where: {
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }],
      },
      orderBy: { nextReviewAt: "asc" },
      include: conceptInclude,
    });
  });
}
