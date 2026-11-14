import {
  analyzeConflicts,
  causalSummary,
  conflictBreakdown,
} from "./conflicts";
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
  const a = analyzeConflicts(s);
  const c = a.firstConflict;
  if (!c) throw new Error("No unresolved conflict.");
  const names = [
    ...c.contributingCommitments.map((t) => t.name),
    ...(c.requestContributes ? [s.request.name] : []),
  ].join(" and ");
  const context = `By ${DAYS[c.day]}, ${names} ${c.contributingCommitments.length + Number(c.requestContributes) === 1 ? "requires" : "require"} ${hours(c.due)}h, but I have ${hours(c.available)}h available — a ${hours(c.deficit)}h shortfall.`;
  const attribution =
    !a.existingFeasible && !c.requestContributes
      ? ` This conflict exists before the ${DAYS[s.request.deadline]} request.`
      : !a.existingFeasible
        ? ` Existing work already has a shortfall by ${DAYS[a.existingFirstConflict!.day]}; the new request adds pressure.`
        : "";
  return `${context}${attribution} Could we discuss adjusting that work’s deadline or deliverable, or making more focused time available by ${DAYS[c.day]}? I’ll recheck every deadline before confirming ${s.request.name}.`;
}

export function detailedProposal(
  s: Scenario,
  plan: Option | null,
  scope: string,
): string {
  const analysis = analyzeConflicts(s);
  return plan
    ? (!analysis.existingFeasible ? causalSummary(s, analysis) + " " : "") +
        proposal(s, plan) +
        (scope.trim() && plan.requestUnits < s.request.units
          ? ` Proposed smaller deliverable: ${scope.trim()}.`
          : "")
    : conflictBreakdown(s, analysis);
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
  const analysis = analyzeConflicts(s);
  const cap = analysis.baseline.capacity;
  const changes = plan ? shortProposal(s, plan) : renegotiationRequest(s);
  const good: PracticeChoice = {
    id: "grounded",
    text: plan
      ? `With ${hours(cap)} focused hours available, ${changes.startsWith("I ") ? changes : changes.charAt(0).toLowerCase() + changes.slice(1)}`
      : changes,
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
      text:
        (!plan || !analysis.existingFeasible) && analysis.firstConflict
          ? `By ${DAYS[analysis.firstConflict.day]}, ${hours(analysis.firstConflict.due)}h are due with ${hours(analysis.firstConflict.available)}h available. I need you to sort this out.`
          : `I have ${hours(cap)} focused hours available. You need to be more realistic about ${s.request.name}.`,
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
      (!plan || !analysis.existingFeasible) && analysis.firstConflict
        ? `“How can we address the work due by ${DAYS[analysis.firstConflict.day]} before confirming more?”`
        : plan?.kind === "accept"
          ? `“Could you add more to ${s.request.name} and still finish by ${DAYS[s.request.deadline]}?”`
          : `“We still need the full ${s.request.name} by ${DAYS[s.request.deadline]}. What can we do?”`,
    choices: [...choices.slice(offset), ...choices.slice(0, offset)],
  };
}
