import { z } from "zod";

export const conceptInteractionParamsSchema = z.object({
  conceptId: z.string().min(1),
});

export const interactionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const interactionTypeSchema = z.enum(["FLASHCARD", "QUIZ", "PROMPT"]);

export const createInteractionSchema = z.object({
  type: interactionTypeSchema,
  prompt: z.string().trim().min(1, "La consigne est obligatoire"),
  answer: z.string().trim().min(1).optional(),
});

export const updateInteractionSchema = createInteractionSchema.partial();
