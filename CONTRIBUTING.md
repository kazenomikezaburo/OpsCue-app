# Contributing to OpsCue

既存機能を活用し、小さなIssueとレビュー可能なPRで改善します。

## 3人の役割（開発体制 v1.1）

| メンバー | 主担当 | 協力・責任範囲 |
|---|---|---|
| みく（オーナー）：PM / Tech Lead / Infrastructure Lead | 要件・優先順位、全体アーキテクチャ、AWS・IAM・Secrets・監視、GitHub・CI/CD、結合調整、リリース判断 | 共通機能とフロント・バック結合実装、E2E計画、レビュー・品質管理 |
| katou：Frontend Lead | Next.js、Figma、Worker/Admin UI、コンポーネント、状態管理、UI/UX、レスポンシブ対応 | API連携、フロントテスト、画面仕様の検証、結合テスト |
| wakaranai（wwakanarai）：Backend Lead | Supabase、PostgreSQL、DB設計、API/RPC、Auth/RLS、migration、バックエンドテスト | API契約、LINE通知基盤のバックエンド側設計、結合テスト、AWS設計レビュー |

### 決定権と共同責任

- 各Leadは担当領域内の実装方針を主導します。公開API契約、権限、データモデル、他領域の仕様に影響する変更は関係者と合意してから実施します。
- PMは優先順位・全体整合・リリース調整を担当しますが、すべてのPRの唯一のレビュアーにはなりません。各担当がテストと相互レビューを担います。
- セキュリティはPMとBackend Leadが中心となり、Frontend LeadもUI上の認証・権限境界を確認します。重要PRは作成者以外2名の承認を運用上必須とします。
- 通常PRは作成者以外1名以上の承認、必須CI成功、レビュー会話の解決後に統合します。担当者本人の承認を必要人数に数えません。
- AWSやSupabaseの担当任命は実環境への操作承認ではありません。既存の個別承認・HOLD・BLOCKED条件を優先します。
- リリースは各担当の検証結果と未解決リスクを確認し、PMが最終判断します。本番操作は別途明示承認が必要です。

### Phase別の主担当

| Phase | みく | katou | wakaranai |
|---|---|---|---|
| 2：HOLD・変更整理 | 全体仕分け・承認条件整理 | UI差分審査 | DB/API差分審査 |
| 3：仕様整合 | 要件・受入条件・API契約調整 | 画面仕様・Figma | DB/API/RLS設計 |
| 4：機能実装 | 共通・結合実装、進捗管理 | Worker/Admin画面 | 認証・案件・シフト・通知API |
| 5：環境準備 | AWS・CI/CD・監視 | ビルド・UI確認 | Supabase環境設計・移行計画 |
| 6：総合テスト | E2E統括・品質判定 | UI/操作・画面間連携 | RLS/データ整合性・API |
| 7：公開 | リリース調整・監視 | UI不具合対応 | DB/API不具合対応 |

### 稼働配分の目安（固定ノルマではない）

- みく：PM・仕様25%、AWS・CI/CD35%、結合実装25%、レビュー・QA15%。
- katou：UI設計・実装65%、API連携20%、レビュー・QA15%。
- wakaranai：DB・API・認可65%、結合・インフラ協力20%、レビュー・QA15%。
- 実際の稼働時間、依存関係、BLOCKED状況に応じてIssue単位で見直します。3名の合意確認後に運用開始します。

全員が仕様検討とPRレビューに参加します。AWS準備の担当は操作承認を意味しません。LINE Dispatcher通知基盤のCDKとNext.js Web全体のデプロイ基盤は別の範囲です。Web全体のAWS構成・既存リソース・運用権限は未確認で、LINE用CDKの存在から完成済みと判断しません。

## Issue・PR運用

- Issueごとに完了条件、担当、依存、検証方法、セキュリティ影響を記載します。
- `feature/123-topic`、`fix/123-topic`、`docs/123-topic`を使い、PRで統合します。
- 過去の記録：元リポジトリのブランチは`opscue-v1`です。stagingの当時の状態はGit未初期化でした。現在の開発拠点はOpsCue-appで、ローカルGitは初期化済み・ブランチはmainです。現在の共有先はOpsCue-appです。個々のメンバーのアクセス権限とローカル同期状態は作業前に確認します。
- mainへの直接PushとForce Pushは禁止します。Issue単位の作業ブランチからPRを作成します。
- Squash mergeを標準とし、マージ前にPRの目的・差分・検証結果を確認します。現在のRulesetは他のマージ方式も許容するため、Squashは運用上の標準です。
- HOLD・BLOCKED・権利/機密審査待ちの変更は、個別の解除承認と共有可否の確認なしに統合しません。
- 1PRにつき原則1目的。無関係な整形・依存更新を混ぜません。
- 通常変更は作成者以外1名以上のレビュー・承認。
- Auth/RLS/DB/インフラ変更は関係担当を含む2名のレビュー・承認。
- PRに目的、変更内容、確認方法、リスク、未検証事項を記載します。

### GitHub保護の確認結果（2026-10-15）

main向けRuleset `Protect main`（ID: 25013294）はactiveです。PR必須、書き込み権限のある作成者以外1名以上の承認、追加Push後の古い承認の失効、最終Push者以外の承認、レビュー会話の解決、必須チェック `Offline safety gate` が設定されています。strict required status checksも有効です。削除とnon-fast-forwardも制限されています。バイパス対象はありません。

検証専用PR #4で、承認不足・未解決レビュー会話のブロック、追加Push後の再承認要求、CI再実行、再承認後の解除を確認し、2026-10-15に**未マージでクローズ**しました。検証ブランチは保持します。CI成功は本番・DB・AWS操作の許可を意味しません。

重要変更の2名承認、Squash標準、main直接Push禁止はチーム運用規則です。現行Rulesetは一律1名承認であり、重要変更だけを自動で2名必須にはしていません。CODEOWNERSは現時点で確認できていません。全員参加は毎PRの全員承認を意味しません。

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
GitHubの実際の保護設定と運用上の追加ルールは上記「GitHub保護の確認結果」に従います。個別メンバーの招待・権限・合意は必要に応じて別途確認します。
