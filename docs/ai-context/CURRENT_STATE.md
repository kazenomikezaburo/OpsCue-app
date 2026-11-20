# OpsCue — Current State

> Snapshot: 2026-11-20 JST (GitHub read-only inspection). This is an index, not a substitute for canonical specifications. **Do not interpret this snapshot as a fresh execution approval.**

## Repository / verified baseline

- Repository: `kazenomikezaburo/OpsCue-app`
- Observed latest `main` commit before this documentation branch: [`8f85f9ab8bf2a6ef2f0c01c3f635aec4a224e38b`](https://github.com/kazenomikezaburo/OpsCue-app/commit/8f85f9ab8bf2a6ef2f0c01c3f635aec4a224e38b), merge of PR #25.
- Documentation bootstrap branch base: `8f85f9ab8bf2a6ef2f0c01c3f635aec4a224e38b`. Refresh this field only after independently reading GitHub.
- Trust labels: **VERIFIED_GITHUB** = inspected repository/API; **REPORTED** = cited PR/test report but not independently rerun; **UNVERIFIED** = not established; **BLOCKED** = prerequisite/approval missing.
- Source date matters. Merges and tests below are historical snapshots, not current production-readiness claims.

## Integration history (VERIFIED_GITHUB: PR metadata / commits)

| PR | Status at snapshot | Scope | Source |
| --- | --- | --- | --- |
| #18 | merged | Worker single-application unknown/idempotency handling | https://github.com/kazenomikezaburo/OpsCue-app/pull/18 |
| #19 | merged | Project recruitment UI + synthetic Demo; browser validation was reported | https://github.com/kazenomikezaburo/OpsCue-app/pull/19 |
| #20 | merged (as referenced by FE-2 handoff; PR state not independently checked in this bootstrap) | Backend project recruitment reader contract | `docs/phase-4-fe-2-backend-adapter-handoff.md` |
| #21 | merged | Backend DTO adapter + mock contract tests; no live route wiring | https://github.com/kazenomikezaburo/OpsCue-app/pull/21 |
| #23 | merged (verified through merge commit) | Phase 4 Task A date filter/availableShiftCount changes; DB migration execution not established | https://github.com/kazenomikezaburo/OpsCue-app/commit/326f0abbfc910d3d6242f649c2bc031d218a021d |
| #24 | merged | Task B B-01–B-15 frontend memory-only mock contract | https://github.com/kazenomikezaburo/OpsCue-app/pull/24 |
| #25 | merged | Task B dedicated 215-case offline CI job | https://github.com/kazenomikezaburo/OpsCue-app/pull/25 |

## Verification boundaries

- PR #24 reports 215/215 PASS offline, with fail/cancelled/skipped/todo all zero (**REPORTED**, not rerun by this bootstrap).
- PR #25 states prior 173-case safety suite remains intact and dedicated 215-case suite is added (**REPORTED**). The `offline-safety-tests.yml` file on main was inspected (**VERIFIED_GITHUB**).
- A PR-triggered `Offline safety tests` workflow run associated with PR #25 head commit `9214116c9b8cde5eb198dc2da88b044fe2200c35` returned conclusion `success` (run ID `44586522137`, **VERIFIED_GITHUB**). Individual job logs/counts were **not** independently inspected; do not claim direct CI count verification from this result alone.
- Real browser/device, DB, Auth, RLS, LINE, AWS, migration apply, deploy, and production behavior were **not verified in this bootstrap**.
- `docs/ai-context/` did not exist at the initial main snapshot; this PR introduces it.

## Persistent blockers / caveats

- Task B formal RPC/wire, including error/authorization/unavailable/replayed semantics: **BLOCKED** pending authoritative contract.
- U-2 receipt retention/anonymization/deletion/replay period: **BLOCKED**.
- Real DB atomicity, concurrency and duplicate prevention: **BLOCKED**.
- Persistent recovery across reload/navigation/devices and manual conflict resolution UX: **BLOCKED**.
- `applicationAvailability` and `hasActiveApplication` live contract: **BLOCKED**; do not infer eligibility from other fields.
- Migration application and real environment approval: **UNVERIFIED / separate approval required**.

## Source index

- `docs/phase-4-task-b-frontend-mock-contract-handoff.md`
- `docs/phase-4-fe-2-backend-adapter-handoff.md`
- `docs/phase-4-fe-project-ui-handoff.md`
- `docs/migration-manifest.md`
- Relevant PRs #18, #19, #21, #23, #24, #25; consult primary code and approved contract documents before implementation.

## Next steps (proposal, not approval)

1. Review and merge this **documentation-only** bootstrap PR after explicit PM decision.
2. Validate full job-level CI results and reconcile any discrepancy with reports.
3. Recover unavailable PM decisions/primary contract attachments from exported chat as supplemental evidence; never manufacture authorization.
4. Maintain `TASKS.md` at task close and refresh this snapshot by checking main SHA.

**Safe restart:** Read `RULES.md`, `WORKFLOW.md`, `TASKS.md`, then live GitHub state. If a cited source is missing, mark **BLOCKED/UNVERIFIED** and continue only within safe read-only boundaries.
