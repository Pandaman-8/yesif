import {
  analyze,
  DAYS,
  hours,
  proposal,
  simulate,
  type Option,
  type Scenario,
} from "./engine";

export function shortProposal(s: Scenario, plan: Option, scope = ""): string {
  const o = simulate(s, plan.deferred, plan.requestUnits);
  if (!o.result.fits)
    throw new Error("A feasible proposal needs a feasible plan.");
  const smaller = o.requestUnits < s.request.units;
  const names = s.tasks
    .filter((t) => o.deferred.includes(t.id))
    .map((t) => t.name)
    .join(" and ");
  const intro = smaller
    ? `I can offer a smaller, ${hours(o.requestUnits)}-hour version of ${s.request.name} by ${DAYS[s.request.deadline]}`
    : `Based on my estimates, I can take on ${s.request.name} (${hours(o.requestUnits)} ${o.requestUnits === 4 ? "hour" : "hours"}) by ${DAYS[s.request.deadline]}`;
  return `${intro}${names ? ` if we agree to move ${names} out of this planning week` : smaller ? " if we agree on the reduced scope" : " with my current commitments"}.${smaller && scope.trim() ? ` The smaller deliverable would include: ${scope.trim()}.` : ""} ${names ? "Could we agree on the priorities and a new date first? Capacity beyond this week still needs checking." : smaller ? "Could we agree which parts to keep? This means a smaller deliverable, not the same work faster." : "Could we confirm the scope and priority before I commit?"}`;
}

export function conflictText(s: Scenario): string {
  const c = analyze(s).baseline.checkpoints.find((c) => c.deficit);
  return c
    ? `By ${DAYS[c.day]}, ${hours(c.due)}h are due with ${hours(c.available)}h available — a ${hours(c.deficit)}h shortfall.`
    : "Every deadline fits the entered estimates.";
}

export function renegotiationRequest(s: Scenario): string {
  if (analyze(s).baseline.fits) throw new Error("No unresolved conflict.");
  const fixed = s.tasks
    .filter((t) => !t.movable)
    .map((t) => `${t.name} (${hours(t.units)}h, due ${DAYS[t.deadline]})`)
    .join("; ");
  return `I can’t commit to ${s.request.name} (${hours(s.request.units)}h) by ${DAYS[s.request.deadline]} under the current conditions. ${conflictText(s)}${fixed ? ` My fixed commitments include ${fixed}.` : ""} Could we agree on what must change — the deadline, deliverable, available time, or an existing commitment? I need to check the revised plan before confirming. No change has been agreed yet.`;
}

export function detailedProposal(
  s: Scenario,
  plan: Option | null,
  scope: string,
): string {
  return plan
    ? proposal(s, plan) +
        (scope.trim() && plan.requestUnits < s.request.units
          ? ` Proposed smaller deliverable: ${scope.trim()}.`
          : "")
    : renegotiationRequest(s);
}

export interface PracticeChoice {
  id: string;
  text: string;
  checks: boolean[];
  feedback: string;
}
export function practiceFor(
  s: Scenario,
  plan: Option | null,
): { prompt: string; choices: PracticeChoice[] } {
  const cap = analyze(s).baseline.capacity;
  const changes = plan ? shortProposal(s, plan) : renegotiationRequest(s);
  const good: PracticeChoice = {
    id: "grounded",
    text: `With ${hours(cap)} focused hours available, ${changes.startsWith("I ") ? changes : changes.charAt(0).toLowerCase() + changes.slice(1)}`,
    checks: [true, true, true, true],
    feedback: "You made the decision explicit.",
  };
  const choices: PracticeChoice[] = [
    good,
    {
      id: "promise",
      text: `Sure, I’ll complete the full ${s.request.name} plus anything else by ${DAYS[s.request.deadline]}.`,
      checks: [false, false, false, false],
      feedback: "That promises extra work the calculation has not checked.",
    },
    {
      id: "constraint",
      text: `I have ${hours(cap)} focused hours available. You need to be more realistic about ${s.request.name}.`,
      checks: [true, false, false, true],
      feedback:
        "The constraint is visible; add a specific change and invite agreement.",
    },
  ];
  const offset =
    [...s.request.name].reduce(
      (n, c) => n + c.charCodeAt(0),
      s.request.deadline,
    ) % 3;
  return {
    prompt:
      plan?.kind === "accept"
        ? `“Could you add more to ${s.request.name} and still finish by ${DAYS[s.request.deadline]}?”`
        : `“We still need the full ${s.request.name} by ${DAYS[s.request.deadline]}. What can we do?”`,
    choices: [...choices.slice(offset), ...choices.slice(0, offset)],
  };
}
