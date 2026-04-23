import { z } from "zod";

export const conceptIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const conceptLevelSchema = z.enum([
  "SEEN",
  "UNDERSTOOD",
  "USED",
  "EXPLAINED",
]);

export const createConceptSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  personalExplanation: z.string().trim().min(1, "L'explication est obligatoire"),
  problemSolved: z.string().trim().min(1, "Le probleme resolu est obligatoire"),
  examples: z
    .array(
      z.object({
        title: z.string().trim().min(1).optional(),
        content: z.string().trim().min(1, "L'exemple concret est obligatoire"),
      }),
    )
    .optional(),
  interactions: z
    .array(
      z.object({
        type: z.enum(["FLASHCARD", "QUIZ", "PROMPT"]),
        prompt: z.string().trim().min(1, "La consigne est obligatoire"),
        answer: z.string().trim().min(1).optional(),
      }),
    )
    .optional(),
});

export const listConceptsQuerySchema = z.object({
  level: conceptLevelSchema.optional(),
  due: z.enum(["true", "false"]).optional(),
  search: z.string().trim().min(1).optional(),
});

export const updateConceptSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire").optional(),
  personalExplanation: z
    .string()
    .trim()
    .min(1, "L'explication est obligatoire")
    .optional(),
  problemSolved: z
    .string()
    .trim()
    .min(1, "Le probleme resolu est obligatoire")
    .optional(),
  level: conceptLevelSchema.optional(),
});

export const reviewConceptSchema = z.object({
  level: conceptLevelSchema,
});
