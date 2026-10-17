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

> **秘匿化・権限設計・参照状況**
>
> account、ARN、物理role名、生成識別子、task family、Secret等の環境参照を一貫した役割別プレースホルダーに置換しました。標準AWSサービス名・Action・Condition、Boundary対応、wildcardと権限の残余リスクは保持します。
>
> 通常／canary／Schedulerの分離、旧Secret patternの不一致、未解決の実効権限・rollback問題は解消していません。ローカルmatcherや過去PASSは実AWSの権限証明ではありません。コマンドは非実行の履歴例で、placeholderを埋めても実行許可にはなりません。
>
> `docs/opscue-p2-04b2-boundary-integration.md` は未移行です。本文で参照する `infra/iam/p2-04b1/` 配下のBoundary・CFN policy・bootstrap候補・normal-secret-read template・verify-local・generate-simulator-requests等も未移行です。履歴参照を残し、追加・置換はしていません。

# OpsCue P2-04B.1 権限設計・最終レビュー

2026-10-02。状態: **設計案 / ローカル検証済み / Bootstrap承認待ち**。
AWS APIによるポリシー検証、IAM変更、bootstrap/deploy、実送信は行っていない。
P2-04B.1ではこの設計書とinfra/iam/p2-04b1のJSONを追加し、アプリCDKは変更していない。
P2-04B.2で新規2ロールのRoleName/BoundaryとScheduler trustをローカル統合した。
最新の照合・検証結果は[統合結果](opscue-p2-04b2-boundary-integration.md)を参照する。
既存ログ、cdk.context.json、cdk.out、opscue-bootstrap-review.yamlを保持する。

## 1. 結論と適用ゲート

AdministratorAccessをアタッチせず、CFN実行ポリシーをIAM用とサービス用に分割する。
CanaryとSchedulerには異なるBoundaryを必須にする。既存通常2ロールには適用しない。
Boundaryは許可を付与しない。実効権限はidentity policyとBoundaryの交差、SCP・session policy・
明示Deny・リソースポリシー等による追加制限で決まる。単なるimplicit denyにはresource policyの
session ARN直接許可による例外があるため、Boundaryに許可外操作・対象の明示Denyも置いた。

P2-04B.1時点のアプリにはRoleName/PermissionsBoundaryがなかった。
P2-04B.2で統合とoffline synth照合を完了した。**実環境での既存Boundary確認、公式の権限検証、
rollback handler確認は未完了であり、Bootstrap承認は引き続き別途必要。**

## 2. 管理主体と権限の関係

| 主体/ポリシー | 管理者と権限 |
| --- | --- |
| Boundary 2種・CFN実行管理ポリシー2種 | 独立したIAM管理者がレビュー後に作成。アプリCFN実行ロールに作成/変更権限を与えない |
| Bootstrap実行者 | 短期認証でCDKToolkitの5ロール、S3、ECR、SSMを構築。アプリ実行ポリシーとは別 |
| Bootstrap DeployRole | 標準の広いCloudFormation権限が残る。CFN実行ロールへのPassRoleのみ。使用者は呼出元IAMで限定 |
| Bootstrap CFN execution role | cfn-execution-iam.jsonとcfn-execution-services.jsonをアタッチ |
| Canary実行ロール | 現在のCDK inline policyとCanary Boundaryの交差 |
| Schedulerロール | 現在のCDK inline policyとScheduler Boundaryの交差 |
| 既存通常実行ロール | mutable:falseのまま。追加Secret policyは別管理者・別承認で適用 |
| 既存通常Task Role | AWS API権限なし。変更しない |

Bootstrap標準version 32ではLookupRoleはReadOnlyAccess + kms:Decryptの明示Deny、
FilePublishingRoleはBootstrap S3/KMS、ImagePublishingRoleはBootstrap ECR、
DeployRoleは広いCloudFormation操作と資産参照、CFN実行ロールは指定管理ポリシーとなる。
外部TrustedAccounts/TrustedAccountsForLookupは空、自アカウント信頼とTagSessionは残る。
`--custom-permissions-boundary`はアプリ2ロールへの自動適用ではない。
Canary/Scheduler用BoundaryをBootstrap CFN execution roleへ指定してはいけない。
Bootstrapロール自体のBoundaryを追加するなら、その用途に合う別設計が必要。

## 3. アプリ改修設計（P2-04B.2でローカル統合済み）

新規作成する2ロールだけに、以下を明示する。Boundaryは事前作成済み管理ポリシーのARN参照。
Boundaryをアプリスタック内で作成させない。

| Construct | 提案RoleName | PermissionsBoundary |
| --- | --- | --- |
| CanaryTaskExecutionRole | [REDACTED_CANARY_EXECUTION_ROLE_NAME] | arn:aws:iam::[REDACTED_APPROVED_ACCOUNT_ID]:policy/[REDACTED_CANARY_BOUNDARY_POLICY_NAME] |
| SchedulerRole | [REDACTED_SCHEDULER_ROLE_NAME] | arn:aws:iam::[REDACTED_APPROVED_ACCOUNT_ID]:policy/[REDACTED_SCHEDULER_BOUNDARY_POLICY_NAME] |

実装時は`iam.ManagedPolicy.fromManagedPolicyArn`で参照し、対象`iam.Role`の
`permissionsBoundary`と`roleName`に設定する。import済み通常2ロールには触れない。
BoundaryのARNはアカウントから生成し、東京以外・対象アカウント違いを拒否する。

現在のlogical IDは[REDACTED_CANARY_EXECUTION_LOGICAL_ID]、[REDACTED_SCHEDULER_LOGICAL_ID]。
P2-04B.2では2ロールのRoleNameを明示し、物理名を上記に固定した。
前回の生成名prefix案は今回の明示名へ置き換えた。
スタック既存デプロイの有無を確認すること。既存作成済みならRoleName指定は置換になり得る。

現synthで確定しているTask family:
- 通常: [REDACTED_NORMAL_TASK_FAMILY]
- Canary: [REDACTED_CANARY_TASK_FAMILY]

ClusterとAlarmの名前も未作成の生成名。JSONのprefixは予測パターンであり、作成後に実ARNへ
縮小する。文字数による省略、スタック名・logical ID変更、タグ要件を再synthで確認する。
S3名、qualifier、東京、アカウントはmanifestと一致する。VPC IDは保存済み実環境synthから引用。
最新AWS在庫は今回再取得していない。

## 4. Boundaryの上限

`canary-execution-boundary.json`:
- ECR authorization token、対象[REDACTED_DISPATCHER_ECR_REPOSITORY_NAME] repositoryのpullだけ。
- Canary DBとMessaging tokenのGetSecretValue/DescribeSecretだけ。
- 既存ロググループ内の`canary-task/*`ストリームの作成/書込だけ。
- 通常DB、他ECR/ログ、IAM変更、STS AssumeRole、RunTask、KMS等は明示Deny。
- Secret ARNは作成前なので正式名 + AWSの6文字suffix (`??????`) に限定。
  作成後の完全ARNへの縮小を検討する。customer-managed KMSを使うなら事前に別レビューが必要。

`scheduler-boundary.json`:
- 通常Task familyのRunTaskだけ。対象Clusterのprefix条件付き。
- 既存通常2ロールだけのPassRole、PassedToServiceはecs-tasks.amazonaws.com。
- Canary起動/Canary PassRole、別Cluster、別service、その他操作は明示Deny。
- CDK inline policyは現在の正確なtask revision/clusterを許可するため、実効権限はさらに狭い。
  Boundary単体では同familyの別revisionを許す。物理ARN確定後の縮小が望ましい。

CreateRoleは対象ロールごとに`StringEquals iam:PermissionsBoundary`を要求。
欠落・誤ったBoundaryでは`StringNotEquals`の明示Deny。
PutRolePermissionsBoundaryも正しいBoundaryだけ、DeleteRolePermissionsBoundaryは明示Deny。
アプリCFNはBoundary/実行policyのversion作成・削除・default変更をできない。

Boundaryだけでは信頼ポリシーの本文、LINE送信、DB操作、SchedulerのStateを制御できない。
Canaryの信頼はecs-tasks.amazonaws.com、Schedulerの信頼はscheduler.amazonaws.comのみを維持。
P2-04B.2でScheduler trustに同一アカウントと対象schedule-groupのSourceAccount/SourceArn条件を
追加した。BoundaryはScheduler DISABLEDや送信フラグfalseの代わりにならない。

## 5. ポリシー照合と残る広さ

| 論点 | 修正/判断 |
| --- | --- |
| IAM CreateRole/PassRole | 生成名wildcardを廃止し新規2ロールの提案完全ARNに限定。通常2ロールはPassRoleのみ |
| IAM Boundary | CreateRole/PutRolePermissionsBoundaryだけにiam:PermissionsBoundary条件。GetRole等には付けない |
| IAM政策改変 | Boundary管理権限を別管理者へ分離。アプリ実行policyは自己変更不可 |
| ECS RegisterTaskDefinition | 現行SARでtask-definition resourceをサポート。2 family ARNに限定 |
| ECS DeregisterTaskDefinition | 現行SARではresource制限不可。Resource:* + 東京条件。残余リスク |
| EC2 CreateSecurityGroup | vpc ARNとsecurity-group ARN双方を指定 |
| EC2 SG変更 | ec2:Vpc条件はSG resourceの認可条件。SGタグは広いまま。初回後の実SG ARN縮小が必要 |
| Secrets ARN | 名前末尾のハイフン + 6文字suffix。Create/Update/Deleteは3名限定 |
| Logs | MetricFilterの認可はlog-group ARN。保持期間やCreateLogGroupは許可しない |
| CloudWatch/Scheduler | アラーム生成名prefix、固定group/schedule ARN。SNS Publish/Topic Policy変更は含めない |
| KMS | 現構成はAWS管理キー。customer-managed key作成・DecryptはアプリCFNへ付与しない |
| 管理policyサイズ | CFN IAM/Servicesへ分割。各policyを空白除外6144文字以下でローカル検査 |

残余リスク: 同VPCの別SG、同ロググループの別フィルター、東京の他task definition登録解除、
同familyの別revision、UpdateSecretによる値更新、Schedule更新による有効化。
これらは前回案を「最小権限完了」と評価できない理由。テンプレート固定・変更レビュー・
呼出元権限・SCP等を含めて受容判断する。必要なら初回後のARN縮小を必須にする。

`bootstrap-operator-candidate.json`はAWS管理S3キー・Boundaryなしの標準Bootstrap構築用候補。
AdministratorAccessのアタッチ権限はないが、Bootstrap用5ロールのCreateRole/PutRolePolicy/
trust変更を許すため、強いinline policyや信頼改変による昇格余地は残る。
この候補を通常開発者へ恒久付与しない。独立管理者の短期セッション・監査・固定テンプレートを
前提とする。Bootstrap operator自身のBoundary/SCPでさらに制限する設計は未確定。
この候補はCloudFormation handler/CLIの追加Read/List操作、タグ、暗号化要件で不足し得る。

## 6. 通常Execution RoleのSecret修正

既存policy本文はrepo内にない。今回AWSには問い合わせていないため、実物は未確認。
ユーザー提示の`[REDACTED_LEGACY_SECRET_PREFIX]-??????`は、通常DBの
`[REDACTED_NORMAL_DB_SECRET_NAME]-??????`に**一致しない**。
`?`は1文字なのでdatabase-urlを吸収しない。前回の「通常DB GetSecretValue充足」は訂正する。
既存AmazonECSTaskExecutionRolePolicyにもSecret GetSecretValueは含まれない。

`normal-secret-read.template.json`は通常DBとMessaging tokenの**完全ARN**だけに
GetSecretValue/DescribeSecretを許可。Canary DBは含めない。未確定ARNのplaceholderがあるので
そのままvalidate/apply不可。describe-secretまたは将来のstack outputで取得後、ローカルコピーを
完成させる。Secret値は取得しない。通常Task Roleは変更しない。

将来の読み取り確認手順（今回は未実行）:

```powershell
aws iam list-role-policies --role-name [REDACTED_NORMAL_EXECUTION_ROLE_NAME] --profile <review-profile>
aws iam get-role-policy --role-name [REDACTED_NORMAL_EXECUTION_ROLE_NAME] --policy-name [REDACTED_NORMAL_SECRET_READ_POLICY_NAME] --profile <review-profile>
aws iam list-attached-role-policies --role-name [REDACTED_NORMAL_EXECUTION_ROLE_NAME] --profile <review-profile>
aws secretsmanager describe-secret --secret-id [REDACTED_NORMAL_DB_SECRET_NAME] --region ap-northeast-1 --profile <review-profile>
aws secretsmanager describe-secret --secret-id [REDACTED_MESSAGING_TOKEN_SECRET_NAME] --region ap-northeast-1 --profile <review-profile>
```

SecretReadがmanaged policyならGetPolicy/GetPolicyVersionでdefault versionを確認。
不存在ならARNは今は決められない。同名Secretが存在する場合はCDK作成と衝突するため参照方針を
改める。customer-managed KMS使用時は完全key ARNのDecryptとkey policyを別途設計。
既存policyの上書きや通常ロールの変更は別承認事項。

## 7. 検証手順と判定基準

ローカル（AWS通信なし）:

```powershell
node infra/iam/p2-04b1/verify-local.mjs "$env:TEMP/[REDACTED_BOUNDARY_SYNTH_OUTPUT_DIR]/[REDACTED_APPLICATION_STACK_NAME].template.json"
node infra/iam/p2-04b1/generate-simulator-requests.mjs "$env:TEMP/[REDACTED_SIMULATOR_OUTPUT_DIR]"
git diff --check
```

ローカルmatcherはこの案のAction/Resource/Condition一致だけを検査する。AWSの正式なIAM
評価エンジンではなく、SARの正否、SCP、multi-resource request、trust、resource policy、
CloudFormation handlerを検証しない。39ケースとJSON/サイズ、旧Secret ARN不一致、
指定した最新synthのScheduler/両フラグの無効化、Boundary/RoleName統合、CFN policyとの照合を検査する。
ルートの古いcdk.outは保持し、検証対象パスは必須入力とした。

AWSでの検証（将来の読み取り検証窓でのみ。今回は未実行）:

```powershell
aws accessanalyzer validate-policy --policy-document file://infra/iam/p2-04b1/cfn-execution-iam.json --policy-type IDENTITY_POLICY --region ap-northeast-1 --profile <review-profile>
aws accessanalyzer validate-policy --policy-document file://infra/iam/p2-04b1/cfn-execution-services.json --policy-type IDENTITY_POLICY --region ap-northeast-1 --profile <review-profile>
aws accessanalyzer validate-policy --policy-document file://infra/iam/p2-04b1/canary-execution-boundary.json --policy-type IDENTITY_POLICY --region ap-northeast-1 --profile <review-profile>
aws accessanalyzer validate-policy --policy-document file://infra/iam/p2-04b1/scheduler-boundary.json --policy-type IDENTITY_POLICY --region ap-northeast-1 --profile <review-profile>
aws accessanalyzer validate-policy --policy-document file://infra/iam/p2-04b1/bootstrap-operator-candidate.json --policy-type IDENTITY_POLICY --region ap-northeast-1 --profile <review-profile>
```

完成したnormal-secret-readも同様に検証する。ERRORは0、SECURITY_WARNING/WARNING/SUGGESTIONは
すべて理由を記録してレビュー。validate-policyはサービスの実行成功や「最小権限」を保証しない。
検証者はaccess-analyzer:ValidatePolicy、iam:SimulateCustomPolicy等の限定権限を使う。

生成したrequestごとに次を実行し、expected.jsonと比較:

```powershell
aws iam simulate-custom-policy --cli-input-json "file://$env:TEMP/[REDACTED_SIMULATOR_OUTPUT_DIR]/01.json" --profile <review-profile>
```

CFNケースは2実行policyの評価。Boundaryケースは**シミュレーション専用の全許可identity
policy**とBoundaryを交差させ、過大なinline policyを付けても拒否が残ることを確認する。
この全許可文書はIAMへ適用するpolicyではない。実際のCDK inline policy + Boundaryでも
追加検証すること。Fn::Ref/GetAttは実ARNに解決して入力する。
任意policyによる実効権限はSimulateCustomPolicy、作成後の実ロールはSimulatePrincipalPolicyで
確認し、PermissionsBoundaryDecisionDetail/MissingContextValuesも読む。

| 許可されるべき | 拒否されるべき |
| --- | --- |
| 正しいRoleName + 対応BoundaryでCreateRole | Boundary欠落/別Boundary/別RoleNameでCreateRole |
| 正しいBoundary再指定 | Boundary削除/変更、Boundary policy version改変 |
| 新規2ロールのinline policy操作 | 既存通常ロールのpolicy/trust変更・削除 |
| CFNの必要なECS/Scheduler PassRole | 別Role/別PassedToServiceへのPassRole |
| Canary専用DB/token/ECR/Canary logs | 通常DB、他Secret、IAM/STS/KMS操作 |
| Schedulerの通常family + 指定cluster起動 | Canary family、別cluster、cluster欠落、Canary PassRole |
| 東京のrollback登録解除 | 東京以外の登録解除 |
| 空Secretの作成 | CFNによるSecret値読取/RunTask |

SG作成はVPCとSG双方のresource評価、ECS taggingは作成時TagResource、SchedulerはPassRole
依存も個別に追加する。resource/conditionごとの組合せを省略しない。
SimulatorはSCPやresource-policyを含む実環境の完全再現ではない。許可結果を本番の成功保証に
使わず、実環境のdeny policyとサービス側設定を別途レビューする。

## 8. Bootstrap実行・作成後検証・復旧の案

以下は**将来の承認後用コマンド**。今回は実行禁止。
独立IAM管理者がBoundary2種とCFN実行policy2種を先に作成し、default version/hashを記録。
Bootstrap operator candidateも独立管理者が必要性と実効上限を確認してから使用する。

```powershell
npx cdk bootstrap aws://[REDACTED_APPROVED_ACCOUNT_ID]/ap-northeast-1 `
  --profile <approved-bootstrap-profile> `
  --region ap-northeast-1 --qualifier hnb659fds --toolkit-stack-name CDKToolkit `
  --cloudformation-execution-policies arn:aws:iam::[REDACTED_APPROVED_ACCOUNT_ID]:policy/[REDACTED_CFN_IAM_POLICY_NAME] arn:aws:iam::[REDACTED_APPROVED_ACCOUNT_ID]:policy/[REDACTED_CFN_SERVICES_POLICY_NAME] `
  --bootstrap-kms-key-id AWS_MANAGED_KEY --termination-protection
```

外部trustなし。アプリBoundaryを--custom-permissions-boundaryには渡さない。
保存YAMLの空KMSパラメータはCMK作成を意味する一方、CLI初回既定はAWS_MANAGED_KEY。
直接YAML適用なら値を明示する。S3はPrivate/PublicAccessBlock/TLS/Versioning、ECRはIMMUTABLE。
Bootstrap operator候補はCMK作成権限を持たない。
--no-executeでも変更セット作成はAWS変更なので今回実行しない。

作成後の読み取り確認コマンド案:

```powershell
aws cloudformation describe-stacks --stack-name CDKToolkit --region ap-northeast-1 --profile <review-profile>
aws cloudformation get-template --stack-name CDKToolkit --region ap-northeast-1 --profile <review-profile>
aws ssm get-parameter --name /cdk-bootstrap/hnb659fds/version --region ap-northeast-1 --profile <review-profile>
aws iam get-role --role-name [REDACTED_BOOTSTRAP_CFN_EXECUTION_ROLE_NAME] --profile <review-profile>
aws iam list-attached-role-policies --role-name [REDACTED_BOOTSTRAP_CFN_EXECUTION_ROLE_NAME] --profile <review-profile>
aws s3api get-public-access-block --bucket [REDACTED_BOOTSTRAP_ASSET_BUCKET_NAME] --profile <review-profile>
aws s3api get-bucket-encryption --bucket [REDACTED_BOOTSTRAP_ASSET_BUCKET_NAME] --profile <review-profile>
aws ecr describe-repositories --repository-names [REDACTED_BOOTSTRAP_ASSET_REPOSITORY_NAME] --region ap-northeast-1 --profile <review-profile>
```

さらに5ロールすべてのTrust/inline/attached policy、Parametersの信頼空・実行policy指定、
version 32、名前衝突、S3 BucketPolicy/lifecycle/versioning、SCPを確認。
アプリ2ロールのBoundaryは**Bootstrap後ではなくアプリ作成後**にget-roleで確認する。

失敗時は実行を止め、StackEventsのAPI/ARN/request ID、caller、SCP/Boundaryを記録。
AdministratorAccessへ切り替えない。必要APIの妥当性をSAR/handlerで調査し、JSONを修正、
validation/simulationを再実施して別承認。UPDATE_ROLLBACK_FAILEDでは原因修正後に承認済みの
continue-update-rollbackを使用。初回失敗はStack状態とRetain資産を確認し、削除/再実行を自動化しない。
管理policyは前の承認済みversionへ戻す。Boundaryを外して復旧しない。
Boundary削除DenyがCloudFormationのcleanup handlerと衝突する場合、境界を維持したまま
DeleteRoleが可能か確認し、必要なら独立管理者による限定回復手順を承認する。

## 9. 承認前の未解決事項

1. 新規2ロールのRoleName/Boundary CDK統合・テスト・offline synthはP2-04B.2で完了。実環境再synth・Boundary存在確認は未実施。
2. Access Analyzer/公式Simulator未実行。local matcher PASSで代替不可。
3. Bootstrap operatorの昇格防御、呼出元許可/期間、SCP/Boundary、固定テンプレートのレビュー。
4. 実行policy/Boundaryを独立管理する責任者・policy default version/hash。
5. CloudFormationの各resource type handlerの実際のCreate/Read/Update/Delete権限。
6. 生成Cluster/Alarm ARNのprefix妥当性、初回後の縮小、RoleName衝突・置換有無。
7. 既存SecretRead実物、通常DB/tokenの存在・完全ARN・KMS、追加policyの別承認。
8. Bootstrap/アプリのrollback権限、サービスリンクロール、タグ/SCP制約。
9. 既存SNS Publish/暗号化/購読、通常実行ロールの実効権限。
10. placeholder image・未固定digest・仮origin。Scheduler DISABLED・両フラグfalseを維持。

## 10. 参照とローカル検証

- [IAM Boundary](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html)
- [IAM条件キー](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html)
- [ECS SAR](https://docs.aws.amazon.com/ja_jp/service-authorization/latest/reference/list_amazonelasticcontainerservice.html)
- [EC2 SAR](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ec2.html)
- [IAM SAR](https://docs.aws.amazon.com/service-authorization/latest/reference/list_iam.html)
- [Scheduler SAR](https://docs.aws.amazon.com/service-authorization/latest/reference/list_scheduler.html)
- [Secrets Manager SAR](https://docs.aws.amazon.com/service-authorization/latest/reference/list_secretsmanager.html)
- [Simulator API](https://docs.aws.amazon.com/IAM/latest/APIReference/API_SimulateCustomPolicy.html)
- [Access Analyzer CLI](https://docs.aws.amazon.com/cli/latest/reference/accessanalyzer/validate-policy.html)
- [Bootstrap設計](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-customizing.html)

P2-04B.1ローカル結果: JSON parse/サイズ/39一致検査 PASS。Simulator request生成のみ実施、AWS送信なし。
git diff --check PASS。AWS検証未実行。P2-04B.2の変更・検証は統合結果文書に記録する。通常ロールは変更なし。
