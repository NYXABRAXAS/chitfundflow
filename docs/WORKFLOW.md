# MCF LOS — Workflow & Architecture Reference

This document explains how the static simulation is wired together: the data layer, the
workflow state machine, the CAM module, and where each of the 20 required scenarios lives
in the state graph. It is the "how it works" companion to the running app — read this
before extending the workflow engine or seed data.

## 1. No backend, by design

Everything lives in the browser. `localStorage` holds the case pool, customer pool, audit
log and notifications; `sessionStorage` holds who's currently "logged in" and as which
role. There is no build step — every page is plain HTML with `<script src="assets/js/...">`
tags, deployable to Render (or any static host) as-is. See `render.yaml`.

## 2. Load order (every retrofitted page)

```html
<link rel="stylesheet" href="assets/css/common.css">
...
<script src="assets/js/config-data.js"></script>   <!-- LOS_CONFIG: branches, security types, deviation/approval matrices, workflow graph, permissions -->
<script src="assets/js/seed-data.js"></script>      <!-- LOS_SEED.generate(): 220 customers, 105 cases -->
<script src="assets/js/data-store.js"></script>     <!-- LOS_DB: localStorage CRUD + schema versioning -->
<script src="assets/js/session.js"></script>        <!-- Session: sessionStorage login/logout -->
<script src="assets/js/permissions.js"></script>    <!-- Permissions: role x feature, role x status gates -->
<script src="assets/js/audit-notify.js"></script>   <!-- AuditNotify: audit log + notifications -->
<script src="assets/js/workflow-engine.js"></script><!-- WorkflowEngine: the state machine -->
<script src="assets/js/cam-engine.js"></script>     <!-- CamEngine: builds the 10-section CAM -->
<script src="assets/js/nav-config.js"></script>     <!-- NavConfig: per-role sidebar -->
<script src="assets/js/ui-common.js"></script>      <!-- LOSApp.boot(): wires sidebar/notif/profile/modals/tabs -->
<script>
  var session = LOSApp.boot('BI'); // fallback role if nobody's logged in yet
  // ...page-specific rendering, using LOS_DB / WorkflowEngine ...
</script>
```

`LOSApp.boot(fallbackRole)` is the one call every page needs before anything else: it seeds
the database on first run, resolves or creates a session, and renders the sidebar,
notification bell and profile block for whoever is logged in.

## 3. Case schema

One record per case (`assets/json/*.json` + `config-data.js` define the reference config;
seeded case shape is documented in `assets/js/seed-data.js`). Key fields:

- Identity: `id` (`MCF-2024-XXXXXX`), `applicant`, `mobile`, `pan`, `aadhaar`, `branch`, `hub`
- Commercial: `amount`/`prize`, `tenure`, `fl` (future liability), `security`, `securities[]`
- Workflow: `status` (one of the canonical codes below), `stage`, `statusHistory[]`
- Risk inputs: `cibil`, `subscriber{}`, `guarantors[]` (each scored by `CamEngine`)
- CAM: `cam{}` — populated once `generateCAM` runs (sections A–J, see below)
- Ops: `deviations[]`, `approvals[]`, `disbursement{}`, `fiReport{}`, `courierTracking{}`

## 4. The status graph

Canonical states, owner role, and screen are defined in `LOS_CONFIG.workflowStates` (mirrors
`assets/json/workflow-states.json`, itself scraped from `admin-workflow-config.html`'s
15-row table plus 3 side-branch statuses):

```
NEW -> ASSIGNED -> BRANCH_WIP -> SCRUTINY_PENDING -> DISPATCHED -> HUB_INWARD
    -> [FI_INITIATED -> FI_COMPLETED | skip] -> FINAL_CHECK
    -> [DEVIATION_PENDING ->] CREDIT_REVIEW -> IN_PRINCIPAL_APPROVED
    -> [FINAL_APPROVAL ->] BUSINESS_APPROVED -> READY_DISBURSEMENT -> CLOSED
```

Side states: `REVERTED` (returned to BI), `ADDITIONAL_SECURITY_REQUIRED`, `ON_HOLD`,
`DECLINED`/`CANCELLED`/`EXPIRED` (terminal).

**Nothing sets `case.status` directly.** Every transition goes through:

```js
WorkflowEngine.transition(caseId, action, {actorRole, payload})
// -> {success: true, case} | {success: false, error}
```

which validates the actor's role against the status's owner, checks any guard (documents
complete? FI required? deviation triggered? final-approval needed?), mutates the case,
appends to `statusHistory`, writes an audit entry, and notifies the next owner role. The
full transition table (action name, target status, role, guard) lives in
`LOS_CONFIG.workflowStates.transitions`.

## 5. CAM module

`cam/cam.html?caseId=<id>` renders the Credit Appraisal Memo, built by
`CamEngine.buildCAM(case)` from the real Excel template
(`Copy of CAM Format_PrizeMoneyApp2.0.xlsx`): sections A (Current Proposal) through J
(Approvals). Section F/G implement the actual scoring formula — Positive score (KYC tier ×
security coverage / FOIR) minus Negative score (suit filed / PRL / CC3 / cheque bounces),
weighted `SB × 60% + avg(Guarantors) × 40%`, mapped to a risk band (A–D) via
`LOS_CONFIG.productConfig.camScoreBands`.

CAM generation is itself a workflow transition (`generateCAM`, `FI_COMPLETED -> FINAL_CHECK`)
— it is not a side effect, so it shows up correctly in the case's audit trail and timeline.

## 6. Scenario library

`LOS_CONFIG.workflowStates.scenarioIndex` maps each of the 20 required scenarios to its
transition path in the graph above (e.g. scenario 2, "rejected by scrutinizer → returned to
BI → edits → resubmits", is `SCRUTINY_PENDING > REVERTED > BRANCH_WIP > SCRUTINY_PENDING`).
`seed-data.js` places at least one seeded case at the entry status of every scenario so it
can be walked live via real clicks from a fresh login, in addition to the ~85 randomly
distributed cases used for volume/reporting.

## 7. Editable reference data

Static config (branches, security types, deviation matrix, approval matrix, role
permissions) ships as read-only defaults in `LOS_CONFIG` (`config-data.js`) but becomes
independently editable per-browser via `LOS_DB.getConfigCollection(name)` /
`saveConfigCollection(name, list)` — used by the admin master-data pages. `resetDemoData()`
(wired to a button in `admin-settings.html`) is the only way the seed ever regenerates
after first load; the schema-version check in `data-store.js` guarantees normal navigation
never silently wipes progress.
