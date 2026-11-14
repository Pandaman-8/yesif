import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  ShieldCheck,
  LockKeyhole,
  BookOpen,
  Download,
} from "lucide-react";
import {
  DAYS,
  analyze,
  simulate,
  emptyScenario,
  exampleScenario,
  optionTitle,
  validate,
  type Scenario,
  type Option,
} from "./domain/engine";
import {
  readNotebook,
  writeNotebook,
  type Notebook,
  type SavedDecision,
} from "./storage/scenarios";

import { Workload } from "./components/Workload";
import { Results } from "./components/Results";
import { Proposal } from "./components/Proposal";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FollowUp } from "./components/FollowUp";
import { shortProposal, renegotiationRequest } from "./domain/conversation";
import {
  readDraft,
  writeDraft,
  encodeDraft,
  DRAFT_KEY,
  type Draft,
} from "./storage/draft";

type Page = "landing" | "workload" | "results" | "proposal" | "notebook";

const load = () => {
  try {
    return readNotebook(window.localStorage);
  } catch {
    return {
      notebook: { version: 1 as const, decisions: [] },
      warning:
        "Local saving is unavailable in this browser. You can still use and copy every proposal.",
    };
  }
};
function App() {
  const [initial] = useState(load);
  const [page, setPage] = useState<Page>("landing");
  const [scenario, setScenario] = useState<Scenario>(exampleScenario);
  const [selected, setSelected] = useState<Option | null>(null);
  const [simDeferred, setSimDeferred] = useState<string[]>([]);
  const [simUnits, setSimUnits] = useState(20);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState(initial.warning);
  const [notebook, setNotebook] = useState<Notebook>(initial.notebook);
  const [unlocked, setUnlocked] = useState(false);
  const [demo, setDemo] = useState(false);
  const [unresolved, setUnresolved] = useState(false);
  const [scope, setScope] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [removingDraft, setRemovingDraft] = useState(false);
  const [deleting, setDeleting] = useState<SavedDecision | null>(null);
  const [recovery, setRecovery] = useState<Draft | null>(() => {
    try {
      return readDraft(window.localStorage);
    } catch {
      return null;
    }
  });
  const messageEdited = useRef(false);
  const [dialogError, setDialogError] = useState("");
  const [savedId, setSavedId] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const output = validate(scenario).length === 0 ? analyze(scenario) : null;
  const chosen =
    output && selected
      ? simulate(scenario, selected.deferred, selected.requestUnits)
      : null;
  const simulation = output ? simulate(scenario, simDeferred, simUnits) : null;
  const fingerprint = encodeDraft({
    version: 2,
    scenario,
    plan: selected
      ? { deferred: selected.deferred, requestUnits: selected.requestUnits }
      : null,
    unresolved,
    message,
    scope,
    preview: { deferred: simDeferred, requestUnits: simUnits },
  });
  const cleanFingerprint = useRef(fingerprint);
  const hasChanges = dirty && fingerprint !== cleanFingerprint.current;
  useEffect(() => {
    if (!dirty) cleanFingerprint.current = fingerprint;
  }, [dirty, fingerprint]);
  useEffect(() => {
    if (!hasChanges && !Object.keys(noteEdits).length) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges, noteEdits]);
  function guard(action: () => void) {
    if (hasChanges || Object.keys(noteEdits).length) {
      setDialogError("");
      setPending(() => action);
    } else action();
  }
  function go(next: Page) {
    if (next === "workload" && messageEdited.current) {
      guard(() => {
        messageEdited.current = false;
        navigate(next);
      });
      return;
    }
    navigate(next);
  }
  function navigate(next: Page) {
    setPage(next);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => heading.current?.focus(), 0);
  }
  function change(next: Scenario) {
    setDirty(true);
    setDemo(false);
    setScope("");
    messageEdited.current = false;
    setScenario(next);
    setSelected(null);
    setSimDeferred([]);
    setSimUnits(next.request.units);
    setMessage("");
    setUnresolved(false);
    setSavedId("");
    setNotice("");
    if (errors.length) setErrors(validate(next));
  }
  function start(example: boolean) {
    guard(() => {
      change(example ? exampleScenario() : emptyScenario());
      setDemo(example);
      setDirty(false);
      setErrors([]);
      navigate(example && page === "landing" ? "results" : "workload");
    });
  }
  function editSimulation(action: () => void) {
    const apply = () => {
      action();
      setDirty(true);
      setSelected(null);
      setSavedId("");
      setMessage("");
      setUnresolved(false);
      messageEdited.current = false;
    };
    if (messageEdited.current) guard(apply);
    else apply();
  }
  function editDeferred(ids: string[]) {
    editSimulation(() => setSimDeferred(ids));
  }
  function editUnits(n: number) {
    editSimulation(() => setSimUnits(n));
  }
  function editScope(text: string) {
    editSimulation(() => setScope(text));
  }
  function editMessage(text: string) {
    setMessage(text);
    setDirty(true);
    messageEdited.current = true;
    setNotice("");
  }
  function prepareConflict() {
    const action = () => {
      setSelected(null);
      setUnresolved(true);
      setMessage(renegotiationRequest(scenario));
      setSavedId("");
      setDirty(true);
      messageEdited.current = false;
      navigate("proposal");
    };
    if (messageEdited.current) guard(action);
    else action();
  }
  function saveCurrentDraft(): boolean {
    if (Object.keys(noteEdits).length) {
      const next = {
        ...notebook,
        decisions: notebook.decisions.map((d) =>
          noteEdits[d.id] === undefined ? d : { ...d, notes: noteEdits[d.id] },
        ),
      };
      if (!persist(next)) {
        setDialogError(
          "Your outcome notes could not be saved. Cancel and copy them before leaving.",
        );
        return false;
      }
      setNoteEdits({});
    }
    const draft: Draft = {
      version: 2,
      page:
        page === "workload" || page === "results" || page === "proposal"
          ? page
          : chosen || unresolved
            ? "proposal"
            : "workload",
      scenario: structuredClone(scenario),
      plan: chosen
        ? { deferred: chosen.deferred, requestUnits: chosen.requestUnits }
        : null,
      unresolved,
      message,
      scope,
      preview: simulation
        ? { deferred: simDeferred, requestUnits: simUnits }
        : undefined,
    };
    let error = "";
    try {
      error = writeDraft(window.localStorage, draft);
    } catch {
      error =
        "This browser could not save your draft. Your current work is still here.";
    }
    if (error) {
      setDialogError(error);
      setNotice(error);
      return false;
    }
    setRecovery(draft);
    setDirty(false);
    setNotice("Draft saved on this device. It can be resumed after reload.");
    return true;
  }
  function resumeDraft() {
    if (!recovery) return;
    guard(() => {
      setScenario(structuredClone(recovery.scenario));
      setSelected(
        recovery.plan
          ? simulate(
              recovery.scenario,
              recovery.plan.deferred,
              recovery.plan.requestUnits,
            )
          : null,
      );
      setSimDeferred(
        recovery.preview?.deferred ?? recovery.plan?.deferred ?? [],
      );
      setSimUnits(
        recovery.preview?.requestUnits ??
          recovery.plan?.requestUnits ??
          recovery.scenario.request.units,
      );
      setMessage(recovery.message);
      setScope(recovery.scope);
      setUnresolved(recovery.unresolved);
      setSavedId("");
      setDirty(false);
      setDemo(false);
      setErrors([]);
      messageEdited.current = !!recovery.message;
      navigate(
        recovery.page ??
          (recovery.plan || recovery.unresolved
            ? "proposal"
            : recovery.preview
              ? "results"
              : "workload"),
      );
    });
  }
  function resetMessage() {
    const action = () => {
      setMessage(
        chosen
          ? shortProposal(scenario, chosen, scope)
          : renegotiationRequest(scenario),
      );
      messageEdited.current = false;
      setDirty(true);
      setNotice("Draft reset to the current calculation.");
    };
    if (messageEdited.current) guard(action);
    else action();
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const problems = validate(scenario);
    setErrors(problems);
    if (problems.length) {
      setTimeout(() => document.getElementById("form-errors")?.focus(), 0);
      return;
    }
    go("results");
  }
  function choose(option: Option) {
    const action = () => {
      const fresh = simulate(scenario, option.deferred, option.requestUnits);
      setSelected(fresh);
      setSimDeferred(fresh.deferred);
      setSimUnits(fresh.requestUnits);
      setMessage(shortProposal(scenario, fresh, scope));
      setUnresolved(false);
      setSavedId("");
      setDirty(true);
      messageEdited.current = false;
      navigate("proposal");
    };
    if (messageEdited.current) guard(action);
    else action();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setNotice("Proposal copied. Ready to paste wherever you work.");
    } catch {
      setNotice(
        "Clipboard access was unavailable. Select the proposal text and copy it manually.",
      );
      document.getElementById("proposal-text")?.focus();
      (
        document.getElementById("proposal-text") as HTMLTextAreaElement | null
      )?.select();
    }
  }
  function persist(next: Notebook) {
    let error: string;
    try {
      error = writeNotebook(window.localStorage, next);
    } catch {
      error = "Local saving is unavailable. Copy your proposal before leaving.";
    }
    if (error) {
      setNotice(error);
      return false;
    }
    setNotebook(next);
    return true;
  }
  function save() {
    if (!chosen) return;
    if (!savedId && notebook.decisions.length >= (unlocked ? 50 : 1)) {
      go("notebook");
      setNotice(
        unlocked
          ? "This device has reached the 50-decision storage limit. Delete an old decision to make room."
          : "Your free saved decision is safe. Unlock the no-payment kit demo to save more, or delete it to use the free slot again.",
      );
      return;
    }
    const id = savedId || crypto.randomUUID();
    const old = notebook.decisions.find((d) => d.id === id);
    const decision: SavedDecision = {
      id,
      created: old?.created || new Date().toISOString(),
      scenario: structuredClone(scenario),
      plan: { deferred: chosen.deferred, requestUnits: chosen.requestUnits },
      message,
      scope,
      outcome: old?.outcome || "pending",
      notes: old?.notes || "",
    };
    if (
      persist({
        version: 1,
        decisions: [decision, ...notebook.decisions.filter((d) => d.id !== id)],
      })
    ) {
      setSavedId(id);
      setDirty(false);
      messageEdited.current = false;
      setNotice("Saved on this device. No message was sent.");
    }
  }
  function restore(d: SavedDecision) {
    guard(() => {
      setScenario(structuredClone(d.scenario));
      setSelected(simulate(d.scenario, d.plan.deferred, d.plan.requestUnits));
      setSimDeferred(d.plan.deferred);
      setSimUnits(d.plan.requestUnits);
      setMessage(d.message);
      setSavedId(d.id);
      setErrors([]);
      setScope(d.scope ?? "");
      setUnresolved(false);
      setDemo(false);
      setDirty(false);
      messageEdited.current = false;
      navigate("proposal");
    });
  }
  function updateDecision(
    id: string,
    patch: Partial<Pick<SavedDecision, "outcome" | "notes">>,
  ) {
    if (patch.notes !== undefined)
      setNoteEdits((previous) => ({ ...previous, [id]: patch.notes! }));
    const success = persist({
      ...notebook,
      decisions: notebook.decisions.map((d) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    });
    if (success && patch.notes !== undefined)
      setNoteEdits((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
  }
  function exportNotebook() {
    try {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(notebook, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "yesif-decisions.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setNotice(
        "Export prepared. Check your browser’s downloads for yesif-decisions.json. It contains your saved task names, proposals, and notes.",
      );
    } catch {
      setNotice(
        "Export could not be prepared. Your saved decisions are still available here.",
      );
    }
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="wordmark"
            onClick={() => go("landing")}
            aria-label="YESIF home"
          >
            yesif<span>.</span>
          </button>
          <span className="brand-note">
            A little clarity before you commit.
          </span>
          <nav aria-label="Main navigation">
            <button className="nav-link" onClick={() => go("notebook")}>
              <BookOpen size={16} /> <span>My decisions</span>
              {notebook.decisions.length > 0 && (
                <span className="count">{notebook.decisions.length}</span>
              )}
            </button>
            <button className="nav-kit" onClick={() => go("notebook")}>
              The negotiation kit <ArrowUpRight size={14} />
            </button>
          </nav>
        </div>
      </header>
      <main id="main" key={page} className="page-enter">
        {removingDraft && (
          <ConfirmDialog
            title="Remove the saved draft?"
            description="This removes only the separate recovery copy. Your current work and saved decisions stay available."
            cancel={() => setRemovingDraft(false)}
          >
            <button
              className="button primary"
              onClick={() => {
                try {
                  localStorage.removeItem(DRAFT_KEY);
                  setRecovery(null);
                  setRemovingDraft(false);
                } catch {
                  setNotice("This browser could not remove the saved draft.");
                }
              }}
            >
              Remove draft
            </button>
          </ConfirmDialog>
        )}
        {pending && (
          <ConfirmDialog
            title="Keep your current work?"
            description="This action will replace unsaved changes. Save a local draft, discard the changes, or stay here."
            cancel={() => setPending(null)}
          >
            <button
              className="button primary"
              onClick={() => {
                if (saveCurrentDraft()) {
                  const action = pending;
                  setPending(null);
                  setDirty(false);
                  action();
                }
              }}
            >
              Save draft and continue
            </button>
            <button
              className="text-button"
              onClick={() => {
                const action = pending;
                setPending(null);
                setDirty(false);
                setNoteEdits({});
                action();
              }}
            >
              Discard changes
            </button>
            {dialogError && <p role="alert">{dialogError}</p>}
          </ConfirmDialog>
        )}
        {deleting && (
          <ConfirmDialog
            title="Delete this saved decision?"
            description={`“${deleting.scenario.request.name}” and its notes will be removed from this browser.`}
            cancel={() => setDeleting(null)}
          >
            <button
              className="button primary"
              onClick={() => {
                if (
                  persist({
                    ...notebook,
                    decisions: notebook.decisions.filter(
                      (d) => d.id !== deleting.id,
                    ),
                  })
                ) {
                  if (savedId === deleting.id) {
                    setSavedId("");
                    setDirty(true);
                  }
                  setNoteEdits((previous) => {
                    const next = { ...previous };
                    delete next[deleting.id];
                    return next;
                  });
                  setDeleting(null);
                  setNotice("Decision deleted from this browser.");
                }
              }}
            >
              Delete decision
            </button>
            {notice && <p role="alert">{notice}</p>}
          </ConfirmDialog>
        )}
        {hasChanges && page !== "landing" && (
          <div className="draft-strip">
            <span>Unsaved changes · save before leaving</span>
            <button className="text-button" onClick={saveCurrentDraft}>
              Save local draft
            </button>
          </div>
        )}

        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {page === "landing" ? (
          <>
            {recovery && (
              <div className="recovery-bar wrap">
                <p>
                  A local draft is ready to resume. It is separate from your
                  saved decisions.
                </p>
                <button className="button outline" onClick={resumeDraft}>
                  Resume local draft
                </button>
                <button
                  className="text-button"
                  onClick={() => setRemovingDraft(true)}
                >
                  Remove saved draft
                </button>
              </div>
            )}
            <section className="hero wrap">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className="little-line" /> FOR THE NEXT “QUICK FAVOR”
                </p>
                <h1 ref={heading} tabIndex={-1}>
                  Your week is full.
                  <br />
                  Your answer
                  <br />
                  has <em>options.</em>
                </h1>
                <p className="hero-description">
                  A new request, an already full week. See which commitments can
                  change, check how the work fits each day, and prepare a clear
                  proposal for your manager.
                </p>
                <div className="hero-actions">
                  <button
                    className="button primary"
                    onClick={() => start(true)}
                  >
                    Try a real example <ArrowRight size={18} />
                  </button>
                  <button className="text-button" onClick={() => start(false)}>
                    Use my own workload <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="trust-line">
                  <ShieldCheck size={15} />
                  <span>No account. Private on your device. Free to try.</span>
                </div>
              </div>
              <div
                className="hero-visual"
                aria-label="Illustrative example: 18 hours of work, 15 available. Propose deferring a five-hour report to make room."
              >
                <div className="paper-top">
                  <span className="paper-dot" />
                  <span>A WEEK WITH A LITTLE TOO MUCH IN IT</span>
                  <span className="paper-number">01 / 03</span>
                </div>
                <div className="week-paper">
                  <div className="paper-title">
                    <span>Your week, at a glance</span>
                    <span className="small-pill">15h available</span>
                  </div>
                  <div className="mini-days">
                    {DAYS.map((d) => (
                      <span key={d}>{d.slice(0, 3).toUpperCase()}</span>
                    ))}
                  </div>
                  <div className="week-block qa">
                    Launch QA <span>5h</span>
                  </div>
                  <div className="week-block updates">
                    Customer updates <span>3h</span>
                  </div>
                  <div className="week-block report">
                    Weekly report <span>5h</span>
                  </div>
                  <div className="week-block request">
                    ↳ The new presentation <span>+5h</span>
                  </div>
                  <div className="paper-total">
                    <span>A full yes would mean</span>
                    <strong>
                      18h <span>/ 15h</span>
                    </strong>
                  </div>
                </div>
                <div className="if-note">
                  <div className="note-icon">
                    <ArrowUpRight size={23} />
                  </div>
                  <div>
                    <p>THERE’S ANOTHER WAY TO SAY YES.</p>
                    <blockquote>
                      “Yes, if we move
                      <br />
                      the weekly report.”
                    </blockquote>
                    <span>
                      One clear trade-off. A conversation you can have.
                    </span>
                  </div>
                </div>
                <span className="visual-caption">
                  A fictional week. A very familiar situation.
                </span>
              </div>
            </section>
            <section className="how wrap">
              <div className="how-intro">
                <p className="eyebrow">
                  LESS GUESSWORK. MORE GROUND TO STAND ON.
                </p>
                <h2>
                  From “I’ll try”
                  <br />
                  to “here’s how.”
                </h2>
              </div>
              <div className="how-step">
                <span>01</span>
                <h3>See the whole picture</h3>
                <p>
                  Add your available hours and commitments. We check the
                  deadlines, too.
                </p>
              </div>
              <div className="how-step">
                <span>02</span>
                <h3>Choose what can change</h3>
                <p>
                  Compare specific trade-offs. Keep your fixed commitments
                  protected.
                </p>
              </div>
              <div className="how-step">
                <span>03</span>
                <h3>Make a clear proposal</h3>
                <p>
                  Leave with an editable message and a little practice for the
                  conversation.
                </p>
              </div>
            </section>
            <section className="landing-note wrap">
              <span>EVERY YES NEEDS AN IF.</span>
              <p>You bring the context. We help you see the choices.</p>
              <button className="text-button" onClick={() => start(true)}>
                Find your if <ArrowRight size={16} />
              </button>
            </section>
          </>
        ) : (
          <div className="workspace wrap">
            {page !== "notebook" && (
              <ol className="stepper" aria-label="Your progress">
                {[
                  ["workload", "Set the scene"],
                  ["results", "Find your if"],
                  ["proposal", "Make your proposal"],
                ].map(([id, label], i) => (
                  <li
                    key={id}
                    className={page === id ? "active" : ""}
                    aria-current={page === id ? "step" : undefined}
                  >
                    <button
                      disabled={
                        id === "results"
                          ? !output
                          : id === "proposal"
                            ? !(chosen || unresolved)
                            : false
                      }
                      title={
                        id === "results" && !output
                          ? "Complete valid workload inputs first"
                          : id === "proposal" && !(chosen || unresolved)
                            ? "Choose an option or prepare a renegotiation request first"
                            : label
                      }
                      onClick={() => go(id as Page)}
                    >
                      <span>{i + 1}</span>
                      {label}
                    </button>
                    {id === "results" && !output && (
                      <small>Complete valid inputs first</small>
                    )}
                    {id === "proposal" && !(chosen || unresolved) && (
                      <small>Choose a plan or request a change</small>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {page === "workload" && (
              <Workload
                scenario={scenario}
                change={change}
                heading={heading}
                errors={errors}
                submit={submit}
                reset={() => start(true)}
              />
            )}
            {page === "results" && output && simulation && (
              <Results
                scenario={scenario}
                heading={heading}
                demo={demo}
                simulation={simulation}
                deferred={simDeferred}
                units={simUnits}
                setDeferred={editDeferred}
                setUnits={editUnits}
                scope={scope}
                setScope={editScope}
                choose={choose}
                edit={() => go("workload")}
                unresolved={prepareConflict}
              />
            )}
            {page === "proposal" && (chosen || unresolved) && (
              <Proposal
                scenario={scenario}
                chosen={chosen}
                heading={heading}
                message={message}
                setMessage={editMessage}
                scope={scope}
                copy={copy}
                save={save}
                saveDraft={saveCurrentDraft}
                savedId={savedId}
                reset={resetMessage}
                compare={() => go("results")}
              />
            )}
            {page === "notebook" && (
              <>
                <button
                  className="text-button notebook-return"
                  onClick={() =>
                    go(chosen || unresolved ? "proposal" : "workload")
                  }
                >
                  <ArrowLeft size={15} />{" "}
                  {chosen || unresolved
                    ? "Back to my proposal"
                    : "Back to my workload"}
                </button>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">A LITTLE LESS STARTING OVER</p>
                    <h1 ref={heading} tabIndex={-1}>
                      Your decision notebook.
                    </h1>
                    <p>Keep the context. Come back when priorities change.</p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => start(false)}
                  >
                    New situation <Plus size={16} />
                  </button>
                </div>
                <section className="kit-banner">
                  <div>
                    <span className="eyebrow">
                      THE NEGOTIATION KIT · PRICING EXPERIMENT
                    </span>
                    <h2>Make your next conversation easier.</h2>
                    <p>
                      Keep your decisions, compare saved conditions, record the
                      response, and prepare a follow-up. Reuse your workload
                      when the next request arrives.
                    </p>
                    <span className="fine-print">
                      One saved decision and the complete core workflow are
                      free. Data stays in this browser; no sync. Demo unlock
                      lasts for this visit.
                    </span>
                  </div>
                  <div className="kit-action">
                    <div className="price">
                      $4.99 <span>one time · proposed price</span>
                    </div>
                    <button
                      className="button primary"
                      disabled={unlocked}
                      onClick={() => {
                        setUnlocked(true);
                        setNotice(
                          "Kit demo unlocked for this visit. No payment, account, or subscription.",
                        );
                      }}
                    >
                      {unlocked ? (
                        <>
                          <Check size={16} /> Demo unlocked
                        </>
                      ) : (
                        <>
                          Unlock free demo <ArrowUpRight size={16} />
                        </>
                      )}
                    </button>
                    <small>No checkout. No payment is collected.</small>
                  </div>
                </section>
                <div className="section-title notebook-heading">
                  <h2>
                    Saved on this device{" "}
                    <span className="small-pill">
                      {notebook.decisions.length}
                    </span>
                  </h2>
                  {unlocked && notebook.decisions.length > 0 && (
                    <button className="text-button" onClick={exportNotebook}>
                      <Download size={16} /> Export notebook
                    </button>
                  )}
                </div>
                {notebook.decisions.length === 0 ? (
                  <div className="empty-notebook">
                    <BookOpen size={30} />
                    <h3>Your next decision can start here.</h3>
                    <p>
                      Save a proposal after choosing a trade-off. It will stay
                      here when you return to this browser.
                    </p>
                    <button
                      className="button outline"
                      onClick={() => start(true)}
                    >
                      Try the example <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="saved-grid">
                    {notebook.decisions.map((d) => (
                      <article className="panel saved-card" key={d.id}>
                        <p className="eyebrow">
                          {new Date(d.created).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          · SAVED SNAPSHOT
                        </p>
                        <h3>{d.scenario.request.name}</h3>
                        <p>
                          {optionTitle(
                            d.scenario,
                            simulate(
                              d.scenario,
                              d.plan.deferred,
                              d.plan.requestUnits,
                            ),
                          )}
                        </p>
                        <label>
                          Conversation outcome
                          <select
                            value={d.outcome}
                            onChange={(e) =>
                              updateDecision(d.id, {
                                outcome: e.target
                                  .value as SavedDecision["outcome"],
                              })
                            }
                          >
                            <option value="pending">Not discussed yet</option>
                            <option value="agreed">
                              Agreement recorded by me
                            </option>
                            <option value="revisit">
                              Needs another conversation
                            </option>
                          </select>
                        </label>
                        <label>
                          What was agreed?
                          <textarea
                            rows={2}
                            maxLength={2000}
                            value={noteEdits[d.id] ?? d.notes}
                            placeholder="A new date, a smaller scope, a next step…"
                            onChange={(e) =>
                              updateDecision(d.id, { notes: e.target.value })
                            }
                          />
                        </label>
                        {noteEdits[d.id] !== undefined && (
                          <p className="error-box">
                            This note is not saved yet. It stays here while this
                            page is open.{" "}
                            <button
                              className="text-button"
                              onClick={() =>
                                updateDecision(d.id, { notes: noteEdits[d.id] })
                              }
                            >
                              Retry saving note
                            </button>
                          </p>
                        )}
                        <p className="fine-print">
                          Your note only; the saved workload does not change.
                        </p>
                        {unlocked && (
                          <FollowUp
                            key={`${d.id}:${d.outcome}:${d.notes}`}
                            decision={d}
                          />
                        )}
                        <div className="saved-actions">
                          <button
                            className="text-button"
                            onClick={() => restore(d)}
                          >
                            Open decision <ArrowRight size={15} />
                          </button>
                          <button
                            className="text-button"
                            onClick={() =>
                              guard(() => {
                                change(structuredClone(d.scenario));
                                setDirty(false);
                                setErrors([]);
                                navigate("workload");
                              })
                            }
                          >
                            Reuse workload
                          </button>
                          <button
                            className="delete-button"
                            aria-label={`Delete saved ${d.scenario.request.name}`}
                            onClick={() => {
                              setNotice("");
                              setDeleting(d);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <p className="fine-print">
                  Export includes working details, proposals and notes. Keep the
                  file private. Saving is explicit. Clearing browser data
                  removes this notebook. Avoid sensitive names on shared
                  devices. No analytics, accounts, or task uploads.
                </p>
              </>
            )}
          </div>
        )}
      </main>
      <footer className="footer wrap">
        <span className="footer-logo">yesif.</span>
        <span>Every yes needs an if.</span>
        <span className="footer-right">
          <LockKeyhole size={13} /> Your work stays yours.
        </span>
      </footer>
    </>
  );
}
export default App;
