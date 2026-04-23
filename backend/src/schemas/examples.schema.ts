import { z } from "zod";

export const conceptExampleParamsSchema = z.object({
  conceptId: z.string().min(1),
});

export const exampleIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createExampleSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1, "L'exemple concret est obligatoire"),
});

export const updateExampleSchema = createExampleSchema.partial();
