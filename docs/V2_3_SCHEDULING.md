# Visual scheduling contract

`AllocationView` calls the unchanged `allocate(scenario, plan)` on every render. A false verdict displays no completed schedule. It does not trust cached `plan.result` for totals.

The five rows share an hours scale: each row's width is entered daily capacity / maximum entered daily capacity. Within that row, each segment is allocator units / entered daily capacity. Thus a zero-capacity day has no filled bar. No minimum pixel width inflates quarter-hour tasks.

For each day: assigned integer quarters + unassigned usable quarters + reserved quarters = entered quarters. Usable = entered − explicit reserve. Solid labelled blocks are assigned tasks; open segments are unassigned; hatched segments are reserve. Existing tasks retain input-order letter codes and muted tones across alternatives; N identifies the new request. Legend buttons highlight the same ID across days. Tiny segments remain inspectable using 44px legend buttons and exact text, without hover.

Deferred tasks are absent from current-week assignments but listed as still owed, pending agreement and future scheduling. Reduced scope is labelled with both selected and original hours. A single reusable component serves Results, alternatives, simulator, Proposal and existing saved-plan views. Main actions remain before the schedule disclosure.

Automated cases cover the exact 10/15 Friday EDF allocation; 13/15 deferral; 15/15 reduced request; 13/14 with 1h reserve; impossible Tuesday; updates to names/hours/deadlines/reserve/deferrals; zero-capacity and quarter-hour tasks; keyboard highlighting; and 60 generated rendered witnesses. Existing 1,000 independent allocator witnesses remain unchanged.

Initial browser review: both reference alternatives expanded at 375, 390, 768, 900, 1280, 1440px, actual PNGs inspected, no horizontal overflow. The five-day shape is compact; legend/obligation detail can still add height for many or long task names. Screenshots are bounded clips, not full-page captures. Final integration evidence is in V2_3_QA.md.
