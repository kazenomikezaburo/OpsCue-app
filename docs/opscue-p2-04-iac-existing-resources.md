> **移行文書に関する注意**
>
> この文書は旧OpsCueで作成された履歴資料です。
>
> 本文のCOMPLETE、READY、PASS、FROZEN、PROPOSED、NOT IMPLEMENTED等は原則として当時のPhaseの状態を示します。現在のOpsCue-appにおける実装、DB適用、テスト成功、本番稼働を保証しません。
>
> 現在の状態は対応コード、migration、テスト結果、承認記録から独立に確認してください。
>
> 文書の移行は、本文のコマンド実行、SQL適用、AWS操作、LINE送信、デプロイを承認するものではありません。
>
> 原文の設計判断、未解決事項、禁止事項、承認境界を保持します。

> **秘匿化・非実行例・参照状況**
>
> CIDR、ログ、SNS、Secret、policy等の環境名を役割別プレースホルダーに置換しました。これらは新側設定値でも実在の証明でもありません。通常／canary、現行／旧命名の区別を保持します。
>
> 旧Secret patternの「?は1文字」である点、必要な長い名前を6文字wildcardでは吸収できない点、通常DBとMessaging tokenの両方に完全ARNの別審査が必要という結論を保持します。例として prefix-?????? は prefix-database-url-?????? の代用になりません（いずれも実環境名ではありません）。
>
> synth・テスト例は実行禁止の履歴例です。実lookupを伴うsynthはAWS照会やローカル生成を伴い得ます。記載の過去PASS、在庫報告、費用は現在の検証結果・価格保証ではありません。
>
> `cdk.context.json` と `cdk.out/` はこの候補に含めません。旧環境の保存済み資料への参照です。関連IAM policy/templateは未移行であり、参照先の生成・追加はしていません。

# OpsCue P2-04 — existing AWS resource references

Implementation date: 2026-10-02. Local changes only; no deploy, bootstrap,
AWS mutation, secret registration, task launch, LINE send, commit or push.

## Resource ownership and configuration

- Production requires a concrete `CDK_DEFAULT_ACCOUNT` and `ap-northeast-1`.
  `Vpc.fromLookup({ isDefault: true })` discovers the existing default VPC and
  public subnets. Operator-provided inventory: CIDR `[REDACTED_VPC_CIDR]`, DNS support
  and hostnames enabled, one public subnet in each of 1a/1c/1d. Live inventory
  remains unverified here. No VPC, subnet, IGW, route or NACL is managed.
- A dedicated SG retains no ingress and only TCP 443/5432 plus TCP/UDP DNS to
  the VPC CIDR. Scheduler retains Public IP enabled. Never use the default SG.
- Existing normal execution/task roles are imported with `mutable: false` and
  `addGrantsToResources: false`. CDK neither attaches policies to those roles
  nor compensates with Secret resource policies. Canary execution and Scheduler
  roles remain CDK-owned. The application task role has no AWS API permissions.
- Both task definitions and both Metric Filters reference
  `[REDACTED_CURRENT_LOG_GROUP_NAME]`. No LogGroup or retention resource is created;
  the operator-reported 14-day retention remains externally managed. The old
  `[REDACTED_LEGACY_LOG_GROUP_NAME]` 30-day definition is superseded. No existing log group
  or historical logs are deleted or migrated by this change.
- All safe dispatcher events include `dispatcherMode` (`normal` or `canary`).
  The normal failure filter requires `normal`, excluding Canary completion
  failures. Older events without the field are excluded; use an image built
  from the updated entry point before relying on this alarm. Provider-auth
  failures intentionally alert for either mode. The failure alarm represents
  three consecutive one-minute periods, not necessarily three task executions.
- Existing `[REDACTED_ALERTS_SNS_TOPIC_NAME]` is imported by same-account Tokyo ARN.
  All four alarms have ALARM actions; no SNS Topic/TopicPolicy/subscription is
  created. OK and INSUFFICIENT_DATA notifications are not configured.

## Canonical Secret names and boundary

| Purpose | Canonical name | Execution role access |
| --- | --- | --- |
| Normal DB | `[REDACTED_NORMAL_DB_SECRET_NAME]` | Existing normal execution role only |
| Canary DB | `[REDACTED_CANARY_DB_SECRET_NAME]` | CDK Canary execution role only |
| Messaging token | `[REDACTED_MESSAGING_TOKEN_SECRET_NAME]` | Both execution roles |

The normal name replaces both the previous code name
`[REDACTED_LEGACY_CODE_DB_SECRET_NAME]` and the previous documentation name
`[REDACTED_LEGACY_DOC_DB_SECRET_NAME]`. It matches the initially reported
`[REDACTED_LEGACY_SECRET_PREFIX]-*` IAM scope while keeping DB and token independent.
P2-04B.1 corrects that assumption: the subsequently reported actual pattern
`[REDACTED_LEGACY_SECRET_PREFIX]-??????` does not match this DB name. Both normal DB and
Messaging token require separately reviewed complete-ARN read permissions.
This naming decision does not prove that any of these Secrets exist. AWS CLI
previously returned `NoCredentials`; no Secret value is read.

CDK still declares three empty Secret resources, with neither `SecretString`
nor `GenerateSecretString`. Before deployment, use `describe-secret` for each
name. If a same-name Secret already exists, do not deploy its creation: adopt
an explicitly reviewed import/reference design first. If this stack has ever
been deployed, review Secret replacement and all resource removals before
applying this revision; this change is not an automatic migration of deployed
resources. Values are populated only in a separately approved operator step.

## Normal execution role: separately applicable policy proposal

Operator-reported baseline:
`AmazonECSTaskExecutionRolePolicy` supplies ECR pull and log-stream writes;
`[REDACTED_NORMAL_SECRET_READ_POLICY_NAME]` was initially reported as a prefix grant. The
subsequently reported actual `[REDACTED_LEGACY_SECRET_STEM]-??????` pattern matches neither the
normal DB name nor the Messaging token. Both Secrets' `GetSecretValue` and
`DescribeSecret` are therefore absent from that reported baseline. The live
policy remains unverified. `DescribeSecret` matches the CDK grant
contract; ECS injection primarily requires `GetSecretValue`. No permissions
are needed on the normal application task role.

Resolve the **complete** ARNs (including Secrets Manager's random suffix) from
reviewed stack outputs or existing Secret metadata. Replace the placeholders
below with the two exact ARNs; this is a proposal, not an applied policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadNormalDispatcherSecrets",
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      "Resource": ["<NORMAL_DB_COMPLETE_SECRET_ARN>", "<MESSAGING_TOKEN_COMPLETE_SECRET_ARN>"]
    }
  ]
}
```

No Canary DB ARN belongs in this policy. The existing legacy grant remains
outside CDK ownership; review narrowing it separately. If customer-managed KMS
keys are used, add `kms:Decrypt` on the exact relevant key ARNs and verify their
key policies; do not add wildcard KMS access. Confirm ECS Tasks trust,
permissions boundaries, SCPs and resource policies before application.
Scheduler's CDK policy passes only the normal execution/task roles to ECS and
runs only the normal task definition on the specified cluster. A manual Canary
operator needs separately reviewed RunTask/PassRole permissions.

## SNS permission proposal and pre-application checks

Topic Policy, subscriptions and encryption are unverified. Importing the topic
does not grant CloudWatch delivery permissions. If required, merge this
statement into the existing policy without removing its current statements:

```json
{
  "Sid": "OpsCueCloudWatchAlarmPublish",
  "Effect": "Allow",
  "Principal": {"Service": "cloudwatch.amazonaws.com"},
  "Action": "sns:Publish",
  "Resource": "<EXISTING_TOPIC_ARN>",
  "Condition": {
    "StringEquals": {"aws:SourceAccount": "<APPROVED_ACCOUNT_ID>"},
    "ArnEquals": {"aws:SourceArn": ["<PROVIDER_AUTH_ALARM_ARN>", "<NORMAL_FAILURE_ALARM_ARN>", "<TARGET_ERROR_ALARM_ARN>", "<DROPPED_INVOCATION_ALARM_ARN>"]}
  }
}
```

Confirm the account/Region/ARN, current policy and deny conditions, confirmed
subscriptions and intended recipients. For an encrypted topic, verify the
customer-managed KMS key allows CloudWatch `kms:GenerateDataKey*` and
`kms:Decrypt`. Review any change separately. Do not trigger alarm-state changes
or test notifications as part of this local implementation.

## Offline verification and real lookup

Unit tests inject concrete synthetic VPC attributes and use a synthetic account.
They require no AWS authentication. The entry point supports an explicit
`-c opscueOfflineTest=true` synth fixture using the same pattern. Fixture
account/IDs are not live inventory: **never deploy the offline assembly**.
It proves template construction only, not lookup, routes, IAM or SNS delivery.

```powershell
npx tsx infra/test/opscue-line-delivery-stack-test.ts
npx cdk synth --app "npx tsx infra/bin/opscue-line-delivery.ts" --output "$env:TEMP/[REDACTED_REAL_SYNTH_OUTPUT_DIR]"
npx cdk synth --app "npx tsx infra/bin/opscue-line-delivery.ts" -c opscueOfflineTest=true --output "$env:TEMP/[REDACTED_OFFLINE_SYNTH_OUTPUT_DIR]"
git diff --check
```

Real lookup needs approved credentials, `CDK_DEFAULT_ACCOUNT`, and a read-only
lookup capability. Existing root `cdk.context.json` and `cdk.out/` are preserved;
only separate temporary assemblies are used. Refresh/review real lookup context
before deployment; do not substitute fixture subnet IDs for AWS inventory.

Tests assert zero new network/log/SNS resources, exactly Canary and Scheduler
roles/policies, existing normal role references, SG rules, public subnet inputs,
four SNS alarm actions, disabled schedule and both flags, exact task Secret
boundaries and absence of Secret values. They run the real entry point in both
disabled modes and in configuration-failure paths before any DB/provider call,
checking the log discriminator used by the normal-only failure filter.

Observed local results: CDK assertions/runtime checks PASS; offline CDK synth
PASS (only the existing unconfigured-feature-flags notice); focused infra
TypeScript and ESLint PASS; `git diff --check` PASS (line-ending notices only).
The production synth command was attempted with a separate temporary output
directory and stopped because the concrete account was unavailable. Earlier
STS identity lookup returned `NoCredentials`. Real authenticated VPC lookup
and production synth remain unverified. Existing root CDK artifacts and dirty
logs were preserved.

## Remaining activation blockers and cost

Scheduler stays `DISABLED`; both delivery flags stay `false`. Canary remains
batch 1 with its dedicated DB Secret/execution role. Placeholder image
`c2-05-placeholder`, mutable ECR tags/unpinned digest and invalid app origin
remain unresolved. No real task/send is authorized by this change.

Before AWS application: verify default VPC public routing/IGW, NACL, DNS and
available IPs; real lookup results; existing roles' effective policies; Secret
existence/KMS ownership; log group/retention; SNS policy/KMS/subscriptions; and
review actual CloudFormation diff, deployed-resource ownership and bootstrap
state without bootstrapping automatically.

No NAT Gateway existed in the prior design, so VPC reuse does not save NAT
fees. It reduces managed infrastructure. Three Secrets have a published base
cost of about USD 1.20/month plus API usage. Logs, metrics, four alarms,
Container Insights, ECR and SNS remain usage/monitoring cost drivers.
Future every-minute Linux Fargate operation has 43,200 starts per 30 days:
the one-minute minimum is at least 720 task-hours, 180 vCPU-hours and 360
GiB-hours, before cold-start/retry overhead. The old 55-second/660-hour estimate
is not a billing upper bound. Public IPv4 costs USD 0.005 per assigned IP-hour;
calculate actual assignment duration and data transfer separately.

AWS references: [IAM imports](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_iam/README.html),
[ECS execution role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html),
[CloudWatch SNS policies](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Notify_Users_Alarm_Changes.html),
[SNS KMS permissions](https://docs.aws.amazon.com/sns/latest/dg/sns-key-management.html),
[Fargate billing](https://aws.amazon.com/fargate/pricing/),
[IPv4 billing](https://aws.amazon.com/vpc/pricing/),
[Secrets pricing](https://aws.amazon.com/secrets-manager/pricing/).
