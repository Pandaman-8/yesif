import { analyzeConflicts } from "./conflicts";
import { DAYS, hours, simulate, type Option, type Scenario } from "./engine";

export const RUBRIC = [
  ["constraint", "Correct constraint"],
  ["action", "Relevant action"],
  ["agreement", "Agreement"],
  ["promise", "Grounded promise"],
  ["tone", "Clarity and tone"],
] as const;
type Criterion = (typeof RUBRIC)[number][0];
export type ChoiceId = "grounded" | "observe" | "assume";
export interface RubricEvidence {
  criterion: Criterion;
  status: "supported" | "missing" | "risk";
  quote: string | null;
  reason: string;
}
export interface PracticeChoice {
  id: ChoiceId;
  text: string;
  evidence: RubricEvidence[];
  worked: string;
  improve: string;
  revision: string;
}
export interface PracticeTurn {
  kind: "fits" | "deferral" | "scope" | "combined" | "blocked";
  step: 1 | 2;
  context: string;
  prompt: string;
  choices: PracticeChoice[];
}
// Evidence is authored alongside each reply. It describes these exact buttons only;
// it never scores the user's editor or infers their ability.
function choice(
  id: ChoiceId,
  text: string,
  proof: Partial<Record<Criterion, [string, string]>>,
  worked: string,
  improve: string,
  revision: string,
  risk?: [string, string],
): PracticeChoice {
  return {
    id,
    text,
    worked,
    improve,
    revision,
    evidence: RUBRIC.map(([criterion]) => {
      const p = proof[criterion];
      if (criterion === "promise" && risk)
        return { criterion, status: "risk", quote: risk[0], reason: risk[1] };
      return p
        ? { criterion, status: "supported", quote: p[0], reason: p[1] }
        : {
            criterion,
            status: "missing",
            quote: null,
            reason:
              criterion === "action"
                ? "No change or information request addresses the limiting condition."
                : criterion === "agreement"
                  ? "No explicit invitation to agree the condition."
                  : criterion === "promise"
                    ? "The reply leaves the commitment boundary unclear."
                    : "The limiting condition is not identified in this reply.",
          };
    }),
  };
}

export function practiceFor(
  s: Scenario,
  plan: Option | null,
  first?: ChoiceId,
  scope = "",
): PracticeTurn {
  const a = analyzeConflicts(s);
  const checked = plan ? simulate(s, plan.deferred, plan.requestUnits) : null;
  if (checked && !checked.result.fits)
    throw new Error(
      "Practice requires a checked plan or an unresolved conflict.",
    );
  if (!checked && !a.firstConflict) throw new Error("No unresolved conflict.");
  const moved = s.tasks.filter((t) => checked?.deferred.includes(t.id));
  const smaller = !!checked && checked.requestUnits < s.request.units;
  const kind = !checked
    ? "blocked"
    : moved.length
      ? smaller
        ? "combined"
        : "deferral"
      : smaller
        ? "scope"
        : "fits";
  const step = first ? 2 : 1;
  const c = a.firstConflict;
  const day = c ? DAYS[c.day] : DAYS[s.request.deadline];
  const deficit = c ? `${hours(c.deficit)}h` : "";
  const limit = c
    ? `${hours(c.due)}h due / ${hours(c.available)}h usable by ${day}`
    : "";
  const names = moved.map((t) => t.name).join(" and ");
  const later =
    c && a.conflicts.find((x) => x.day > c.day && x.additionalDeficit > 0);
  const context =
    kind === "blocked"
      ? `${limit}. Relevant work: ${[...c!.contributingCommitments.map((t) => t.name), ...(c!.requestContributes ? [s.request.name] : [])].join("; ")}. ${!a.existingFeasible ? "Existing work already has a conflict. " : ""}${!c!.requestContributes ? `${s.request.name} is due ${DAYS[s.request.deadline]}; cutting it cannot fix this earlier shortfall. ` : ""}${later ? `The request also adds pressure by ${DAYS[later.day]}: ${hours(later.due)}h due / ${hours(later.available)}h usable. ` : ""}No changed conditions have been checked.`
      : `${s.request.name} is due ${DAYS[s.request.deadline]}. Selected plan: ${hours(checked!.result.total)}h / ${hours(checked!.result.capacity)}h usable; all weekday checks pass. ${moved.length ? `Move ${names} beyond this week, subject to agreement; future capacity unchecked. Original constraint: ${limit}. ` : ""}${smaller ? `Reduce the request from ${hours(s.request.units)}h to ${hours(checked!.requestUnits)}h. ${scope.trim() ? `Proposed contents: ${scope.trim()}.` : "Smaller contents still need definition."} ` : ""}These conditions are not approved.`;

  let prompt: string, good: string, observe: string, assume: string;
  let constraint: string, action: string, agreement: string, promise: string;
  let observeConstraint: string,
    observeBoundary: string,
    assumedAction: string,
    assumedPromise: string;
  let lesson: string, gap: string, risk: string;

  if (kind === "fits") {
    prompt = !first
      ? `“Could you add more to ${s.request.name} for ${DAYS[s.request.deadline]}?”`
      : first === "grounded"
        ? "“I can describe the extra work, but I need a yes now. Can you confirm first?”"
        : first === "observe"
          ? "“You said the current work fits. What would you need to decide about the extra work?”"
          : "“So I can tell the team the extra work is confirmed, even without an estimate?”";
    good = !first
      ? "The added work is unestimated. Could we define its scope, effort and deadline, then recheck before I confirm?"
      : "I can confirm the checked scope only. Could we estimate the addition and agree its deadline, then recheck before accepting it?";
    constraint = !first
      ? "The added work is unestimated."
      : "the checked scope only";
    action = !first
      ? "define its scope, effort and deadline"
      : "estimate the addition";
    agreement = !first ? "Could we define" : "agree its deadline";
    promise = !first
      ? "recheck before I confirm"
      : "recheck before accepting it";
    observe =
      "The current scope fits the entered deadlines. The extra work has no estimate yet, so I’m keeping my confirmation open.";
    observeConstraint = "The extra work has no estimate yet";
    observeBoundary = "keeping my confirmation open";
    assume =
      "The current scope fits the entered deadlines. Could we use the available room for the extra work and confirm it now?";
    assumedAction = "use the available room";
    assumedPromise = "confirm it now";
    lesson =
      "Asking for scope, effort and deadline gives the calculation the missing inputs; the current plan checks only the original request.";
    gap =
      "You identify the missing estimate and avoid accepting, but do not ask for the information needed to decide.";
    risk =
      "Available room does not prove unspecified extra work fits; even a request to confirm now skips the necessary check.";
  } else if (kind === "blocked") {
    prompt = !first
      ? `“Can we keep the ${day} deadline and still take on ${s.request.name}?”`
      : first === "grounded"
        ? `“Suppose we find ${deficit} more before ${day}. Does that settle every deadline?”`
        : first === "observe"
          ? `“I hear the ${day} shortfall. What change do you want us to discuss?”`
          : "“If we make that adjustment, can I confirm the whole plan without another check?”";
    good = !first
      ? `There’s a ${deficit} gap by ${day}. Could we discuss time before then or that work’s deadline, and recheck before committing?`
      : `The ${day} repair is still untested. Could we agree revised inputs and check every deadline before confirming the whole plan?`;
    constraint = !first
      ? `${deficit} gap by ${day}`
      : `${day} repair is still untested`;
    action = !first
      ? "time before then or that work’s deadline"
      : "check every deadline";
    agreement = !first ? "Could we discuss" : "Could we agree revised inputs";
    promise = !first
      ? "recheck before committing"
      : "before confirming the whole plan";
    observe = `The ${deficit} gap by ${day} is still unresolved. I’ll hold off on confirming the plan while we consider the workload.`;
    observeConstraint = `${deficit} gap by ${day}`;
    observeBoundary = "hold off on confirming";
    assume = `The ${deficit} gap by ${day} needs attention. Could we add that much focused time before then and confirm the whole plan?`;
    assumedAction = "add that much focused time before then";
    assumedPromise = "confirm the whole plan";
    lesson = `${day}'s ${deficit} deficit needs a relevant change, followed by every weekday check.${later ? ` The new request also adds pressure by ${DAYS[later.day]}.` : " A lower bound is not proof of a sufficient repair."}`;
    gap = `You correctly identify ${day}'s ${deficit} gap and hold the commitment open, but do not ask to change a condition affecting that deadline.`;
    risk = `Adding ${deficit} before ${day} is relevant, but its exact day and all later constraints still need checking. The whole plan is not verified.`;
  } else if (kind === "scope") {
    prompt = !first
      ? `“Will the ${hours(checked!.requestUnits)}h version of ${s.request.name} include everything?”`
      : first === "grounded"
        ? "“I still want the full result. Can you keep everything in the smaller estimate?”"
        : first === "observe"
          ? "“You said the result would be smaller. What do we need to agree before you start?”"
          : "“Then can I tell everyone the full result is included in those fewer hours?”";
    good = !first
      ? "The lower estimate covers a smaller result. Could we agree what is included and excluded, then confirm that estimate before I commit?"
      : "The full result is outside this estimate. Could we agree fewer deliverables, or revise the time and recheck before I confirm?";
    constraint = !first
      ? "lower estimate covers a smaller result"
      : "full result is outside this estimate";
    action = !first
      ? "what is included and excluded"
      : "agree fewer deliverables";
    agreement = "Could we agree";
    promise = !first
      ? "confirm that estimate before I commit"
      : "recheck before I confirm";
    observe =
      "The lower estimate covers a smaller result, with the exact contents still awaiting agreement. I’ll hold off on promising the full output.";
    observeConstraint = "lower estimate covers a smaller result";
    observeBoundary = "hold off on promising the full output";
    assume =
      "The lower estimate fits the available time. Could we keep all the original deliverables by simplifying how much detail goes into each one?";
    assumedAction = "simplifying how much detail";
    assumedPromise = "keep all the original deliverables";
    lesson = `${hours(checked!.requestUnits)}h fits the time constraints; it does not prove a useful version of the original ${hours(s.request.units)}h result exists. Agree the contents and estimate together.`;
    gap =
      "You distinguish a smaller result from the full output, but leave the next action implicit. Ask to define the inclusions and exclusions together.";
    risk =
      "Simplifying detail may be worth discussing, but the entered hours do not verify that all original deliverables remain achievable.";
  } else {
    const combined = kind === "combined";
    const early = !!c && !c.requestContributes;
    const earlyNames = early
      ? moved
          .filter((t) => t.deadline <= c!.day)
          .map((t) => t.name)
          .join(" and ")
      : "";
    prompt = !first
      ? `“We still need ${early ? `${earlyNames} by ${day}` : `${names} this week`}. Can ${s.request.name} still arrive by ${DAYS[s.request.deadline]}?”`
      : first === "grounded"
        ? "“Those priorities cannot move yet. Can you commit while I seek approval?”"
        : first === "observe"
          ? "“You’ve explained the condition. Which decision do you need from me?”"
          : "“Are we treating that change as approved, even though the original requirement still stands?”";
    good = !first
      ? combined
        ? "Keeping that work changes the checked plan. Could we revisit both the move and smaller scope, then recheck before I confirm?"
        : early
          ? `Keeping that work changes the checked plan. Could we revisit its ${day} deadline or time before then, and recheck before I confirm?`
          : "Keeping that work changes the checked plan. Could we revisit its timing or the request’s scope, then recheck before I confirm?"
      : combined
        ? "Both the move and smaller scope still need agreement. Could we settle both conditions and recheck any changes before I commit?"
        : "The move still needs agreement. Could we settle the priorities and a new date, checking future capacity before I commit?";
    constraint = !first
      ? "Keeping that work changes the checked plan"
      : combined
        ? "Both the move and smaller scope still need agreement"
        : "The move still needs agreement";
    action = !first
      ? combined
        ? "revisit both the move and smaller scope"
        : early
          ? `revisit its ${day} deadline or time before then`
          : "revisit its timing or the request’s scope"
      : combined
        ? "settle both conditions"
        : "settle the priorities and a new date";
    agreement = "Could we";
    promise = !first ? "recheck before I confirm" : "before I commit";
    observe = combined
      ? "Both the move and smaller scope are conditions of the checked plan. I’ll hold off on confirming while those two conditions remain open."
      : "Moving that work is a condition of the checked plan. I’ll hold off on confirming the request while the original deadline still stands.";
    observeConstraint = combined
      ? "Both the move and smaller scope"
      : "Moving that work is a condition";
    observeBoundary = "hold off on confirming";
    assume = combined
      ? "The checked plan needs both changes. Could we keep the smaller scope, leave that work in this week and confirm the request now?"
      : "The checked plan needs the move. Could we put that work at the end of this week and confirm the request now?";
    assumedAction = combined
      ? "leave that work in this week"
      : "put that work at the end of this week";
    assumedPromise = "confirm the request now";
    lesson = `${names} remains owed. Keeping it this week changes the checked plan; no alternative is verified until recalculated.${combined ? " The smaller deliverable also needs agreement." : " A new date also needs a future-capacity check."}`;
    if (early)
      lesson += ` The ${day} shortfall cannot be repaired by cutting the later ${DAYS[s.request.deadline]} request.`;
    gap =
      "You correctly keep the commitment conditional, but do not invite a decision on the conditions that make the selected plan fit.";
    risk =
      "Changing order inside the same week is not the checked deferral beyond this week. Recheck the revised plan before offering it as feasible.";
  }
  const goodChoice = choice(
    "grounded",
    good,
    {
      constraint: [
        constraint,
        "Identifies the current limiting condition shown in the scenario.",
      ],
      action: [action, lesson],
      agreement: [agreement, "Invites a decision; does not invent approval."],
      promise: [
        promise,
        "Holds confirmation until the stated condition is checked or agreed.",
      ],
      tone: [good, "A concise, constructive request with a clear next step."],
    },
    lesson,
    "Keep the condition explicit when the conversation continues; this reply does not itself change or approve the plan.",
    good,
  );
  const observation = choice(
    "observe",
    observe,
    {
      constraint: [observeConstraint, "Names the actual limiting issue."],
      promise: [observeBoundary, "Explicitly holds the commitment open."],
      tone: [
        observe,
        "Calm, concise language without blaming the other person.",
      ],
    },
    "You acknowledge the constraint and avoid an unchecked commitment.",
    gap,
    good,
  );
  const assumption = choice(
    "assume",
    assume,
    {
      ...(kind === "blocked" || kind === "deferral" || kind === "combined"
        ? {
            constraint: [
              kind === "blocked"
                ? `${deficit} gap by ${day}`
                : "checked plan needs",
              "Names the unresolved gap or the required move.",
            ] as [string, string],
          }
        : {}),
      ...(kind === "blocked"
        ? {
            action: [
              assumedAction,
              "Additional time before the binding date is relevant; sufficiency still needs verification.",
            ] as [string, string],
          }
        : {}),
      agreement: [
        "Could we",
        "Asks rather than assumes the other person’s permission.",
      ],
      tone: [
        assume,
        "Constructive tone; the issue is the unsupported inference, not politeness.",
      ],
    },
    "You invite agreement instead of assigning priorities unilaterally.",
    risk,
    good,
    [assumedPromise, risk],
  );
  // Rotate by scenario + step. Substantive quality comes from authored distinctions,
  // not from randomizing one visibly longer answer.
  const choices = [goodChoice, observation, assumption];
  const offset =
    ([...s.request.name].reduce(
      (n, x) => n + x.charCodeAt(0),
      s.request.deadline,
    ) +
      (first ? 1 : 0)) %
    3;
  return {
    kind,
    step,
    context,
    prompt,
    choices: [...choices.slice(offset), ...choices.slice(0, offset)],
  };
}
