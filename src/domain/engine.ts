export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;
/** All effort is stored as integer 15-minute units. */
export interface Task {
  id: string;
  name: string;
  units: number;
  deadline: number;
  movable: boolean;
  priority: "normal" | "high";
}
export interface Scenario {
  capacity: number[];
  /** Optional explicit daily reserve; absent in V1 records. */
  reserve?: number[];
  tasks: Task[];
  request: Task;
}
export interface Checkpoint {
  day: number;
  available: number;
  due: number;
  deficit: number;
}
export interface Feasibility {
  fits: boolean;
  capacity: number;
  total: number;
  overload: number;
  checkpoints: Checkpoint[];
}
export interface Option {
  id: string;
  kind: "accept" | "defer" | "scope" | "combined";
  deferred: string[];
  requestUnits: number;
  result: Feasibility;
}
export const hours = (units: number) => `${units / 4}`;
const duration = (units: number) =>
  `${hours(units)} ${units === 4 ? "hour" : "hours"}`;
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const integer = (x: unknown, min: number, max: number) =>
  typeof x === "number" && Number.isInteger(x) && x >= min && x <= max;
export function validate(value: unknown): string[] {
  if (!record(value)) return ["Enter a valid workload."];
  const errors: string[] = [];
  if (
    !Array.isArray(value.capacity) ||
    value.capacity.length !== 5 ||
    !value.capacity.every((n) => integer(n, 0, 96))
  )
    errors.push("Enter 0–24 focused hours for each day, in 0.25-hour steps.");
  if (
    value.reserve !== undefined &&
    (!Array.isArray(value.reserve) ||
      value.reserve.length !== 5 ||
      !value.reserve.every(
        (n, i) =>
          integer(n, 0, 96) &&
          Array.isArray(value.capacity) &&
          n <= value.capacity[i],
      ))
  )
    errors.push(
      "Reserve 0–24 hours per day in 0.25-hour steps, no more than that day’s available time.",
    );
  if (!Array.isArray(value.tasks) || value.tasks.length > 8)
    errors.push("Add no more than 8 existing commitments.");
  const tasks = Array.isArray(value.tasks) ? value.tasks : [];
  const ids = new Set<string>();
  [...tasks, value.request].forEach((t: unknown, index) => {
    const label =
      index === tasks.length ? "New request" : `Commitment ${index + 1}`;
    if (!record(t)) {
      errors.push(`${label}: enter a valid task.`);
      return;
    }
    if (typeof t.name !== "string" || !t.name.trim() || t.name.length > 100)
      errors.push(`${label}: use a name of 1–100 characters.`);
    if (!integer(t.units, 1, 480))
      errors.push(`${label}: enter 0.25–120 hours in 0.25-hour steps.`);
    if (!integer(t.deadline, 0, 4))
      errors.push(`${label}: select a weekday deadline.`);
    if (
      typeof t.movable !== "boolean" ||
      !["normal", "high"].includes(String(t.priority))
    )
      errors.push(`${label}: invalid flexibility or priority.`);
    if (typeof t.id !== "string" || !t.id || t.id.length > 100 || ids.has(t.id))
      errors.push(`${label}: invalid or duplicate identifier.`);
    if (typeof t.id === "string") ids.add(t.id);
  });
  return errors;
}
export function isScenario(value: unknown): value is Scenario {
  return validate(value).length === 0;
}
export function feasibility(capacity: number[], tasks: Task[]): Feasibility {
  const checkpoints = capacity.map((_, day) => {
    const available = capacity.slice(0, day + 1).reduce((a, b) => a + b, 0);
    const due = tasks
      .filter((t) => t.deadline <= day)
      .reduce((a, t) => a + t.units, 0);
    return { day, available, due, deficit: Math.max(0, due - available) };
  });
  const total = tasks.reduce((a, t) => a + t.units, 0);
  const sum = capacity.reduce((a, b) => a + b, 0);
  return {
    fits: checkpoints.every((c) => !c.deficit),
    capacity: sum,
    total,
    overload: Math.max(0, total - sum),
    checkpoints,
  };
}
export function availableCapacity(s: Scenario): number[] {
  return s.capacity.map((n, i) => n - (s.reserve?.[i] ?? 0));
}
export function analyze(s: Scenario): {
  baseline: Feasibility;
  existing: Feasibility;
  options: Option[];
} {
  const errors = validate(s);
  if (errors.length) throw new Error(errors.join(" "));
  const baseline = feasibility(availableCapacity(s), [...s.tasks, s.request]);
  const existing = feasibility(availableCapacity(s), s.tasks);
  if (baseline.fits)
    return {
      baseline,
      existing,
      options: [
        {
          id: "accept",
          kind: "accept",
          deferred: [],
          requestUnits: s.request.units,
          result: baseline,
        },
      ],
    };
  const movable = s.tasks.filter((t) => t.movable);
  const candidates: Option[] = [];
  for (let mask = 1; mask < 2 ** movable.length; mask++) {
    const deferred = movable.filter((_, i) => mask & (1 << i)).map((t) => t.id);
    const result = feasibility(availableCapacity(s), [
      ...s.tasks.filter((t) => !deferred.includes(t.id)),
      s.request,
    ]);
    if (result.fits)
      candidates.push({
        id: `defer:${deferred.join(",")}`,
        kind: "defer",
        deferred,
        requestUnits: s.request.units,
        result,
      });
  }
  const highCount = (o: Option) =>
    s.tasks.filter((t) => o.deferred.includes(t.id) && t.priority === "high")
      .length;
  const removedUnits = (o: Option) =>
    s.tasks
      .filter((t) => o.deferred.includes(t.id))
      .reduce((a, t) => a + t.units, 0);
  // Supersets change extra commitments unnecessarily; then rank with an explicit rule.
  const minimal = candidates.filter(
    (o) =>
      !candidates.some(
        (p) =>
          p.deferred.length < o.deferred.length &&
          p.deferred.every((id) => o.deferred.includes(id)),
      ),
  );
  minimal.sort(
    (a, b) =>
      highCount(a) - highCount(b) ||
      a.deferred.length - b.deferred.length ||
      removedUnits(a) - removedUnits(b) ||
      a.id.localeCompare(b.id),
  );
  const options = minimal.slice(0, 3);
  if (existing.fits) {
    const maxUnits = Math.min(
      ...existing.checkpoints
        .filter((c) => c.day >= s.request.deadline)
        .map((c) => c.available - c.due),
    );
    if (maxUnits >= 1 && maxUnits < s.request.units) {
      const result = feasibility(availableCapacity(s), [
        ...s.tasks,
        { ...s.request, units: maxUnits },
      ]);
      options.push({
        id: "scope",
        kind: "scope",
        deferred: [],
        requestUnits: maxUnits,
        result,
      });
    }
  }
  return { baseline, existing, options };
}
/** Recalculate a user-selected combination; never silently accept fixed-task changes. */
export function simulate(
  s: Scenario,
  deferred: string[],
  requestUnits: number,
): Option {
  const errors = validate(s);
  if (errors.length) throw new Error(errors.join(" "));
  if (
    !Array.isArray(deferred) ||
    new Set(deferred).size !== deferred.length ||
    deferred.some((id) => !s.tasks.some((t) => t.id === id && t.movable))
  )
    throw new Error("Only negotiable commitments can be deferred.");
  if (
    !Number.isInteger(requestUnits) ||
    requestUnits < 1 ||
    requestUnits > s.request.units
  )
    throw new Error(
      "Choose a positive scope no larger than the original request, in quarter-hours.",
    );
  const ordered = s.tasks
    .filter((t) => deferred.includes(t.id))
    .map((t) => t.id);
  const kind = ordered.length
    ? requestUnits < s.request.units
      ? "combined"
      : "defer"
    : requestUnits < s.request.units
      ? "scope"
      : "accept";
  return {
    id: `plan:${ordered.join(",")}:${requestUnits}`,
    kind,
    deferred: ordered,
    requestUnits,
    result: feasibility(availableCapacity(s), [
      ...s.tasks.filter((t) => !ordered.includes(t.id)),
      { ...s.request, units: requestUnits },
    ]),
  };
}
export function optionTitle(s: Scenario, o: Option): string {
  if (o.kind === "accept") return "Keep your current commitments";
  if (o.kind === "scope")
    return `Make the new request a ${hours(o.requestUnits)}h deliverable`;
  const names = s.tasks
    .filter((t) => o.deferred.includes(t.id))
    .map((t) => t.name)
    .join(" + ");
  return `Defer ${names}${o.kind === "combined" ? ` + reduce the request to ${hours(o.requestUnits)}h` : ""}`;
}
export function proposal(s: Scenario, option: Option): string {
  const o = simulate(s, option.deferred, option.requestUnits);
  if (!o.result.fits)
    throw new Error(
      "This plan still conflicts with a deadline. Recalculate before preparing a proposal.",
    );
  const baseline = feasibility(availableCapacity(s), [...s.tasks, s.request]);
  const deadline = DAYS[s.request.deadline];
  const current = s.tasks.reduce((a, t) => a + t.units, 0);
  const context = `I have ${duration(current)} already committed against ${hours(baseline.capacity)} focused hours available in this planning week. The full request would bring the total to ${duration(baseline.total)}.`;
  const conflict = baseline.checkpoints.find((c) => c.deficit > 0);
  const constraint = conflict
    ? ` By ${DAYS[conflict.day]}, ${duration(conflict.due)} would be due with ${hours(conflict.available)} available.`
    : "";
  if (o.kind === "accept")
    return `Based on my current estimates, I can take on ${s.request.name} (${duration(s.request.units)}) by ${deadline} without changing my existing commitments. ${context} The work fits each weekday deadline. Please confirm the scope and priority so we can revisit the plan if anything changes.`;
  const smaller = o.requestUnits < s.request.units;
  const intro = smaller
    ? `I can offer a smaller, ${hours(o.requestUnits)}-hour version of ${s.request.name} by ${deadline}, instead of the original ${hours(s.request.units)}-hour deliverable`
    : `I can take on ${s.request.name} by ${deadline}`;
  const moved = s.tasks
    .filter((t) => o.deferred.includes(t.id))
    .map(
      (t) =>
        `${t.name} (${duration(t.units)}, currently due ${DAYS[t.deadline]})`,
    )
    .join(" and ");
  const change = moved
    ? ` if we agree to move ${moved} out of this planning week.`
    : ".";
  const scope = smaller
    ? " This requires reducing the deliverable, not doing the same work faster."
    : "";
  const ask = moved
    ? " Could we agree on this priority change and a new date for the deferred work?"
    : " Could we agree which parts to keep within that scope?";
  const future = moved
    ? " Capacity beyond this week has not been checked."
    : "";
  return `${intro}${change} ${context}${constraint} With that change, ${duration(o.result.total)} would remain this week, fitting the weekday deadlines.${scope}${ask}${future}`;
}
export function exampleScenario(): Scenario {
  return {
    capacity: [12, 12, 12, 12, 12],
    tasks: [
      {
        id: "qa",
        name: "Launch QA",
        units: 20,
        deadline: 2,
        movable: false,
        priority: "high",
      },
      {
        id: "updates",
        name: "Customer updates",
        units: 12,
        deadline: 3,
        movable: false,
        priority: "normal",
      },
      {
        id: "report",
        name: "Weekly report",
        units: 20,
        deadline: 4,
        movable: true,
        priority: "normal",
      },
    ],
    request: {
      id: "request",
      name: "Urgent presentation",
      units: 20,
      deadline: 4,
      movable: false,
      priority: "normal",
    },
  };
}
export function emptyScenario(): Scenario {
  return {
    capacity: [0, 0, 0, 0, 0],
    tasks: [],
    request: {
      id: "request",
      name: "",
      units: 4,
      deadline: 4,
      movable: false,
      priority: "normal",
    },
  };
}
