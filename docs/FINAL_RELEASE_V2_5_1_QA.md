# YESIF V2.5.1 — final human QA corrections

## Release status

**PRINT QA PASS — captain-confirmed independent review of the real two-page PDF from local V2.5.1 (2026-11-15).** Both pages preserve all calculations, the manual message and Limits; no lost text, blank pages or awkward section breaks were reported. This is external human verification supplied by the captain, not a native preview independently observed by this agent. The blocking print gate is closed. Fresh regression and publication evidence follow below.

Pre-release baseline: `51ff6b4fa48512ddebe57730579bfecd2abfd653`.
Local rollback reference: `codex/yesif-v2-5-rollback`, pointing to that exact commit.
Working branch: `codex/yesif-v2-5-1-human-qa`.

## Confirmed corrections

- Practice completion quotes `firstAnswer.text` and `answer.text` exactly. Each quotation has its own label and a separate concise feedback paragraph. The authored evidence disclosure remains available for both answers. No state transition, scoring rule or proposal regeneration was added.
- Second-step acknowledgement and unsupported-commitment wording now responds to the objection instead of repeating the first-step wording. Grounded replies and the rubric are unchanged.
- Notebook cards show a snapshot number and saved date/time alongside the existing selected change. Comparison options use compact change labels, with the full name, full change and date immediately below the selected control. Labels are derived without writing or migrating saved records. Long request names can still be abbreviated in a native select; the full description wraps below it.
- The print-only Brief has a title, section headings, readable typography, 18mm margins, and a preference for keeping short sections together. Long content may paginate naturally. The original section strings are retained separately for rendering so a manual message containing blank lines or heading-like text cannot be mistaken for generated report sections. Copy output remains the same joined text. Native pagination is **PASS by captain-confirmed review**, as recorded above.

## Exact changed source files

| File | Change |
| --- | --- |
| `src/components/NegotiationPractice.tsx` | Exact selected quotations and separate compact feedback |
| `src/domain/practice.ts` | Authored second-step wording only |
| `src/components/savedLabels.ts` (new) | Pure presentation helpers for dates and compact choices |
| `src/components/SavedComparison.tsx` | Short choices and accessible full selected descriptions |
| `src/App.tsx` | Notebook date labels and structured print-only rendering |
| `src/components/DecisionKit.tsx` | Pass existing Brief sections to the print callback |
| `src/components/PrintBrief.tsx` (new) | Sectioned print presentation preserving manual paragraphs |
| `src/domain/decisionTools.ts` | Expose existing Brief sections; joined text unchanged |
| `src/styles.css` | Wrapped selected descriptions and print-specific typography/pagination |
| `src/tests/v251-human-qa.test.tsx` (new) | Six focused regression cases |

Additional files are this report and five actual browser captures in `artifacts/v2.5.1/`. Existing tests, package manifests, lockfile and deployment configuration were not edited.

## Regression coverage and required commands

Six new cases cover:

1. The exact 2h-of-5h scope path with risky first and risky second replies; both quotations, separate feedback, Back clearing the second choice, Retry, Skip, exact manual proposal preservation, and no implicit save.
2. Exact first quotation for the grounded choice.
3. Exact first quotation for the acknowledgement choice.
4. Same-named comparison records, selected description/date, correct 15/15 versus 13/15 results, and unchanged stored bytes.
5. All Brief facts/disclaimers and multiline manual text surviving structured print rendering, including a manual paragraph beginning with `Original week:`.
6. Distinct scope follow-up choices and evidence quotations that remain actual substrings of the authored replies.

Final required command chain, on the final source:

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 109 packages, 6s |
| `npm run typecheck` | PASS |
| `npm test` | **153/153 PASS**, 18 files, 57.71s; all original 147 retained |
| `npm run build` | PASS — Vite build 995ms |
| `git diff --check` | PASS |

Final runtime assets: `index-B4rcIoAJ.js` (333.50 kB; 100.20 kB gzip) and `index-BertTNsz.css` (56.43 kB; 11.67 kB gzip).

Earlier focused checks caught a case-sensitive authored evidence quote and a selector accessible name expanded by the new helper text. Both were corrected in source; no existing assertion or timeout was weakened. An earlier complete run also passed 153/153. After retaining original Brief section boundaries, the focused print/Kit checks passed 14/14, followed by the final complete command chain above.

## Actual browser verification

Used the production preview at `http://localhost:5181/yesif/` through visible UI controls, with no app-state injection. Test records were created explicitly in this QA origin; existing user records were not deleted or rewritten for labels.

- **PASS:** example → reduce request from 5h to 2h → manually edit proposal → risky first reply → manager pushback → risky second reply → finish. Both completion quotations matched the selected authored strings exactly, with feedback outside the quotations.
- **PASS:** Back retained the first choice and cleared the second; moving forward left Finish disabled until a new choice. Retry reset the choice. Skip returned to the idle practice state.
- **PASS:** `My exact proposal.\nKeep all my punctuation — and terms.` remained byte-for-byte unchanged through practice. It also remained visible after saving, reloading, and reopening its snapshot.
- **PASS:** two actually saved `Urgent presentation` decisions appeared in Notebook with distinct snapshot numbers, selected changes and timestamps. Labels did not modify their content.
- **PASS:** comparison selected `1. Urgent presentation · Move 5h` and `2. Urgent presentation · Scope 2h`. Full descriptions showed their respective saved times and changes. The resulting cards showed 13/15 with 2h unassigned, and 15/15 with 0h unassigned, including agreement and future-capacity limitations.
- **PASS, bounded visual coverage:** saved comparison inspected at viewport widths **375, 390, 900 and 1440px**. At each width the document scroll width equalled its client width, with no horizontal page overflow. Mobile descriptions wrapped; tablet/desktop comparison used two columns. These captures cover the changed saved-comparison layout, not every product screen at every width.
- **PASS — external human verification:** the captain confirmed independent inspection of both pages of the real local V2.5.1 PDF. All calculations, manual text and Limits are retained; no text loss, blank pages or awkward breaks. Earlier automation could not complete native preview, as recorded in the historical attempt below.

Screenshots, all actually viewed:

- `artifacts/v2.5.1/notebook-390.jpg`
- `artifacts/v2.5.1/comparison-375.jpg`
- `artifacts/v2.5.1/comparison-390.jpg`
- `artifacts/v2.5.1/comparison-900.jpg`
- `artifacts/v2.5.1/comparison-1440.jpg`

Requested viewport widths were verified using `window.innerWidth`; client widths were 360, 375, 885 and 1425px because of the 15px scrollbar. Capture dimensions may differ from the viewport because of the browser capture surface. The 1440px image is soft; it supports layout inspection, not a claim about precise text rasterization. Initial screenshot attempts failed until the preview was made visible. Temporary viewport overrides were reset afterward. A later in-app tab closed during an additional practice capture, so no final practice screenshot is claimed.

## Protected behavior

Diff review confirms no edits to the mathematical engine, allocation, conflicts, ranking, conversation grounding, storage files, follow-up component, clipboard component, Free/Kit offer, $4.99 experiment, package dependencies or GitHub Pages workflow/configuration. The existing follow-up function in `decisionTools.ts` is unchanged. ShiftMargin was not touched. No demand or payment-validation claim was added.

The captain has closed the print gate. Release now requires a fresh sequential install, typecheck, test, build and whitespace check, followed by CI and production verification.

Final V2.5.1 commit SHA: **not created**. GitHub Actions: **not triggered for this patch**. Production: **not updated by this task**. The rollback reference is preserved locally.

## Historical blocked handoff attempt — 2026-11-15 (superseded by captain confirmation)

The release/cleanup handoff, proposed README and cleanup script supplied in Downloads were read before changes. The actual branch is still `codex/yesif-v2-5-1-human-qa`; HEAD and the rollback reference both remain `51ff6b4fa48512ddebe57730579bfecd2abfd653`. No staged changes were present. All existing V2.5.1 source modifications were preserved.

The production preview at `http://localhost:5181/yesif/` responded with HTTP 200. A separate Firefox process opened that build, and the actual UI successfully advanced from the example landing page to the two verified alternatives. Before the next action, that process exited with code 0 and its accessibility service disappeared. The cause of the window closing is not established.

A fallback test tab was opened in the existing Firefox without closing or replacing existing tabs. Keyboard control failed because the desktop input backend could not run `ydotool`. Accessibility inspection in that browser reached its 500-node limit before the relevant page controls, so the requested semantic action could not be resolved. These attempts did **not** reach a native print preview and are not print verification.

Required captain evidence: open a saved Decision Brief from this local V2.5.1 build, choose Print, and capture every preview page on standard portrait paper, including the page-count/settings area and the end of the manual proposal and Limits section. For the fictional example, the path is Explore an example → choose a trade-off → edit/save the proposal → My decisions → Unlock free demo (no payment) → Decision Brief → Print. Verify that only the Brief is printed, with no missing text, blank/duplicate pages or avoidable awkward section breaks. A PDF saved from that same preview can additionally support checking complete text.

The previous 153/153 result remains historical evidence for the unchanged runtime source. A fresh final command chain is still due **after** closing print QA, as required by the handoff. No release commit, push, merge, tag, cleanup script execution, remote branch deletion, README replacement or public pitch upload has been performed during this blocked attempt. Repository cleanup and the final jury handoff remain dependent on the verified release.

## Fresh release gate after captain confirmation

2026-11-15: the required commands ran sequentially on the unchanged final runtime source: `npm ci` (109 packages, 6s), `npm run typecheck`, `npm test` (**153/153**, 18 files, 57.71s), `npm run build` (995ms), and `git diff --check` all passed. No assertions or timeouts were changed. Final diff inspection found only the intended V2.5.1 corrections and QA evidence. Remote main was freshly fetched and still matched the baseline, permitting a normal fast-forward. Publication/CI evidence will be recorded after the actual deployment.
