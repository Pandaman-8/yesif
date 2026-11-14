# YESIF QA report

Verified November 14, 2026. **Working public release; visual sign-off remains incomplete.** No user research or commercial validation is implied.

## Release identity

- Production: https://pandaman-8.github.io/yesif/
- Public source: https://github.com/Pandaman-8/yesif
- Final application-code commit: `02de341734e732bf790c13ed81142982a198b661`.
- Subsequent documentation-only commits do not change the app. The final repository HEAD is reported in the captain's handoff; a file cannot contain its own commit hash.
- Full production browser flow was exercised on `738030418b8968436000bf0dc6bfb3e42d9e198f`; the subsequent code commit only changes export notification wording to avoid claiming download completion.
- Verified successful workflow for the exercised code: https://github.com/Pandaman-8/yesif/actions/runs/43613649966
- GitHub Pages uses Actions and HTTPS. Production returned HTTP 200, served the app assets, and worked without sign-in.

## Automated checks actually run

Node 22.22.2 / npm 10.9.7 locally; Node 22 in CI.

| Check                        | Observed result                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                     | PASS, clean lockfile install; also passed in deployed CI                                                                                                     |
| `npm run typecheck`          | PASS, strict TypeScript                                                                                                                                      |
| `npm test`                   | PASS, **35 tests** across 3 files                                                                                                                            |
| `npm run build`              | PASS, static Vite bundle                                                                                                                                     |
| `git diff --check`           | PASS                                                                                                                                                         |
| Independent generated oracle | 500 seeded workload cases matched a discrete quarter-slot earliest-deadline execution model; generated options were feasible and moved only negotiable tasks |

Coverage includes reference arithmetic; weekly-fit/early-deadline failure; zero capacity; exact fits; fixed commitments; preexisting conflicts; later deadlines limiting new scope; multi-task deferrals; priority ranking; combined deferral/scope; invalid and stale plans; proposal facts; invalid numbers/IDs; corrupted/blocked storage; copying and clipboard rejection; save/reopen; real custom inputs; stale-result clearing; demo unlock and returning to the active proposal; quarter-hour scope controls.

The 500 generated cases are automated domain checks, not 500 customer or browser tests. Browser automation is recorded below, separately from jsdom integration tests.

## Browser checks actually completed

Used the Codex in-app browser. Some Playwright/CDP operations stalled; documented DOM controls and read-only DOM inspection in the same browser were used for remaining interactions. No alternate browser or security-policy bypass was used.

### Desktop — 1280 × 900

- Landing rendered and one-click demo opened the simulator.
- Baseline: 18h / 15h, 3h short by Friday.
- Launch QA and Customer updates were disabled as fixed commitments.
- Selecting Weekly report changed the result to 13h / 15h; all five deadline checkpoints fit; the proposal action became enabled.
- Generated proposal named the report, its original Friday deadline, 13 existing hours, 15 available hours, and unchecked future capacity.
- Save showed success; practice response C displayed the explicit four-part rubric.
- Exact desktop viewport confirmed as 1280px; document client/scroll widths both 1265px (15px scrollbar), no horizontal overflow on the inspected proposal.
- Browser error-log inspection returned an empty error list for the tested production tab.

### Mobile — 375 × 812

- Responsive navigation and landing were accessible.
- Entered an independent scenario: Monday 2h, other days 0h, no existing commitments, a 1h request named “Mobile client brief”, due Friday. Result: 1h / 2h, each deadline fits; correct proposal generated.
- Submitted a blank request name: a readable error appeared and the alert received focus. Page headings received focus after navigation.
- Reload retained the explicitly saved example. Reopened its proposal; selected an outcome and entered a QA-only note; both appeared in the notebook.
- No-payment kit unlock showed the correct notice and enabled its controls. It reset after reload as documented.
- On the reference scenario, twelve “Reduce scope by 15 minutes” clicks changed 5h to 2h, producing 15h / 15h with every deadline fitting and a proposal explicitly asking for a smaller deliverable.
- Measured landing, results, proposal and notebook: viewport 375px; clientWidth = scrollWidth = 360px (15px scrollbar). No horizontal overflow on those screens.
- Removed only the QA-created saved decision; verified empty notebook. Temporary viewport override reset.

## Limits and incomplete checks — do not claim these passed

- **Screenshots / visual QA:** local screenshot capture first timed out, then was blocked by the browser URL/security policy. A separate production screenshot attempt timed out. No screenshot was obtained, and no pixel-level visual sign-off is claimed. Pitch screenshots still need to be captured from the public app in an ordinary supported browser. DOM and overflow checks do not replace visual inspection.
- **Live clipboard:** browser clipboard access was denied; the app showed its manual-copy fallback. The success branch was verified in integration tests, not in the live browser. The fallback now also selects the proposal text. Normal-browser clipboard success remains unconfirmed.
- **Export:** clicking Export invoked the handler, but a browser download event was not observed before timeout. Download receipt/content has not been independently verified. The app now says “Export prepared” and asks the user to check downloads, rather than asserting successful delivery.
- **Keyboard/accessibility:** heading/error focus and labeled native controls checked. Full Tab traversal, screen-reader behavior, visual focus contrast, and native slider key dispatch were not fully verified; the automation did not reliably dispatch range arrow keys. Explicit ±15-minute buttons were added and successfully exercised. No WCAG certification claimed.
- No real customer usability session, paid conversion, retention measurement, or observed negotiation outcome.

## Product limitations

One worker, one user-chosen Monday–Friday week, eight existing tasks, quarter-hour estimates. All work must be available at the start and divisible; no dependencies, release dates, fixed appointments, overtime/weekend inference, next-week capacity, or automatic uncertainty adjustment. Existing-task scope changes and within-week deadline rescheduling are outside the simulator. User-edited proposals are not revalidated. Local storage is device-specific and can be cleared; no sync or encryption guarantee. Kit is a pricing demonstration without billing or secure entitlement enforcement.

## Release decision

GO for public demonstration of the core engine and workflow. **Conditional competition readiness:** capture/review screenshots and confirm clipboard/download behavior in a normal browser before claiming all QA gates passed. Do not automatically replace ShiftMargin or treat a working build as validated demand.
