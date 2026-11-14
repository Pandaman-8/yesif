import { hours, simulate } from "../domain/engine";
import type { SavedDecision } from "../storage/scenarios";

export function savedDate(d: SavedDecision) {
  return new Date(d.created).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Presentation only: derive labels without modifying a saved snapshot.
export function savedChoiceLabel(d: SavedDecision, index: number) {
  const plan = simulate(d.scenario, d.plan.deferred, d.plan.requestUnits);
  const moved = d.scenario.tasks.filter((t) => plan.deferred.includes(t.id));
  const changes = [];
  if (moved.length)
    changes.push(`Move ${hours(moved.reduce((n, t) => n + t.units, 0))}h`);
  if (plan.requestUnits < d.scenario.request.units)
    changes.push(`Scope ${hours(plan.requestUnits)}h`);
  const name = d.scenario.request.name;
  return `${index + 1}. ${name.length > 20 ? name.slice(0, 19) + "…" : name} · ${changes.join(" + ") || "Keep plan"}`;
}
