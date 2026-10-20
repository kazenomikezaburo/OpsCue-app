# AWS設計・承認履歴 — AWS-1レビュー候補

> 旧資料を要約した履歴です。COMPLETE、PASS、作成済み、read-backは各資料作成時点の記述です。
> 現在のAWS状態・認証成立・実行承認は証明しません。引き継ぎはBLOCKEDのままです。
> この文書は認証、環境調査、IAM変更、bootstrap、deploy、task、DB、LINE操作の許可ではありません。

## 基準

旧commit `50c83e50949b0245c9ef95ec8f1de4f6b4820cf8`、新main `587ed91c1c8cf4ddea9ef9f16e49cc09483bd54a`、P1-A `a207ca52098c56d9b76715923ea692bfe3c33735`を使用します。リモート最新状態はUNKNOWN。以下はPhase順であり、個々のAWS操作の日時・現在の有効性を再認証した記録ではありません。

## P2-04からB.12まで

証拠パスは旧commit内の資料を指します。未移行の旧パスは新側のリンク先が存在するという意味ではありません。

| 段階・旧証拠 | 変更・記録された判断 | 承認と未確認事項 |
|---|---|---|
| P2-04：`docs/opscue-p2-04-iac-existing-resources.md` | 既存VPC・通常role・ログ・SNS参照、通常/canary分離、空Secret定義、無効Scheduler | コードはIMPLEMENTED IN REPOSITORY。bootstrap、deploy、Secret登録、実送信の完了ではない |
| B.5：`docs/opscue-p2-04b5-handler-reconciliation.md` | 11 resource types／193 rowsのhandler権限照合という過去記録。初期の単一account前提 | schema宣言は実際のhandler分岐成功を保証しない。Secret読取、追加API、生成名等の不足はBLOCKED |
| B.6：`docs/opscue-p2-04b6-bootstrap-preflight.md` | Bootstrap-only、application deploy、post-deploy/live sendの承認を分離 | bootstrap operatorのrole policy/trust変更による昇格可能性を残す。包括的な安全承認ではない |
| B.6.1：`docs/opscue-p2-04b6-1-bootstrap-operator-architecture.md` | operatorの主体分離・失効・復旧を設計 | 既存の強い管理権限を限定role作成だけで除去したとはしない |
| B.7：`docs/opscue-p2-04b7-cfn-managed-policy-preflight.md` | CFN用2policyのsource/input/canonical対応を設計。Analyzer hash linkage未確認、Simulator対応検査の過去記録 | 作成、attach、bootstrap、deployは別判断。39件PASSは最小権限・handler成功の証明ではない |
| B.8：`docs/opscue-p2-04b8-bootstrap-operator-role-preflight.md` | CFN用2policyの過去作成済み記録を参照。MFA条件付きoperator trustとrole作成案 | policy作成の履歴は現在のversion/attachmentsの証明ではない。role作成とAssumeRoleも別承認 |
| B.9：`docs/opscue-p2-04b9-assume-role-preflight.md` | operator role作成のユーザーread-back採用記録。PasskeyだけではCLI AssumeRole経路を承認できないとした | source sessionのMFA contextは不明。実AssumeRole、bootstrapは未承認。現在のrole状態はUNKNOWN |
| B.10：`docs/opscue-p2-04b10-cli-totp-assume-role-preflight.md` | 短期source credential＋明示TOTPの経路を条件付き設計 | 組み合わせた仕様判断であり、実認証成功の証拠ではない |
| B.11：`docs/opscue-p2-04b11-virtual-totp-enrollment-preflight.md` | Console登録案、既存MFA・未割当device・復旧の注意を整理 | enrollment自体と後続AssumeRoleを分離。現device状態はUNKNOWN |
| B.12：`docs/opscue-p2-04b12-assume-role-helper-preflight.md` | TOTP登録のユーザーread-back採用。独立toolの実装・mock検査という履歴 | 再取得なし。runtime依存未確定だった時点の記録を維持 |
| B.12.1：`docs/opscue-p2-04b12-1-local-runtime-closure.md` | tool依存・lock、mock/import確認を行ったという後続記録 | 当時の未install記録を消さない。AWS・credential resolution成功ではない。live入口は失敗終了のまま |

## B.13とR.58〜R.69

B.13ではGUI、provider境界、strict parser、認証前提・実行環境・独立期待値の検査が積み重なっています。prototypeの存在やローカル検査は、保護されたAWS認証経路の完成を意味しません。

R.58〜R.60の証拠は旧`docs/opscue-p2-04b13-4b2-strict-parser.md`の各R節です。R.61以降は同じ接頭辞に以下のsuffixを付けた独立文書です。

| 段階・証拠suffix | 履歴上の結果 | 引き継ぐ制約 |
|---|---|---|
| R.58：統合文書のAWS MULTI-ACCOUNT節 | 条件付きM／S／W論理設計がCOMPLETE | 実topology未確認、実装・採用なし。初期単一account前提を現状として確定しない |
| R.59：統合文書のSTAGE 0節 | safe-read前提が未成立でBLOCKED | AWS topologyの観測を開始していない。過去の限定許可を現在へ継承しない |
| R.60：統合文書のLOCAL METADATA節 | selectorの限定分類がCOMPLETE | credential値・有効session・実効認証chainの検証ではない |
| R.61：`r61-auth-chain-preflight.md` | SAFE_LOCAL_PREFLIGHT_NOT_ESTABLISHEDでBLOCKED | config/credential解決へ進めない。失敗を認証情報不存在と解釈しない |
| R.62：`r62-env-presence-preflight.md` | value-free問い合わせ前提が未成立、BLOCKED | 環境値の問い合わせ0という履歴。native/runtime契約未成立 |
| R.63：`r63-native-binding-design.md` | DESIGN REVIEW COMPLETE、ABI/last-error契約にambiguity | NATIVE_ABI_OR_LAST_ERROR_CONTRACT_NOT_ESTABLISHED |
| R.64：`r64-native-api-contract-verification.md` | 静的な公式契約review COMPLETE | NATIVE_API_CONTRACT_CONFLICT_UNRESOLVED。runtime安全性は未実証 |
| R.65：`r65-empty-env-contract-review.md` | EMPTY ENV契約review COMPLETE | EMPTY_ENV_NULL_ZERO_CONTRACT_NOT_ESTABLISHED |
| R.66：`r66-synthetic-runtime-authorization-design.md` | synthetic実行の条件付き承認設計COMPLETE | SYNTHETIC_RUNTIME_EXECUTION_NOT_AUTHORIZED |
| R.67：`r67-synthetic-execution-readiness-review.md` | 条件付きreadiness packetのreview COMPLETE | EXECUTION_EVIDENCE_AND_OWNER_APPROVAL_NOT_ESTABLISHED |
| R.68：`r68-evidence-acquisition-sequence.md` | 証拠取得順序・preauth設計が条件付きCOMPLETE | LIMITED_EVIDENCE_ACQUISITION_PREAUTH_NOT_GRANTED |
| R.69：`r69-preauth-bootstrap-order-resolution.md` | 承認順序の循環を整理した条件付き設計COMPLETE | OWNER_IDENTITY_AUTHORITY_TRUST_ROOT_NOT_ESTABLISHED。実行承認なし |

R.69 §27には、post-finalizationチェックが文書内ではPENDINGで、実結果を当時の最終回答に置く旨もあります。今回その回答・verifier実行を再検証していません。文書のCOMPLETEを新しい検証済み状態へ昇格しません。

## M／S／Wの位置づけ

- M：Organizations Management。統制、identity、復旧を担う論理管理面。
- S：Security。owner decision、独立source/state、gate、保護実行、監査の論理domain。
- W：Workload。DEV-PERSONAL資源と限定操作の対象。
- 想定経路は候補→S gate/state→S保護実行→W限定target。具体的な保護操作と実account対応は未選定です。
- root・管理者・復旧経路の信頼前提は残ります。BoundaryやSCPの存在だけで非迂回性を保証しません。
- AWS-1は採用判断を行いません。R.58の条件付き設計と過去の選択履歴を保持し、現在の採否はAWS-2の判断対象です。

## 現在へ持ち越す承認境界

文書審査、identity/authority確認、静的候補審査、隔離証拠取得、synthetic実行、AWS認証、IAM変更、bootstrap、deploy、DB変更、task実行、実送信を分離します。前段の完了・ユーザー申告・hash一致・ローカル成功から後段の許可を推論しません。

現AWS状態はUNKNOWN。AWS-0のBLOCKEDは解除していません。現在の判断台帳は[未解決事項](aws-open-issues-decisions.md)を参照してください。秘密値・実ARN・内部応答の対応台帳は今回作成していません。
