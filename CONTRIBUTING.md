# Contributing to OpsCue

既存機能を活用し、小さなIssueとレビュー可能なPRで改善します。

## 3人の役割

| 役割 | 責任 |
|---|---|
| オーナー：PM / Tech Lead / Full Stack | 全体仕様、技術設計、Figma・共通UI、共通機能実装、Issue管理、レビュー、品質・リリース調整 |
| 共同開発者A：Frontend Lead | Next.js、Worker/Admin UI、コンポーネント、状態管理、API連携、UIテスト |
| 共同開発者B：Backend Lead | Supabase、DB/Migration、API・RPC・Server Actions、Auth/RLS、Backendテスト |

全員が仕様検討とPRレビューに参加します。

## Issue・PR運用

- Issueごとに完了条件、担当、依存、検証方法、セキュリティ影響を記載します。
- `feature/123-topic`、`fix/123-topic`、`docs/123-topic`を使い、PRで統合します。
- 元リポジトリのブランチは`opscue-v1`です。stagingはGit未初期化。新PrivateリポジトリOpsCue-appの`main`運用は予定であり、作成・移行は別承認です。
- 統合ブランチへの直接PushとForce Pushは避けます。将来のmain直接Pushは禁止する運用ルールです。
- 1PRにつき原則1目的。無関係な整形・依存更新を混ぜません。
- 通常変更は作成者以外1名以上のレビュー・承認。
- Auth/RLS/DB/インフラ変更は関係担当を含む2名のレビュー・承認。
- PRに目的、変更内容、確認方法、リスク、未検証事項を記載します。

上記はチーム内の運用ルールです。GitHubプランと実設定を確認するまでbranch protection、required checks、CODEOWNERSの強制が有効とは扱いません。全員参加は毎PRの全員承認を意味しません。

## 実装・安全な開発

- 読み取りはlib、書き込みはServer Actions等の適切な境界へ置きます。
- profiles.account_type、server-side guard、RLSを維持し、クライアントのroleを信用しません。
- DB変更は新しいmigrationで行い、適用済みmigrationを書き換えません。
- Next.js変更前に導入版ガイドと[AGENTS.md](AGENTS.md)を確認します。
- 原本証拠・無関係な未Commit作業を保全します。
- Supabaseは原則ローカル。seed/fixture審査前にDB初期化・resetを行いません。
- 実ユーザー・スタッフ・顧客データ、秘密値、鍵、token、認証cacheをCommitしません。
- service-roleは承認済みローカル準備限定。ブラウザや通常の権限判定へ渡しません。
- 秘密値をIssue・PR・スクリーンショット・ログへ掲載しません。
- LINE実送信、Dispatcher/Scheduler、AWS資格情報利用、本番操作を通常手順へ混ぜません。
- Event C/D、Live有効化、R.70は別承認です。

## 検証・共有

[README.md](README.md)の制約を守り、関連するlint・型確認・重点テストを行います。未実行・失敗はそのまま報告し、RLS・認証を緩和して検証を通しません。

共有対象は権利・機密性・依存関係の審査と、承認済み環境の秘密情報検査を経て保存します。静的審査をscanner実施済みとは扱いません。

## COLLAB-SHARE-6時点の制約

ユーザーが固定564件をGitleaks8.30.1でオフライン検査し、終了0・検出報告なしを記録しました。
この結果は権利・業務上の開示許可、秘密不存在、全形式の検査を保証しません。
ファイル分類は所有者審査待ち541件、依存保留21件、ローカル記録除外2件です。
秘密情報疑い8件と権利保留6件は引き続き共有対象外です。
今回改訂したREADME/CONTRIBUTINGは旧スキャン対象バイト列と異なるため、共有前に再確認します。

Node22.23.3/npm10.9.9でのWeb型検査・lint・合成ガードは確認済みですが、
Next起動/build、Supabase起動/migration/Auth/RLS、macOS/Docker再現性は未検証です。
変更内容に応じて安全な実行範囲と通信先を事前に承認し、未検証をPASSにしません。

初期CI候補は承認済み依存取得、Web型検査、Web lint、DB不要の合成ガードです。
CIによるDB/fixture、LINE/AWS、production deployは含めません。
RLS/DB/認証変更を含むPRは関係担当を含む作成者以外2名、通常PRは作成者以外1名以上でレビューします。
GitHubプラン上の強制可否は未確認です。現時点では運用規則であり、有効な保護設定とは報告しません。
