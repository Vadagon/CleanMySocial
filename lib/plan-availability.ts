import type { Plan } from "./extensions";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Public 3-day passes alternate globally by UTC day. Epoch-day parity is used
 * instead of the day of the month so the schedule also alternates correctly
 * across month and year boundaries.
 */
export function isPublicPassDay(now: number | Date = Date.now()): boolean {
  const timestamp = now instanceof Date ? now.getTime() : now;
  return Math.floor(timestamp / DAY_MS) % 2 === 0;
}

export function publicPlansForToday(plans: Plan[], now: number | Date = Date.now()): Plan[] {
  return isPublicPassDay(now) ? plans : plans.filter((plan) => plan.access !== "pass");
}

/** Stable server-rendered plans; the client adds the pass on pass days. */
export function plansWithoutPublicPass(plans: Plan[]): Plan[] {
  return plans.filter((plan) => plan.access !== "pass");
}
