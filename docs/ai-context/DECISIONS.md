# OpsCue — Decision Log

> Append-only decision register. **DO NOT manufacture historical PM approvals.** This bootstrap records only the proposed operational process; existing design decisions must be recovered from authoritative sources before entry.

## Entry format

```md
### DEC-YYYYMMDD-NNN — short title
- Status: PROPOSED | APPROVED | SUPERSEDED | REJECTED | BLOCKED
- Decided at (JST):
- Decider / approver:
- Scope: repo, base SHA, branch, files, environment, actions, expiry
- Context / alternatives:
- Decision and reasons:
- Evidence: primary contract / GitHub PR / PM record URL
- Supersedes / superseded by:
- Verification: VERIFIED_GITHUB | REPORTED | UNVERIFIED
```

### DEC-20261120-001 — Chat-independent development handoff process
- Status: **PROPOSED** (pending review/PM acceptance in documentation PR).
- Proposed at (JST): 2026-11-20.
- Proposer: OpsCue frontend documentation bootstrap assistant; **PM approval not asserted**.
- Scope: `docs/ai-context/` five Markdown files and future task handoff workflow only. Not an implementation, provider, deployment or merge approval.
- Context: Large branched chat became unreliable; shared-link extraction did not yield usable full conversation. GitHub remains accessible and has merged PR/task records.
- Proposed decision: Use GitHub as canonical development record, ChatGPT Project for planning/context, Work for investigation/orchestration, Codex for implementation; one task per conversation; record per-task evidence, remaining blockers and exact SHA in GitHub.
- Reasons: Reproducible restarts; distinguish observed facts from reported tests and provisional PM decisions; avoid reliance on full chat retention.
- Evidence: PRs #24/#25; `docs/phase-4-task-b-frontend-mock-contract-handoff.md`; this documentation PR.
- Supersedes: none.
- Verification: **REPORTED** process proposal; GitHub PR/commit facts separately verifiable.

## Historical decision recovery queue

- The [Master Specification v1.3](https://github.com/kazenomikezaburo/OpsCue-app/blob/8f85f9ab8bf2a6ef2f0c01c3f635aec4a224e38b/docs/ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md) text is available at the bootstrap base and preserves v1.2 with later amendments. For historical v1.1 and subsequent approval claims, recover the original PM record with approver, date, version and scope before registering an approved decision. Availability of the specification grants no new execution authority.
- Phase 4 Task B receipt-first and B-01–B-15 PM supplemental ruling: locate original text and verify scope before marking APPROVED.
- Any historical provider/DB/migration execution approvals: do not infer from previous test runs or a summary. Record only after primary evidence is recovered.

Missing primary evidence => **UNVERIFIED**, not an invented decision.
