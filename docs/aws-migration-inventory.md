# AWS移行インベントリ — AWS-1レビュー候補

> ローカル文書候補。AWS-0の引き継ぎ状態は **BLOCKED** のままです。
> コードの存在、履歴文書のCOMPLETE、過去のread-backは、現在のAWS状態・実行許可・テスト成功を保証しません。
> この文書は接続、認証、IAM変更、bootstrap、deploy、Secret登録、DB操作、task実行、LINE送信を承認しません。

## 基準と調査限界

- 作成日：2026-10-18。
- 旧OpsCue基準：`50c83e50949b0245c9ef95ec8f1de4f6b4820cf8`。
- 新OpsCue-app main基準：`587ed91c1c8cf4ddea9ef9f16e49cc09483bd54a`。
- P1-Aビルド候補：`a207ca52098c56d9b76715923ea692bfe3c33735`。main収録とは別に扱います。
- 現在のリモートmain・PRの最新状態はUNKNOWN。ローカル参照だけを使用し、fetch・外部照会はしていません。
- 表の「新側」は上記mainのGit treeです。dirtyなcheckoutの内容は基準にしません。
- AWS上の現在状態をVERIFIED IN AWSとした項目は0件です。

## 分類

| 分類 | 意味 |
|---|---|
| IMPLEMENTED IN REPOSITORY | ソース・定義が存在。実行・適用の証明ではない |
| DOCUMENTED ONLY | 文書上の設計・履歴・計画 |
| BLOCKED | 安全条件、承認、依存、証拠が未成立 |
| UNKNOWN | 現在状態を判断する証拠が不足 |

## 資産対応

| ID | 旧資産・存在場所 | 新側の対応・内容差分 | 依存・公開審査・分類 |
|---|---|---|---|
| INV-01 | `infra/bin/opscue-line-delivery.ts`、`infra/cdk.json`、`infra/lib/opscue-line-delivery-stack.ts`、`infra/test/opscue-line-delivery-stack-test.ts` | 4件すべて存在、旧基準と同一blob | IMPLEMENTED IN REPOSITORY。VPC、role、ログ、SNS、Boundary等の現物はUNKNOWN。環境名・接続設計の再審査が必要 |
| INV-02 | `scripts/line-delivery-dispatcher.ts`、主要`lib/line/`実行経路 | 本体、delivery-db、dispatcher、dispatcher-core、push-coreは同一blob | IMPLEMENTED IN REPOSITORY。DB、LINE、runtime設定に依存。現在の権限・実動作はUNKNOWN |
| INV-03 | `Dockerfile.line-dispatcher`、`scripts/build-line-dispatcher.mjs` | mainには欠落。P1-Aには2件とpackage script追加が存在 | IMPLEMENTED IN REPOSITORY（候補ブランチ）。ビルド未検証。可変image tag、signal終了処理、監視、配布ライセンスが残留課題 |
| INV-04 | root `Dockerfile`、`.dockerignore` | 新旧同一blob。Dockerfileは開発serverを起動 | IMPLEMENTED IN REPOSITORY。本番Web配備用と解釈しない。contextと機密除外を別途審査 |
| INV-05 | `docs/opscue-p2-04-iac-existing-resources.md`、`docs/opscue-p2-04b1-permissions-review.md`、`docs/ocv1-07c2-06a-production-readiness-canary-preparation.md` | 3件移行済み。注記・秘匿化のため原本とは異なる | DOCUMENTED ONLY。設計判断・未解決事項を保持し、過去結果を現在の事実にしない |
| INV-06 | その他AWS関連文書30件 | mainには欠落 | DOCUMENTED ONLY。B.5〜B.12、B.13、R.58〜R.69等。account、主体、内部証拠、ローカルパスを公開前に審査 |
| INV-07 | `opscue-bootstrap-review.yaml` | mainには欠落 | IMPLEMENTED IN REPOSITORY（旧保存template）。使用parameter、tool version、trust、実効権限の再審査が必要。適用はBLOCKED |
| INV-08 | `infra/iam/p2-04b1/` 12件 | mainには欠落 | policy・Boundary・検査入力・helper。実account、ARN、resource名を一貫した役割別合成値へ変換する必要あり |
| INV-09 | `infra/iam/p2-04b5/` 3件 | mainには欠落 | handler照合コードと証拠2件。template/schemaの出所・取得時点・公開安全性が必要 |
| INV-10 | `infra/iam/p2-04b7/` 8件 | mainには欠落 | policy成果物、保存応答照合等。内部証拠・生成metadataを無審査で転載しない |
| INV-11 | `infra/iam/p2-04b8/trust-policy.json` | mainには欠落 | 特定operatorのtrust候補。主体・session識別子を秘匿化。現在のtrustはUNKNOWN |
| INV-12 | `infra/tools/` 4,062追跡ファイル | mainには欠落 | 認証helper、GUI、診断、依存・binary・証拠。実装は存在するがlive利用はBLOCKED。大量コピーしない |
| INV-13 | 旧`.github/workflows/`の追跡ファイル0件 | 新側は`offline-safety-tests.yml`のみ | offline検査はIMPLEMENTED IN REPOSITORY。AWS deploy workflow・OIDC定義は今回の基準には存在しない |
| INV-14 | root package・lockfile | 新旧内容は異なる。新側にもCDK、constructs、tsx等の依存指定あり | 現行依存を維持する。旧package/lockfileへの置換禁止。指定値は実行可能性の証明ではない |

旧infraは4,090件、新mainは4件です。差の4,086件はIAM24件とtools4,062件です。旧toolsの3,744件はパス上のnode_modules、obj、bin、Review、配布package等に該当します。この分類はライセンス・秘密情報の全件審査ではありません。残る318件も自動的な移行候補ではありません。

AWS関連文書33件の集計は、旧基準の`docs/`でP2-04系、AWS Dispatcher結果、canary準備を抽出した監査範囲です。全てのAWS言及を網羅した件数ではありません。今回この3文書へ旧資料を大量コピーしていません。

## 実装上の引き継ぎ注意

- 通常・canary配送flagはfalse、SchedulerはDISABLEDの定義を維持する。
- 通常roleのimportはimmutable扱い。既存roleの不足権限がCDKで自動修復されるとは扱わない。
- CDKはSecretを値なしで3件作成する定義。同名既存Secretがあればそのまま作成しない。
- 通常／canary DB、共有Messaging token、旧Secret名／必要なSecret名の関係を保持する。
- 旧単一アカウントのrole・資源参照と、後続M／S／W論理設計は未統合。accountだけ置換して適用しない。

## 証拠の取り扱いと移行順序

1. このインベントリ・[履歴](aws-design-approval-history.md)・[判断台帳](aws-open-issues-decisions.md)を先にレビューする。
2. 履歴文書は環境識別子を除き、禁止事項・未解決事項・承認境界を保持して最小移行する。
3. IAM JSONと検査caseは同じ合成値体系でセット審査する。権限の意味を変える秘匿化は避ける。
4. template、保存AWS応答、package、binary、実認証helperは別の許可リストと権利・機密審査を要する。

旧パス＋旧commit＋この文書のIDを非秘密の参照キーとします。識別子の実値や内部応答は記載しません。実値との対応台帳が必要になった場合は、別途承認した非公開保存先で管理し、public候補のworktreeやGitへ含めません。今回、実値対応台帳は作成していません。
