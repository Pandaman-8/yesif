import { analyzeConflicts, causalSummary } from "./conflicts";
import { selectedConsequences } from "./conversation";
import { DAYS, hours, type Option, type Scenario } from "./engine";

export function decisionFacts(
  s: Scenario,
  plan: Pick<Option, "deferred" | "requestUnits">,
  scope = "",
) {
  // selectedConsequences independently simulates the plan; no cached result is used.
  const f = selectedConsequences(s, plan as Option, scope);
  const retained = s.tasks.filter((t) => !f.plan.deferred.includes(t.id));
  const highMoved = f.moved.filter((t) => t.priority === "high");
  const highRetained = retained.filter((t) => t.priority === "high");
  return {
    ...f,
    retained,
    highMoved,
    highRetained,
    priority: highMoved.length
      ? `High-priority work moved: ${highMoved.map((t) => t.name).join("; ")}.`
      : `No high-priority commitments moved${highRetained.length ? `; ${highRetained.map((t) => t.name).join("; ")} ${highRetained.length === 1 ? "stays" : "stay"}` : ""}.`,
    agreements: [
      ...f.moved.map(
        (t) =>
          `Agree a replacement for ${t.name}’s ${DAYS[t.deadline]} deadline; its ${hours(t.units)}h remain owed.`,
      ),
      ...(f.smaller
        ? [
            `Agree the smaller ${hours(f.plan.requestUnits)}h result and its estimate${scope.trim() ? `: ${scope.trim()}` : "; contents still need definition"}.`,
          ]
        : ["Confirm the full request’s scope and priority."]),
      ...(f.moved.length
        ? [
            "Check future capacity before agreeing new dates; it is not verified here.",
          ]
        : []),
    ],
    constraint: causalSummary(s, analyzeConflicts(s)),
  };
}

import { practiceFor } from "./practice";
import { shortProposal } from "./conversation";
import { scenarioContent, type SavedDecision } from "../storage/scenarios";

export function scenarioDifferences(a: Scenario, b: Scenario): string[] {
  if (scenarioContent(a) === scenarioContent(b)) return [];
  const differences: string[] = [];
  const daily = (s: Scenario) =>
    DAYS.map(
      (d, i) =>
        `${d}: ${hours(s.capacity[i])}h gross, ${hours(s.reserve?.[i] ?? 0)}h reserve`,
    ).join("; ");
  if (daily(a) !== daily(b))
    differences.push(
      `Daily capacity differs. A — ${daily(a)}. B — ${daily(b)}.`,
    );
  const request = (s: Scenario) =>
    `${s.request.name}, ${hours(s.request.units)}h by ${DAYS[s.request.deadline]}, ${s.request.priority} priority, ${s.request.movable ? "negotiable" : "fixed"}`;
  if (request(a) !== request(b))
    differences.push(
      `Original request differs. A — ${request(a)}. B — ${request(b)}.`,
    );
  const tasks = (s: Scenario) =>
    s.tasks
      .map(
        (t) =>
          `${t.name}: ${hours(t.units)}h by ${DAYS[t.deadline]}, ${t.priority} priority, ${t.movable ? "negotiable" : "fixed"}`,
      )
      .sort()
      .join("; ") || "none";
  if (tasks(a) !== tasks(b))
    differences.push(
      `Existing commitments differ. A — ${tasks(a)}. B — ${tasks(b)}.`,
    );
  return differences;
}
export function playbook(d: SavedDecision): string {
  const f = decisionFacts(d.scenario, d.plan, d.scope);
  const turn = practiceFor(d.scenario, f.plan, undefined, d.scope);
  const original = analyzeConflicts(d.scenario).firstConflict;
  return [
    `NEGOTIATION PLAYBOOK — ${d.scenario.request.name}`,
    original
      ? `Initial constraint: ${hours(original.due)}h due / ${hours(original.available)}h usable by ${DAYS[original.day]}; ${hours(original.deficit)}h short. ${f.constraint}`
      : "Initial constraint: all entered deadlines fit; any extra work still needs an estimate and a fresh check.",
    `Reasonable ask: ${shortProposal(d.scenario, f.plan, d.scope)}`,
    `Keep unchanged: ${f.retained.map((t) => `${t.name} (${hours(t.units)}h by ${DAYS[t.deadline]})`).join("; ") || "No existing work remains in this week."}`,
    `Open agreements: ${f.agreements.join(" ")}`,
    `Possible objection (authored practice, not a prediction): ${turn.prompt}`,
    `Conditional response: ${turn.choices.find((c) => c.id === "grounded")!.text}`,
    "Recheck every deadline after any changed condition. This preparation does not approve or send anything.",
  ].join("\n\n");
}
export function followUpText(d: SavedDecision): string {
  const note = d.notes.trim();
  const noteSentence = note
    ? note + (/[.!?]$/.test(note) ? "" : ".")
    : "[add the exact terms we agreed].";
  const f = decisionFacts(d.scenario, d.plan, d.scope);
  return d.outcome === "agreed"
    ? `Thanks for discussing ${d.scenario.request.name}. My understanding is: ${noteSentence} Could you confirm that I captured this correctly? I’ll check the updated timing before committing to any further changes.`
    : `${d.outcome === "revisit" ? "Could we revisit" : "Following up on"} ${d.scenario.request.name}: ${shortProposal(d.scenario, f.plan, d.scope)}${note ? ` My note for this conversation: ${noteSentence}` : ""} Could we confirm the next step?`;
}
export function decisionBrief(d: SavedDecision): string {
  return decisionBriefParts(d).join("\n\n");
}
// Keep authored sections intact for printing, especially multi-paragraph user text.
export function decisionBriefParts(d: SavedDecision): string[] {
  const s = d.scenario,
    f = decisionFacts(s, d.plan, d.scope),
    a = analyzeConflicts(s);
  return [
    `YESIF DECISION BRIEF — ${s.request.name}`,
    `Saved snapshot: ${d.created}. Proposed conditions, not an employer-approved agreement.`,
    `Initial request: ${hours(s.request.units)}h by ${DAYS[s.request.deadline]}.`,
    `Existing commitments:\n${s.tasks.map((t) => `• ${t.name}: ${hours(t.units)}h by ${DAYS[t.deadline]}; ${t.priority} priority; ${t.movable ? "negotiable" : "fixed"}.`).join("\n") || "None."}`,
    `Original week: ${hours(a.baseline.total)}h / ${hours(a.baseline.capacity)}h usable. ${f.constraint}`,
    `Original deadline checks:\n${a.baseline.checkpoints.map((c) => `${DAYS[c.day]}: ${hours(c.due)}h due / ${hours(c.available)}h usable; ${hours(c.deficit)}h short.`).join("\n")}`,
    `Chosen change:\n${f.items.join("\n")}`,
    `Updated week: ${hours(f.plan.result.total)}h / ${hours(f.plan.result.capacity)}h usable; ${hours(f.plan.result.capacity - f.plan.result.total)}h unassigned.`,
    `Checked deadlines:\n${f.plan.result.checkpoints.map((c) => `${DAYS[c.day]}: ${hours(c.due)}h due / ${hours(c.available)}h usable.`).join("\n")}`,
    `Required agreement:\n${f.agreements.join("\n")}`,
    `Outcome recorded by you: ${d.outcome === "agreed" ? "Agreement recorded by me (not independently verified)" : d.outcome === "revisit" ? "Needs another conversation" : "Not discussed yet"}.${d.notes ? `\nYour notes: ${d.notes}` : ""}`,
    `Your saved message (not verified by the calculation):\n${d.message}`,
    "Limits: entered estimates, divisible work available from the start, one person and five weekdays. No dependencies, delivery guarantee or verified future capacity.",
  ];
}
