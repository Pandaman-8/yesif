import { decisionFacts } from "../domain/decisionTools";
import { DAYS, hours, type Option, type Scenario } from "../domain/engine";
import { DeadlineTable } from "./Shared";
export function DecisionFacts({
  scenario,
  plan,
  scope = "",
}: {
  scenario: Scenario;
  plan: Pick<Option, "deferred" | "requestUnits">;
  scope?: string;
}) {
  const f = decisionFacts(scenario, plan, scope);
  return (
    <div className="decision-facts">
      <dl>
        <div>
          <dt>New request</dt>
          <dd>
            {scenario.request.name} · {hours(scenario.request.units)}h
            originally → {hours(f.plan.requestUnits)}h proposed · due{" "}
            {DAYS[scenario.request.deadline]}.
          </dd>
        </div>
        <div>
          <dt>Retained this week</dt>
          <dd>
            {f.retained.length ? (
              <ul>
                {f.retained.map((t) => (
                  <li key={t.id}>
                    {t.name} · {hours(t.units)}h · {DAYS[t.deadline]} ·{" "}
                    {t.priority === "high"
                      ? "High priority"
                      : "Normal priority"}{" "}
                    · {t.movable ? "negotiable" : "fixed"}
                  </li>
                ))}
              </ul>
            ) : (
              "No existing commitments remain this week."
            )}
          </dd>
        </div>
        <div>
          <dt>Moved, still owed</dt>
          <dd>
            {f.moved.length ? (
              <ul>
                {f.moved.map((t) => (
                  <li key={t.id}>
                    {t.name} · {hours(t.units)}h · originally {DAYS[t.deadline]}{" "}
                    ·{" "}
                    {t.priority === "high"
                      ? "High priority"
                      : "Normal priority"}
                    .
                  </li>
                ))}
              </ul>
            ) : (
              "None."
            )}
          </dd>
        </div>
        <div>
          <dt>Agreement needed</dt>
          <dd>
            <ul>
              {f.agreements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <DeadlineTable result={f.plan.result} />
      <p className="fine-print">
        Every current-week deadline is checked against entered estimates.
        Approval, delivery quality and future scheduling are not verified.
      </p>
    </div>
  );
}
