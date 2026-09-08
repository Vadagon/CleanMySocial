"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/extensions";
import { plansWithoutPublicPass, publicPlansForToday } from "@/lib/plan-availability";

function summary(plans: Plan[]): string {
  if (plans.length === 0) return "Free — nothing to buy";
  const pass = plans.find((plan) => plan.access === "pass");
  const monthly = plans.find((plan) => plan.access === "subscription");
  const lifetime = plans.find((plan) => plan.access === "lifetime");
  const trim = (value: string) => value.replace(/\.00$/, "");
  return [
    pass ? `${trim(pass.price)} / 3 days` : null,
    monthly ? `${trim(monthly.price)}/mo` : null,
    lifetime ? `${trim(lifetime.price)} lifetime` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function AlternatingPriceSummary({ plans }: { plans: Plan[] }) {
  const [visiblePlans, setVisiblePlans] = useState(() => plansWithoutPublicPass(plans));

  useEffect(() => {
    setVisiblePlans(publicPlansForToday(plans));
  }, [plans]);

  return <>{summary(visiblePlans)}</>;
}
