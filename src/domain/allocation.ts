import {
  availableCapacity,
  simulate,
  type Option,
  type Scenario,
} from "./engine";

export interface DayAllocation {
  day: number;
  capacity: number;
  reserve: number;
  assignments: { taskId: string; units: number }[];
  available: number;
}
export type Allocation =
  { fits: false; days: null } | { fits: true; days: DayAllocation[] };

/** EDF; ties retain original input order, with the new request last. */
export function allocate(
  s: Scenario,
  plan: Pick<Option, "deferred" | "requestUnits">,
): Allocation {
  const checked = simulate(s, plan.deferred, plan.requestUnits);
  if (!checked.result.fits) return { fits: false, days: null };
  const remaining = [
    ...s.tasks.filter((t) => !checked.deferred.includes(t.id)),
    { ...s.request, units: checked.requestUnits },
  ]
    .map((task, order) => ({ ...task, order, remaining: task.units }))
    .sort((a, b) => a.deadline - b.deadline || a.order - b.order);
  const days = availableCapacity(s).map((capacity, day) => {
    let available = capacity;
    const assignments: DayAllocation["assignments"] = [];
    for (const task of remaining) {
      const units = Math.min(available, task.remaining);
      if (!units) continue;
      if (day > task.deadline)
        throw new Error("Feasibility/allocation mismatch: missed deadline.");
      assignments.push({ taskId: task.id, units });
      task.remaining -= units;
      available -= units;
    }
    return {
      day,
      capacity,
      reserve: s.reserve?.[day] ?? 0,
      assignments,
      available,
    };
  });
  if (remaining.some((t) => t.remaining !== 0))
    throw new Error("Feasibility/allocation mismatch: incomplete work.");
  return { fits: true, days };
}
