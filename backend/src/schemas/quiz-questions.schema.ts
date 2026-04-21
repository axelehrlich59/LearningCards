import { z } from "zod";

export const conceptQuizParamsSchema = z.object({
  conceptId: z.string().min(1),
});

export const quizQuestionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createQuizQuestionSchema = z.object({
  question: z.string().trim().min(1, "La question est obligatoire"),
  answer: z.string().trim().min(1, "La reponse est obligatoire"),
});

export const updateQuizQuestionSchema = createQuizQuestionSchema.partial();
