# OpsCue — Rules / Safety Boundary

> Operational process proposal for review; not a new blanket PM authorization. Existing approved Master Specification, Backend contracts, and `docs/migration-manifest.md` take precedence over this index.

## Authority and evidence

1. Current GitHub main, exact commit/PR diffs, and approved source contracts determine implemented behavior. Historical chats, Work outputs and these context files are evidence with dates, not current truth by themselves.
2. Label every material claim **VERIFIED_GITHUB**, **REPORTED**, **INFERRED**, **UNVERIFIED**, or **BLOCKED**. Do not turn report-only test results into independently executed results.
3. Record PM approvals with approver, precise subject/scope, timestamp, and evidence link. If any are missing, approval for new operations is **BLOCKED**.
4. An approval is scoped to the stated branch/SHA, files, commands, providers, environment, budget and run limit where applicable; it must never be re-used for a new task without confirmation.
5. A conflicting contract or unknown backend wire shape is **BLOCKED**. Never guess, implicitly widen scope or relax a safety gate.
6. Application/notification/authorization and other canonical domain facts belong to their respective authoritative Backend domain; AI-generated suggestions are never canonical operational truth.

## Protected operations — require separate explicit authorization

- Merge to `main`, direct commit to `main`, destructive Git operations, release/deployment.
- Real database/Auth/Supabase/LINE/AWS/provider access, migrations, RLS modification, secrets handling or production actions.
- Live Worker batch apply, real receipt replay/wire integration, any operation that can mutate operational records.
- Changing security gates/CI baselines or expanding approved files/branch boundaries.

## Default execution

- Read-only exploration and proposal drafting are safe when explicitly requested.
- For implementation: inspect live main and dependencies, name exact base SHA, create isolated branch/worktree, modify only approved files, use safe offline tests, preserve existing state and report unexpected changes.
- Do not alter unrelated UI, Backend, CI, deployment, configuration, integration targets or local environments.
- For PRs: **Draft** by default; human PM decides readiness and merge separately.
- Fail closed: insufficient approval or uncertain environment/target/contract => **BLOCKED** and stop the affected operation; never infer safety from a name/port alone.
- Preserve existing idempotency keys after unknown results; do not automatically retry and do not simulate batch by looping single-item commands.

## Change control / traceability

Record each decision in `DECISIONS.md` with immutable decision ID, evidence, alternatives, scope and replacement linkage. Never silently rewrite historical approvals. Update `CURRENT_STATE.md` and `TASKS.md` only against actually observed source state. A handoff is not itself permission to execute next steps.
