# YESIF V2 experience decisions

## Information architecture

V1: landing → unexplained result → large manual simulator → suggested alternatives → long proposal.

V2: landing → compact request context and reality check → up to three verified alternatives → optional simulator → short proposal with inspectable allocation and optional detailed explanation. Impossible scenarios end with a usable renegotiation request, visibly distinct from a feasible proposal.

Custom entry remains one simple page to avoid wizard navigation overhead. Its reading and keyboard order is request → available weekdays → optional reserve → commitments → Find my options. Flexibility and priority are disclosed per task. There are no inferred calendar dates or hidden capacity defaults; a blank workload begins at zero availability.

Suggested options show what changes, what remains and what needs agreement. A day-by-day disclosure assigns named hours to tasks. The simulator additionally keeps three explicit categories: work planned this week, proposed renegotiation, and work needing future scheduling or approval. Changes never silently imply manager consent.

The progress indicator now uses real navigation buttons, with disabled-stage explanations. Headings receive focus on page changes; the validation summary receives focus on errors. Changes invalidate old proposals. Editing a manually changed proposal through a destructive transition requires Save draft / Discard / Cancel. Modal dialogs use the browser's native top layer; Cancel initially receives focus and Escape cancels. A saved local draft is separate from saved decisions and can be resumed after reload.

## Visual system

Retained warm ivory `#f8f7f2`, paper `#fffefa`, forest `#244c3c`, ink `#243c33`, restrained lime and amber conflict surfaces. Body and controls use 16px; secondary labels/help use a shared 14px token. Georgia editorial headings retain the product's character. Meaningful 7–12px labels were removed. Responsive forms are a single column up to 780px; result cards compare on desktop and stack on mobile. The working screens have clearer primary actions, fewer uppercase micro-labels, readable forms and optional detail instead of always-visible tables.

Motion is CSS-only: 180ms screen entrance and state/background/border feedback. No animation dependency, blocking delay, confetti or large-form height animation. `prefers-reduced-motion: reduce` disables animation, transition and smooth scrolling on elements and pseudo-elements. Browser preference emulation availability is documented in QA; source compliance is not a certification.

## Accessibility

Native inputs/selects/range/details/dialog; explicit labels; visible outline; skip link; heading/error focus; polite live calculation summary; only short status text is live (large tables and controls are outside it). Buttons and summaries target at least 44px; fixed checkboxes have visible reasons and the associated row label is the touch target. The simulator range has precise ±15-minute alternatives and visible bounds. Disabled copy/save explain empty message requirements.

Checked at 375, 390, 768, 1280 and 1440px where recorded. DOM layout checks do not substitute for actual screenshot review, keyboard traversal or screen-reader testing. No full accessibility certification.

## Skills and repeat use

Practice uses the selected workload and deadline. The grounded reply proposes the actual change, contrasting with an unchecked promise and a constraint without an actionable ask. Answer position is deterministic but varies. Feedback explains four explicit criteria and makes no skill-measurement claim.

Free calculations, alternatives, allocation, proposal, practice, one notebook entry, and a separate recovery draft. Kit demo adds multiple saved decisions, export and an outcome-aware follow-up built from the saved conditions and self-reported notes. Saved conditions can be compared by inspecting notebook cards; there is no separate quantitative comparison product. Proposed $4.99 one-time price remains a hypothesis. No checkout, subscription, payment or secure entitlement claim.

Deferred: release dates/dependencies, within-week deadline renegotiation, multi-week scheduling, automatic drafts, cloud sync, AI coaching and payment processing. Correctness and a readable complete flow take precedence.
