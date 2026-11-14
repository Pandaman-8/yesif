import {
  analyze,
  availableCapacity,
  feasibility,
  simulate,
  type Option,
  type Scenario,
} from "./engine";
/** V1 full-scope options remain preferred. Supply a combined starting point when none exists. */
export function startingOptions(s: Scenario): Option[] {
  const base = analyze(s).options;
  const full = base.filter((o) => o.kind !== "scope");
  const scope = base.find((o) => o.kind === "scope");
  if (full.length)
    return scope ? [...full.slice(0, 2), scope] : full.slice(0, 3);
  const movable = s.tasks.filter((t) => t.movable);
  const combined: Option[] = [];
  for (let mask = 1; mask < 2 ** movable.length; mask++) {
    const deferred = movable.filter((_, i) => mask & (1 << i)).map((t) => t.id);
    const remaining = feasibility(
      availableCapacity(s),
      s.tasks.filter((t) => !deferred.includes(t.id)),
    );
    if (!remaining.fits) continue;
    const units = Math.min(
      s.request.units,
      ...remaining.checkpoints
        .filter((c) => c.day >= s.request.deadline)
        .map((c) => c.available - c.due),
    );
    if (
      units < 1 ||
      units === s.request.units ||
      (scope && units <= scope.requestUnits)
    )
      continue;
    combined.push(simulate(s, deferred, units));
  }
  const minimal = combined.filter(
    (o) =>
      !combined.some(
        (p) =>
          p.deferred.length < o.deferred.length &&
          p.requestUnits >= o.requestUnits &&
          p.deferred.every((id) => o.deferred.includes(id)),
      ),
  );
  const high = (o: Option) =>
    s.tasks.filter((t) => o.deferred.includes(t.id) && t.priority === "high")
      .length;
  minimal.sort(
    (a, b) =>
      high(a) - high(b) ||
      a.deferred.length - b.deferred.length ||
      b.requestUnits - a.requestUnits ||
      a.id.localeCompare(b.id),
  );
  return [...(scope ? [scope] : []), ...minimal.slice(0, scope ? 2 : 3)];
}
