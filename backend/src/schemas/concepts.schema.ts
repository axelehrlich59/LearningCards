import { z } from "zod";

export const conceptIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createConceptSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire"),
  explanation: z.string().trim().min(1, "L'explication est obligatoire"),
  problemSolved: z.string().trim().min(1, "Le probleme resolu est obligatoire"),
  concreteExample: z.string().trim().min(1, "L'exemple concret est obligatoire"),
});

export const updateConceptSchema = createConceptSchema.partial();

export const updateReviewStatusSchema = z.object({
  reviewStatus: z.enum(["TO_REVIEW", "REVIEWED"]),
});
