import type { FastifyInstance } from "fastify";
import { isRecordNotFoundError } from "../lib/prisma-errors";
import { prisma } from "../prisma";
import {
  conceptInteractionParamsSchema,
  createInteractionSchema,
  interactionIdParamsSchema,
  updateInteractionSchema,
} from "../schemas/interactions.schema";

export async function interactionsRoutes(app: FastifyInstance) {
  app.post("/concepts/:conceptId/interactions", async (request, reply) => {
    const { conceptId } = conceptInteractionParamsSchema.parse(request.params);
    const body = createInteractionSchema.parse(request.body);

    const concept = await prisma.concept.findUnique({ where: { id: conceptId } });

    if (!concept) {
      return reply.code(404).send({ message: "Concept introuvable" });
    }

    const interaction = await prisma.interaction.create({
      data: {
        conceptId,
        ...body,
      },
    });

    return reply.code(201).send(interaction);
  });

  app.patch("/interactions/:id", async (request, reply) => {
    const { id } = interactionIdParamsSchema.parse(request.params);
    const body = updateInteractionSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      return reply.code(400).send({ message: "Aucun champ a mettre a jour" });
    }

    try {
      return await prisma.interaction.update({
        where: { id },
        data: body,
      });
    } catch (error) {
      if (!isRecordNotFoundError(error)) {
        throw error;
      }

      return reply.code(404).send({ message: "Interaction introuvable" });
    }
  });

  app.delete("/interactions/:id", async (request, reply) => {
    const { id } = interactionIdParamsSchema.parse(request.params);

    try {
      await prisma.interaction.delete({ where: { id } });
      return reply.code(204).send();
    } catch (error) {
      if (!isRecordNotFoundError(error)) {
        throw error;
      }

      return reply.code(404).send({ message: "Interaction introuvable" });
    }
  });
}
