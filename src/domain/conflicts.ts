import {
  analyze,
  DAYS,
  hours,
  simulate,
  type Checkpoint,
  type Feasibility,
  type Option,
  type Scenario,
  type Task,
} from "./engine";
import { startingOptions } from "./options";

export type ConflictClassification =
  | "fits"
  | "preexisting_conflict"
  | "new_request_causes_conflict"
  | "preexisting_and_additional_pressure";
export interface ConflictConstraint extends Checkpoint {
  existingDue: number;
  existingDeficit: number;
  additionalDeficit: number;
  contributingCommitments: Task[];
  requestContributes: boolean;
}
export interface VerifiedAlternative {
  status: "verified";
  plan: Option;
  changedTasks: Task[];
  requestUnits: number;
  remainingUnits: number;
  allDeadlinesFit: true;
  needsAgreement: true;
  futureCapacityChecked: false;
}
export interface NegotiationDirection {
  id: "capacity" | "existing_conditions" | "request_scope";
  status: "unverified";
  day: number;
  taskIds: string[];
  label: string;
  explanation: string;
  assumptionToChange: string;
  recheck: string;
}
export interface ConflictAnalysis {
  classification: ConflictClassification;
  baseline: Feasibility;
  existing: Feasibility;
  baselineFeasible: boolean;
  existingFeasible: boolean;
  firstConflict: ConflictConstraint | null;
  existingFirstConflict: Checkpoint | null;
  conflicts: ConflictConstraint[];
  weeklyOverloadUnits: number;
  requestContributesToFirstConflict: boolean;
  verifiedAlternatives: VerifiedAlternative[];
  negotiationDirections: NegotiationDirection[];
}

/** Validates via analyze. Causality is a comparison of the same five trusted prefixes,
 * not a second scheduler. Additional pressure means a new or increased deficit,
 * rather than merely using otherwise spare time. */
export function analyzeConflicts(s: Scenario): ConflictAnalysis {
  const { baseline, existing } = analyze(s);
  const conflicts: ConflictConstraint[] = baseline.checkpoints
    .filter((c) => c.deficit > 0)
    .map((c) => ({
      ...c,
      existingDue: existing.checkpoints[c.day].due,
      existingDeficit: existing.checkpoints[c.day].deficit,
      additionalDeficit: c.deficit - existing.checkpoints[c.day].deficit,
      contributingCommitments: s.tasks.filter((t) => t.deadline <= c.day),
      requestContributes: s.request.deadline <= c.day,
    }));
  const firstConflict = conflicts[0] ?? null;
  const classification: ConflictClassification = baseline.fits
    ? "fits"
    : existing.fits
      ? "new_request_causes_conflict"
      : conflicts.some((c) => c.additionalDeficit > 0)
        ? "preexisting_and_additional_pressure"
        : "preexisting_conflict";
  const verifiedAlternatives: VerifiedAlternative[] = startingOptions(s).map(
    (candidate) => {
      const plan = simulate(s, candidate.deferred, candidate.requestUnits);
      if (!plan.result.fits)
        throw new Error("An alternative failed all-deadline verification.");
      return {
        status: "verified",
        plan,
        changedTasks: s.tasks.filter((t) => plan.deferred.includes(t.id)),
        requestUnits: plan.requestUnits,
        remainingUnits: plan.result.capacity - plan.result.total,
        allDeadlinesFit: true,
        needsAgreement: true,
        futureCapacityChecked: false,
      };
    },
  );
  return {
    classification,
    baseline,
    existing,
    baselineFeasible: baseline.fits,
    existingFeasible: existing.fits,
    firstConflict,
    existingFirstConflict:
      existing.checkpoints.find((c) => c.deficit > 0) ?? null,
    conflicts,
    weeklyOverloadUnits: baseline.overload,
    requestContributesToFirstConflict:
      firstConflict?.requestContributes ?? false,
    verifiedAlternatives,
    negotiationDirections: buildNegotiationDirections(s, firstConflict),
  };
}

function buildNegotiationDirections(
  s: Scenario,
  c: ConflictConstraint | null,
): NegotiationDirection[] {
  if (!c) return [];
  const recheck =
    "Agree the changed conditions, update the inputs, then recheck every weekday before committing.";
  const directions: NegotiationDirection[] = [
    {
      id: "capacity",
      status: "unverified",
      day: c.day,
      taskIds: [],
      label: `Discuss more focused time by ${DAYS[c.day]}`,
      explanation: `The ${hours(c.deficit)}h shortfall is a lower bound at this deadline, not proof that the whole week would fit.`,
      assumptionToChange: `Usable capacity on or before ${DAYS[c.day]}; later capacity cannot repair this deadline.`,
      recheck,
    },
  ];
  if (c.contributingCommitments.length)
    directions.push({
      id: "existing_conditions",
      status: "unverified",
      day: c.day,
      taskIds: c.contributingCommitments.map((t) => t.id),
      label: "Discuss the work due by this deadline",
      explanation:
        c.contributingCommitments
          .map(
            (t) =>
              `${t.name} (${hours(t.units)}h, due ${DAYS[t.deadline]}${t.movable ? "" : ", Fixed — permission required"})`,
          )
          .join("; ") + ".",
      assumptionToChange:
        "Ask whether a deadline, required deliverable or who does part of this work can change. No Fixed commitment is automatically moved.",
      recheck,
    });
  if (c.requestContributes)
    directions.push({
      id: "request_scope",
      status: "unverified",
      day: c.day,
      taskIds: [s.request.id],
      label: `Discuss the scope or deadline of ${s.request.name}`,
      explanation: `This request is due by ${DAYS[c.day]} and contributes ${hours(s.request.units)}h to this constraint. A change alone may not be sufficient.`,
      assumptionToChange:
        "An explicitly agreed smaller deliverable or new deadline for the request.",
      recheck,
    });
  return directions;
}

export function causalSummary(s: Scenario, a: ConflictAnalysis): string {
  const c = a.firstConflict;
  if (!c)
    return "Every weekday deadline fits the entered estimates; this is not a delivery guarantee.";
  if (a.existingFeasible)
    return `Your existing work fits. Adding ${s.request.name} creates the first shortfall by ${DAYS[c.day]}.`;
  const existing = a.existingFirstConflict!;
  const prefix = `Your existing work is already ${hours(existing.deficit)}h short by ${DAYS[existing.day]}.`;
  const request = c.requestContributes
    ? ` ${s.request.name} also contributes to the ${DAYS[c.day]} constraint.`
    : ` The ${DAYS[s.request.deadline]} request does not cause the earlier ${DAYS[c.day]} shortfall.`;
  const later = a.conflicts.find(
    (p) => p.day > c.day && p.additionalDeficit > 0,
  );
  return (
    prefix +
    request +
    (later
      ? ` It also adds ${hours(later.additionalDeficit)}h to the shortfall by ${DAYS[later.day]}.`
      : "")
  );
}

/** Explain the still-failing CURRENT plan, including changes irrelevant to its prefix. */
export function simulationConstraint(s: Scenario, plan: Option): string {
  const checked = simulate(s, plan.deferred, plan.requestUnits);
  const c = checked.result.checkpoints.find((p) => p.deficit > 0);
  if (!c)
    return `${hours(checked.result.capacity - checked.result.total)}h unassigned. Fits every weekday deadline; changes still need agreement.`;
  const irrelevant = s.tasks
    .filter((t) => checked.deferred.includes(t.id) && t.deadline > c.day)
    .map((t) => t.name);
  const scopeIrrelevant =
    checked.requestUnits < s.request.units && s.request.deadline > c.day;
  const facts = `By ${DAYS[c.day]}, ${hours(c.due)}h are due, but only ${hours(c.available)}h are available. That deadline needs ${hours(c.deficit)}h more room.`;
  const changes = [
    ...(irrelevant.length ? [`Moving ${irrelevant.join(" and ")}`] : []),
    ...(scopeIrrelevant ? [`reducing ${s.request.name}`] : []),
  ];
  return (
    facts +
    (changes.length
      ? ` ${changes.join(" and ")} cannot repair this shortfall: that work is due later.`
      : "") +
    ` Address work or usable time on or before ${DAYS[c.day]}, then recheck every deadline.`
  );
}

export function conflictBreakdown(s: Scenario, a: ConflictAnalysis): string {
  const c = a.firstConflict;
  if (!c) return causalSummary(s, a);
  const names = [
    ...c.contributingCommitments.map(
      (t) =>
        `${t.name}: ${hours(t.units)}h due ${DAYS[t.deadline]}${t.movable ? "" : " (Fixed)"}`,
    ),
    ...(c.requestContributes
      ? [
          `${s.request.name}: ${hours(s.request.units)}h due ${DAYS[s.request.deadline]} (new request)`,
        ]
      : []),
  ];
  const later = a.conflicts
    .slice(1)
    .map(
      (p) =>
        `${DAYS[p.day]}: ${hours(p.due)}h due / ${hours(p.available)}h usable, ${hours(p.deficit)}h short`,
    )
    .join("; ");
  return `First violated cumulative deadline: ${DAYS[c.day]}. ${hours(c.due)}h due / ${hours(c.available)}h usable; ${hours(c.deficit)}h shortfall. Contributing work: ${names.join("; ")}. Existing-only demand by this date: ${hours(c.existingDue)}h, with a ${hours(c.existingDeficit)}h deficit. ${causalSummary(s, a)} Whole week: ${hours(a.baseline.total)}h / ${hours(a.baseline.capacity)}h usable; ${hours(a.weeklyOverloadUnits)}h weekly overload.${later ? ` Other violated checks: ${later}.` : ""} The first deficit is a lower bound, not a complete repair. No changed conditions have been verified in this request. Recheck all weekdays after agreement; future capacity is unchecked.`;
}
