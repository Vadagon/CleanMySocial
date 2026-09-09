import type { Plan } from "@/lib/extensions";

function trim(value: string): string {
  return value.replace(/\.00$/, "");
}

export default function PriceSummary({ plans }: { plans: Plan[] }) {
  const pass = plans.find((plan) => plan.access === "pass");
  const monthly = plans.find((plan) => plan.access === "subscription");
  const lifetime = plans.find((plan) => plan.access === "lifetime");
  const summary = [
    pass ? `${trim(pass.price)} / 3 days` : null,
    monthly ? `${trim(monthly.price)}/mo` : null,
    lifetime ? `${trim(lifetime.price)} lifetime` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return <>{summary || "Free — nothing to buy"}</>;
}
