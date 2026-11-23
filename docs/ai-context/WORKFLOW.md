# OpsCue — Work / Codex / ChatGPT Project Workflow

> Goal: A failed, archived or overlong chat must not block continuation. GitHub is the durable development record. The Project is a working interface, not a replacement for version control.

## Roles

- **GitHub:** canonical code, approved specs, indexed state/decisions/tasks, PR descriptions, CI evidence. Never put secrets or personal data into context files.
- **ChatGPT Project:** planning, PM decision support, task-level chats and review; project instructions reference these docs. Past chats are supplemental.
- **Work:** source discovery, cross-file / PR checks, browser-based or GitHub-supported operations within explicit authority; report verified facts separately from model reports.
- **Codex:** scoped implementation and offline verification on exact branch/worktree. No implicit PM authorization.

Check current product availability/settings manually. Project/Work availability and memory behavior may change; these docs do not assert any account-specific entitlement.

## Start of every task (copy/paste)

```text
OpsCue task start.
Repo: kazenomikezaburo/OpsCue-app
Task / goal:
Mode: READ_ONLY | DESIGN | IMPLEMENT | REVIEW
Read docs/ai-context/{CURRENT_STATE,RULES,DECISIONS,TASKS,WORKFLOW}.md
and the cited approved primary specifications.
Verify current main SHA, PR state and CI from GitHub; compare against snapshot.
Compare the live open PR list with TASKS.md. Report missing or stale entries and unresolved decisions.
Declare base SHA, target branch/worktree, owner, authorized files/actions,
prohibited actions, provider endpoints, environment, budget/run cap,
tests, acceptance, stop/recovery and evidence destination.
Separate VERIFIED_GITHUB / REPORTED / INFERRED / UNVERIFIED / BLOCKED.
Missing source or approval => BLOCKED for that operation.
Do not change Git, DB, PR or providers in read-only mode.
```

## Implementation gates

1. Investigate and state assumptions + BLOCKED items before implementation.
2. Capture precise human approval for scoped effects; do not reuse past approvals.
3. Work on an isolated branch/worktree from recorded base SHA. Keep unrelated work untouched.
4. Run only approved offline checks and record actual exit codes/counts, scopes and output artifacts.
5. Open Draft PR if authorized; no auto-merge. For CI, inspect the actual run and jobs—not only a report or green aggregate.
6. Return the handoff report. Update CURRENT_STATE/TASKS or append a proven decision to DECISIONS only when this task explicitly authorizes writes to those files. Coordinate authorized updates to avoid parallel-write conflicts.
7. Only then call the task 'handoff ready'. Production-ready is a separate gate.

READ_ONLY and REVIEW without explicit write authorization finish with the report alone. Record discrepancies and proposed corrections there. No GitHub or ledger update is required.

## End-of-task report (copy/paste)

```md
# OpsCue Task Handoff
- Task / date (JST) / owner:
- Verdict: GO | FIX_REQUIRED | BLOCKED
- Repo / base SHA / branch / HEAD SHA / PR URL:
- Authorized scope / changed files / preserved boundaries:
- Tests: commands, environment, PASS/FAIL/SKIP/CANCELLED/TODO counts:
- CI: workflow, run URL/ID, job-level status, independently verified or reported:
- Operations NOT performed (DB/Auth/LINE/AWS/migrations/deploy/etc.):
- Evidence links / detailed report path:
- Residual BLOCKED and required PM decisions:
- Proposed next task / prerequisites / **new approval needed**:
- CURRENT_STATE / TASKS / DECISIONS update links, N/A（読み取り専用） for read-only work, or reason updates are outside scope:
```

## Chat recovery drill

Create a **new** task chat without past transcript. Provide only repo name and instruction to load these five docs, then verify latest main and relevant PRs. Pass iff it (1) reports real main SHA, (2) distinguishes integrated vs mocked vs live, (3) reports BLOCKED and authority limitations, (4) proposes next scoped steps, and (5) performs no mutations. If it fails, repair GitHub docs before relying on the workflow.

## Fallback

If a shared ChatGPT link returns empty/zero bytes, do not treat it as proof that the original chat is gone. Continue from repository sources; optionally parse a user-supplied conversation data export for missing historical approval evidence. Never upgrade an unavailable chat excerpt into current approval.
