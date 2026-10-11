# Contributing to OpsCue

既存機能を活用し、小さなIssueとレビュー可能なPRで改善します。

## 3人の役割

| 役割 | 責任 |
|---|---|
| オーナー：PM / Tech Lead / AWS担当 | 全体仕様、技術設計、Issue管理、レビュー、品質・リリース調整。AWSのIAM、CDK、Secrets、監視、デプロイ準備 |
| 共同開発者A：フロント担当 | Next.js、Worker/Admin UI、UI/UX、コンポーネント、状態管理、API連携、UIテスト、Figmaとの整合 |
| 共同開発者B：バック担当 | Supabase、認可・Auth/RLS、DB・マイグレーション設計、API・RPC・Server Actions、Backendテスト |

全員が仕様検討とPRレビューに参加します。AWS準備の担当は操作承認を意味しません。LINE Dispatcher通知基盤のCDKとNext.js Web全体のデプロイ基盤は別の範囲です。Web全体のAWS構成・既存リソース・運用権限は未確認で、LINE用CDKの存在から完成済みと判断しません。

## Issue・PR運用

- Issueごとに完了条件、担当、依存、検証方法、セキュリティ影響を記載します。
- `feature/123-topic`、`fix/123-topic`、`docs/123-topic`を使い、PRで統合します。
- 過去の記録：元リポジトリのブランチは`opscue-v1`です。stagingの当時の状態はGit未初期化でした。現在の開発拠点はOpsCue-appで、ローカルGitは初期化済み・ブランチはmainです。GitHub共有・反映状態と招待受諾は未確認／別承認です。
- 統合ブランチへの直接PushとForce Pushは避けます。main直接Pushは禁止する運用ルールです。
- 1PRにつき原則1目的。無関係な整形・依存更新を混ぜません。
- 通常変更は作成者以外1名以上のレビュー・承認。
- Auth/RLS/DB/インフラ変更は関係担当を含む2名のレビュー・承認。
- PRに目的、変更内容、確認方法、リスク、未検証事項を記載します。

上記はチーム内の運用ルールです。GitHub招待受諾、branch protection、required checks、CODEOWNERSは未確認です。GitHubプランと実設定を確認するまで強制が有効とは扱いません。全員参加は毎PRの全員承認を意味しません。

## 実装・安全な開発

- 読み取りはlib、書き込みはServer Actions等の適切な境界へ置きます。
- profiles.account_type、server-side guard、RLSを維持し、クライアントのroleを信用しません。
- DB変更は新しいmigrationで行い、適用済みmigrationを書き換えません。
- Next.js変更前に導入版ガイドと[AGENTS.md](AGENTS.md)を確認します。
- 原本証拠・無関係な未Commit作業を保全します。
- 新Supabase対象はopscue-app-dev（API55321・DB55322）に限定します。ローカルでもDB初期化/reset、migration適用、seed、Auth操作を自由に行えません。対象・影響・復旧手順を確認し、個別の明示承認が必要です。未確認なら停止します。旧dispatch-os DB・543xx環境・supabase_db_dispatch-osは操作禁止です。既存ManagerのAuth/profile/パスワード/支店アクセスとDEMO-001を保護し、上書き・削除・再作成しません。
- 実ユーザー・スタッフ・顧客データ、秘密値、鍵、token、認証cache、認証情報、各自の.env.local等のローカル設定をGitHubに含めません。
- service-roleは承認済みローカル準備限定。ブラウザや通常の権限判定へ渡しません。
- 秘密値をIssue・PR・スクリーンショット・ログへ掲載しません。
- LINE実送信、Dispatcher/Scheduler、AWS資格情報利用、本番操作を通常手順へ混ぜません。
- Event C/D、Live有効化、R.70は別承認です。

## 検証・共有

[README.md](README.md)とユーザーの明示承認範囲を守り、許可されたlint・型確認・重点テストだけを行います。統合・RLSテストは専用隔離DB、安全なfixture、fail-closed共通実行器、別途承認が揃うまで実行禁止です。ポート/名前の一致やオフラインガード・仕様モデルテストの成功は実DBへの許可ではありません。未実行・失敗はそのまま報告し、RLS・認証を緩和して検証を通しません。

共有対象は権利・機密性・依存関係の審査と、承認済み環境の秘密情報検査を経て保存します。静的審査をscanner実施済みとは扱いません。

## COLLAB-SHARE-6時点の制約

ユーザーが固定564件をGitleaks8.30.1でオフライン検査し、終了0・検出報告なしを記録しました。
この結果は権利・業務上の開示許可、秘密不存在、全形式の検査を保証しません。
当時のファイル分類は所有者審査待ち541件、依存保留21件、ローカル記録除外2件でした。現在の移行範囲は[migration-manifest](docs/migration-manifest.md)で管理します。
秘密情報疑い8件と権利保留6件は引き続き共有対象外です。
今回改訂したREADME/CONTRIBUTINGは旧スキャン対象バイト列と異なるため、共有前に再確認します。

当時のNode22.23.3/npm10.9.9でのWeb型検査・lint・合成ガードには確認記録がありますが、現在の全体検証を意味しません。
Next起動/build、Supabase起動/migration/Auth/RLS、macOS/Docker再現性は未検証です。
変更内容に応じて安全な実行範囲と通信先を事前に承認し、未検証をPASSにしません。

初期CI候補は承認済み依存取得、Web型検査、Web lint、DB不要の合成ガードです。
CIによるDB/fixture、LINE/AWS、production deployは含めません。
RLS/DB/認証変更を含むPRは関係担当を含む作成者以外2名、通常PRは作成者以外1名以上でレビューします。
GitHub招待受諾・プラン上の強制可否・保護設定は未確認です。現時点では運用規則であり、有効な保護設定とは報告しません。
