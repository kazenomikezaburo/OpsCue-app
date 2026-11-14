# OpsCue ドキュメント索引

このディレクトリは、OpsCueの仕様、設計判断、開発上の制約、過去の検証記録と画面証拠を保存する場所です。
本索引は現在の作業ツリーの資料の入口と役割を案内します。既存文書を新たに正式仕様として認定しません。
仕様変更、実装完了、GitHub公開、DB・Auth・AWS等の操作の承認とは別です。

## 最初に読む

1. [リポジトリの開発ルール](../AGENTS.md)
2. [共同開発・共有条件](../CONTRIBUTING.md)
3. [移行状態と実行制限](migration-manifest.md)
4. [製品横断の方針・差分台帳](ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md)
5. 担当領域の入口、対応する契約・設計基準、個別UI仕様

## 正本の役割と資料の状態

読む順序と、矛盾時の優先順位は別です。全体把握のためMasterを先に読んでも、その要約だけで個別契約を上書きしません。

| 種類 | 役割と扱い |
| --- | --- |
| 契約・設計基準 | 対象領域の責務、認可、状態、制約を確認する。現在の適用状況・変更決定は独立に確認 |
| 個別UI仕様 | 画面項目、操作、例外、受入条件の正本候補。既存業務契約との適合は別途確認 |
| Admin / Worker統合要約 | 全体像、原典対応、未決事項の入口。原典の条件を省略して適用しない |
| Shared Contracts | v0.1 Draft。共通業務判断とPM決定の入口。DB/API/RLSの正式実装契約へ自動昇格しない |
| Master Specification | 製品横断の方針・状態ラベル・差分台帳の入口。報告ベースの進捗と独立検証を区別 |
| 歴史的スナップショット | 記載時点の判断・原典を保存。現在の仕様・実装状態とは区別 |
| 過去の検証結果 | 実施時点、環境、対象範囲の証拠。現在のPASSやDB適用の証明に転用しない |

ファイル名の「最終」「完全版」、更新日時、番号の大きさだけで現行正本と判断しません。
BASELINE、PM_DECIDED、UI_SPEC、REPORTED、PROPOSED、VERIFY、BLOCKEDを区別し、各文書の定義を確認してください。
COMPLETE・PASS・FROZEN等も、記録時点と対象範囲を確認します。

仕様と実装が異なる場合は、仕様の出典・コードの位置・観測時点・影響・必要な判断を記録します。
実装の存在を正当性の証明とせず、安全性を弱める解釈や暗黙の仕様修正を行わず、PM・担当者の判断を待ちます。

## Adminの参照順序

1. [Admin統合要約・原典対応表](ui_仕様書/OpsCue_Admin.md)
2. [UI/UX方針](dispatch-os-ui-ux-v1.md)・[UI Pattern](dispatch-os-ui-patterns-v1.md)・[Design Foundation](dispatch-os-design-foundation-v1.md)
3. 対象画面の個別仕様
4. 対応するドメイン・認可契約と実装

Admin統合版は実装前照合が必要なドラフトです。§16の未決事項と§18の原典対応表を併読してください。

- [共通ナビゲーション](<ui_仕様書/OpsCue Admin 共通ナビゲーション UI_UX 最終仕様書.md>)
- [共通レスポンシブ・UI部品](<ui_仕様書/OpsCue Admin 共通レスポンシブ・UIコンポーネント仕様書.md>)
- [ホーム・要対応](<ui_仕様書/OpsCue Admin ホーム・要対応 UI_UX仕様書.md>)
- [案件管理](<ui_仕様書/OpsCue 案件管理 UI 最終仕様 v1.md>)
- [シフト運用](<ui_仕様書/OpsCue Admin シフト運用 詳細UI_UX仕様書 v1.md>)
- [勤怠管理](<ui_仕様書/OpsCue Admin 勤怠管理 UI 最終仕様.md>)
- [スタッフ管理](<ui_仕様書/OpsCue Admin スタッフ管理 UI 最終仕様 v1.md>)
- [ヘルプリクエスト](<ui_仕様書/OpsCue Admin「ヘルプリクエスト管理」詳細UI最終仕様 v1.md>)
- [お知らせ管理](<ui_仕様書/OpsCue Admin「お知らせ管理」最終UI仕様 v1.md>)
- [取引先・勤務先](<ui_仕様書/OpsCue Admin「取引先・勤務先マスタ管理」最終UI仕様.md>)

## Workerの参照順序

1. [Worker統合要約・未収録事項](ui_仕様書/OpsCue_Worker.md)
2. [Journey契約](ocv1-01-worker-journey-timeline-contract.md)・[募集公開契約](ocv1-02a-recruitment-visibility-contract.md)
3. 対象画面の個別仕様
4. Shared Contractsの未確定事項と対応実装

Worker統合版は実装適合未検証です。募集の独立した最終UI仕様は未収録であり、募集機能全体を網羅した文書とは扱いません。

- [ホーム](<ui_仕様書/OpsCue Worker ホーム画面 最終UIUX仕様書.md>)
- [勤務](<ui_仕様書/OpsCue Worker「勤務」最終UI_UX仕様書.md>)
- [勤務可能時間・希望条件](<ui_仕様書/OpsCue Worker「勤務可能時間・希望条件」最終UI_UX仕様書.md>)
- [サポート](<ui_仕様書/OpsCue Worker「サポート」最終UI_UX仕様書.md>)
- [マイページ](<ui_仕様書/OpsCue Worker「マイページ」最終UI_UX仕様書.md>)
- [お知らせ・通知](<ui_仕様書/OpsCue Worker「お知らせ・通知」最終UI_UX仕様書.md>)
- [LINE連携・通知設定](<ui_仕様書/OpsCue Worker「LINE連携・通知設定」最終UI_UX仕様書.md>)

## Shared・認証・RLS・DB・API

[Shared Contracts](ui_仕様書/OpsCue_Shared_Contracts.md) はv0.1 Draftです。
参照順序は、Shared Contracts → 対象領域の契約 → 対応コード・migration → 別途承認された検証証拠です。
既存DB/RPC/RLS/APIを自動的に置換しません。

以下の契約・設計一覧から、募集、Journey、配置、Incident、お知らせ、STAFF、編集安全性の資料を参照してください。
profiles.account_type、サーバー認可、RLS等の開発ルールは[AGENTS.md](../AGENTS.md)を確認します。
コードの存在は実DB適用の証拠ではありません。

現在のdocsだけで、認証・API・DBの網羅的な現行仕様が揃っているとは判断しません。
API/DTO v1.0-RC、PR-05設計等は文書中に言及がありますが、対応する実在資料の所在・版は要確認です。

## 既存契約・設計・記録26件

現行の判断に使う契約・設計基準と、過去の結果・計画を区別して案内します。
全26件を一律の現行正本・適用済み契約として扱いません。歴史的dispatch-osファイル名は維持します。

| 資料 | 役割・注意 |
| --- | --- |
| [UI/UX方針](dispatch-os-ui-ux-v1.md) | UI方針・設計基準。実装適合は別途確認 |
| [UI Pattern](dispatch-os-ui-patterns-v1.md) | 共通UIパターン・操作基準 |
| [Design Foundation](dispatch-os-design-foundation-v1.md) | 視覚基盤。第三者Referenceは判断材料 |
| [Journey・Timeline](ocv1-01-worker-journey-timeline-contract.md) | Workerイベント・Timeline契約。過去の実装状態と区別 |
| [募集公開・応募可否](ocv1-02a-recruitment-visibility-contract.md) | 公開範囲・Discovery・応募条件の契約 |
| [配置・休憩](placement-break-domain-design-v1.md) | Assignment・Placement・Breakの責務と制約 |
| [Incident・Help Request](operational-incident-domain-design-v1.md) | 状態・認可・監査のドメイン設計 |
| [お知らせ](domain-2.9a-announcement-design-result.md) | 公開対象・状態・認可の設計と歴史的結果 |
| [スキル・資格](staff-2a-skill-qualification-foundation-result.md) | 基盤設計と過去の結果。現在の適用証明ではない |
| [業務要件](staff-2c-structured-job-requirements-result.md) | 構造化要件の契約と過去の実装結果 |
| [勤務可能時間・希望条件の基盤](staff-2d-availability-work-conditions-foundation-result.md) | 設計Freeze。希望条件と勤務可否を区別 |
| [候補者選択UI](staff-2g-3-candidate-picker-read-ui-result.md) | 参照UI・認可境界と過去の実装結果 |
| [勤務可能時間・希望条件UI](staff-2i-availability-work-conditions-ui-result.md) | Worker更新・Admin参照と過去の結果 |
| [編集時の認可・競合制御](ui-1.6-edit-security-plan.md) | サーバー検証・権限・楽観的競合制御の設計基準 |
| [案件IA](admin-ui-3.0b-6c-canonical-project-ia-result.md) | 案件構成の判断と過去の実装結果 |
| [案件・勤務先構成](admin-ui-3.0b-6g-project-workplace-canonical-ux-result.md) | 勤務先設計・履歴・安全境界の判断記録 |
| [LINE配信契約](ocv1-07c0-line-delivery-contract.md) | 連携・配信・同意等の契約 |
| [本番準備・Canary条件](ocv1-07c2-06a-production-readiness-canary-preparation.md) | 未解決の稼働条件と準備記録。実行許可ではない |
| [AWS移行インベントリ](aws-migration-inventory.md) | 資産対応・証拠の限界・引継ぎ状態 |
| [AWS未解決事項](aws-open-issues-decisions.md) | 判断待ち・運用上の保留 |
| [AWS設計・承認履歴](aws-design-approval-history.md) | 歴史的判断と承認境界 |
| [既存AWS資源参照](opscue-p2-04-iac-existing-resources.md) | IaC設計・適用条件。現物の確認証明ではない |
| [権限設計レビュー](opscue-p2-04b1-permissions-review.md) | 権限案・適用ゲート・未解決事項 |
| [ローカルテストアカウント](local-test-accounts.md) | 環境識別・準備・保全条件。実行は別承認 |
| [移行manifest](migration-manifest.md) | 移行状況・未移行参照・実行制限 |
| [V1ギャップ監査](opscue-v1-gap-audit.md) | 過去時点の実装・不足・契約差分の監査 |

## 開発・担当別工程

手順書は2026-10-23時点の工程と承認条件を含みます。日付付き計画を現在の進捗・実行許可とみなしません。
恒久手順と過去のデモ工程、将来提案を区別して読みます。実ファイル名は変更せず案内します。

- [Backend開発手順書・工程表](<ui_仕様書/OpsCue_Backend_%25E9%2596%258B%25E7%2599%25BA%25E6%2589%258B%25E9%25A0%2586%25E6%259B%25B8_20261023_%25E6%2594%25B9%25E8%25A8%2582%25E7%2589%2588.md>)
- [Frontend開発手順書・工程表](<ui_仕様書/OpsCue_Frontend_%25E9%2596%258B%25E7%2599%25BA%25E6%2589%258B%25E9%25A0%2586%25E6%259B%25B8_20261023_%25E6%2594%25B9%25E8%25A8%2582%25E7%2589%2588.md>)
- [PM / Owner開発管理手順書](<ui_仕様書/OpsCue_PM_Owner_%25E9%2596%258B%25E7%2599%25BA%25E7%25AE%25A1%25E7%2590%2586%25E6%2589%258B%25E9%25A0%2586%25E6%259B%25B8_20261023_%25E6%2594%25B9%25E8%25A8%2582%25E7%2589%2588.md>)

## 統合版と歴史的記述

- [UIUX完全版](ui_仕様書/OpsCue_UIUX_完全版統合仕様書_v1.0.md)：第I部は横断統合、第II部はAdmin・Worker・Sharedの原文収録。適合性未検証。原典と重複していますが、現段階では保存・参照を維持します。
- [Worker統合版](ui_仕様書/OpsCue_Worker.md)：第1部は統合要約、第2部は個別7仕様の原文収録。原文と要約を区別します。
- [Master v1.3](ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md)：前半は2026-10-23までの追補・判断・報告。付録Aのv1.2および内包する旧記述は歴史的ベースラインです。

全文収録を理由に単独原典を削除しません。統合版のアーカイブ化・リンク化・更新停止は未決定であり、別承認事項です。
個別原典と収録版の差異は記録し、暗黙に同期・修正しません。

## UIスクリーンショット

[画面カタログ・撮影条件・既知の制約](ui-screenshots/README.md)

Admin54枚、Worker27枚の過去の画面証拠です。現行動作・DB/RLS・外部連携・本番安全性の保証ではありません。
公開前の全画像確認は未完了です。TEST表記だけで合成データ・公開可能性を保証しません。
氏名、住所、勤務、体調回答、通知、履歴等を公開前に確認します。
FAIL・BLOCKED・撮影範囲外の注意事項と状態別の記録を保持します。

## 未解決事項・仕様とコードの不一致

- [Master v1.3](ui_仕様書/OpsCue_Master_Specification_v1.3_2026-10-23.md) §12：製品横断の差分台帳
- [Admin統合版](ui_仕様書/OpsCue_Admin.md) §16：NAV-01、MASTER-01、SNAP-01等
- [Worker統合版](ui_仕様書/OpsCue_Worker.md) §9：未収録・要照合事項
- [Shared Contracts](ui_仕様書/OpsCue_Shared_Contracts.md) §11：共通契約の未解決事項
- [UIUX完全版](ui_仕様書/OpsCue_UIUX_完全版統合仕様書_v1.0.md) §11：横断差分
- [AWS未解決事項](aws-open-issues-decisions.md)・[migration-manifest](migration-manifest.md)：運用・移行上の保留

索引作成前の静的調査で判明した事項です。本索引の追加で解消済みにはしません。

| 項目 | 状態 |
| --- | --- |
| Adminサイドバー幅 | 個別UI仕様は展開248px・縮小64px。現行コードはw-60・w-18、フレームはpl-60・pl-18であり、指定が異なる |
| Adminロゴ位置 | UI仕様はサイドバー内にロゴを置かない。現行AdminSidebarにはロゴ表示がある |
| Worker終了状態 | 欠勤・無断欠勤・本人取消・会社取消等が詳細Timelineで共通の終了項目になる |
| B.2権限設計資料 | opscue-p2-04b1-permissions-review.mdの相対リンク先opscue-p2-04b2-boundary-integration.mdが欠落 |
| UI/IA資料 | ui-1-admin-ia-route-plan.md、画面構成台帳・画面構成Markdown正本の所在・版が未確認 |
| API関連原典 | PR05_審査RPC_設計.md、P0-4_勤務可否の扱い_選択肢.md、API/DTO原典の所在・版が要確認 |

不在・所在未確認の資料にはリンクを作っていません。推奨ルートを実在ルートとみなさず、仕様と実装の網羅的適合確認は別工程です。

## 第三者UI参考資料と公開判断

[参考資料の所在](ui_reference/)：Cal.com、ClickUp、Linear、Notionの分析資料・CSS・JSON、計16件。

出典URLの記載は再配布許可の証明ではありません。取得経路、作成者、利用条件、転載範囲の確認は未完了です。
再配布条件が確認されるまで公開可と判定せず、追加PRでは保留する方針です。Referenceは判断材料であり、OpsCueのUI・業務・セキュリティの正本ではありません。

この索引は現在の作業ツリーを対象にしています。将来PRを分割する場合は、PRに含まれない画像・参考資料等へのリンクを調整し、最終的なPR対象集合でリンクを再確認してください。
