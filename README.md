# Sentinel

A clickable concept demo of a tool that helps consulting teams keep due-diligence projects on scope, on time and on budget. It walks through one project from the first client call, through scoping and pricing, to week-by-week delivery tracking.

## Context

I built this while testing a hypothesis during a venture-validation project. The question was whether AI could help reduce project overruns in consulting and private-equity work, using commercial due diligence (CDD) as the test case. It is a working prototype I used in customer conversations to test the idea. It is not a finished product or a live business.

All the AI steps are simulated. The demo runs on one sample project with hardcoded outputs, so people could react to the workflow before any AI or back end was built.

**What's interesting about it:**

- **The whole project in one flow.** A seven-step scoping wizard (transcript → scope questions → work map → plan → team and pricing → summary → engagement letter) connects to a delivery view (live scope, progress, milestones, risks, team status).
- **Risk flags that feed into the contract.** Risks drawn from a client's past projects (such as late data-room access or mid-project scope additions) turn into suggested engagement-letter clauses.
- **Dependency-aware planning.** Deliverables link to the inputs they depend on (surveys, expert calls, data room), so a slipped input shows which milestones it puts at risk.
- **Alerts in the team's chat tool.** A mocked Microsoft Teams view shows how warnings would reach the team where they already work.

## How it's built

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, shadcn/ui (Radix primitives), Recharts, lucide icons
- **State:** A React Context shares scope, workstreams and risks across steps, and a step can only be opened once the steps before it are done
- **Data:** Sample data in `src/data`. `data/synthetic_engagements/` holds 27 made-up past-project notes, meant as a mock "client history" for the risk-flag idea. The app doesn't read them yet
- **Tooling:** First version built with Lovable, then developed further locally. Deployed on Vercel

```bash
npm install && npm run dev
```
