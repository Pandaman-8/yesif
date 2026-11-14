import { useMemo, useState } from "react";
import { followUpText } from "../domain/decisionTools";
import type { SavedDecision } from "../storage/scenarios";
import { ArtifactText } from "./ArtifactText";
import { ConfirmDialog } from "./ConfirmDialog";
export interface FollowUpDraft {
  text: string;
  source: string;
}
export function FollowUp({
  decision: d,
  draft,
  change,
}: {
  decision: SavedDecision;
  draft?: FollowUpDraft;
  change: (draft: FollowUpDraft | undefined) => void;
}) {
  const generated = useMemo(() => followUpText(d), [d]),
    [reset, setReset] = useState(false);
  const [open, setOpen] = useState(false);
  const text = draft?.text ?? generated;
  return (
    <details
      className="follow-up"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Prepare a follow-up · Kit demo</summary>
      {open && (
        <>
          <p className="help">
            Based on your saved condition and self-recorded outcome. YESIF has
            not verified any approval. Nothing is sent.
          </p>
          {draft && draft.source !== generated && (
            <p role="status">
              The saved outcome or notes changed. Your edited follow-up is
              unchanged; regenerate explicitly to use the latest record.
            </p>
          )}
          <ArtifactText
            label="Follow-up message"
            text={text}
            onChange={(value) =>
              change({ text: value, source: draft?.source ?? generated })
            }
          />
          <button
            className="text-button"
            onClick={() => {
              if (draft && text !== generated) setReset(true);
              else change(undefined);
            }}
          >
            Regenerate follow-up
          </button>
          <p className="fine-print">
            Edits stay for this visit, including while you open another page.
            Copy them before reloading. They do not overwrite saved notes or
            your proposal.
          </p>
          {reset && (
            <ConfirmDialog
              title="Replace your follow-up edits?"
              description="Copy your current follow-up first if you want to keep it. Regenerating uses the latest saved outcome and notes."
              cancel={() => setReset(false)}
            >
              <button
                className="button primary"
                onClick={() => {
                  change(undefined);
                  setReset(false);
                }}
              >
                Replace follow-up
              </button>
            </ConfirmDialog>
          )}
        </>
      )}
    </details>
  );
}
