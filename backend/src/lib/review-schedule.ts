import type { ConceptLevel } from "../generated/prisma/enums";

const reviewDelayByLevel = {
  SEEN: 1,
  UNDERSTOOD: 3,
  USED: 7,
  EXPLAINED: 14,
} as const satisfies Record<ConceptLevel, number>;

export function getNextReviewDate(level: ConceptLevel) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + reviewDelayByLevel[level]);
  return nextDate;
}
