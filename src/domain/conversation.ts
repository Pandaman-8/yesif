import {
  analyzeConflicts,
  conflictBreakdown,
  causalSummary,
} from "./conflicts";
import {
  analyze,
  DAYS,
  hours,
  simulate,
  type Option,
  type Scenario,
} from "./engine";
export { practiceFor } from "./practice";

export function shortProposal(s: Scenario, plan: Option, scope = ""): string {
  const o = simulate(s, plan.deferred, plan.requestUnits);
  if (!o.result.fits)
    throw new Error("A feasible proposal needs a feasible plan.");
  const smaller = o.requestUnits < s.request.units;
  const names = s.tasks
    .filter((t) => o.deferred.includes(t.id))
    .map((t) => t.name)
    .join(" and ");
  const request = `${s.request.name} by ${DAYS[s.request.deadline]}`;
  if (!names && !smaller)
    return `${request} fits my current estimates while keeping the existing deadlines. Could we confirm the scope and priority before I commit?`;
  const deliverable = smaller
    ? `a smaller, ${hours(o.requestUnits)}-hour version of ${request}${scope.trim() ? ` (${scope.trim()})` : ""}`
    : request;
  return `I can ${smaller ? "offer" : "take on"} ${deliverable} if we agree ${names ? `to move ${names} beyond this week${smaller ? " and approve the reduced scope" : ""}` : "on the reduced scope"}.${smaller && !scope.trim() ? " The smaller deliverable still needs to be defined." : ""} ${names ? "Could we confirm the priorities and new deadlines after checking future capacity?" : "Could we agree on that smaller result before I commit?"}`;
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
  const prior =
    c.existingDeficit > 0
      ? c.requestContributes
        ? `; ${hours(c.existingDeficit)}h of this shortfall already existed, and the request adds ${hours(c.additionalDeficit)}h.`
        : "; this shortfall exists before the new request."
      : `; the new request causes this deadline shortfall${a.existingFirstConflict ? `, while existing work separately falls short by ${hours(a.existingFirstConflict.deficit)}h on ${DAYS[a.existingFirstConflict.day]}` : ""}.`;
  return `${prior ? context.slice(0, -1) + prior : context} Could we discuss that work’s deadline or free up time before ${DAYS[c.day]}? I’ll recheck every deadline before confirming ${s.request.name}.`;
}

// Factual records, not a second email. Always recompute; never trust a cached result.
export function selectedConsequences(s: Scenario, plan: Option, scope = "") {
  const o = simulate(s, plan.deferred, plan.requestUnits);
  if (!o.result.fits) throw new Error("Consequences require a feasible plan.");
  const moved = s.tasks.filter((t) => o.deferred.includes(t.id));
  const smaller = o.requestUnits < s.request.units;
  return {
    plan: o,
    moved,
    smaller,
    items: [
      smaller
        ? `${s.request.name}: ${hours(s.request.units)}h → ${hours(o.requestUnits)}h. A smaller result, not the original work done faster.`
        : `${s.request.name}: the full ${hours(o.requestUnits)}h estimate stays, due ${DAYS[s.request.deadline]}.`,
      ...moved.map(
        (t) =>
          `${t.name}: ${hours(t.units)}h moves beyond this week; it remains owed. A replacement for the ${DAYS[t.deadline]} deadline needs approval.`,
      ),
      ...(moved.length
        ? []
        : ["Existing commitments and their deadlines stay."]),
      `${hours(o.result.capacity - o.result.total)}h remain unassigned this week.`,
      ...(smaller
        ? [
            scope.trim()
              ? `Proposed deliverable: ${scope.trim()}. Confirm the contents and estimate together.`
              : "The smaller deliverable still needs to be defined and agreed.",
          ]
        : []),
      ...(moved.length ? ["Future capacity has not been checked."] : []),
    ],
  };
}

export function proposalEvidence(s: Scenario, plan: Option, scope = "") {
  const f = selectedConsequences(s, plan, scope);
  return [
    {
      label: "Selected change",
      value: f.moved.length
        ? `Propose moving ${f.moved.map((t) => t.name).join(" and ")}${f.smaller ? " and reducing the new deliverable" : ""}.`
        : f.smaller
          ? "Reduce the new deliverable; retain existing commitments."
          : "Retain all entered work and deadlines.",
    },
    {
      label: "Assigned / usable",
      value: `${hours(f.plan.result.total)}h / ${hours(f.plan.result.capacity)}h, after entered reserve.`,
    },
    {
      label: "Deadlines checked",
      value:
        f.plan.result.checkpoints
          .map(
            (c) =>
              `${DAYS[c.day]}: ${hours(c.due)}h due / ${hours(c.available)}h usable`,
          )
          .join("; ") + ".",
    },
    {
      label: "Agreement needed",
      value: `${f.moved.length ? "Replacement deadlines and priorities. " : "Scope and priority. "}${f.smaller ? "Define and approve the smaller result and its estimate. " : ""}No approval is assumed.`,
    },
    {
      label: "Limits",
      value:
        "Fits the entered time constraints. Delivery quality, dependencies and future capacity are not verified.",
    },
  ];
}

export function blockedEvidence(s: Scenario) {
  const a = analyzeConflicts(s),
    c = a.firstConflict;
  if (!c) throw new Error("No unresolved conflict.");
  return [
    {
      label: "First violated deadline",
      value: `${DAYS[c.day]}: ${hours(c.due)}h due / ${hours(c.available)}h usable — ${hours(c.deficit)}h shortfall.`,
    },
    {
      label: "Existing work alone",
      value: `${hours(c.existingDue)}h due by ${DAYS[c.day]}; ${hours(c.existingDeficit)}h shortfall at that date. ${a.existingFeasible ? "Existing deadlines fit without the request." : `Existing work first fails by ${DAYS[a.existingFirstConflict!.day]}.`}`,
    },
    {
      label: "Relevant obligations",
      value: [
        ...c.contributingCommitments.map(
          (t) =>
            `${t.name}: ${hours(t.units)}h by ${DAYS[t.deadline]} (${t.movable ? "negotiable" : "fixed; permission required"})`,
        ),
        ...(c.requestContributes
          ? [
              `${s.request.name}: ${hours(s.request.units)}h by ${DAYS[s.request.deadline]} (new request)`,
            ]
          : []),
      ].join("; "),
    },
    { label: "Cause", value: causalSummary(s, a) },
    {
      label: "Other failed checks",
      value:
        a.conflicts
          .slice(1)
          .map(
            (x) =>
              `${DAYS[x.day]}: ${hours(x.due)}h due / ${hours(x.available)}h usable`,
          )
          .join("; ") ||
        "No later cumulative deadline fails under the current inputs.",
    },
    {
      label: "Whole week",
      value: `${hours(a.baseline.total)}h due / ${hours(a.baseline.capacity)}h usable. Weekly totals do not resolve an earlier conflict.`,
    },
    {
      label: "Before confirming",
      value:
        "Negotiate relevant conditions, enter the revised inputs and recheck every weekday. No proposed repair or future capacity is verified.",
    },
  ];
}

export function detailedProposal(
  s: Scenario,
  plan: Option | null,
  scope: string,
): string {
  return plan
    ? proposalEvidence(s, plan, scope)
        .map((f) => `${f.label}: ${f.value}`)
        .join("\n")
    : conflictBreakdown(s, analyzeConflicts(s));
}
