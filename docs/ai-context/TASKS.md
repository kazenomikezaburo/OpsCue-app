# OpsCue — Task Register

> Snapshot 2026-11-20 JST. Statuses describe observed repository activity and reported work, **not** permission for new execution. Update only with owner, evidence and exact SHA.

| ID | Task | Status | Evidence / next gate |
| --- | --- | --- | --- |
| DOC-001 | Establish five AI context documents | IN_PROGRESS (this Draft PR) | Review doc correctness; PM merge decision required |
| FE-UI | Phase 4 project recruitment UI / synthetic Demo | MERGED, live wiring NOT verified | PR #19; `docs/phase-4-fe-project-ui-handoff.md` |
| FE-2 | Backend project recruitment DTO adapter / offline mock | MERGED, live wiring BLOCKED | PR #21; `docs/phase-4-fe-2-backend-adapter-handoff.md` |
| BE-A | Phase 4 Task A date filter / availableShiftCount | MERGED CODE; DB apply UNVERIFIED | PR #23; approved isolated DB/RLS proof required |
| FE-B | Phase 4 Task B B-01–B-15 memory-only mock | MERGED; official wire BLOCKED | PR #24; `docs/phase-4-task-b-frontend-mock-contract-handoff.md` |
| CI-B | Add dedicated Task B 215-case offline CI | MERGED; workflow success observed, job-level counts UNVERIFIED | PR #25; workflow run 44586522137 |
| BE-B-WIRE | Confirm batch apply / receipt wire, replayed, unavailable, auth/exception cases | BLOCKED | Authoritative final Backend contract and explicit PM review |
| BE-U2 | Receipt retention/anonymization/deletion/replay window | BLOCKED | Primary U-2 decision and testable contract |
| BE-DB | Batch atomicity/concurrency/duplicate-prevention validation | BLOCKED | Explicitly approved isolated environment and controls |
| FE-RECOVERY | Durable batch recovery across reload/navigation/devices | BLOCKED | Agreed persistence, security, TTL and reconciliation UX |
| HISTORY | Recover legacy PM decisions from original conversation export | UNVERIFIED / OPEN | Audit primary record, cite exact date and scope; no assumptions |

## Task entry format

```md
### TASK-ID — title
- Owner / approver:
- Status: TODO | IN_PROGRESS | REVIEW | MERGED | BLOCKED
- Scope / base SHA / branch / worktree:
- Approved changes and prohibited operations:
- Commands / environment / network endpoints / cost / maximum attempts:
- Acceptance criteria:
- Evidence: test output, PR, CI, code path, report
- Outstanding blockers and decisions:
- Next executable step (and its separate approval):
- Last checked at (JST):
```

No task should be marked complete solely because a chat says it was completed. Confirm actual GitHub state, then cite its source.
