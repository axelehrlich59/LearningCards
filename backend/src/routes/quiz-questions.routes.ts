import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import {
  conceptQuizParamsSchema,
  createQuizQuestionSchema,
  quizQuestionIdParamsSchema,
  updateQuizQuestionSchema,
} from "../schemas/quiz-questions.schema";

export async function quizQuestionsRoutes(app: FastifyInstance) {
  app.post("/concepts/:conceptId/quiz-questions", async (request, reply) => {
    const { conceptId } = conceptQuizParamsSchema.parse(request.params);
    const body = createQuizQuestionSchema.parse(request.body);

    const concept = await prisma.concept.findUnique({ where: { id: conceptId } });

    if (!concept) {
      return reply.code(404).send({ message: "Concept introuvable" });
    }

    const quizQuestion = await prisma.quizQuestion.create({
      data: {
        conceptId,
        ...body,
      },
    });

    return reply.code(201).send(quizQuestion);
  });

  app.patch("/quiz-questions/:id", async (request, reply) => {
    const { id } = quizQuestionIdParamsSchema.parse(request.params);
    const body = updateQuizQuestionSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      return reply.code(400).send({ message: "Aucun champ a mettre a jour" });
    }

    try {
      return await prisma.quizQuestion.update({
        where: { id },
        data: body,
      });
    } catch {
      return reply.code(404).send({ message: "Question introuvable" });
    }
  });

  app.delete("/quiz-questions/:id", async (request, reply) => {
    const { id } = quizQuestionIdParamsSchema.parse(request.params);

    try {
      await prisma.quizQuestion.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ message: "Question introuvable" });
    }
  });
}
