# YESIF

**Every yes needs an if.** A private, interactive commitment trade-off simulator for workload conversations.

Compare named deferrals and smaller deliverables, see every weekday deadline recalculate, choose a feasible plan, and edit/copy a proposal. No account, backend, external AI, analytics or payment collection.

- Production: https://pandaman-8.github.io/yesif/
- Public source: https://github.com/Pandaman-8/yesif
- Primary track: Skills. Initial audience: US marketing/project coordinators aged 25–45.
- Demand, pricing, and differentiation are hypotheses; this is a working product experiment, not a validated business.

## Run locally

Node 22.22+ and npm 10+:

```sh
npm ci
npm run dev
```

Open the `/yesif/` URL printed by Vite. If the port is busy, Vite prints the next available port.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

## Deployment

GitHub Actions runs clean install, typecheck, tests, build and whitespace check on pushes to `main`, then deploys `dist` to GitHub Pages. Configure Pages source as GitHub Actions. Vite's base is `/yesif/`. For a different path, update `vite.config.ts` and the favicon path in `index.html`.

## Scope and privacy

One person, five weekdays, eight existing commitments, quarter-hour estimates. Work must be available at the start and divisible, with no dependencies. Users enter remaining focused capacity themselves. Deferring work never proves future capacity. Reduced effort means a reduced deliverable requiring agreement.

Only explicit saves write to localStorage. The free workflow is unlimited, with one saved-decision slot. The proposed $4.99 one-time kit has a clearly labeled free demo unlocking multiple saved decisions and local export; no payments occur. Existing saved entries remain readable after the demo session ends.

See [product decision](docs/PRODUCT_DECISION.md), [engine specification](docs/ENGINE_SPEC.md), [QA report](docs/QA_REPORT.md), and [pitch handoff](docs/PITCH_HANDOFF.md).

ShiftMargin is a separate fallback and is not modified by this project. No pitch deck is included.
