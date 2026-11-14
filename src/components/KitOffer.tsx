export function KitOffer({
  unlocked,
  unlock,
}: {
  unlocked: boolean;
  unlock: () => void;
}) {
  return (
    <section className="kit-banner" aria-label="Free and Kit demo">
      <div>
        <p className="eyebrow">THE NEGOTIATION KIT · PRICING EXPERIMENT</p>
        <h2>Keep the next conversation in context.</h2>
        <div className="kit-features">
          <div>
            <h3>Free</h3>
            <p>
              Unlimited workload checks, deadline explanations, verified
              alternatives and comparison, editable/copyable proposals, two-step
              practice and one saved decision.
            </p>
          </div>
          <div>
            <h3>Kit demo</h3>
            <p>
              Up to 50 local decisions, comparison of two saved snapshots, a
              Negotiation Playbook, editable follow-ups, and a
              copyable/printable Decision Brief.
            </p>
          </div>
        </div>
        <p className="fine-print">
          Data stays in this browser; no account or sync. Saved decisions remain
          readable and exportable after demo access ends.
        </p>
      </div>
      <div className="kit-action">
        <div className="price">
          $4.99 <span>one time · proposed, unvalidated price</span>
        </div>
        <button className="button primary" disabled={unlocked} onClick={unlock}>
          {unlocked
            ? "Demo unlocked"
            : "Unlock free demo — no payment required"}
        </button>
        <p className="fine-print">
          No payment is collected. No account, subscription, renewal or
          automatic charging. Demo access lasts for this visit and resets on
          reload.
        </p>
      </div>
    </section>
  );
}
