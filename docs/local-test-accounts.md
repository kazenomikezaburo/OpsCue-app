# Local test accounts — stage 2, offline only

This repository targets `opscue-app-dev`, API `http://127.0.0.1:55321`,
DB `127.0.0.1:55322`, container `supabase_db_opscue-app-dev`.
These identifiers are requirements, not proof of the running environment.

## Current implementation

No live adapter exists. `prepare-local-accounts.mjs` always refuses with
`LOCAL_ACCOUNT_TARGET_UNVERIFIED`, exit 1 when invoked directly. It neither reads
credentials/.env.local nor invokes Docker, SQL or Auth. There is no enable flag.
Do not interpret any offline plan/comparison/simulation as permission to execute.

`local-account-plan.mjs` accepts bounded primitive JSON strings containing only
non-secret projections: complete, branches, authUsers (id/email/confirmed),
profiles, workers, managerBranchAccess. No passwords, tokens or Auth metadata.
The complete flag is a mock assumption, not authenticated acquisition evidence.
The closed simulator uses provided fictional UUIDs and in-memory mock operations;
it cannot accept a live SDK/DB adapter. It preserves protected rows and never
updates passwords, repairs existing users, overwrites roles or deletes accounts.

Manager `manager-a@test.invalid` must already be confirmed with an active manager
profile and access to active `DEMO-001`. Worker `worker-a@test.invalid` needs an
active worker profile and exactly one active linked Worker in that branch;
workers.id is independent of Auth/profile UUID. System Admin
`system-admin@test.invalid` needs an active system_admin profile, no Worker or
manager access rows. Existing complete accounts are verified, not rewritten.
`DEV-WORKER-A` is the proposed reserved staff code; collision causes refusal.

## Approved offline checks

From the repository root, run only these DB-free tests:

```text
node --test scripts/dev/local-account-plan.test.mjs
node --test scripts/safety/verify-local-account-target.test.mjs
```

No npm installation, DB reset, existing integration tests or Docker commands are
part of this procedure. No real credentials are required for the tests.

## Before a separately approved live phase

Verify actual Docker daemon/context, complete container ID, project labels,
network, data volume exclusivity and loopback port bindings. Independently
approve PostgreSQL cluster/database identity and the Auth API-to-DB route.
Confirm actual schema/triggers/grants and existing Manager/demo rows read-only.
None of these conditions is currently established by offline data. Do not fill
unknown values with fixture identities or use assertIntegrationTarget as approval.

A future reviewed adapter must fully acquire relevant users (including pagination
and collision checks), serialize competing preparation runs, re-read before
creation, and use authenticated Admin createUser responses for profile UUIDs.
Auth and the profile/Worker transaction cannot commit atomically. Never directly
INSERT auth.users or normalize GoTrue columns. No migration, production trigger,
RLS/GRANT relaxation or Manager password input belongs in this preparation.

Future secret input proposals: OPSCUE_DEV_SUPABASE_ADMIN_KEY,
OPSCUE_DEV_DATABASE_URL, OPSCUE_DEV_WORKER_PASSWORD,
OPSCUE_DEV_SYSTEM_ADMIN_PASSWORD. No current code reads them. Supply transiently
without terminal echo, shell history/argv, code, files or logs. Never load/change
.env.local automatically. Never give the browser an Admin key. Never print raw
SDK errors, SQL, Docker environment or connection URLs. Use fixed diagnostics.

## Partial failure and recovery

The simulator models lost Auth response, pre-DB failure, DB rollback and post-DB
failure. Auth rows may remain when DB writes roll back. Inconsistent existing
accounts stop subsequent runs; they are not silently adopted or repaired.
A future live version requires non-secret operation ownership records with exact
UUIDs/stages, protected from Git and not containing credentials. Missing or
ambiguous ownership, concurrent creation or uncertain API response => stop.

No automatic compensating deletion. After separate approval and fresh target
verification, inspect only run-owned rows. Never delete a pre-existing user,
Manager, branch or access. Recovery must account for dependent data and sessions;
after any login, revoke sessions before considering explicit user deletion.
No db reset, broad deletion, Docker stop/remove, or deletion by email alone.

Residual limitations: offline projection completeness and approval provenance
cannot be proved; real idempotency/concurrency, Auth routing, privileges, schema
drift and recovery are unverified. The 28 integration tests remain unmodified and
unapproved. Stage 2 completion does not authorize account creation.

## 手動セットアップ・ログイン検証結果

以下はユーザーから報告された、新しいローカル開発環境での手動セットアップと
ログインの確認結果である。今回のドキュメント更新では、DB接続や環境の再検証は
実施していない。上記のオフライン実装・シミュレーターの制約とは別の実施記録であり、
自動アカウント作成スクリプトの完成や実行許可を示すものではない。

### 確認済み環境（ユーザー報告）

- Supabase project_id: `opscue-app-dev`
- API: `http://127.0.0.1:55321`
- DBコンテナ: `supabase_db_opscue-app-dev`
- PostgreSQLクラスタの完全識別子は端末固有の実値のため共有文書には保存しない。
  識別子の照合自体は安全確認に必要であり、省略しない。
- 新旧Dockerプロジェクト、ネットワーク、DBボリュームは分離済み。
- 新しいAuthの `GOTRUE_DB_DATABASE_URL` のホスト名は
  `supabase_db_opscue-app-dev`（接続URL自体は記載しない）。
- 元の `dispatch-os` DBは変更していない。

### 実施済み（ユーザー報告）

| 種別 | アカウント | 確認結果 |
| --- | --- | --- |
| Manager | `manager-a@test.invalid` | profiles: `manager`、有効。`DEMO-001`（デモ支店）の `manager_branch_access` あり。アプリへのログイン成功。 |
| Worker | `worker-a@test.invalid` | Authメール確認済み。profiles: `worker`、有効。workers: `staff_code=DEV-WORKER-A`、`status=active`、`DEMO-001` 所属。アプリへのログイン成功、Workerホーム画面表示成功。 |
| System Admin | `system-admin@test.invalid` | Authメール確認済み。profiles: `system_admin`、有効。アプリへのログイン成功。 |

### 未検証・検証範囲の限界

認証成功は、権限別の機能テストやRLS検証の完了を意味しない。
Workerホーム画面の表示成功も、個別業務機能の動作や権限制御の証明ではない。

- Managerの権限別機能・アクセス制御は未検証。
- Workerの募集表示、勤務割当、および権限別機能・アクセス制御は未検証。
- System Adminの機能とアクセス制御は未検証。
- RLS、権限外の操作・データアクセスの拒否、およびintegration testは未検証。
- 自動作成処理の実環境での冪等性・並行実行・部分失敗からの復旧は未検証。

### 維持する安全ガードと自動作成の制約

`prepare-local-accounts.mjs` は引き続きlive adapterを持たず、直接実行すると
`LOCAL_ACCOUNT_TARGET_UNVERIFIED`、exit 1で拒否する。enable flagはなく、
認証情報・`.env.local` の読み取りやDocker・SQL・Authの呼び出しを行わないという
既存の制約を維持する。今回の手動確認は、このガードを解除する根拠にはならない。

将来のlive phaseには、上記の個別承認・対象確認・安全な復旧要件が引き続き必要である。
今回の更新ではドキュメントのみを変更し、アプリ、スクリプト、DB、Auth、Docker、
環境変数、元の `dispatch-os` は変更しない。DB接続、外部通信、integration test、
`supabase db reset`、Git commit / pushは実施しない。パスワード、APIキー、トークン、
接続URLは読み取り・出力・記録しない。

## STEP 215 — 開発者ごとの実環境識別条件

実DBクラスタ識別子は旧DBとの区別と接続先の照合に必要だが、他の端末に共通の期待値として使わない。共有文書から実値を除外しても、live phaseの検証要件は維持する。この記録は実行手順の承認ではない。

別途承認された読み取り専用の確認段階で、各開発者は対象PostgreSQLのクラスタ制御情報からsystem identifierを取得し、DB名・用途・環境識別情報とともにローカル限定の期待値として独立レビューを受ける。取得方法・必要権限は実環境で確認して確定し、模擬値や接続先から自動採用した値で埋めない。

Dockerの完全コンテナID・context・project labels・network・volume・loopback bindingと、Auth APIから対象DBまでの経路も別途確認する。DB実観測が独立承認した期待値と一致し、旧環境とコンテナ/ネットワーク/volume/クラスタが共有されていないことを確認する。API/DBポートやproject名だけの一致では不足する。クラスタ再作成等で値が変わった場合は再承認し、未取得・不一致・由来不明なら停止する。

実値・Auth UUID・認証情報をGitHub、ログ、コマンド引数、共有文書へ記載しない。非共有記録の具体的な保管方法と実観測アダプターは未確定である。prepare-local-accounts.mjsのlive入口は引き続き無条件拒否で、Manager・Worker・System Adminの既存整合を勝手に修復せず、既存ManagerとDEMO-001を保護する。